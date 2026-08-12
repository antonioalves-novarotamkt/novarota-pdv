'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AreaEntrega {
  id: string
  descricao: string
  cepInicio: number
  cepFim: number
  taxa: number
  tempoEstimadoMin: number
  ativo: boolean
}

function formatarCep(numero: number): string {
  const texto = String(numero).padStart(8, '0')
  return `${texto.slice(0, 5)}-${texto.slice(5)}`
}

const VAZIO = { descricao: '', cepInicio: '', cepFim: '', taxa: 0, tempoEstimadoMin: 45 }

export default function AreasEntregaPage(): JSX.Element {
  const router = useRouter()
  const [areas, setAreas] = useState<AreaEntrega[]>([])
  const [form, setForm] = useState<typeof VAZIO & { id?: string }>(VAZIO)

  async function carregar(): Promise<void> {
    const resp = await fetch('/api/admin/areas-entrega')
    if (resp.status === 401) {
      router.push('/admin')
      return
    }
    setAreas(await resp.json())
  }

  useEffect(() => {
    carregar()
  }, [])

  async function salvar(): Promise<void> {
    if (!form.descricao.trim() || !form.cepInicio || !form.cepFim) return
    const url = form.id ? `/api/admin/areas-entrega/${form.id}` : '/api/admin/areas-entrega'
    const method = form.id ? 'PATCH' : 'POST'
    const resp = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (resp.ok) {
      setForm(VAZIO)
      await carregar()
    }
  }

  function editar(area: AreaEntrega): void {
    setForm({
      id: area.id,
      descricao: area.descricao,
      cepInicio: formatarCep(area.cepInicio),
      cepFim: formatarCep(area.cepFim),
      taxa: area.taxa,
      tempoEstimadoMin: area.tempoEstimadoMin
    })
  }

  async function alternarAtivo(area: AreaEntrega): Promise<void> {
    await fetch(`/api/admin/areas-entrega/${area.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !area.ativo })
    })
    await carregar()
  }

  async function remover(id: string): Promise<void> {
    await fetch(`/api/admin/areas-entrega/${id}`, { method: 'DELETE' })
    await carregar()
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Areas de entrega</h1>
        <div className="flex gap-4 text-sm">
          <a href="/admin/produtos" className="text-brand-600">
            ← Produtos
          </a>
          <a href="/admin/configuracoes" className="text-brand-600">
            Configuracoes →
          </a>
        </div>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        A taxa de entrega e definida por faixa de CEP — o cliente digita o CEP no checkout e o
        sistema encontra automaticamente a area correspondente. CEPs fora de qualquer faixa
        cadastrada aqui nao conseguem finalizar o pedido.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">Descricao</th>
                <th className="px-3 py-2">Faixa de CEP</th>
                <th className="px-3 py-2">Valor</th>
                <th className="px-3 py-2">Tempo estimado</th>
                <th className="px-3 py-2">Ativo</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {areas.map((area) => (
                <tr key={area.id} className="border-t">
                  <td className="px-3 py-2">{area.descricao}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {formatarCep(area.cepInicio)} a {formatarCep(area.cepFim)}
                  </td>
                  <td className="px-3 py-2">{area.taxa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-3 py-2">{area.tempoEstimadoMin}min</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => alternarAtivo(area)}
                      className={area.ativo ? 'text-emerald-600' : 'text-slate-400'}
                    >
                      {area.ativo ? 'Sim' : 'Nao'}
                    </button>
                  </td>
                  <td className="space-x-2 px-3 py-2 text-right">
                    <button onClick={() => editar(area)} className="text-brand-600">
                      editar
                    </button>
                    <button onClick={() => remover(area.id)} className="text-red-600">
                      remover
                    </button>
                  </td>
                </tr>
              ))}
              {areas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                    Nenhuma area de entrega cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-semibold">{form.id ? 'Editar area' : 'Nova area'}</h2>
          <div className="space-y-2">
            <input
              placeholder="Descricao (ex: Area 1 - Centro)"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full rounded border px-2 py-1 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="CEP inicial"
                value={form.cepInicio}
                onChange={(e) => setForm({ ...form, cepInicio: e.target.value })}
                className="rounded border px-2 py-1 text-sm"
              />
              <input
                placeholder="CEP final"
                value={form.cepFim}
                onChange={(e) => setForm({ ...form, cepFim: e.target.value })}
                className="rounded border px-2 py-1 text-sm"
              />
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="Taxa de entrega (R$)"
              value={form.taxa}
              onChange={(e) => setForm({ ...form, taxa: Number(e.target.value) })}
              className="w-full rounded border px-2 py-1 text-sm"
            />
            <input
              type="number"
              placeholder="Tempo estimado (min)"
              value={form.tempoEstimadoMin}
              onChange={(e) => setForm({ ...form, tempoEstimadoMin: Number(e.target.value) })}
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
