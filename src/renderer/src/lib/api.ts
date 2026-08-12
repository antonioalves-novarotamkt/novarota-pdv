import { IPC } from '../../../shared/types'
import type {
  AppConfig,
  Categoria,
  Comanda,
  ComandaComItens,
  ComandaTipo,
  FinalizarVendaInput,
  Mesa,
  MovimentoEstoqueInput,
  Produto,
  ProdutoInput,
  ResultadoFinalizarVenda,
  Venda,
  VendaCompleta
} from '../../../shared/types'

function invoke<T>(channel: string, payload?: unknown): Promise<T> {
  return window.api.invoke<T>(channel, payload)
}

export const api = {
  produtos: {
    listar: (apenasAtivos = true) => invoke<Produto[]>(IPC.PRODUTOS_LISTAR, apenasAtivos),
    salvar: (input: ProdutoInput & { id?: number }) => invoke<Produto>(IPC.PRODUTOS_SALVAR, input),
    remover: (id: number) => invoke<{ ok: boolean }>(IPC.PRODUTOS_REMOVER, id)
  },
  categorias: {
    listar: () => invoke<Categoria[]>(IPC.CATEGORIAS_LISTAR),
    salvar: (input: { id?: number; nome: string; ordem?: number }) =>
      invoke<Categoria>(IPC.CATEGORIAS_SALVAR, input),
    remover: (id: number) => invoke<{ ok: boolean }>(IPC.CATEGORIAS_REMOVER, id)
  },
  mesas: {
    listar: () => invoke<Mesa[]>(IPC.MESAS_LISTAR),
    salvar: (input: { id?: number; numero: string }) => invoke<Mesa>(IPC.MESAS_SALVAR, input),
    remover: (id: number) => invoke<{ ok: boolean }>(IPC.MESAS_REMOVER, id)
  },
  comandas: {
    listarAbertas: () => invoke<ComandaComItens[]>(IPC.COMANDAS_LISTAR_ABERTAS),
    obter: (id: number) => invoke<ComandaComItens | undefined>(IPC.COMANDAS_OBTER, id),
    abrir: (input: { mesa_id?: number | null; tipo: ComandaTipo; observacao?: string }) =>
      invoke<ComandaComItens>(IPC.COMANDAS_ABRIR, input),
    adicionarItem: (input: {
      comanda_id: number
      produto_id: number
      quantidade: number
      preco_unitario: number
      observacao?: string
    }) => invoke<ComandaComItens>(IPC.COMANDAS_ADICIONAR_ITEM, input),
    removerItem: (itemId: number, comandaId: number) =>
      invoke<ComandaComItens>(IPC.COMANDAS_REMOVER_ITEM, { itemId, comandaId }),
    cancelar: (id: number) => invoke<{ ok: boolean }>(IPC.COMANDAS_CANCELAR, id)
  },
  vendas: {
    finalizar: (input: FinalizarVendaInput) =>
      invoke<ResultadoFinalizarVenda>(IPC.VENDAS_FINALIZAR, input),
    listar: (limite?: number) => invoke<Venda[]>(IPC.VENDAS_LISTAR, limite),
    obter: (id: number) => invoke<VendaCompleta | undefined>(IPC.VENDAS_OBTER, id)
  },
  estoque: {
    listarMovimentos: (produtoId?: number) => invoke<unknown[]>(IPC.ESTOQUE_LISTAR_MOVIMENTOS, produtoId),
    movimentar: (input: MovimentoEstoqueInput) => invoke<{ ok: boolean }>(IPC.ESTOQUE_MOVIMENTAR, input)
  },
  config: {
    obter: () => invoke<AppConfig>(IPC.CONFIG_OBTER),
    salvar: (config: AppConfig) => invoke<AppConfig>(IPC.CONFIG_SALVAR, config),
    testarFiscal: () => invoke<{ ok: boolean; mensagem: string }>(IPC.FISCAL_TESTAR_CONEXAO),
    testarImpressora: () => invoke<{ ok: boolean; mensagem: string }>(IPC.IMPRESSORA_TESTAR)
  }
}

export type { Comanda }
