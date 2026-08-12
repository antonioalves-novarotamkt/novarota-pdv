import { getDb } from './index'
import type { Produto, ProdutoInput } from '../../shared/types'

export function listarProdutos(apenasAtivos = true): Produto[] {
  const db = getDb()
  const sql = apenasAtivos
    ? 'SELECT * FROM produtos WHERE ativo = 1 ORDER BY nome ASC'
    : 'SELECT * FROM produtos ORDER BY nome ASC'
  return db.prepare(sql).all() as Produto[]
}

export function obterProduto(id: number): Produto | undefined {
  return getDb().prepare('SELECT * FROM produtos WHERE id = ?').get(id) as Produto | undefined
}

export function salvarProduto(input: ProdutoInput & { id?: number }): Produto {
  const db = getDb()
  const unidade = input.unidade ?? 'UN'
  const controlaEstoque = input.controla_estoque ? 1 : 0
  const quantidadeEstoque = input.quantidade_estoque ?? 0
  const estoqueMinimo = input.estoque_minimo ?? 0

  if (input.id) {
    db.prepare(
      `UPDATE produtos SET nome = ?, categoria_id = ?, preco = ?, ncm = ?, cfop = ?, unidade = ?,
       controla_estoque = ?, estoque_minimo = ? WHERE id = ?`
    ).run(
      input.nome,
      input.categoria_id,
      input.preco,
      input.ncm ?? null,
      input.cfop ?? null,
      unidade,
      controlaEstoque,
      estoqueMinimo,
      input.id
    )
    return obterProduto(input.id) as Produto
  }

  const result = db
    .prepare(
      `INSERT INTO produtos (nome, categoria_id, preco, ncm, cfop, unidade, controla_estoque, quantidade_estoque, estoque_minimo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.nome,
      input.categoria_id,
      input.preco,
      input.ncm ?? null,
      input.cfop ?? null,
      unidade,
      controlaEstoque,
      quantidadeEstoque,
      estoqueMinimo
    )
  return obterProduto(Number(result.lastInsertRowid)) as Produto
}

export function removerProduto(id: number): void {
  getDb().prepare('UPDATE produtos SET ativo = 0 WHERE id = ?').run(id)
}

export function ajustarEstoqueProduto(produtoId: number, delta: number): void {
  getDb()
    .prepare('UPDATE produtos SET quantidade_estoque = quantidade_estoque + ? WHERE id = ?')
    .run(delta, produtoId)
}

/**
 * Usado pela sincronizacao de delivery: o catalogo do site de pedidos ainda e
 * separado do catalogo do PDV, entao ao importar um pedido criamos o produto
 * localmente na primeira vez que o nome aparece (sem controle de estoque).
 */
export function encontrarOuCriarProdutoPorNome(nome: string, preco: number): Produto {
  const db = getDb()
  const existente = db
    .prepare('SELECT * FROM produtos WHERE lower(nome) = lower(?) LIMIT 1')
    .get(nome) as Produto | undefined
  if (existente) return existente

  return salvarProduto({ nome, categoria_id: null, preco, controla_estoque: false })
}
