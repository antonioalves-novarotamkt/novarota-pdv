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
  }
  produtos: ProdutoPublico[]
}

export interface FreteResponse {
  dentroDaArea: boolean
  distanciaKm?: number
  taxa?: number
  mensagem?: string
}

export interface ItemPedidoInput {
  produtoId: string
  quantidade: number
}

export type FormaPagamentoPedido = 'dinheiro' | 'cartao_entrega'

export interface CriarPedidoInput {
  clienteNome: string
  clienteTelefone: string
  enderecoEntrega: string
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
