import { getDb } from './index'
import type { Produto, ProdutoInput } from '../../shared/types'

export function listarProdutos(apenasAtivos = true): Produto[] {
  const db = getDb()
  const sql = apenasAtivos
    ? 'SELECT * FROM produtos WHERE ativo = 1 ORDER BY nome ASC'
    : 'SELECT * FROM produtos ORDER BY nome ASC'
  return db.prepare(sql).all() as Produto[]
}

export function listarProdutosDisponiveisDelivery(): Produto[] {
  return getDb()
    .prepare('SELECT * FROM produtos WHERE ativo = 1 AND disponivel_delivery = 1 ORDER BY nome ASC')
    .all() as Produto[]
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
  const itemCozinha = input.item_cozinha ? 1 : 0
  const disponivelPdv = input.disponivel_pdv ?? true ? 1 : 0
  const disponivelComanda = input.disponivel_comanda ?? true ? 1 : 0
  const disponivelDelivery = input.disponivel_delivery ? 1 : 0

  if (input.id) {
    db.prepare(
      `UPDATE produtos SET nome = ?, descricao = ?, categoria_id = ?, preco = ?, ncm = ?, cfop = ?, unidade = ?,
       controla_estoque = ?, estoque_minimo = ?, item_cozinha = ?, cozinha = ?,
       disponivel_pdv = ?, disponivel_comanda = ?, disponivel_delivery = ? WHERE id = ?`
    ).run(
      input.nome,
      input.descricao ?? null,
      input.categoria_id,
      input.preco,
      input.ncm ?? null,
      input.cfop ?? null,
      unidade,
      controlaEstoque,
      estoqueMinimo,
      itemCozinha,
      input.cozinha ?? null,
      disponivelPdv,
      disponivelComanda,
      disponivelDelivery,
      input.id
    )
    return obterProduto(input.id) as Produto
  }

  const result = db
    .prepare(
      `INSERT INTO produtos (nome, descricao, categoria_id, preco, ncm, cfop, unidade, controla_estoque,
       quantidade_estoque, estoque_minimo, item_cozinha, cozinha, disponivel_pdv, disponivel_comanda, disponivel_delivery)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.nome,
      input.descricao ?? null,
      input.categoria_id,
      input.preco,
      input.ncm ?? null,
      input.cfop ?? null,
      unidade,
      controlaEstoque,
      quantidadeEstoque,
      estoqueMinimo,
      itemCozinha,
      input.cozinha ?? null,
      disponivelPdv,
      disponivelComanda,
      disponivelDelivery
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
 * Usado pela sincronizacao de pedidos do delivery: se por algum motivo chegar um pedido com um
 * produto que ainda nao existe localmente (ex: primeira sincronizacao antes do push de catalogo
 * rodar), criamos o produto na hora para nao perder a venda.
 */
export function encontrarOuCriarProdutoPorNome(nome: string, preco: number): Produto {
  const db = getDb()
  const existente = db
    .prepare('SELECT * FROM produtos WHERE lower(nome) = lower(?) LIMIT 1')
    .get(nome) as Produto | undefined
  if (existente) return existente

  return salvarProduto({ nome, categoria_id: null, preco, controla_estoque: false })
}
