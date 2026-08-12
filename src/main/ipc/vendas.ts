import { ipcMain } from 'electron'
import { IPC } from '../../shared/types'
import { criarVenda, listarVendas, obterVenda } from '../db/vendas.repo'
import { obterProduto } from '../db/produtos.repo'
import { darBaixaEstoqueVenda } from '../db/estoque.repo'
import { fecharComanda } from '../db/comandas.repo'
import { obterConfig } from '../db/config.repo'
import { emitirNfceParaVenda } from '../fiscal/nfce'
import { imprimirVenda } from '../printing'
import type { FinalizarVendaInput, ResultadoFinalizarVenda, VendaCompleta } from '../../shared/types'

async function finalizarVenda(input: FinalizarVendaInput): Promise<ResultadoFinalizarVenda> {
  if (!input.itens.length) {
    throw new Error('A venda precisa ter ao menos um item.')
  }

  const desconto = input.desconto ?? 0
  const itensComNome = input.itens.map((item) => {
    const produto = obterProduto(item.produto_id)
    if (!produto) throw new Error(`Produto ${item.produto_id} nao encontrado.`)
    return {
      produto_id: item.produto_id,
      nome_produto: produto.nome,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.quantidade * item.preco_unitario
    }
  })

  const totalBruto = itensComNome.reduce((acc, item) => acc + item.subtotal, 0)
  const total = Math.max(totalBruto - desconto, 0)

  const totalPagamentos = input.pagamentos.reduce((acc, p) => acc + p.valor, 0)
  if (Math.abs(totalPagamentos - total) > 0.01) {
    throw new Error(
      `Total dos pagamentos (${totalPagamentos.toFixed(2)}) nao confere com o total da venda (${total.toFixed(2)}).`
    )
  }

  let venda = criarVenda({
    comanda_id: input.comanda_id ?? null,
    total,
    desconto,
    tipo_documento: input.tipo_documento,
    itens: itensComNome,
    pagamentos: input.pagamentos
  })

  for (const item of itensComNome) {
    const produto = obterProduto(item.produto_id)
    if (produto?.controla_estoque) {
      darBaixaEstoqueVenda(item.produto_id, item.quantidade, `Venda #${venda.id}`)
    }
  }

  if (input.comanda_id) {
    fecharComanda(input.comanda_id)
  }

  const resultado: ResultadoFinalizarVenda = { venda }

  if (input.tipo_documento === 'nfce') {
    const config = obterConfig()
    try {
      const emissao = await emitirNfceParaVenda(venda, config)
      resultado.fiscal = { sucesso: emissao.sucesso, mensagemErro: emissao.mensagemErro }
      venda = obterVenda(venda.id) as VendaCompleta
      resultado.venda = venda
    } catch (error) {
      resultado.fiscal = { sucesso: false, mensagemErro: (error as Error).message }
    }
  }

  if (input.imprimir) {
    const config = obterConfig()
    try {
      await imprimirVenda(venda, config.loja, config.impressora)
      resultado.impressao = { sucesso: true }
    } catch (error) {
      resultado.impressao = { sucesso: false, mensagemErro: (error as Error).message }
    }
  }

  return resultado
}

export function registrarIpcVendas(): void {
  ipcMain.handle(IPC.VENDAS_FINALIZAR, (_event, input: FinalizarVendaInput) => finalizarVenda(input))

  ipcMain.handle(IPC.VENDAS_LISTAR, (_event, limite?: number) => listarVendas(limite))

  ipcMain.handle(IPC.VENDAS_OBTER, (_event, id: number) => obterVenda(id))
}
