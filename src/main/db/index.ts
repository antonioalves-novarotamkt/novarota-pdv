import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { SCHEMA_SQL } from './schema'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  if (db) return db

  const userDataPath = app.getPath('userData')
  mkdirSync(userDataPath, { recursive: true })
  const dbPath = join(userDataPath, 'novarota-pdv.sqlite')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA_SQL)

  return db
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Banco de dados ainda nao foi inicializado. Chame initDatabase() primeiro.')
  }
  return db
}
