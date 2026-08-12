import { getDb } from './index'
import type { PagamentoInput, TipoDocumento, Venda, VendaCompleta } from '../../shared/types'

interface CriarVendaInput {
  comanda_id: number | null
  total: number
  desconto: number
  tipo_documento: TipoDocumento
  itens: Array<{
    produto_id: number
    nome_produto: string
    quantidade: number
    preco_unitario: number
    subtotal: number
  }>
  pagamentos: PagamentoInput[]
}

export function criarVenda(input: CriarVendaInput): VendaCompleta {
  const db = getDb()

  const criarTudo = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO vendas (comanda_id, total, desconto, status, tipo_documento)
         VALUES (?, ?, ?, 'concluida', ?)`
      )
      .run(input.comanda_id, input.total, input.desconto, input.tipo_documento)

    const vendaId = Number(result.lastInsertRowid)

    const insertItem = db.prepare(
      `INSERT INTO itens_venda (venda_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    for (const item of input.itens) {
      insertItem.run(
        vendaId,
        item.produto_id,
        item.nome_produto,
        item.quantidade,
        item.preco_unitario,
        item.subtotal
      )
    }

    const insertPagamento = db.prepare(
      'INSERT INTO pagamentos (venda_id, forma, valor) VALUES (?, ?, ?)'
    )
    for (const pagamento of input.pagamentos) {
      insertPagamento.run(vendaId, pagamento.forma, pagamento.valor)
    }

    return vendaId
  })

  const vendaId = criarTudo()
  return obterVenda(vendaId) as VendaCompleta
}

export function atualizarDadosFiscais(
  vendaId: number,
  dados: {
    numero_documento?: string | null
    chave_acesso?: string | null
    protocolo_autorizacao?: string | null
    ambiente_fiscal?: string | null
    erro_fiscal?: string | null
  }
): void {
  const db = getDb()
  db.prepare(
    `UPDATE vendas SET numero_documento = COALESCE(?, numero_documento),
     chave_acesso = COALESCE(?, chave_acesso),
     protocolo_autorizacao = COALESCE(?, protocolo_autorizacao),
     ambiente_fiscal = COALESCE(?, ambiente_fiscal),
     erro_fiscal = ?
     WHERE id = ?`
  ).run(
    dados.numero_documento ?? null,
    dados.chave_acesso ?? null,
    dados.protocolo_autorizacao ?? null,
    dados.ambiente_fiscal ?? null,
    dados.erro_fiscal ?? null,
    vendaId
  )
}

export function listarVendas(limite = 100): Venda[] {
  return getDb()
    .prepare('SELECT * FROM vendas ORDER BY criado_em DESC LIMIT ?')
    .all(limite) as Venda[]
}

export function obterVenda(id: number): VendaCompleta | undefined {
  const db = getDb()
  const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(id) as Venda | undefined
  if (!venda) return undefined

  const itens = db
    .prepare('SELECT * FROM itens_venda WHERE venda_id = ?')
    .all(id) as VendaCompleta['itens']
  const pagamentos = db
    .prepare('SELECT forma, valor FROM pagamentos WHERE venda_id = ?')
    .all(id) as PagamentoInput[]

  return { ...venda, itens, pagamentos }
}
