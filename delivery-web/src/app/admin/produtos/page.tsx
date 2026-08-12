'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProdutoAdmin {
  id: string
  nome: string
  descricao: string | null
  preco: number
  categoria: string
  ativo: boolean
}

const VAZIO = { nome: '', descricao: '', preco: 0, categoria: 'Cardapio' }

export default function AdminProdutosPage(): JSX.Element {
  const router = useRouter()
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([])
  const [form, setForm] = useState<typeof VAZIO & { id?: string }>(VAZIO)

  async function carregar(): Promise<void> {
    const resp = await fetch('/api/admin/produtos')
    if (resp.status === 401) {
      router.push('/admin')
      return
    }
    setProdutos(await resp.json())
  }

  useEffect(() => {
    carregar()
  }, [])

  async function salvar(): Promise<void> {
    if (!form.nome.trim()) return
    const url = form.id ? `/api/admin/produtos/${form.id}` : '/api/admin/produtos'
    const method = form.id ? 'PATCH' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm(VAZIO)
    await carregar()
  }

  async function alternarAtivo(produto: ProdutoAdmin): Promise<void> {
    await fetch(`/api/admin/produtos/${produto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !produto.ativo })
    })
    await carregar()
  }

  async function remover(id: string): Promise<void> {
    await fetch(`/api/admin/produtos/${id}`, { method: 'DELETE' })
    await carregar()
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Produtos do delivery</h1>
        <a href="/admin/configuracoes" className="text-sm text-brand-600">
          Configuracoes de entrega →
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Preco</th>
                <th className="px-3 py-2">Ativo</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">{p.nome}</td>
                  <td className="px-3 py-2 text-slate-500">{p.categoria}</td>
                  <td className="px-3 py-2">{p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => alternarAtivo(p)} className={p.ativo ? 'text-emerald-600' : 'text-slate-400'}>
                      {p.ativo ? 'Sim' : 'Nao'}
                    </button>
                  </td>
                  <td className="space-x-2 px-3 py-2 text-right">
                    <button
                      onClick={() => setForm({ ...p, descricao: p.descricao ?? '' })}
                      className="text-brand-600"
                    >
                      editar
                    </button>
                    <button onClick={() => remover(p.id)} className="text-red-600">
                      remover
                    </button>
                  </td>
                </tr>
              ))}
              {produtos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-semibold">{form.id ? 'Editar produto' : 'Novo produto'}</h2>
          <div className="space-y-2">
            <input
              placeholder="Nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full rounded border px-2 py-1 text-sm"
            />
            <input
              placeholder="Categoria (ex: Pratos, Bebidas)"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="w-full rounded border px-2 py-1 text-sm"
            />
            <input
              placeholder="Descricao (opcional)"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full rounded border px-2 py-1 text-sm"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Preco"
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: Number(e.target.value) })}
              className="w-full rounded border px-2 py-1 text-sm"
            />
            <div className="flex gap-2 pt-1">
              <button onClick={salvar} className="flex-1 rounded bg-brand-600 py-2 text-sm text-white">
                Salvar
              </button>
              {form.id && (
                <button onClick={() => setForm(VAZIO)} className="rounded border px-3 py-2 text-sm">
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
