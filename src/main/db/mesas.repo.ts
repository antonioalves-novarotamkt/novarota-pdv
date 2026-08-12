import { getDb } from './index'
import type { Mesa, MesaStatus } from '../../shared/types'

export function listarMesas(): Mesa[] {
  return getDb().prepare('SELECT * FROM mesas ORDER BY numero ASC').all() as Mesa[]
}

export function salvarMesa(input: { id?: number; numero: string }): Mesa {
  const db = getDb()
  if (input.id) {
    db.prepare('UPDATE mesas SET numero = ? WHERE id = ?').run(input.numero, input.id)
    return db.prepare('SELECT * FROM mesas WHERE id = ?').get(input.id) as Mesa
  }
  const result = db.prepare('INSERT INTO mesas (numero, status) VALUES (?, ?)').run(input.numero, 'livre')
  return db.prepare('SELECT * FROM mesas WHERE id = ?').get(result.lastInsertRowid) as Mesa
}

export function removerMesa(id: number): void {
  getDb().prepare('DELETE FROM mesas WHERE id = ?').run(id)
}

export function atualizarStatusMesa(id: number, status: MesaStatus): void {
  getDb().prepare('UPDATE mesas SET status = ? WHERE id = ?').run(status, id)
}
