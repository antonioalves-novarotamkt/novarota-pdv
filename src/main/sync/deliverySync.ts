import axios from 'axios'
import { obterConfig } from '../db/config.repo'
import { encontrarOuCriarProdutoPorNome } from '../db/produtos.repo'
import { abrirComanda, adicionarItemComanda } from '../db/comandas.repo'
import type { ConfiguracoesDelivery, ResultadoSincronizacaoDelivery } from '../../shared/types'

interface PedidoRemotoItem {
  produtoId: string | null
  nomeProduto: string
  quantidade: number
  precoUnitario: number
}

interface PedidoRemoto {
  id: string
  clienteNome: string
  clienteTelefone: string
  enderecoEntrega: string
  taxaEntrega: number
  formaPagamento: 'dinheiro' | 'cartao_entrega'
  trocoPara: number | null
  observacoes: string | null
  itens: PedidoRemotoItem[]
}

let timer: ReturnType<typeof setInterval> | null = null

function montarObservacaoComanda(pedido: PedidoRemoto): string {
  const partes = [
    `Cliente: ${pedido.clienteNome}`,
    `Tel: ${pedido.clienteTelefone}`,
    `Endereco: ${pedido.enderecoEntrega}`,
    `Pagamento na entrega: ${pedido.formaPagamento === 'dinheiro' ? 'Dinheiro' : 'Cartao (maquininha)'}`
  ]
  if (pedido.formaPagamento === 'dinheiro' && pedido.trocoPara) {
    partes.push(`Troco para: R$ ${pedido.trocoPara.toFixed(2)}`)
  }
  if (pedido.taxaEntrega) {
    partes.push(`Taxa de entrega: R$ ${pedido.taxaEntrega.toFixed(2)}`)
  }
  if (pedido.observacoes) {
    partes.push(`Obs: ${pedido.observacoes}`)
  }
  return partes.join(' | ')
}

async function importarPedido(apiUrl: string, token: string, pedido: PedidoRemoto): Promise<void> {
  const comanda = abrirComanda({ tipo: 'delivery', observacao: montarObservacaoComanda(pedido) })

  for (const item of pedido.itens) {
    const produto = encontrarOuCriarProdutoPorNome(item.nomeProduto, item.precoUnitario)
    adicionarItemComanda({
      comanda_id: comanda.id,
      produto_id: produto.id,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario
    })
  }

  if (pedido.taxaEntrega) {
    const produtoTaxa = encontrarOuCriarProdutoPorNome('Taxa de entrega', pedido.taxaEntrega)
    adicionarItemComanda({
      comanda_id: comanda.id,
      produto_id: produtoTaxa.id,
      quantidade: 1,
      preco_unitario: pedido.taxaEntrega
    })
  }

  await axios.post(
    `${apiUrl}/api/pedidos/${pedido.id}/sincronizado`,
    {},
    { headers: { Authorization: `Bearer ${token}` }, timeout: 15_000 }
  )
}

export async function sincronizarPedidosDelivery(): Promise<ResultadoSincronizacaoDelivery> {
  const config = obterConfig()
  const delivery = config.delivery

  if (!delivery.apiUrl || !delivery.syncToken) {
    return { ok: false, importados: 0, mensagemErro: 'Configure a URL e o token do delivery em Configuracoes.' }
  }

  try {
    const { data } = await axios.get<PedidoRemoto[]>(`${delivery.apiUrl}/api/pedidos/pendentes`, {
      headers: { Authorization: `Bearer ${delivery.syncToken}` },
      timeout: 15_000
    })

    for (const pedido of data) {
      await importarPedido(delivery.apiUrl, delivery.syncToken, pedido)
    }

    return { ok: true, importados: data.length }
  } catch (error) {
    return { ok: false, importados: 0, mensagemErro: (error as Error).message }
  }
}

export function iniciarSyncDelivery(): void {
  pararSyncDelivery()

  const agendarProximo = (config: ConfiguracoesDelivery): void => {
    timer = setInterval(
      () => {
        sincronizarPedidosDelivery().catch(() => undefined)
      },
      Math.max(config.intervaloSegundos, 10) * 1000
    )
  }

  const config = obterConfig()
  if (config.delivery.ativo) {
    agendarProximo(config.delivery)
  }
}

export function pararSyncDelivery(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

/** Chamar apos salvar as Configuracoes para aplicar imediatamente ativo/intervalo novos. */
export function reiniciarSyncDelivery(): void {
  iniciarSyncDelivery()
}
