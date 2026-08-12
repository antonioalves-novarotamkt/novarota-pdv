import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import CheckoutModal from '../../components/CheckoutModal'
import type { ComandaComItens, Mesa, Produto, ResultadoFinalizarVenda } from '../../../../shared/types'

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ComandasPage(): JSX.Element {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [comandas, setComandas] = useState<ComandaComItens[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [comandaSelecionadaId, setComandaSelecionadaId] = useState<number | null>(null)
  const [produtoParaAdicionar, setProdutoParaAdicionar] = useState<number | ''>('')
  const [quantidade, setQuantidade] = useState(1)
  const [mostrarCheckout, setMostrarCheckout] = useState(false)

  async function carregar(): Promise<void> {
    const [m, c, p] = await Promise.all([
      api.mesas.listar(),
      api.comandas.listarAbertas(),
      api.produtos.listar()
    ])
    setMesas(m)
    setComandas(c)
    setProdutos(p)
  }

  useEffect(() => {
    carregar()
  }, [])

  const comandaSelecionada = comandas.find((c) => c.id === comandaSelecionadaId) || null
  const comandasBalcao = comandas.filter((c) => c.tipo !== 'mesa')

  async function abrirComandaMesa(mesa: Mesa): Promise<void> {
    if (mesa.status === 'livre') {
      const nova = await api.comandas.abrir({ mesa_id: mesa.id, tipo: 'mesa' })
      await carregar()
      setComandaSelecionadaId(nova.id)
      return
    }
    const existente = comandas.find((c) => c.mesa_id === mesa.id)
    if (existente) setComandaSelecionadaId(existente.id)
  }

  async function abrirComandaBalcao(): Promise<void> {
    const nova = await api.comandas.abrir({ tipo: 'balcao' })
    await carregar()
    setComandaSelecionadaId(nova.id)
  }

  async function adicionarItem(): Promise<void> {
    if (!comandaSelecionada || !produtoParaAdicionar) return
    const produto = produtos.find((p) => p.id === produtoParaAdicionar)
    if (!produto) return
    await api.comandas.adicionarItem({
      comanda_id: comandaSelecionada.id,
      produto_id: produto.id,
      quantidade,
      preco_unitario: produto.preco
    })
    setProdutoParaAdicionar('')
    setQuantidade(1)
    await carregar()
  }

  async function removerItem(itemId: number): Promise<void> {
    if (!comandaSelecionada) return
    await api.comandas.removerItem(itemId, comandaSelecionada.id)
    await carregar()
  }

  async function cancelarComanda(): Promise<void> {
    if (!comandaSelecionada) return
    await api.comandas.cancelar(comandaSelecionada.id)
    setComandaSelecionadaId(null)
    await carregar()
  }

  function finalizado(_resultado: ResultadoFinalizarVenda): void {
    setMostrarCheckout(false)
    setComandaSelecionadaId(null)
    carregar()
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Comandas</h2>
          <button
            onClick={abrirComandaBalcao}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white"
          >
            + Nova comanda de balcao
          </button>
        </div>

        <h3 className="mb-2 text-sm font-medium text-slate-500">Mesas</h3>
        <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {mesas.map((mesa) => (
            <button
              key={mesa.id}
              onClick={() => abrirComandaMesa(mesa)}
              className={`rounded-lg border p-4 text-center shadow-sm ${
                mesa.status === 'ocupada'
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <p className="text-lg font-semibold">{mesa.numero}</p>
              <p className="text-xs">{mesa.status === 'ocupada' ? 'Ocupada' : 'Livre'}</p>
            </button>
          ))}
          {mesas.length === 0 && (
            <p className="col-span-full text-sm text-slate-500">
              Nenhuma mesa cadastrada. Cadastre mesas em Configuracoes.
            </p>
          )}
        </div>

        <h3 className="mb-2 text-sm font-medium text-slate-500">Balcao / Delivery</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {comandasBalcao.map((comanda) => (
            <button
              key={comanda.id}
              onClick={() => setComandaSelecionadaId(comanda.id)}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm"
            >
              <p className="font-medium">
                Comanda #{comanda.id}
                {comanda.tipo === 'delivery' && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    Delivery
                  </span>
                )}
                {comanda.tipo === 'balcao' && ' - Balcao'}
              </p>
              {comanda.observacao && (
                <p className="mt-1 truncate text-xs text-slate-500">{comanda.observacao}</p>
              )}
              <p className="mt-1 text-sm text-slate-500">{formatarMoeda(comanda.total)}</p>
            </button>
          ))}
        </div>
      </div>

      {comandaSelecionada && (
        <aside className="flex w-96 shrink-0 flex-col border-l bg-white">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold">
              Comanda #{comandaSelecionada.id}
              {comandaSelecionada.mesa_id &&
                ` - Mesa ${mesas.find((m) => m.id === comandaSelecionada.mesa_id)?.numero ?? ''}`}
            </h3>
            {comandaSelecionada.observacao && (
              <p className="mt-1 whitespace-pre-line rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                {comandaSelecionada.observacao}
              </p>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            <div className="flex gap-2">
              <select
                value={produtoParaAdicionar}
                onChange={(e) => setProdutoParaAdicionar(e.target.value ? Number(e.target.value) : '')}
                className="flex-1 rounded border px-2 py-1 text-sm"
              >
                <option value="">Selecione um produto</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - {formatarMoeda(p.preco)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-16 rounded border px-2 py-1 text-sm"
              />
              <button
                onClick={adicionarItem}
                disabled={!produtoParaAdicionar}
                className="rounded bg-brand-600 px-3 py-1 text-sm text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>

            <div className="space-y-1">
              {comandaSelecionada.itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>
                    {item.quantidade}x {item.produto_nome}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{formatarMoeda(item.quantidade * item.preco_unitario)}</span>
                    <button onClick={() => removerItem(item.id)} className="text-xs text-red-600">
                      remover
                    </button>
                  </div>
                </div>
              ))}
              {comandaSelecionada.itens.length === 0 && (
                <p className="text-sm text-slate-400">Nenhum item adicionado ainda.</p>
              )}
            </div>
          </div>

          <div className="border-t px-4 py-3">
            <div className="mb-3 flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatarMoeda(comandaSelecionada.total)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelarComanda}
                className="flex-1 rounded-md border border-red-300 py-2 text-sm text-red-600"
              >
                Cancelar
              </button>
              <button
                disabled={comandaSelecionada.itens.length === 0}
                onClick={() => setMostrarCheckout(true)}
                className="flex-1 rounded-md bg-brand-600 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Cobrar
              </button>
            </div>
          </div>
        </aside>
      )}

      {mostrarCheckout && comandaSelecionada && (
        <CheckoutModal
          itens={comandaSelecionada.itens.map((item) => ({
            produto_id: item.produto_id,
            nome: item.produto_nome ?? '',
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario
          }))}
          comandaId={comandaSelecionada.id}
          onClose={() => setMostrarCheckout(false)}
          onFinalizado={finalizado}
        />
      )}
    </div>
  )
}
