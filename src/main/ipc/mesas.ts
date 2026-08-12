import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import { listarMesas, salvarMesa, removerMesa } from '../db/mesas.repo'

export function registrarIpcMesas(): void {
  ipcMain.handle(IPC.MESAS_LISTAR, () => listarMesas())

  ipcMain.handle(IPC.MESAS_SALVAR, (_event, input: { id?: number; numero: string }) =>
    salvarMesa(input)
  )

  ipcMain.handle(IPC.MESAS_REMOVER, (_event, id: number) => {
    removerMesa(id)
    return { ok: true }
  })
}
