import axios, { AxiosInstance } from 'axios'
import type { ConfiguracoesFiscal } from '../../shared/types'

const BASE_URL_HOMOLOGACAO = 'https://homologacao.focusnfe.com.br'
const BASE_URL_PRODUCAO = 'https://api.focusnfe.com.br'

export interface FocusNfeResponse {
  status: 'processando_autorizacao' | 'autorizado' | 'erro_autorizacao' | 'cancelado' | string
  status_sefaz?: string
  mensagem_sefaz?: string
  numero?: string
  serie?: string
  chave_nfe?: string
  caminho_danfe?: string
  caminho_xml_nota_fiscal?: string
  protocolo_autorizacao?: string
  erros?: Array<{ codigo?: string; mensagem: string }>
  [key: string]: unknown
}

export class FocusNfeClient {
  private http: AxiosInstance

  constructor(config: ConfiguracoesFiscal) {
    if (!config.focusNfeToken) {
      throw new Error('Token da Focus NFe nao configurado. Ajuste em Configuracoes > Fiscal.')
    }
    const baseURL = config.ambiente === 'producao' ? BASE_URL_PRODUCAO : BASE_URL_HOMOLOGACAO
    this.http = axios.create({
      baseURL,
      auth: { username: config.focusNfeToken, password: '' },
      timeout: 30_000
    })
  }

  /** Envia a emissao. A Focus NFe processa de forma assincrona, retorna 202 "processando_autorizacao". */
  async emitirNfce(referencia: string, payload: Record<string, unknown>): Promise<FocusNfeResponse> {
    const { data } = await this.http.post<FocusNfeResponse>(`/v2/nfce?ref=${referencia}`, payload)
    return data
  }

  async consultarNfce(referencia: string): Promise<FocusNfeResponse> {
    const { data } = await this.http.get<FocusNfeResponse>(`/v2/nfce/${referencia}`)
    return data
  }

  async cancelarNfce(referencia: string, justificativa: string): Promise<FocusNfeResponse> {
    const { data } = await this.http.delete<FocusNfeResponse>(`/v2/nfce/${referencia}`, {
      data: { justificativa }
    })
    return data
  }

  /** Ping simples para validar token/ambiente na tela de Configuracoes. */
  async testarConexao(): Promise<{ ok: boolean; mensagem: string }> {
    try {
      await this.http.get('/v2/nfce', { params: { ref: '__teste_conexao__' } })
      return { ok: true, mensagem: 'Conexao com a Focus NFe estabelecida.' }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // 404/erro de referencia inexistente ainda indica que o token autenticou com sucesso
        if (error.response.status === 404 || error.response.status === 422) {
          return { ok: true, mensagem: 'Token valido, conexao estabelecida.' }
        }
        if (error.response.status === 401 || error.response.status === 403) {
          return { ok: false, mensagem: 'Token invalido ou sem permissao.' }
        }
        return { ok: false, mensagem: `Erro HTTP ${error.response.status}` }
      }
      return { ok: false, mensagem: (error as Error).message }
    }
  }
}
