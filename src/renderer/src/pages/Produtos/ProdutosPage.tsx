import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Categoria, Produto } from '../../../../shared/types'

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const PRODUTO_VAZIO = {
  nome: '',
  categoria_id: null as number | null,
  preco: 0,
  ncm: '',
  cfop: '',
  unidade: 'UN',
  controla_estoque: false,
  quantidade_estoque: 0,
  estoque_minimo: 0
}

export default function ProdutosPage(): JSX.Element {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [form, setForm] = useState<typeof PRODUTO_VAZIO & { id?: number }>(PRODUTO_VAZIO)
  const [novaCategoria, setNovaCategoria] = useState('')

  async function carregar(): Promise<void> {
    const [p, c] = await Promise.all([api.produtos.listar(false), api.categorias.listar()])
    setProdutos(p)
    setCategorias(c)
  }

  useEffect(() => {
    carregar()
  }, [])

  async function salvar(): Promise<void> {
    if (!form.nome.trim()) return
    await api.produtos.salvar({
      id: form.id,
      nome: form.nome,
      categoria_id: form.categoria_id,
      preco: form.preco,
      ncm: form.ncm || null,
      cfop: form.cfop || null,
      unidade: form.unidade,
      controla_estoque: form.controla_estoque,
      quantidade_estoque: form.quantidade_estoque,
      estoque_minimo: form.estoque_minimo
    })
    setForm(PRODUTO_VAZIO)
    await carregar()
  }

  function editar(produto: Produto): void {
    setForm({
      id: produto.id,
      nome: produto.nome,
      categoria_id: produto.categoria_id,
      preco: produto.preco,
      ncm: produto.ncm ?? '',
      cfop: produto.cfop ?? '',
      unidade: produto.unidade,
      controla_estoque: produto.controla_estoque === 1,
      quantidade_estoque: produto.quantidade_estoque,
      estoque_minimo: produto.estoque_minimo
    })
  }

  async function remover(id: number): Promise<void> {
    await api.produtos.remover(id)
    await carregar()
  }

  async function salvarCategoria(): Promise<void> {
    if (!novaCategoria.trim()) return
    await api.categorias.salvar({ nome: novaCategoria })
    setNovaCategoria('')
    await carregar()
  }

  return (
    <div className="grid h-full grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_360px]">
      <div>
        <h2 className="mb-4 text-xl font-semibold">Produtos</h2>
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Categoria</th>
                <th className="px-4 py-2">Preco</th>
                <th className="px-4 py-2">Estoque</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id} className="border-t">
                  <td className="px-4 py-2">{produto.nome}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {categorias.find((c) => c.id === produto.categoria_id)?.nome ?? '-'}
                  </td>
                  <td className="px-4 py-2">{formatarMoeda(produto.preco)}</td>
                  <td className="px-4 py-2">
                    {produto.controla_estoque ? produto.quantidade_estoque : '-'}
                  </td>
                  <td className="space-x-2 px-4 py-2 text-right">
                    <button onClick={() => editar(produto)} className="text-brand-600">
                      editar
                    </button>
                    <button onClick={() => remover(produto.id)} className="text-red-600">
                      remover
                    </button>
                  </td>
                </tr>
              ))}
              {produtos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 font-semibold">{form.id ? 'Editar produto' : 'Novo produto'}</h3>
          <div className="space-y-2">
            <input
              placeholder="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full rounded border px-2 py-1 text-sm"
            />
            <select
              value={form.categoria_id ?? ''}
              onChange={(e) => setForm({ ...form, categoria_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded border px-2 py-1 text-sm"
            >
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Preco"
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })}
              className="w-full rounded border px-2 py-1 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="NCM"
                value={form.ncm}
                onChange={(e) => setForm({ ...form, ncm: e.target.value })}
                className="rounded border px-2 py-1 text-sm"
              />
              <input
                placeholder="CFOP"
                value={form.cfop}
                onChange={(e) => setForm({ ...form, cfop: e.target.value })}
                className="rounded border px-2 py-1 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.controla_estoque}
                onChange={(e) => setForm({ ...form, controla_estoque: e.target.checked })}
              />
              Controla estoque
            </label>
            {form.controla_estoque && (
              <input
                type="number"
                placeholder="Quantidade em estoque"
                value={form.quantidade_estoque}
                onChange={(e) => setForm({ ...form, quantidade_estoque: Number(e.target.value) })}
                className="w-full rounded border px-2 py-1 text-sm"
              />
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={salvar} className="flex-1 rounded bg-brand-600 py-2 text-sm text-white">
                Salvar
              </button>
              {form.id && (
                <button
                  onClick={() => setForm(PRODUTO_VAZIO)}
                  className="rounded border px-3 py-2 text-sm text-slate-600"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h3 className="mb-3 font-semibold">Categorias</h3>
          <ul className="mb-3 space-y-1 text-sm">
            {categorias.map((c) => (
              <li key={c.id} className="flex justify-between">
                <span>{c.nome}</span>
                <button
                  onClick={async () => {
                    await api.categorias.remover(c.id)
                    carregar()
                  }}
                  className="text-red-600"
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              placeholder="Nova categoria"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              className="flex-1 rounded border px-2 py-1 text-sm"
            />
            <button onClick={salvarCategoria} className="rounded bg-brand-600 px-3 py-1 text-sm text-white">
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
