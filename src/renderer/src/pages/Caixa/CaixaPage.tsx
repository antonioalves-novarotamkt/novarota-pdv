import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import CheckoutModal, { type ItemCarrinho } from '../../components/CheckoutModal'
import type { Categoria, Produto, ResultadoFinalizarVenda } from '../../../../shared/types'

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CaixaPage(): JSX.Element {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaAtiva, setCategoriaAtiva] = useState<number | 'todas'>('todas')
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [mostrarCheckout, setMostrarCheckout] = useState(false)
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoFinalizarVenda | null>(null)

  useEffect(() => {
    api.produtos.listar().then(setProdutos)
    api.categorias.listar().then(setCategorias)
  }, [])

  const produtosFiltrados = useMemo(
    () =>
      categoriaAtiva === 'todas'
        ? produtos
        : produtos.filter((p) => p.categoria_id === categoriaAtiva),
    [produtos, categoriaAtiva]
  )

  const total = carrinho.reduce((acc, item) => acc + item.quantidade * item.preco_unitario, 0)

  function adicionarAoCarrinho(produto: Produto): void {
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.produto_id === produto.id)
      if (existente) {
        return atual.map((i) => (i.produto_id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i))
      }
      return [...atual, { produto_id: produto.id, nome: produto.nome, quantidade: 1, preco_unitario: produto.preco }]
    })
  }

  function alterarQuantidade(produtoId: number, delta: number): void {
    setCarrinho((atual) =>
      atual
        .map((i) => (i.produto_id === produtoId ? { ...i, quantidade: i.quantidade + delta } : i))
        .filter((i) => i.quantidade > 0)
    )
  }

  function limparEFechar(resultado: ResultadoFinalizarVenda): void {
    setUltimoResultado(resultado)
    setCarrinho([])
    setMostrarCheckout(false)
    if (resultado.venda.itens.some((item) => produtos.find((p) => p.id === item.produto_id)?.controla_estoque)) {
      api.produtos.listar().then(setProdutos)
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="mb-4 text-xl font-semibold">Caixa</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoriaAtiva('todas')}
            className={`rounded-full px-3 py-1 text-sm ${
              categoriaAtiva === 'todas' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'
            }`}
          >
            Todas
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoriaAtiva(c.id)}
              className={`rounded-full px-3 py-1 text-sm ${
                categoriaAtiva === c.id ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'
              }`}
            >
              {c.nome}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {produtosFiltrados.map((produto) => (
            <button
              key={produto.id}
              onClick={() => adicionarAoCarrinho(produto)}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-500 hover:shadow"
            >
              <p className="font-medium text-slate-800">{produto.nome}</p>
              <p className="text-sm text-slate-500">{formatarMoeda(produto.preco)}</p>
              {produto.controla_estoque === 1 && (
                <p className="mt-1 text-xs text-slate-400">Estoque: {produto.quantidade_estoque}</p>
              )}
            </button>
          ))}
          {produtosFiltrados.length === 0 && (
            <p className="col-span-full text-sm text-slate-500">
              Nenhum produto cadastrado. Va em Produtos para cadastrar o cardapio.
            </p>
          )}
        </div>
      </div>

      <aside className="flex w-96 shrink-0 flex-col border-l bg-white">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">Carrinho</h3>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {carrinho.length === 0 && <p className="text-sm text-slate-400">Nenhum item adicionado.</p>}
          {carrinho.map((item) => (
            <div key={item.produto_id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex-1">
                <p className="font-medium">{item.nome}</p>
                <p className="text-slate-500">{formatarMoeda(item.preco_unitario)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => alterarQuantidade(item.produto_id, -1)}
                  className="h-6 w-6 rounded bg-slate-100 text-slate-600"
                >
                  -
                </button>
                <span className="w-6 text-center">{item.quantidade}</span>
                <button
                  onClick={() => alterarQuantidade(item.produto_id, 1)}
                  className="h-6 w-6 rounded bg-slate-100 text-slate-600"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t px-4 py-3">
          <div className="mb-3 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatarMoeda(total)}</span>
          </div>
          <button
            disabled={carrinho.length === 0}
            onClick={() => setMostrarCheckout(true)}
            className="w-full rounded-md bg-brand-600 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Cobrar
          </button>
        </div>

        {ultimoResultado && (
          <div className="border-t px-4 py-3 text-xs text-slate-600">
            <p className="font-medium text-emerald-600">Ultima venda #{ultimoResultado.venda.id} concluida.</p>
            {ultimoResultado.fiscal && !ultimoResultado.fiscal.sucesso && (
              <p className="text-red-600">Fiscal: {ultimoResultado.fiscal.mensagemErro}</p>
            )}
            {ultimoResultado.impressao && !ultimoResultado.impressao.sucesso && (
              <p className="text-red-600">Impressao: {ultimoResultado.impressao.mensagemErro}</p>
            )}
          </div>
        )}
      </aside>

      {mostrarCheckout && (
        <CheckoutModal
          itens={carrinho}
          onClose={() => setMostrarCheckout(false)}
          onFinalizado={limparEFechar}
        />
      )}
    </div>
  )
}
