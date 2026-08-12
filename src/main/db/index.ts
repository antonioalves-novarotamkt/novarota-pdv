import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { SCHEMA_SQL } from './schema'

let db: Database.Database | null = null

/**
 * SQLite nao suporta "ADD COLUMN IF NOT EXISTS", entao para bancos criados antes de um novo
 * campo existir, adicionamos a coluna na mao aqui. Mantem instalacoes antigas funcionando sem
 * perder dados.
 */
function migrarColunasNovas(database: Database.Database): void {
  const colunas = database.prepare('PRAGMA table_info(produtos)').all() as Array<{ name: string }>
  const existentes = new Set(colunas.map((c) => c.name))

  const novasColunas: Array<{ nome: string; ddl: string }> = [
    { nome: 'descricao', ddl: 'ALTER TABLE produtos ADD COLUMN descricao TEXT' },
    { nome: 'item_cozinha', ddl: 'ALTER TABLE produtos ADD COLUMN item_cozinha INTEGER NOT NULL DEFAULT 0' },
    { nome: 'cozinha', ddl: 'ALTER TABLE produtos ADD COLUMN cozinha TEXT' },
    {
      nome: 'disponivel_pdv',
      ddl: 'ALTER TABLE produtos ADD COLUMN disponivel_pdv INTEGER NOT NULL DEFAULT 1'
    },
    {
      nome: 'disponivel_comanda',
      ddl: 'ALTER TABLE produtos ADD COLUMN disponivel_comanda INTEGER NOT NULL DEFAULT 1'
    },
    {
      nome: 'disponivel_delivery',
      ddl: 'ALTER TABLE produtos ADD COLUMN disponivel_delivery INTEGER NOT NULL DEFAULT 0'
    }
  ]

  for (const coluna of novasColunas) {
    if (!existentes.has(coluna.nome)) {
      database.exec(coluna.ddl)
    }
  }
}

export function initDatabase(): Database.Database {
  if (db) return db

  const userDataPath = app.getPath('userData')
  mkdirSync(userDataPath, { recursive: true })
  const dbPath = join(userDataPath, 'novarota-pdv.sqlite')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA_SQL)
  migrarColunasNovas(db)

  return db
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Banco de dados ainda nao foi inicializado. Chame initDatabase() primeiro.')
  }
  return db
}
