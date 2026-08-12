import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import {
  listarComandasAbertas,
  obterComanda,
  abrirComanda,
  adicionarItemComanda,
  removerItemComanda,
  cancelarComanda
} from '../db/comandas.repo'
import type { ComandaTipo } from '../../shared/types'

export function registrarIpcComandas(): void {
  ipcMain.handle(IPC.COMANDAS_LISTAR_ABERTAS, () => listarComandasAbertas())

  ipcMain.handle(IPC.COMANDAS_OBTER, (_event, id: number) => obterComanda(id))

  ipcMain.handle(
    IPC.COMANDAS_ABRIR,
    (_event, input: { mesa_id?: number | null; tipo: ComandaTipo; observacao?: string }) =>
      abrirComanda(input)
  )

  ipcMain.handle(
    IPC.COMANDAS_ADICIONAR_ITEM,
    (
      _event,
      input: {
        comanda_id: number
        produto_id: number
        quantidade: number
        preco_unitario: number
        observacao?: string
      }
    ) => adicionarItemComanda(input)
  )

  ipcMain.handle(IPC.COMANDAS_REMOVER_ITEM, (_event, input: { itemId: number; comandaId: number }) =>
    removerItemComanda(input.itemId, input.comandaId)
  )

  ipcMain.handle(IPC.COMANDAS_CANCELAR, (_event, id: number) => {
    cancelarComanda(id)
    return { ok: true }
  })
}
