import { getDb } from './index'
import { atualizarStatusMesa } from './mesas.repo'
import type { Comanda, ComandaComItens, ComandaTipo, ItemComanda } from '../../shared/types'

export function listarComandasAbertas(): ComandaComItens[] {
  const db = getDb()
  const comandas = db
    .prepare("SELECT * FROM comandas WHERE status = 'aberta' ORDER BY aberta_em ASC")
    .all() as Comanda[]
  return comandas.map(anexarItens)
}

export function obterComanda(id: number): ComandaComItens | undefined {
  const comanda = getDb().prepare('SELECT * FROM comandas WHERE id = ?').get(id) as
    | Comanda
    | undefined
  if (!comanda) return undefined
  return anexarItens(comanda)
}

function anexarItens(comanda: Comanda): ComandaComItens {
  const db = getDb()
  const itens = db
    .prepare(
      `SELECT ic.*, p.nome as produto_nome FROM itens_comanda ic
       JOIN produtos p ON p.id = ic.produto_id
       WHERE ic.comanda_id = ? ORDER BY ic.criado_em ASC`
    )
    .all(comanda.id) as ItemComanda[]
  const total = itens.reduce((acc, item) => acc + item.quantidade * item.preco_unitario, 0)
  return { ...comanda, itens, total }
}

export function abrirComanda(input: {
  mesa_id?: number | null
  tipo: ComandaTipo
  observacao?: string
}): ComandaComItens {
  const db = getDb()
  const result = db
    .prepare('INSERT INTO comandas (mesa_id, tipo, status, observacao) VALUES (?, ?, ?, ?)')
    .run(input.mesa_id ?? null, input.tipo, 'aberta', input.observacao ?? null)

  if (input.mesa_id) {
    atualizarStatusMesa(input.mesa_id, 'ocupada')
  }

  return obterComanda(Number(result.lastInsertRowid)) as ComandaComItens
}

export function adicionarItemComanda(input: {
  comanda_id: number
  produto_id: number
  quantidade: number
  preco_unitario: number
  observacao?: string
}): ComandaComItens {
  const db = getDb()
  db.prepare(
    `INSERT INTO itens_comanda (comanda_id, produto_id, quantidade, preco_unitario, observacao)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    input.comanda_id,
    input.produto_id,
    input.quantidade,
    input.preco_unitario,
    input.observacao ?? null
  )
  return obterComanda(input.comanda_id) as ComandaComItens
}

export function removerItemComanda(itemId: number, comandaId: number): ComandaComItens {
  getDb().prepare('DELETE FROM itens_comanda WHERE id = ?').run(itemId)
  return obterComanda(comandaId) as ComandaComItens
}

export function fecharComanda(id: number): void {
  const db = getDb()
  const comanda = db.prepare('SELECT * FROM comandas WHERE id = ?').get(id) as Comanda | undefined
  db.prepare("UPDATE comandas SET status = 'fechada', fechada_em = datetime('now') WHERE id = ?").run(id)
  if (comanda?.mesa_id) {
    atualizarStatusMesa(comanda.mesa_id, 'livre')
  }
}

export function cancelarComanda(id: number): void {
  const db = getDb()
  const comanda = db.prepare('SELECT * FROM comandas WHERE id = ?').get(id) as Comanda | undefined
  db.prepare("UPDATE comandas SET status = 'cancelada', fechada_em = datetime('now') WHERE id = ?").run(id)
  if (comanda?.mesa_id) {
    atualizarStatusMesa(comanda.mesa_id, 'livre')
  }
}
