import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Venda } from '../../../../shared/types'

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function VendasPage(): JSX.Element {
  const [vendas, setVendas] = useState<Venda[]>([])

  useEffect(() => {
    api.vendas.listar().then(setVendas)
  }, [])

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="mb-4 text-xl font-semibold">Vendas</h2>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Documento</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Status fiscal</th>
            </tr>
          </thead>
          <tbody>
            {vendas.map((venda) => (
              <tr key={venda.id} className="border-t">
                <td className="px-4 py-2">{venda.id}</td>
                <td className="px-4 py-2">{new Date(venda.criado_em).toLocaleString('pt-BR')}</td>
                <td className="px-4 py-2 uppercase">{venda.tipo_documento}</td>
                <td className="px-4 py-2">{formatarMoeda(venda.total)}</td>
                <td className="px-4 py-2">
                  {venda.tipo_documento !== 'nfce' ? (
                    '-'
                  ) : venda.chave_acesso ? (
                    <span className="text-emerald-600">Autorizada</span>
                  ) : venda.erro_fiscal ? (
                    <span className="text-red-600" title={venda.erro_fiscal}>
                      Erro
                    </span>
                  ) : (
                    <span className="text-amber-600">Pendente</span>
                  )}
                </td>
              </tr>
            ))}
            {vendas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma venda registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
