import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import { listarMovimentosEstoque, registrarMovimentoEstoque } from '../db/estoque.repo'
import type { MovimentoEstoqueInput } from '../../shared/types'

export function registrarIpcEstoque(): void {
  ipcMain.handle(IPC.ESTOQUE_LISTAR_MOVIMENTOS, (_event, produtoId?: number) =>
    listarMovimentosEstoque(produtoId)
  )

  ipcMain.handle(IPC.ESTOQUE_MOVIMENTAR, (_event, input: MovimentoEstoqueInput) => {
    registrarMovimentoEstoque(input)
    return { ok: true }
  })
}
