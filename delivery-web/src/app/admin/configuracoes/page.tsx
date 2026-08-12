'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface ConfigForm {
  nomeFantasia: string
  telefone: string
  enderecoLoja: string
  pedidoMinimo: number
  tempoEstimadoMin: number
  aceitandoPedidos: boolean
}

const VAZIO: ConfigForm = {
  nomeFantasia: '',
  telefone: '',
  enderecoLoja: '',
  pedidoMinimo: 0,
  tempoEstimadoMin: 45,
  aceitandoPedidos: true
}

export default function AdminConfiguracoesPage(): JSX.Element {
  const router = useRouter()
  const [form, setForm] = useState<ConfigForm>(VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/configuracoes').then(async (resp) => {
      if (resp.status === 401) {
        router.push('/admin')
        return
      }
      const dados = await resp.json()
      if (dados) {
        setForm({
          nomeFantasia: dados.nomeFantasia ?? '',
          telefone: dados.telefone ?? '',
          enderecoLoja: dados.enderecoLoja ?? '',
          pedidoMinimo: dados.pedidoMinimo ?? 0,
          tempoEstimadoMin: dados.tempoEstimadoMin ?? 45,
          aceitandoPedidos: dados.aceitandoPedidos ?? true
        })
      }
    })
  }, [router])

  async function salvar(): Promise<void> {
    setSalvando(true)
    setMensagem(null)
    try {
      const resp = await fetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const dados = await resp.json()
      if (!resp.ok) {
        setMensagem(dados.erro ?? 'Nao foi possivel salvar.')
        return
      }
      setMensagem('Configuracoes salvas.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Configuracoes da loja</h1>
        <div className="flex gap-4 text-sm">
          <a href="/admin/produtos" className="text-brand-600">
            Produtos
          </a>
          <a href="/admin/areas-entrega" className="text-brand-600">
            Areas de entrega →
          </a>
        </div>
      </div>

      <div className="space-y-5 rounded-lg border bg-white p-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Nome fantasia</label>
            <input
              value={form.nomeFantasia}
              onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })}
              className="w-full rounded border px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Telefone</label>
            <input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              className="w-full rounded border px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Endereco da loja</label>
          <input
            value={form.enderecoLoja}
            onChange={(e) => setForm({ ...form, enderecoLoja: e.target.value })}
            placeholder="Rua, numero, bairro, cidade, UF"
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
          <p className="mt-1 text-xs text-slate-400">
            Aparece no cupom impresso. A area de entrega e a taxa sao configuradas separadamente por
            CEP em &quot;Areas de entrega&quot;.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Pedido minimo (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.pedidoMinimo}
              onChange={(e) => setForm({ ...form, pedidoMinimo: Number(e.target.value) })}
              className="w-full rounded border px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Tempo estimado padrao (min)</label>
            <input
              type="number"
              value={form.tempoEstimadoMin}
              onChange={(e) => setForm({ ...form, tempoEstimadoMin: Number(e.target.value) })}
              className="w-full rounded border px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.aceitandoPedidos}
            onChange={(e) => setForm({ ...form, aceitandoPedidos: e.target.checked })}
          />
          Loja aceitando pedidos online agora
        </label>

        {mensagem && <p className="text-sm text-slate-600">{mensagem}</p>}

        <button
          onClick={salvar}
          disabled={salvando}
          className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar configuracoes'}
        </button>
      </div>
    </main>
  )
}
