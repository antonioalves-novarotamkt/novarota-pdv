import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import { listarCategorias, salvarCategoria, removerCategoria } from '../db/categorias.repo'

export function registrarIpcCategorias(): void {
  ipcMain.handle(IPC.CATEGORIAS_LISTAR, () => listarCategorias())

  ipcMain.handle(IPC.CATEGORIAS_SALVAR, (_event, input: { id?: number; nome: string; ordem?: number }) =>
    salvarCategoria(input)
  )

  ipcMain.handle(IPC.CATEGORIAS_REMOVER, (_event, id: number) => {
    removerCategoria(id)
    return { ok: true }
  })
}
