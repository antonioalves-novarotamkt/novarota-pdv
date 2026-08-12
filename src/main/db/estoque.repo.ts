import { getDb } from './index'
import { ajustarEstoqueProduto } from './produtos.repo'
import type { MovimentoEstoqueInput } from '../../shared/types'

export function listarMovimentosEstoque(produtoId?: number): unknown[] {
  const db = getDb()
  if (produtoId) {
    return db
      .prepare(
        `SELECT em.*, p.nome as produto_nome FROM estoque_movimentacoes em
         JOIN produtos p ON p.id = em.produto_id
         WHERE em.produto_id = ? ORDER BY em.criado_em DESC LIMIT 200`
      )
      .all(produtoId)
  }
  return db
    .prepare(
      `SELECT em.*, p.nome as produto_nome FROM estoque_movimentacoes em
       JOIN produtos p ON p.id = em.produto_id
       ORDER BY em.criado_em DESC LIMIT 200`
    )
    .all()
}

export function registrarMovimentoEstoque(input: MovimentoEstoqueInput): void {
  const db = getDb()
  db.prepare(
    'INSERT INTO estoque_movimentacoes (produto_id, tipo, quantidade, motivo) VALUES (?, ?, ?, ?)'
  ).run(input.produto_id, input.tipo, input.quantidade, input.motivo ?? null)

  const delta = input.tipo === 'saida' ? -Math.abs(input.quantidade) : Math.abs(input.quantidade)
  ajustarEstoqueProduto(input.produto_id, delta)
}

export function darBaixaEstoqueVenda(produtoId: number, quantidade: number, motivo: string): void {
  registrarMovimentoEstoque({ produto_id: produtoId, tipo: 'saida', quantidade, motivo })
}
