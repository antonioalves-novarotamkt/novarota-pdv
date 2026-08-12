'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage(): JSX.Element {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  async function entrar(): Promise<void> {
    setErro(null)
    setCarregando(true)
    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha })
      })
      if (!resp.ok) {
        const dados = await resp.json()
        setErro(dados.erro ?? 'Nao foi possivel entrar.')
        return
      }
      router.push('/admin/produtos')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-bold">Painel do delivery</h1>
        <p className="mb-4 text-sm text-slate-500">Entre com a senha administrativa.</p>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && entrar()}
          placeholder="Senha"
          className="mb-3 w-full rounded border px-3 py-2 text-sm"
        />
        {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}
        <button
          onClick={entrar}
          disabled={carregando}
          className="w-full rounded bg-brand-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </main>
  )
}
