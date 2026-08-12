'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface FaixaTaxa {
  ateKm: number
  taxa: number
}

interface ConfigForm {
  nomeFantasia: string
  telefone: string
  enderecoLoja: string
  raioMaximoKm: number
  faixasTaxa: FaixaTaxa[]
  tempoEstimadoMin: number
  aceitandoPedidos: boolean
}

const VAZIO: ConfigForm = {
  nomeFantasia: '',
  telefone: '',
  enderecoLoja: '',
  raioMaximoKm: 8,
  faixasTaxa: [
    { ateKm: 3, taxa: 6 },
    { ateKm: 6, taxa: 9 },
    { ateKm: 8, taxa: 14 }
  ],
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
          raioMaximoKm: dados.raioMaximoKm ?? 8,
          faixasTaxa: dados.faixasTaxa ?? VAZIO.faixasTaxa,
          tempoEstimadoMin: dados.tempoEstimadoMin ?? 45,
          aceitandoPedidos: dados.aceitandoPedidos ?? true
        })
      }
    })
  }, [router])

  function atualizarFaixa(index: number, campo: keyof FaixaTaxa, valor: number): void {
    setForm((atual) => ({
      ...atual,
      faixasTaxa: atual.faixasTaxa.map((f, i) => (i === index ? { ...f, [campo]: valor } : f))
    }))
  }

  function adicionarFaixa(): void {
    setForm((atual) => ({
      ...atual,
      faixasTaxa: [...atual.faixasTaxa, { ateKm: atual.raioMaximoKm, taxa: 0 }]
    }))
  }

  function removerFaixa(index: number): void {
    setForm((atual) => ({ ...atual, faixasTaxa: atual.faixasTaxa.filter((_, i) => i !== index) }))
  }

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
        <h1 className="text-xl font-bold">Configuracoes de entrega</h1>
        <a href="/admin/produtos" className="text-sm text-brand-600">
          ← Produtos
        </a>
      </div>

      <div className="space-y-5 rounded-lg border bg-white p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="field-group">
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
          <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
            Endereco da loja (origem para calculo de frete)
          </label>
          <input
            value={form.enderecoLoja}
            onChange={(e) => setForm({ ...form, enderecoLoja: e.target.value })}
            placeholder="Rua, numero, bairro, cidade, UF"
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
          <p className="mt-1 text-xs text-slate-400">
            Ao salvar, o endereco e convertido em coordenadas automaticamente para calcular a distancia dos clientes.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Raio maximo (km)</label>
            <input
              type="number"
              value={form.raioMaximoKm}
              onChange={(e) => setForm({ ...form, raioMaximoKm: Number(e.target.value) })}
              className="w-full rounded border px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Tempo estimado (min)</label>
            <input
              type="number"
              value={form.tempoEstimadoMin}
              onChange={(e) => setForm({ ...form, tempoEstimadoMin: Number(e.target.value) })}
              className="w-full rounded border px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase text-slate-500">Faixas de taxa por distancia</label>
          <div className="space-y-2">
            {form.faixasTaxa.map((faixa, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">ate</span>
                <input
                  type="number"
                  value={faixa.ateKm}
                  onChange={(e) => atualizarFaixa(index, 'ateKm', Number(e.target.value))}
                  className="w-20 rounded border px-2 py-1"
                />
                <span className="text-slate-500">km → R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={faixa.taxa}
                  onChange={(e) => atualizarFaixa(index, 'taxa', Number(e.target.value))}
                  className="w-24 rounded border px-2 py-1"
                />
                <button onClick={() => removerFaixa(index)} className="text-xs text-red-600">
                  remover
                </button>
              </div>
            ))}
            <button onClick={adicionarFaixa} className="text-xs text-brand-600">
              + adicionar faixa
            </button>
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
