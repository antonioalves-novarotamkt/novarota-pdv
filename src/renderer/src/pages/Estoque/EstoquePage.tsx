import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { MovimentoEstoqueTipo, Produto } from '../../../../shared/types'

interface MovimentoRow {
  id: number
  produto_id: number
  produto_nome: string
  tipo: MovimentoEstoqueTipo
  quantidade: number
  motivo: string | null
  criado_em: string
}

export default function EstoquePage(): JSX.Element {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [movimentos, setMovimentos] = useState<MovimentoRow[]>([])
  const [produtoId, setProdutoId] = useState<number | ''>('')
  const [tipo, setTipo] = useState<MovimentoEstoqueTipo>('entrada')
  const [quantidade, setQuantidade] = useState(1)
  const [motivo, setMotivo] = useState('')

  async function carregar(): Promise<void> {
    const [p, m] = await Promise.all([api.produtos.listar(), api.estoque.listarMovimentos()])
    setProdutos(p.filter((item) => item.controla_estoque === 1))
    setMovimentos(m as MovimentoRow[])
  }

  useEffect(() => {
    carregar()
  }, [])

  async function registrar(): Promise<void> {
    if (!produtoId) return
    await api.estoque.movimentar({ produto_id: produtoId, tipo, quantidade, motivo: motivo || undefined })
    setQuantidade(1)
    setMotivo('')
    await carregar()
  }

  return (
    <div className="grid h-full grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_360px]">
      <div>
        <h2 className="mb-4 text-xl font-semibold">Estoque</h2>

        <h3 className="mb-2 text-sm font-medium text-slate-500">Produtos com controle de estoque</h3>
        <div className="mb-6 overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2">Quantidade</th>
                <th className="px-4 py-2">Minimo</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className={`border-t ${p.quantidade_estoque <= p.estoque_minimo ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-2">{p.nome}</td>
                  <td className="px-4 py-2">{p.quantidade_estoque}</td>
                  <td className="px-4 py-2">{p.estoque_minimo}</td>
                </tr>
              ))}
              {produtos.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    Nenhum produto com controle de estoque ativado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h3 className="mb-2 text-sm font-medium text-slate-500">Historico de movimentacoes</h3>
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Quantidade</th>
                <th className="px-4 py-2">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movimentos.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-2">{new Date(m.criado_em).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-2">{m.produto_nome}</td>
                  <td className="px-4 py-2 capitalize">{m.tipo}</td>
                  <td className="px-4 py-2">{m.quantidade}</td>
                  <td className="px-4 py-2 text-slate-500">{m.motivo ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-semibold">Movimentar estoque</h3>
        <div className="space-y-2">
          <select
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value ? Number(e.target.value) : '')}
            className="w-full rounded border px-2 py-1 text-sm"
          >
            <option value="">Selecione um produto</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as MovimentoEstoqueTipo)}
            className="w-full rounded border px-2 py-1 text-sm"
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saida</option>
            <option value="ajuste">Ajuste</option>
          </select>
          <input
            type="number"
            min={0}
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            className="w-full rounded border px-2 py-1 text-sm"
          />
          <input
            placeholder="Motivo (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm"
          />
          <button onClick={registrar} disabled={!produtoId} className="w-full rounded bg-brand-600 py-2 text-sm text-white disabled:opacity-40">
            Registrar movimento
          </button>
        </div>
      </div>
    </div>
  )
}
