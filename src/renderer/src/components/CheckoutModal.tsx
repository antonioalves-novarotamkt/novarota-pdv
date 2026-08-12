import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import type { FormaPagamento, PagamentoInput, ResultadoFinalizarVenda, TipoDocumento } from '../../../shared/types'

export interface ItemCarrinho {
  produto_id: number
  nome: string
  quantidade: number
  preco_unitario: number
}

interface CheckoutModalProps {
  itens: ItemCarrinho[]
  comandaId?: number | null
  onClose: () => void
  onFinalizado: (resultado: ResultadoFinalizarVenda) => void
}

const FORMAS: { valor: FormaPagamento; label: string }[] = [
  { valor: 'dinheiro', label: 'Dinheiro' },
  { valor: 'debito', label: 'Debito' },
  { valor: 'credito', label: 'Credito' },
  { valor: 'pix', label: 'Pix' },
  { valor: 'outro', label: 'Outro' }
]

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CheckoutModal({ itens, comandaId, onClose, onFinalizado }: CheckoutModalProps): JSX.Element {
  const totalBruto = useMemo(
    () => itens.reduce((acc, item) => acc + item.quantidade * item.preco_unitario, 0),
    [itens]
  )
  const [desconto, setDesconto] = useState(0)
  const total = Math.max(totalBruto - desconto, 0)

  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('nao_fiscal')
  const [pagamentos, setPagamentos] = useState<PagamentoInput[]>([{ forma: 'dinheiro', valor: total }])
  const [imprimir, setImprimir] = useState(true)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0)
  const restante = Number((total - totalPago).toFixed(2))

  function atualizarPagamento(index: number, campo: keyof PagamentoInput, valor: string): void {
    setPagamentos((atual) =>
      atual.map((p, i) =>
        i === index ? { ...p, [campo]: campo === 'valor' ? Number(valor) : (valor as FormaPagamento) } : p
      )
    )
  }

  function adicionarPagamento(): void {
    setPagamentos((atual) => [...atual, { forma: 'dinheiro', valor: Math.max(restante, 0) }])
  }

  function removerPagamento(index: number): void {
    setPagamentos((atual) => atual.filter((_, i) => i !== index))
  }

  async function finalizar(): Promise<void> {
    setErro(null)
    if (Math.abs(restante) > 0.01) {
      setErro(`Faltam ${formatarMoeda(restante)} para completar o pagamento.`)
      return
    }
    setCarregando(true)
    try {
      const resultado = await api.vendas.finalizar({
        comanda_id: comandaId ?? null,
        itens: itens.map((item) => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario
        })),
        desconto,
        pagamentos,
        tipo_documento: tipoDocumento,
        imprimir
      })
      onFinalizado(resultado)
    } catch (error) {
      setErro((error as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Finalizar venda</h2>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="space-y-1">
            {itens.map((item) => (
              <div key={item.produto_id} className="flex justify-between text-sm">
                <span>
                  {item.quantidade}x {item.nome}
                </span>
                <span>{formatarMoeda(item.quantidade * item.preco_unitario)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <label className="text-sm text-slate-600">Desconto (R$)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={desconto}
              onChange={(e) => setDesconto(Number(e.target.value))}
              className="w-28 rounded border px-2 py-1 text-right text-sm"
            />
          </div>

          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatarMoeda(total)}</span>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Documento</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTipoDocumento('nao_fiscal')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  tipoDocumento === 'nao_fiscal' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300'
                }`}
              >
                Cupom nao fiscal
              </button>
              <button
                type="button"
                onClick={() => setTipoDocumento('nfce')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  tipoDocumento === 'nfce' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300'
                }`}
              >
                NFC-e (fiscal)
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Pagamento</p>
            <div className="space-y-2">
              {pagamentos.map((pagamento, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={pagamento.forma}
                    onChange={(e) => atualizarPagamento(index, 'forma', e.target.value)}
                    className="flex-1 rounded border px-2 py-1 text-sm"
                  >
                    {FORMAS.map((f) => (
                      <option key={f.valor} value={f.valor}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={pagamento.valor}
                    onChange={(e) => atualizarPagamento(index, 'valor', e.target.value)}
                    className="w-28 rounded border px-2 py-1 text-right text-sm"
                  />
                  {pagamentos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removerPagamento(index)}
                      className="text-xs text-red-600"
                    >
                      remover
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={adicionarPagamento} className="text-xs text-brand-600">
                + dividir pagamento
              </button>
            </div>
            <p className={`mt-1 text-xs ${restante === 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
              {restante === 0 ? 'Pagamento completo' : `Restante: ${formatarMoeda(restante)}`}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={imprimir} onChange={(e) => setImprimir(e.target.checked)} />
            Imprimir comprovante ao finalizar
          </label>

          {erro && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-slate-600">
            Cancelar
          </button>
          <button
            type="button"
            onClick={finalizar}
            disabled={carregando}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {carregando ? 'Processando...' : 'Finalizar venda'}
          </button>
        </div>
      </div>
    </div>
  )
}
