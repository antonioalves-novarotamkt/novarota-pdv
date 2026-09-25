import { ImportValidationError } from './excel.service.js';

const MAX_BYTES = 5 * 1024 * 1024;
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const NOT_SHARED_MESSAGE =
  'Não foi possível abrir a planilha. No Google Planilhas, clique em "Compartilhar" e ' +
  'mude o acesso geral para "Qualquer pessoa com o link" (Leitor).';

/**
 * Turns a Google Sheets link into its .xlsx export URL. Only docs.google.com links are
 * accepted and the URL is rebuilt from the extracted id, so arbitrary hosts can't be fetched.
 */
export function toGoogleSheetsExportUrl(link: string): string {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    throw new ImportValidationError('Link inválido. Cole o link da planilha do Google.');
  }

  if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com') {
    throw new ImportValidationError('O link precisa ser de uma planilha do Google (docs.google.com/spreadsheets/...).');
  }

  const published = url.pathname.match(/^\/spreadsheets\/d\/e\/([A-Za-z0-9_-]{20,})\//);
  if (published) {
    return `https://docs.google.com/spreadsheets/d/e/${published[1]}/pub?output=xlsx`;
  }

  const regular = url.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})(\/|$)/);
  if (regular) {
    return `https://docs.google.com/spreadsheets/d/${regular[1]}/export?format=xlsx`;
  }

  throw new ImportValidationError('Não reconheci esse link. Cole o link da planilha do Google Planilhas.');
}

async function readWithLimit(response: Response): Promise<Buffer> {
  const declared = Number(response.headers.get('content-length'));
  if (declared > MAX_BYTES) {
    throw new ImportValidationError('A planilha é maior que 5 MB.');
  }
  if (!response.body) return Buffer.alloc(0);

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new ImportValidationError('A planilha é maior que 5 MB.');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function downloadGoogleSheet(link: string, fetchImpl: typeof fetch = fetch): Promise<Buffer> {
  const exportUrl = toGoogleSheetsExportUrl(link);

  let response: Response;
  try {
    response = await fetchImpl(exportUrl, { redirect: 'follow', signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new ImportValidationError('Não foi possível acessar o Google Planilhas. Tente novamente em alguns segundos.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  // A sheet that isn't shared publicly redirects to a Google login page (HTML) instead of the file.
  if (!response.ok || !contentType.includes(XLSX_MIME)) {
    throw new ImportValidationError(NOT_SHARED_MESSAGE);
  }

  return readWithLimit(response);
}
