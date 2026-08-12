import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import { obterConfig, salvarConfig } from '../db/config.repo'
import { FocusNfeClient } from '../fiscal/focusNfeClient'
import { imprimirVenda } from '../printing'
import { reiniciarSyncDelivery, sincronizarPedidosDelivery } from '../sync/deliverySync'
import type { AppConfig } from '../../shared/types'

export function registrarIpcConfig(): void {
  ipcMain.handle(IPC.CONFIG_OBTER, () => obterConfig())

  ipcMain.handle(IPC.CONFIG_SALVAR, (_event, config: AppConfig) => {
    const salvo = salvarConfig(config)
    reiniciarSyncDelivery()
    return salvo
  })

  ipcMain.handle(IPC.DELIVERY_SINCRONIZAR_AGORA, () => sincronizarPedidosDelivery())

  ipcMain.handle(IPC.FISCAL_TESTAR_CONEXAO, async () => {
    const config = obterConfig()
    try {
      const client = new FocusNfeClient(config.fiscal)
      return await client.testarConexao()
    } catch (error) {
      return { ok: false, mensagem: (error as Error).message }
    }
  })

  ipcMain.handle(IPC.IMPRESSORA_TESTAR, async () => {
    const config = obterConfig()
    try {
      await imprimirVenda(
        {
          id: 0,
          comanda_id: null,
          total: 0,
          desconto: 0,
          status: 'teste',
          tipo_documento: 'nao_fiscal',
          numero_documento: null,
          chave_acesso: null,
          protocolo_autorizacao: null,
          ambiente_fiscal: null,
          erro_fiscal: null,
          criado_em: new Date().toISOString(),
          itens: [
            { produto_id: 0, nome_produto: 'Impressao de teste', quantidade: 1, preco_unitario: 0, subtotal: 0 }
          ],
          pagamentos: []
        },
        config.loja,
        config.impressora
      )
      return { ok: true, mensagem: 'Impressao de teste enviada.' }
    } catch (error) {
      return { ok: false, mensagem: (error as Error).message }
    }
  })
}
