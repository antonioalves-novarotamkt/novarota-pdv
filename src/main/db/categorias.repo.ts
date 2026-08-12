import { getDb } from './index'
import type { Categoria } from '../../shared/types'

export function listarCategorias(): Categoria[] {
  return getDb().prepare('SELECT * FROM categorias ORDER BY ordem ASC, nome ASC').all() as Categoria[]
}

export function salvarCategoria(input: { id?: number; nome: string; ordem?: number }): Categoria {
  const db = getDb()
  if (input.id) {
    db.prepare('UPDATE categorias SET nome = ?, ordem = ? WHERE id = ?').run(
      input.nome,
      input.ordem ?? 0,
      input.id
    )
    return db.prepare('SELECT * FROM categorias WHERE id = ?').get(input.id) as Categoria
  }
  const result = db
    .prepare('INSERT INTO categorias (nome, ordem) VALUES (?, ?)')
    .run(input.nome, input.ordem ?? 0)
  return db.prepare('SELECT * FROM categorias WHERE id = ?').get(result.lastInsertRowid) as Categoria
}

export function removerCategoria(id: number): void {
  getDb().prepare('DELETE FROM categorias WHERE id = ?').run(id)
}
