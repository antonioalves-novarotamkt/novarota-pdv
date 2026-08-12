export interface ProdutoPublico {
  id: string
  nome: string
  descricao: string | null
  preco: number
  categoria: string
}

export interface CardapioResponse {
  loja: {
    nomeFantasia: string
    tempoEstimadoMin: number
    aceitandoPedidos: boolean
    pedidoMinimo: number
  }
  produtos: ProdutoPublico[]
}

export interface EnderecoViaCepResponse {
  encontrado: boolean
  cep?: string
  rua?: string
  bairro?: string
  cidade?: string
  uf?: string
  mensagem?: string
}

export interface FreteResponse {
  dentroDaArea: boolean
  latitude?: number
  longitude?: number
  distanciaKm?: number
  taxa?: number
  tempoEstimadoMin?: number
  mensagem?: string
}

export interface ItemPedidoInput {
  produtoId: string
  quantidade: number
}

export type FormaPagamentoPedido = 'dinheiro' | 'cartao_entrega'

export interface EnderecoPedidoInput {
  cep: string
  rua: string
  numero: string
  semNumero: boolean
  complemento?: string
  bairro: string
  cidade: string
  uf: string
  pontoReferencia?: string
}

export interface CriarPedidoInput {
  clienteNome: string
  clienteTelefone: string
  endereco: EnderecoPedidoInput
  itens: ItemPedidoInput[]
  formaPagamento: FormaPagamentoPedido
  trocoPara?: number
  observacoes?: string
}

export interface CriarPedidoResponse {
  id: string
  total: number
  taxaEntrega: number
  tempoEstimadoMin: number
}
