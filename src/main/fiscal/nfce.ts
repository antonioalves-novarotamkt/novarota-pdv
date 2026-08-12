import { FocusNfeClient } from './focusNfeClient'
import { obterProduto } from '../db/produtos.repo'
import { atualizarDadosFiscais } from '../db/vendas.repo'
import type { AppConfig, VendaCompleta } from '../../shared/types'

const FORMAS_PAGAMENTO_SEFAZ: Record<string, string> = {
  dinheiro: '01',
  credito: '03',
  debito: '04',
  pix: '17',
  outro: '99'
}

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 60_000

/**
 * ATENCAO: CFOP e CSOSN/CST dependem do regime tributario do emitente
 * (Simples Nacional, Lucro Presumido, etc) e devem ser validados com o
 * contador do cliente ANTES de emitir em producao. O CSOSN 102 abaixo
 * e um valor comum para Simples Nacional sem permissao de credito, usado
 * apenas como ponto de partida.
 */
function montarItensPayload(venda: VendaCompleta): Record<string, unknown>[] {
  return venda.itens.map((item, index) => {
    const produto = obterProduto(item.produto_id)
    return {
      numero_item: index + 1,
      codigo_produto: String(item.produto_id),
      descricao: item.nome_produto,
      cfop: produto?.cfop || '5102',
      ncm: produto?.ncm || '21069090',
      unidade_comercial: produto?.unidade || 'UN',
      quantidade_comercial: item.quantidade,
      valor_unitario_comercial: item.preco_unitario,
      valor_bruto: item.subtotal,
      unidade_tributavel: produto?.unidade || 'UN',
      quantidade_tributavel: item.quantidade,
      valor_unitario_tributavel: item.preco_unitario,
      icms_origem: '0',
      icms_situacao_tributaria: '102',
      pis_situacao_tributaria: '49',
      cofins_situacao_tributaria: '49'
    }
  })
}

export function montarPayloadNfce(venda: VendaCompleta, config: AppConfig): Record<string, unknown> {
  const formasPagamento = venda.pagamentos.map((pagamento) => ({
    forma_pagamento: FORMAS_PAGAMENTO_SEFAZ[pagamento.forma] ?? '99',
    valor_pagamento: pagamento.valor
  }))

  return {
    natureza_operacao: 'Venda de mercadoria',
    presenca_comprador: '1',
    modalidade_frete: '9',
    cnpj_emitente: config.fiscal.cnpjEmitente.replace(/\D/g, ''),
    valor_produtos: venda.total + venda.desconto,
    valor_desconto: venda.desconto,
    valor_total: venda.total,
    formas_pagamento: formasPagamento,
    items: montarItensPayload(venda)
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface ResultadoEmissaoNfce {
  sucesso: boolean
  chaveAcesso?: string
  numero?: string
  protocolo?: string
  mensagemErro?: string
}

export async function emitirNfceParaVenda(
  venda: VendaCompleta,
  config: AppConfig
): Promise<ResultadoEmissaoNfce> {
  const client = new FocusNfeClient(config.fiscal)
  const referencia = `venda-${venda.id}-${Date.now()}`
  const payload = montarPayloadNfce(venda, config)

  await client.emitirNfce(referencia, payload)

  const inicio = Date.now()
  while (Date.now() - inicio < POLL_TIMEOUT_MS) {
    await delay(POLL_INTERVAL_MS)
    const resultado = await client.consultarNfce(referencia)

    if (resultado.status === 'autorizado') {
      atualizarDadosFiscais(venda.id, {
        numero_documento: resultado.numero ?? null,
        chave_acesso: resultado.chave_nfe ?? null,
        protocolo_autorizacao: resultado.protocolo_autorizacao ?? null,
        ambiente_fiscal: config.fiscal.ambiente,
        erro_fiscal: null
      })
      return {
        sucesso: true,
        chaveAcesso: resultado.chave_nfe,
        numero: resultado.numero,
        protocolo: resultado.protocolo_autorizacao
      }
    }

    if (resultado.status === 'erro_autorizacao') {
      const mensagem = resultado.mensagem_sefaz || resultado.erros?.[0]?.mensagem || 'Erro desconhecido na SEFAZ'
      atualizarDadosFiscais(venda.id, {
        ambiente_fiscal: config.fiscal.ambiente,
        erro_fiscal: mensagem
      })
      return { sucesso: false, mensagemErro: mensagem }
    }
  }

  const mensagemTimeout = 'Tempo limite aguardando autorizacao da SEFAZ. Consulte novamente mais tarde.'
  atualizarDadosFiscais(venda.id, {
    ambiente_fiscal: config.fiscal.ambiente,
    erro_fiscal: mensagemTimeout
  })
  return { sucesso: false, mensagemErro: mensagemTimeout }
}
