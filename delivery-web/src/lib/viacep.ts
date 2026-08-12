export interface EnderecoViaCep {
  cep: string
  rua: string
  bairro: string
  cidade: string
  uf: string
}

function normalizarCep(cep: string): string {
  return cep.replace(/\D/g, '')
}

export function cepParaNumero(cep: string): number {
  return Number(normalizarCep(cep))
}

/**
 * Consulta o ViaCEP (servico publico e gratuito, mantido para consultas de CEP no Brasil,
 * sem necessidade de chave de API). Muito mais confiavel para enderecos brasileiros do que
 * geocodificar texto livre.
 */
export async function buscarEnderecoPorCep(cep: string): Promise<EnderecoViaCep | null> {
  const cepLimpo = normalizarCep(cep)
  if (cepLimpo.length !== 8) return null

  const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
  if (!response.ok) return null

  const dados = (await response.json()) as {
    erro?: boolean
    logradouro?: string
    bairro?: string
    localidade?: string
    uf?: string
  }

  if (dados.erro) return null

  return {
    cep: cepLimpo,
    rua: dados.logradouro || '',
    bairro: dados.bairro || '',
    cidade: dados.localidade || '',
    uf: dados.uf || ''
  }
}
