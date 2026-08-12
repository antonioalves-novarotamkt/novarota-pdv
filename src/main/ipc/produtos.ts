import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import { listarProdutos, salvarProduto, removerProduto } from '../db/produtos.repo'
import type { ProdutoInput } from '../../shared/types'

export function registrarIpcProdutos(): void {
  ipcMain.handle(IPC.PRODUTOS_LISTAR, (_event, apenasAtivos?: boolean) =>
    listarProdutos(apenasAtivos ?? true)
  )

  ipcMain.handle(IPC.PRODUTOS_SALVAR, (_event, input: ProdutoInput & { id?: number }) =>
    salvarProduto(input)
  )

  ipcMain.handle(IPC.PRODUTOS_REMOVER, (_event, id: number) => {
    removerProduto(id)
    return { ok: true }
  })
}
