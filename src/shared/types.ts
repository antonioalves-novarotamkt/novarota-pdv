export interface Categoria {
  id: number
  nome: string
  ordem: number
}

export interface Produto {
  id: number
  nome: string
  descricao: string | null
  categoria_id: number | null
  preco: number
  ncm: string | null
  cfop: string | null
  unidade: string
  controla_estoque: 0 | 1
  quantidade_estoque: number
  estoque_minimo: number
  item_cozinha: 0 | 1
  cozinha: string | null
  disponivel_pdv: 0 | 1
  disponivel_comanda: 0 | 1
  disponivel_delivery: 0 | 1
  ativo: 0 | 1
  criado_em: string
}

export interface ProdutoInput {
  nome: string
  descricao?: string | null
  categoria_id: number | null
  preco: number
  ncm?: string | null
  cfop?: string | null
  unidade?: string
  controla_estoque?: boolean
  quantidade_estoque?: number
  estoque_minimo?: number
  item_cozinha?: boolean
  cozinha?: string | null
  disponivel_pdv?: boolean
  disponivel_comanda?: boolean
  disponivel_delivery?: boolean
}

export type MesaStatus = 'livre' | 'ocupada'

export interface Mesa {
  id: number
  numero: string
  status: MesaStatus
}

export type ComandaTipo = 'mesa' | 'balcao' | 'delivery'
export type ComandaStatus = 'aberta' | 'fechada' | 'cancelada'

export interface Comanda {
  id: number
  mesa_id: number | null
  tipo: ComandaTipo
  status: ComandaStatus
  observacao: string | null
  aberta_em: string
  fechada_em: string | null
}

export interface ItemComanda {
  id: number
  comanda_id: number
  produto_id: number
  quantidade: number
  preco_unitario: number
  observacao: string | null
  criado_em: string
  produto_nome?: string
}

export interface ComandaComItens extends Comanda {
  itens: ItemComanda[]
  total: number
}

export type FormaPagamento = 'dinheiro' | 'debito' | 'credito' | 'pix' | 'outro'

export interface PagamentoInput {
  forma: FormaPagamento
  valor: number
}

export type TipoDocumento = 'nao_fiscal' | 'nfce'

export interface FinalizarVendaInput {
  comanda_id?: number | null
  itens: Array<{
    produto_id: number
    quantidade: number
    preco_unitario: number
  }>
  desconto?: number
  pagamentos: PagamentoInput[]
  tipo_documento: TipoDocumento
  imprimir?: boolean
}

export interface Venda {
  id: number
  comanda_id: number | null
  total: number
  desconto: number
  status: string
  tipo_documento: TipoDocumento
  numero_documento: string | null
  chave_acesso: string | null
  protocolo_autorizacao: string | null
  ambiente_fiscal: string | null
  erro_fiscal: string | null
  criado_em: string
}

export interface VendaCompleta extends Venda {
  itens: Array<{
    produto_id: number
    nome_produto: string
    quantidade: number
    preco_unitario: number
    subtotal: number
  }>
  pagamentos: PagamentoInput[]
}

export type MovimentoEstoqueTipo = 'entrada' | 'saida' | 'ajuste'

export interface MovimentoEstoqueInput {
  produto_id: number
  tipo: MovimentoEstoqueTipo
  quantidade: number
  motivo?: string
}

export interface ConfiguracoesImpressora {
  tipo: 'usb' | 'network' | 'nenhuma'
  enderecoIp?: string
  porta?: number
  largura?: 32 | 42 | 48
}

export interface ConfiguracoesFiscal {
  ambiente: 'homologacao' | 'producao'
  focusNfeToken: string
  cnpjEmitente: string
  ufEmitente: string
  csc: string
  cscId: string
}

export interface ConfiguracoesLoja {
  nomeFantasia: string
  razaoSocial: string
  cnpj: string
  endereco: string
}

export interface ConfiguracoesDelivery {
  ativo: boolean
  apiUrl: string
  syncToken: string
  intervaloSegundos: number
}

export interface AppConfig {
  loja: ConfiguracoesLoja
  impressora: ConfiguracoesImpressora
  fiscal: ConfiguracoesFiscal
  delivery: ConfiguracoesDelivery
}

export interface ResultadoSincronizacaoDelivery {
  ok: boolean
  importados: number
  produtosSincronizados?: number
  mensagemErro?: string
}

export interface ResultadoFinalizarVenda {
  venda: VendaCompleta
  fiscal?: { sucesso: boolean; mensagemErro?: string }
  impressao?: { sucesso: boolean; mensagemErro?: string }
}

export const IPC = {
  PRODUTOS_LISTAR: 'produtos:listar',
  PRODUTOS_SALVAR: 'produtos:salvar',
  PRODUTOS_REMOVER: 'produtos:remover',
  CATEGORIAS_LISTAR: 'categorias:listar',
  CATEGORIAS_SALVAR: 'categorias:salvar',
  CATEGORIAS_REMOVER: 'categorias:remover',
  MESAS_LISTAR: 'mesas:listar',
  MESAS_SALVAR: 'mesas:salvar',
  MESAS_REMOVER: 'mesas:remover',
  COMANDAS_LISTAR_ABERTAS: 'comandas:listarAbertas',
  COMANDAS_ABRIR: 'comandas:abrir',
  COMANDAS_OBTER: 'comandas:obter',
  COMANDAS_ADICIONAR_ITEM: 'comandas:adicionarItem',
  COMANDAS_REMOVER_ITEM: 'comandas:removerItem',
  COMANDAS_CANCELAR: 'comandas:cancelar',
  VENDAS_FINALIZAR: 'vendas:finalizar',
  VENDAS_LISTAR: 'vendas:listar',
  VENDAS_OBTER: 'vendas:obter',
  ESTOQUE_LISTAR_MOVIMENTOS: 'estoque:listarMovimentos',
  ESTOQUE_MOVIMENTAR: 'estoque:movimentar',
  CONFIG_OBTER: 'config:obter',
  CONFIG_SALVAR: 'config:salvar',
  IMPRESSORA_TESTAR: 'impressora:testar',
  FISCAL_TESTAR_CONEXAO: 'fiscal:testarConexao',
  DELIVERY_SINCRONIZAR_AGORA: 'delivery:sincronizarAgora'
} as const
