'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MapaRaio from '@/components/MapaRaio'

interface CamadaRaio {
  id: string
  raioKm: number
  taxa: number
  tempoEstimadoMin: number
  ativo: boolean
}

const CORES = ['#1f63d6', '#2f7bf6', '#60a5fa', '#93c5fd', '#bfdbfe']

const VAZIO = { raioKm: 0, taxa: 0, tempoEstimadoMin: 45 }

export default function AreasEntregaPage(): JSX.Element {
  const router = useRouter()
  const [camadas, setCamadas] = useState<CamadaRaio[]>([])
  const [centroLoja, setCentroLoja] = useState<{ lat: number; lng: number } | null>(null)
  const [form, setForm] = useState<typeof VAZIO & { id?: string }>(VAZIO)

  async function carregar(): Promise<void> {
    const [respCamadas, respConfig] = await Promise.all([
      fetch('/api/admin/areas-entrega'),
      fetch('/api/admin/configuracoes')
    ])
    if (respCamadas.status === 401 || respConfig.status === 401) {
      router.push('/admin')
      return
    }
    setCamadas(await respCamadas.json())
    const config = await respConfig.json()
    if (config?.latitudeLoja && config?.longitudeLoja) {
      setCentroLoja({ lat: config.latitudeLoja, lng: config.longitudeLoja })
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function salvar(): Promise<void> {
    if (!form.raioKm || form.raioKm <= 0) return
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

  function editar(camada: CamadaRaio): void {
    setForm({ id: camada.id, raioKm: camada.raioKm, taxa: camada.taxa, tempoEstimadoMin: camada.tempoEstimadoMin })
  }

  async function atualizarCampo(camada: CamadaRaio, campo: 'taxa' | 'tempoEstimadoMin', valor: number): Promise<void> {
    const valorFinal = Math.max(0, valor)
    setCamadas((atual) => atual.map((c) => (c.id === camada.id ? { ...c, [campo]: valorFinal } : c)))
    await fetch(`/api/admin/areas-entrega/${camada.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [campo]: valorFinal })
    })
  }

  async function alternarAtivo(camada: CamadaRaio): Promise<void> {
    await fetch(`/api/admin/areas-entrega/${camada.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !camada.ativo })
    })
    await carregar()
  }

  async function remover(id: string): Promise<void> {
    await fetch(`/api/admin/areas-entrega/${id}`, { method: 'DELETE' })
    await carregar()
  }

  const camadasOrdenadas = [...camadas].sort((a, b) => a.raioKm - b.raioKm)
  const camadasMapa = camadasOrdenadas
    .filter((c) => c.ativo)
    .map((c, i) => ({ raioKm: c.raioKm, cor: CORES[i % CORES.length] }))

  const resumo =
    camadasOrdenadas.length > 0
      ? {
          raio: `${Math.min(...camadasOrdenadas.map((c) => c.raioKm))} → ${Math.max(...camadasOrdenadas.map((c) => c.raioKm))} km`,
          tempo: `${Math.min(...camadasOrdenadas.map((c) => c.tempoEstimadoMin))} → ${Math.max(...camadasOrdenadas.map((c) => c.tempoEstimadoMin))} min`,
          taxa: `R$ ${Math.min(...camadasOrdenadas.map((c) => c.taxa))} → ${Math.max(...camadasOrdenadas.map((c) => c.taxa))}`
        }
      : null

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-bold">Configuracoes de entrega</h1>
        <div className="flex gap-4 text-sm">
          <a href="/admin/produtos" className="text-brand-600">
            ← Produtos
          </a>
          <a href="/admin/configuracoes" className="text-brand-600">
            Configuracoes →
          </a>
        </div>
      </div>
      <p className="mb-4 text-sm text-slate-500">Defina como funcionara a logistica do seu restaurante</p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <MapaRaio centro={centroLoja} camadas={camadasMapa} />
          {resumo && (
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>📍 {resumo.raio}</span>
              <span>⏱ {resumo.tempo}</span>
              <span>💰 {resumo.taxa}</span>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 font-semibold">Tempo e taxa</h2>

          <div className="mb-4 space-y-2 border-b pb-4">
            <p className="text-xs font-medium uppercase text-slate-500">Nova camada de raio</p>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Raio (km)"
                value={form.raioKm || ''}
                onChange={(e) => setForm({ ...form, raioKm: Number(e.target.value) })}
                className="rounded border px-2 py-1 text-sm"
              />
              <input
                type="number"
                placeholder="Tempo (min)"
                value={form.tempoEstimadoMin}
                onChange={(e) => setForm({ ...form, tempoEstimadoMin: Number(e.target.value) })}
                className="rounded border px-2 py-1 text-sm"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Taxa (R$)"
                value={form.taxa}
                onChange={(e) => setForm({ ...form, taxa: Number(e.target.value) })}
                className="rounded border px-2 py-1 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={salvar} className="flex-1 rounded bg-brand-600 py-1.5 text-sm text-white">
                {form.id ? 'Salvar edicao' : 'Adicionar camada'}
              </button>
              {form.id && (
                <button onClick={() => setForm(VAZIO)} className="rounded border px-3 py-1.5 text-sm">
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2">Raio</th>
                <th className="pb-2">Tempo</th>
                <th className="pb-2">Taxa</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {camadasOrdenadas.map((camada) => (
                <tr key={camada.id} className={`border-t ${!camada.ativo ? 'opacity-40' : ''}`}>
                  <td className="py-2 font-medium">{camada.raioKm} km</td>
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => atualizarCampo(camada, 'tempoEstimadoMin', camada.tempoEstimadoMin - 5)}
                        className="h-5 w-5 rounded bg-slate-100 text-xs"
                      >
                        -
                      </button>
                      <span className="w-10 text-center">{camada.tempoEstimadoMin}m</span>
                      <button
                        onClick={() => atualizarCampo(camada, 'tempoEstimadoMin', camada.tempoEstimadoMin + 5)}
                        className="h-5 w-5 rounded bg-slate-100 text-xs"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => atualizarCampo(camada, 'taxa', camada.taxa - 1)}
                        className="h-5 w-5 rounded bg-slate-100 text-xs"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">R${camada.taxa}</span>
                      <button
                        onClick={() => atualizarCampo(camada, 'taxa', camada.taxa + 1)}
                        className="h-5 w-5 rounded bg-slate-100 text-xs"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="space-x-2 py-2 text-right text-xs">
                    <button onClick={() => editar(camada)} className="text-brand-600">
                      editar
                    </button>
                    <button onClick={() => alternarAtivo(camada)} className="text-slate-500">
                      {camada.ativo ? 'desativar' : 'ativar'}
                    </button>
                    <button onClick={() => remover(camada.id)} className="text-red-600">
                      remover
                    </button>
                  </td>
                </tr>
              ))}
              {camadasOrdenadas.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    Nenhuma camada cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-400">
            Cada camada cobre "ate X km" da loja. O cliente paga a taxa da menor camada que alcance o
            endereco dele. Cadastre em ordem crescente (ex: 1km, 2km, 3km) para formar faixas.
          </p>
        </div>
      </div>
    </main>
  )
}
