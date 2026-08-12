import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Categoria, Produto } from '../../../../shared/types'

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const PRODUTO_VAZIO = {
  nome: '',
  descricao: '',
  categoria_id: null as number | null,
  preco: 0,
  ncm: '',
  cfop: '',
  unidade: 'UN',
  controla_estoque: false,
  quantidade_estoque: 0,
  estoque_minimo: 0,
  item_cozinha: false,
  cozinha: '',
  disponivel_pdv: true,
  disponivel_comanda: true,
  disponivel_delivery: false
}

type Aba = 'principal' | 'estoque' | 'fiscal'

const ABAS: { id: Aba; label: string }[] = [
  { id: 'principal', label: 'Principal' },
  { id: 'estoque', label: 'Estoque' },
  { id: 'fiscal', label: 'Fiscal' }
]

export default function ProdutosPage(): JSX.Element {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [form, setForm] = useState<typeof PRODUTO_VAZIO & { id?: number }>(PRODUTO_VAZIO)
  const [aba, setAba] = useState<Aba>('principal')
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
      descricao: form.descricao || null,
      categoria_id: form.categoria_id,
      preco: form.preco,
      ncm: form.ncm || null,
      cfop: form.cfop || null,
      unidade: form.unidade,
      controla_estoque: form.controla_estoque,
      quantidade_estoque: form.quantidade_estoque,
      estoque_minimo: form.estoque_minimo,
      item_cozinha: form.item_cozinha,
      cozinha: form.cozinha || null,
      disponivel_pdv: form.disponivel_pdv,
      disponivel_comanda: form.disponivel_comanda,
      disponivel_delivery: form.disponivel_delivery
    })
    setForm(PRODUTO_VAZIO)
    setAba('principal')
    await carregar()
  }

  function editar(produto: Produto): void {
    setForm({
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao ?? '',
      categoria_id: produto.categoria_id,
      preco: produto.preco,
      ncm: produto.ncm ?? '',
      cfop: produto.cfop ?? '',
      unidade: produto.unidade,
      controla_estoque: produto.controla_estoque === 1,
      quantidade_estoque: produto.quantidade_estoque,
      estoque_minimo: produto.estoque_minimo,
      item_cozinha: produto.item_cozinha === 1,
      cozinha: produto.cozinha ?? '',
      disponivel_pdv: produto.disponivel_pdv === 1,
      disponivel_comanda: produto.disponivel_comanda === 1,
      disponivel_delivery: produto.disponivel_delivery === 1
    })
    setAba('principal')
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
    <div className="grid h-full grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_380px]">
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
                <th className="px-4 py-2">Canais</th>
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
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      {produto.disponivel_pdv === 1 && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          PDV
                        </span>
                      )}
                      {produto.disponivel_comanda === 1 && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          Comanda
                        </span>
                      )}
                      {produto.disponivel_delivery === 1 && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          Delivery
                        </span>
                      )}
                    </div>
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
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
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

          <div className="mb-3 flex gap-1 border-b">
            {ABAS.map((item) => (
              <button
                key={item.id}
                onClick={() => setAba(item.id)}
                className={`border-b-2 px-3 py-1.5 text-sm font-medium ${
                  aba === item.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {aba === 'principal' && (
            <div className="space-y-2">
              <input
                placeholder="Nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full rounded border px-2 py-1 text-sm"
              />
              <textarea
                placeholder="Descricao (aparece no cardapio do delivery)"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                rows={2}
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

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.item_cozinha}
                  onChange={(e) => setForm({ ...form, item_cozinha: e.target.checked })}
                />
                Item para cozinha (enviar e imprimir na cozinha)
              </label>
              {form.item_cozinha && (
                <input
                  placeholder="Setor da cozinha (opcional)"
                  value={form.cozinha}
                  onChange={(e) => setForm({ ...form, cozinha: e.target.value })}
                  className="w-full rounded border px-2 py-1 text-sm"
                />
              )}

              <div className="pt-1">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Disponibilizar este produto em
                </p>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.disponivel_pdv}
                      onChange={(e) => setForm({ ...form, disponivel_pdv: e.target.checked })}
                    />
                    PDV Desktop (caixa)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.disponivel_comanda}
                      onChange={(e) => setForm({ ...form, disponivel_comanda: e.target.checked })}
                    />
                    Comandas / Mesas
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.disponivel_delivery}
                      onChange={(e) => setForm({ ...form, disponivel_delivery: e.target.checked })}
                    />
                    Delivery Online
                  </label>
                </div>
                {form.disponivel_delivery && (
                  <p className="mt-1 text-xs text-slate-400">
                    Sincroniza para o site de delivery na proxima sincronizacao (ou clique em
                    &quot;Sincronizar agora&quot; em Configuracoes).
                  </p>
                )}
              </div>
            </div>
          )}

          {aba === 'estoque' && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.controla_estoque}
                  onChange={(e) => setForm({ ...form, controla_estoque: e.target.checked })}
                />
                Controla estoque
              </label>
              {form.controla_estoque && (
                <>
                  <input
                    type="number"
                    placeholder="Quantidade em estoque"
                    value={form.quantidade_estoque}
                    onChange={(e) => setForm({ ...form, quantidade_estoque: Number(e.target.value) })}
                    className="w-full rounded border px-2 py-1 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Estoque minimo"
                    value={form.estoque_minimo}
                    onChange={(e) => setForm({ ...form, estoque_minimo: Number(e.target.value) })}
                    className="w-full rounded border px-2 py-1 text-sm"
                  />
                  <select
                    value={form.unidade}
                    onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                    className="w-full rounded border px-2 py-1 text-sm"
                  >
                    <option value="UN">Unidade (UN)</option>
                    <option value="KG">Quilo (KG)</option>
                    <option value="L">Litro (L)</option>
                  </select>
                </>
              )}
            </div>
          )}

          {aba === 'fiscal' && (
            <div className="space-y-2">
              <input
                placeholder="NCM"
                value={form.ncm}
                onChange={(e) => setForm({ ...form, ncm: e.target.value })}
                className="w-full rounded border px-2 py-1 text-sm"
              />
              <input
                placeholder="CFOP"
                value={form.cfop}
                onChange={(e) => setForm({ ...form, cfop: e.target.value })}
                className="w-full rounded border px-2 py-1 text-sm"
              />
              <p className="text-xs text-slate-400">
                Usados na emissao de NFC-e. Confirme com o contador antes de emitir em producao.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-3">
            <button onClick={salvar} className="flex-1 rounded bg-brand-600 py-2 text-sm text-white">
              Salvar
            </button>
            {form.id && (
              <button
                onClick={() => {
                  setForm(PRODUTO_VAZIO)
                  setAba('principal')
                }}
                className="rounded border px-3 py-2 text-sm text-slate-600"
              >
                Cancelar
              </button>
            )}
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
