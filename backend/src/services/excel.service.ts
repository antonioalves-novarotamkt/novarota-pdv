import ExcelJS from 'exceljs';
import { prisma } from '../db/prisma.js';
import { calculateFinalPrice } from '../utils/pricing.js';

const MAX_ROWS = 2000;
const DEFAULT_MARKUP = 30;
const ORANGE = 'FFEA580C';
const CURRENCY_FMT = '"R$" #,##0.00';

const COLUMNS = [
  { header: 'Nome', key: 'name', width: 32 },
  { header: 'Descrição', key: 'description', width: 48 },
  { header: 'Categoria', key: 'category', width: 20 },
  { header: 'Código (SKU)', key: 'sku', width: 16 },
  { header: 'Preço na loja', key: 'basePrice', width: 16 },
  { header: 'Acréscimo (%)', key: 'markup', width: 15 },
  { header: 'Preço final', key: 'finalPrice', width: 16 },
  { header: 'Ativo', key: 'active', width: 10 },
] as const;

type Field = 'name' | 'description' | 'category' | 'sku' | 'basePrice' | 'markup' | 'active';

const HEADER_ALIASES: Record<string, Field> = {
  nome: 'name',
  produto: 'name',
  descricao: 'description',
  categoria: 'category',
  codigosku: 'sku',
  codigo: 'sku',
  sku: 'sku',
  preconaloja: 'basePrice',
  precoloja: 'basePrice',
  precobase: 'basePrice',
  preco: 'basePrice',
  acrescimo: 'markup',
  margem: 'markup',
  markup: 'markup',
  ativo: 'active',
};

export interface ImportRowError {
  row: number;
  message: string;
}

export class ImportValidationError extends Error {
  constructor(message: string, public details: ImportRowError[] = []) {
    super(message);
  }
}

interface ParsedRow {
  row: number;
  name?: string;
  description?: string | null;
  category?: string | null;
  sku?: string | null;
  basePrice?: number;
  markup?: number;
  active?: boolean;
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function cellValue(cell: ExcelJS.Cell): unknown {
  const value = cell.value;
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map((part) => part.text).join('');
    if ('result' in value) return value.result ?? null;
    if ('text' in value) return value.text;
    if ('error' in value) return null;
  }
  return value;
}

function cellText(cell: ExcelJS.Cell): string {
  const value = cellValue(cell);
  if (value === null) return '';
  return String(value).trim();
}

function parseNumber(cell: ExcelJS.Cell, isPercent: boolean): number | null {
  const value = cellValue(cell);
  if (value === null || value === '') return null;
  if (typeof value === 'number') {
    return isPercent && cell.numFmt?.includes('%') ? value * 100 : value;
  }
  let text = String(value).replace(/R\$|%|\s/gi, '');
  if (text === '') return null;
  if (text.includes(',')) {
    text = text.replace(/\./g, '').replace(',', '.');
  }
  const number = Number(text);
  return Number.isFinite(number) ? number : NaN;
}

function parseActive(text: string): boolean | undefined {
  const value = normalize(text);
  if (value === '') return true;
  if (['sim', 's', 'true', '1', 'yes', 'ativo'].includes(value)) return true;
  if (['nao', 'n', 'false', '0', 'no', 'inativo'].includes(value)) return false;
  return undefined;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function parseSheet(sheet: ExcelJS.Worksheet) {
  const columns = new Map<Field, number>();
  sheet.getRow(1).eachCell((cell, colNumber) => {
    const field = HEADER_ALIASES[normalize(cellText(cell))];
    if (field && !columns.has(field)) columns.set(field, colNumber);
  });

  const missing = [
    !columns.has('name') && 'Nome',
    !columns.has('basePrice') && 'Preço na loja',
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new ImportValidationError(
      `Coluna obrigatória não encontrada: ${missing.join(', ')}. Use o modelo de planilha como base.`
    );
  }

  const rows: ParsedRow[] = [];
  const errors: ImportRowError[] = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const cell = (field: Field) => row.getCell(columns.get(field)!);
    const has = (field: Field) => columns.has(field);

    const isEmpty = [...columns.values()].every((col) => cellText(row.getCell(col)) === '');
    if (isEmpty) continue;

    if (rows.length >= MAX_ROWS) {
      throw new ImportValidationError(`A planilha tem mais de ${MAX_ROWS} produtos. Divida em arquivos menores.`);
    }

    const rowErrors: string[] = [];
    const parsed: ParsedRow = { row: rowNumber };

    const name = cellText(cell('name'));
    if (!name) rowErrors.push('o nome é obrigatório');
    else if (name.length > 200) rowErrors.push('o nome tem mais de 200 caracteres');
    parsed.name = name;

    const basePrice = parseNumber(cell('basePrice'), false);
    if (basePrice === null) rowErrors.push('o preço na loja é obrigatório');
    else if (Number.isNaN(basePrice) || basePrice < 0) rowErrors.push('o preço na loja não é um valor válido');
    else parsed.basePrice = round2(basePrice);

    if (has('markup')) {
      const markup = parseNumber(cell('markup'), true);
      if (markup === null) parsed.markup = DEFAULT_MARKUP;
      else if (Number.isNaN(markup) || markup < 0) rowErrors.push('o acréscimo não é uma porcentagem válida');
      else parsed.markup = round2(markup);
    }

    if (has('description')) parsed.description = cellText(cell('description')) || null;
    if (has('category')) parsed.category = cellText(cell('category')) || null;
    if (has('sku')) parsed.sku = cellText(cell('sku')) || null;

    if (has('active')) {
      const active = parseActive(cellText(cell('active')));
      if (active === undefined) rowErrors.push('o campo Ativo deve ser "Sim" ou "Não"');
      else parsed.active = active;
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join('; ') });
    } else {
      rows.push(parsed);
    }
  }

  const seenKeys = new Map<string, number>();
  for (const parsed of rows) {
    const key = parsed.sku ? `sku:${parsed.sku.toLowerCase()}` : `name:${parsed.name!.toLowerCase()}`;
    const firstRow = seenKeys.get(key);
    if (firstRow) {
      errors.push({
        row: parsed.row,
        message: parsed.sku
          ? `o código "${parsed.sku}" já aparece na linha ${firstRow}`
          : `o produto "${parsed.name}" já aparece na linha ${firstRow}`,
      });
    } else {
      seenKeys.set(key, parsed.row);
    }
  }

  if (errors.length > 0) {
    errors.sort((a, b) => a.row - b.row);
    throw new ImportValidationError(
      'A planilha tem erros. Nenhum produto foi importado; corrija as linhas abaixo e envie de novo.',
      errors
    );
  }
  if (rows.length === 0) {
    throw new ImportValidationError('A planilha não tem nenhum produto preenchido.');
  }

  return rows;
}

export async function importProducts(clientId: string, fileBuffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(fileBuffer as unknown as ExcelJS.Buffer);
  } catch {
    throw new ImportValidationError('Não foi possível ler o arquivo. Envie uma planilha Excel (.xlsx).');
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ImportValidationError('A planilha está vazia.');

  const rows = parseSheet(sheet);

  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.product.findMany({
        where: { clientId },
        select: { id: true, name: true, sku: true, basePrice: true, markup: true },
      });
      const bySku = new Map(existing.filter((p) => p.sku).map((p) => [p.sku!.toLowerCase(), p]));
      const byName = new Map(existing.map((p) => [p.name.toLowerCase(), p]));

      const categories = await tx.category.findMany({ where: { clientId } });
      const categoryIds = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
      let nextOrder = categories.reduce((max, c) => Math.max(max, c.order), 0) + 1;
      let categoriesCreated = 0;

      const resolveCategory = async (name: string) => {
        const key = name.toLowerCase();
        let id = categoryIds.get(key);
        if (!id) {
          const created = await tx.category.create({ data: { name, clientId, order: nextOrder++ } });
          id = created.id;
          categoryIds.set(key, id);
          categoriesCreated++;
        }
        return id;
      };

      let created = 0;
      let updated = 0;

      for (const row of rows) {
        const match = row.sku ? bySku.get(row.sku.toLowerCase()) : byName.get(row.name!.toLowerCase());

        let categoryId: string | null | undefined;
        if (row.category !== undefined) {
          categoryId = row.category ? await resolveCategory(row.category) : null;
        }

        const basePrice = row.basePrice!;
        const markup = row.markup ?? match?.markup ?? DEFAULT_MARKUP;
        const data = {
          name: row.name!,
          basePrice,
          markup,
          finalPrice: calculateFinalPrice(basePrice, markup),
          ...(row.description !== undefined && { description: row.description }),
          ...(row.sku && { sku: row.sku }),
          ...(row.active !== undefined && { active: row.active }),
          ...(categoryId !== undefined && { categoryId }),
        };

        if (match) {
          await tx.product.update({ where: { id: match.id }, data });
          updated++;
        } else {
          await tx.product.create({ data: { ...data, clientId } });
          created++;
        }
      }

      return { created, updated, categoriesCreated };
    },
    { timeout: 60_000 }
  );
}

function styleHeader(sheet: ExcelJS.Worksheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
  header.alignment = { vertical: 'middle' };
  header.height = 22;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

export async function exportProducts(clientId: string, template: boolean) {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NovaRota Cardápio';
  const sheet = workbook.addWorksheet('Cardápio');
  sheet.columns = COLUMNS.map((column) => ({ ...column }));
  styleHeader(sheet);

  sheet.getColumn('basePrice').numFmt = CURRENCY_FMT;
  sheet.getColumn('finalPrice').numFmt = CURRENCY_FMT;
  sheet.getColumn('markup').numFmt = '0.##';

  if (template) {
    sheet.addRow({
      name: 'Pizza Margherita',
      description: 'Molho de tomate, muçarela e manjericão',
      category: 'Pizzas',
      sku: 'PZ001',
      basePrice: 40,
      markup: 30,
      finalPrice: calculateFinalPrice(40, 30),
      active: 'Sim',
    });
    addInstructions(workbook);
  } else {
    const products = await prisma.product.findMany({
      where: { clientId },
      include: { category: true },
      orderBy: [{ category: { order: 'asc' } }, { name: 'asc' }],
    });
    for (const product of products) {
      sheet.addRow({
        name: product.name,
        description: product.description ?? '',
        category: product.category?.name ?? '',
        sku: product.sku ?? '',
        basePrice: product.basePrice,
        markup: product.markup,
        finalPrice: product.finalPrice,
        active: product.active ? 'Sim' : 'Não',
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = template ? 'modelo-cardapio.xlsx' : `cardapio-${client.slug}.xlsx`;
  return { buffer: Buffer.from(buffer), filename };
}

function addInstructions(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('Instruções');
  sheet.getColumn(1).width = 110;
  const lines = [
    'Como preencher a planilha',
    '',
    '• Preencha um produto por linha na aba "Cardápio". Apague a linha de exemplo antes de importar.',
    '• Obrigatórios: Nome e Preço na loja.',
    '• Acréscimo (%): porcentagem somada ao preço da loja. Se ficar vazio, usa 30%.',
    '• Preço final: calculado automaticamente pelo sistema; não precisa preencher.',
    '• Categoria: se não existir, é criada automaticamente.',
    '• Ativo: "Sim" ou "Não". Se ficar vazio, o produto fica ativo.',
    '',
    'Atualizar produtos que já existem',
    '',
    '• Com Código (SKU) preenchido, o produto com o mesmo código é atualizado.',
    '• Sem código, o produto com o mesmo nome é atualizado.',
    '• Se não encontrar nenhum, um produto novo é criado.',
    '• Se alguma linha tiver erro, nada é importado e o sistema mostra quais linhas corrigir.',
  ];
  lines.forEach((text, index) => {
    const row = sheet.getRow(index + 1);
    row.getCell(1).value = text;
    if (index === 0 || text === 'Atualizar produtos que já existem') {
      row.font = { bold: true, size: 13, color: { argb: ORANGE } };
    }
  });
}
