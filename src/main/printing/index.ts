import escpos from 'escpos'
import USB from 'escpos-usb'
import Network from 'escpos-network'
import type { ConfiguracoesImpressora, VendaCompleta, ConfiguracoesLoja } from '../../shared/types'

escpos.USB = USB
escpos.Network = Network

function criarDispositivo(config: ConfiguracoesImpressora): unknown {
  if (config.tipo === 'usb') {
    return new escpos.USB()
  }
  if (config.tipo === 'network') {
    if (!config.enderecoIp) throw new Error('Endereco IP da impressora nao configurado')
    return new escpos.Network(config.enderecoIp, config.porta ?? 9100)
  }
  throw new Error('Nenhuma impressora configurada. Ajuste em Configuracoes > Impressora.')
}

function centralizar(texto: string, largura: number): string {
  if (texto.length >= largura) return texto.slice(0, largura)
  const espacos = Math.floor((largura - texto.length) / 2)
  return ' '.repeat(espacos) + texto
}

function linhaDivisoria(largura: number): string {
  return '-'.repeat(largura)
}

function colunaEsquerdaDireita(esquerda: string, direita: string, largura: number): string {
  const espacoDisponivel = largura - esquerda.length - direita.length
  if (espacoDisponivel <= 0) return `${esquerda} ${direita}`.slice(0, largura)
  return esquerda + ' '.repeat(espacoDisponivel) + direita
}

function formatarMoeda(valor: number): string {
  return valor.toFixed(2).replace('.', ',')
}

function montarLinhasCupom(
  venda: VendaCompleta,
  loja: ConfiguracoesLoja,
  largura: number,
  fiscal: boolean
): string[] {
  const linhas: string[] = []
  linhas.push(centralizar(loja.nomeFantasia || 'NovaRota PDV', largura))
  if (loja.cnpj) linhas.push(centralizar(`CNPJ: ${loja.cnpj}`, largura))
  linhas.push(linhaDivisoria(largura))
  linhas.push(centralizar(fiscal ? 'CUPOM FISCAL - NFC-e' : 'COMPROVANTE NAO FISCAL', largura))
  linhas.push(centralizar('Sem valor fiscal como documento tributario', largura))
  linhas.push(linhaDivisoria(largura))

  for (const item of venda.itens) {
    linhas.push(item.nome_produto.slice(0, largura))
    linhas.push(
      colunaEsquerdaDireita(
        `${item.quantidade} x ${formatarMoeda(item.preco_unitario)}`,
        formatarMoeda(item.subtotal),
        largura
      )
    )
  }

  linhas.push(linhaDivisoria(largura))
  if (venda.desconto > 0) {
    linhas.push(colunaEsquerdaDireita('Desconto', `-${formatarMoeda(venda.desconto)}`, largura))
  }
  linhas.push(colunaEsquerdaDireita('TOTAL', formatarMoeda(venda.total), largura))
  linhas.push(linhaDivisoria(largura))

  for (const pagamento of venda.pagamentos) {
    linhas.push(colunaEsquerdaDireita(pagamento.forma.toUpperCase(), formatarMoeda(pagamento.valor), largura))
  }

  if (fiscal) {
    linhas.push(linhaDivisoria(largura))
    if (venda.numero_documento) linhas.push(`NFC-e no ${venda.numero_documento}`)
    if (venda.protocolo_autorizacao) linhas.push(`Protocolo: ${venda.protocolo_autorizacao}`)
    if (venda.chave_acesso) {
      linhas.push('Chave de acesso:')
      linhas.push(venda.chave_acesso.replace(/(\d{4})(?=\d)/g, '$1 '))
    }
    linhas.push('Consulte pela chave em:')
    linhas.push('www.nfce.fazenda.sp.gov.br')
  }

  linhas.push(linhaDivisoria(largura))
  linhas.push(centralizar(new Date().toLocaleString('pt-BR'), largura))
  linhas.push('')
  linhas.push('')

  return linhas
}

export function imprimirVenda(
  venda: VendaCompleta,
  loja: ConfiguracoesLoja,
  config: ConfiguracoesImpressora
): Promise<void> {
  const largura = config.largura ?? 48
  const fiscal = venda.tipo_documento === 'nfce'
  const linhas = montarLinhasCupom(venda, loja, largura, fiscal)

  return new Promise((resolve, reject) => {
    let device: unknown
    try {
      device = criarDispositivo(config)
    } catch (error) {
      reject(error)
      return
    }

    const printer = new escpos.Printer(device)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(device as any).open((err: Error | null) => {
      if (err) {
        reject(err)
        return
      }
      try {
        printer.align('ct')
        for (const linha of linhas) {
          printer.text(linha)
        }
        printer.cut().close(() => resolve())
      } catch (printError) {
        reject(printError as Error)
      }
    })
  })
}
