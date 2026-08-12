'use client'

import { useEffect, useMemo, useState } from 'react'
import type {
  CardapioResponse,
  CriarPedidoResponse,
  EnderecoViaCepResponse,
  FormaPagamentoPedido,
  FreteResponse,
  ProdutoPublico
} from '@/lib/types'
import MapaRaio from '@/components/MapaRaio'

interface ItemCarrinho extends ProdutoPublico {
  quantidade: number
}

function brl(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarCep(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8)
  if (digitos.length <= 5) return digitos
  return `${digitos.slice(0, 5)}-${digitos.slice(5)}`
}

type Etapa = 'cardapio' | 'endereco' | 'confirmarLocal' | 'checkout' | 'confirmado'

export default function PaginaPedido(): JSX.Element {
  const [cardapio, setCardapio] = useState<CardapioResponse | null>(null)
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [etapa, setEtapa] = useState<Etapa>('cardapio')

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cep, setCep] = useState('')
  const [numero, setNumero] = useState('')
  const [semNumero, setSemNumero] = useState(false)
  const [complemento, setComplemento] = useState('')
  const [pontoReferencia, setPontoReferencia] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoPedido>('dinheiro')
  const [trocoPara, setTrocoPara] = useState('')
  const [observacoes, setObservacoes] = useState('')

  const [enderecoCep, setEnderecoCep] = useState<EnderecoViaCepResponse | null>(null)
  const [frete, setFrete] = useState<FreteResponse | null>(null)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [confirmandoLocal, setConfirmandoLocal] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<CriarPedidoResponse | null>(null)

  useEffect(() => {
    fetch('/api/cardapio')
      .then((r) => r.json())
      .then(setCardapio)
      .catch(() => setErro('Nao foi possivel carregar o cardapio agora.'))
  }, [])

  const categorias = useMemo(() => {
    if (!cardapio) return []
    return Array.from(new Set(cardapio.produtos.map((p) => p.categoria)))
  }, [cardapio])

  const totalProdutos = carrinho.reduce((acc, i) => acc + i.quantidade * i.preco, 0)
  const total = totalProdutos + (frete?.dentroDaArea ? frete.taxa ?? 0 : 0)
  const abaixoDoMinimo = (cardapio?.loja.pedidoMinimo ?? 0) > totalProdutos

  function adicionar(produto: ProdutoPublico): void {
    setCarrinho((atual) => {
      const existente = atual.find((i) => i.id === produto.id)
      if (existente) {
        return atual.map((i) => (i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i))
      }
      return [...atual, { ...produto, quantidade: 1 }]
    })
  }

  function alterarQuantidade(id: string, delta: number): void {
    setCarrinho((atual) =>
      atual.map((i) => (i.id === id ? { ...i, quantidade: i.quantidade + delta } : i)).filter((i) => i.quantidade > 0)
    )
  }

  async function buscarCep(): Promise<void> {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) {
      setErro('Informe um CEP valido (8 digitos).')
      return
    }
    setErro(null)
    setBuscandoCep(true)
    setEnderecoCep(null)
    try {
      const resp = await fetch('/api/cep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: cepLimpo })
      })
      const dados = (await resp.json()) as EnderecoViaCepResponse
      setEnderecoCep(dados)
      if (!dados.encontrado) setErro(dados.mensagem ?? 'CEP nao encontrado.')
    } catch {
      setErro('Nao foi possivel buscar esse CEP agora. Tente novamente.')
    } finally {
      setBuscandoCep(false)
    }
  }

  async function confirmarEndereco(): Promise<void> {
    if (!enderecoCep?.encontrado) return
    if (!numero.trim() && !semNumero) {
      setErro('Informe o numero do endereco (ou marque "sem numero").')
      return
    }
    setErro(null)
    setConfirmandoLocal(true)
    setFrete(null)
    try {
      const resp = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rua: enderecoCep.rua,
          numero,
          semNumero,
          complemento,
          bairro: enderecoCep.bairro,
          cidade: enderecoCep.cidade,
          uf: enderecoCep.uf
        })
      })
      const dados = (await resp.json()) as FreteResponse
      setFrete(dados)
      setEtapa('confirmarLocal')
      if (!dados.dentroDaArea) setErro(dados.mensagem ?? 'Nao entregamos nesse endereco.')
    } catch {
      setErro('Nao foi possivel localizar o endereco agora. Tente novamente.')
    } finally {
      setConfirmandoLocal(false)
    }
  }

  async function enviarPedido(): Promise<void> {
    if (!nome.trim() || !telefone.trim()) {
      setErro('Preencha nome e telefone.')
      return
    }
    if (!frete?.dentroDaArea) {
      setErro('Confirme um endereco dentro da area de entrega antes de finalizar.')
      return
    }
    setErro(null)
    setEnviando(true)
    try {
      const resp = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNome: nome,
          clienteTelefone: telefone,
          endereco: {
            cep: cep.replace(/\D/g, ''),
            rua: enderecoCep?.rua ?? '',
            numero,
            semNumero,
            complemento: complemento || undefined,
            bairro: enderecoCep?.bairro ?? '',
            cidade: enderecoCep?.cidade ?? '',
            uf: enderecoCep?.uf ?? '',
            pontoReferencia: pontoReferencia || undefined
          },
          itens: carrinho.map((i) => ({ produtoId: i.id, quantidade: i.quantidade })),
          formaPagamento,
          trocoPara: formaPagamento === 'dinheiro' && trocoPara ? Number(trocoPara) : undefined,
          observacoes: observacoes || undefined
        })
      })
      const dados = await resp.json()
      if (!resp.ok) {
        setErro(dados.erro ?? 'Nao foi possivel enviar o pedido.')
        return
      }
      setResultado(dados as CriarPedidoResponse)
      setEtapa('confirmado')
    } catch {
      setErro('Nao foi possivel enviar o pedido agora. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (!cardapio) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Carregando cardapio...</div>
  }

  if (etapa === 'confirmado' && resultado) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">✓</div>
        <h1 className="text-xl font-bold">Pedido recebido!</h1>
        <p className="text-slate-600">
          Numero do pedido <span className="font-mono">#{resultado.id.slice(-6).toUpperCase()}</span>
        </p>
        <p className="text-slate-600">Tempo estimado: cerca de {resultado.tempoEstimadoMin} minutos.</p>
        <div className="w-full rounded-xl border bg-white p-4 text-left text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Taxa de entrega</span>
            <span>{brl(resultado.taxaEntrega)}</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{brl(resultado.total)}</span>
          </div>
        </div>
        <button
          onClick={() => {
            setEtapa('cardapio')
            setCarrinho([])
            setResultado(null)
            setFrete(null)
            setEnderecoCep(null)
          }}
          className="mt-2 text-sm text-brand-600 underline"
        >
          Fazer novo pedido
        </button>
      </main>
    )
  }

  if (!cardapio.loja.aceitandoPedidos) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center text-slate-600">
        <p>{cardapio.loja.nomeFantasia} nao esta aceitando pedidos online no momento. Tente novamente mais tarde.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md pb-32">
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-4">
        <h1 className="text-lg font-bold">{cardapio.loja.nomeFantasia}</h1>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aberto
          </span>
          <span>⏱ {cardapio.loja.tempoEstimadoMin}min</span>
          {cardapio.loja.pedidoMinimo > 0 && <span>Pedido minimo {brl(cardapio.loja.pedidoMinimo)}</span>}
        </div>
      </header>

      {etapa === 'cardapio' && (
        <div className="px-4 py-4">
          {categorias.map((categoria) => (
            <section key={categoria} className="mb-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{categoria}</h2>
              <div className="space-y-2">
                {cardapio.produtos
                  .filter((p) => p.categoria === categoria)
                  .map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => adicionar(produto)}
                      className="flex w-full items-center justify-between rounded-lg border bg-white p-3 text-left shadow-sm active:scale-[0.99]"
                    >
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        {produto.descricao && <p className="text-xs text-slate-500">{produto.descricao}</p>}
                        <p className="mt-1 text-sm font-semibold text-brand-600">{brl(produto.preco)}</p>
                      </div>
                      <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">+</span>
                    </button>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {etapa === 'endereco' && (
        <div className="space-y-4 px-4 py-4">
          <button onClick={() => setEtapa('cardapio')} className="text-sm text-brand-600">
            ← Voltar ao cardapio
          </button>

          <h2 className="text-base font-semibold">Informe seu endereco</h2>

          <div className="flex gap-2">
            <input
              placeholder="CEP"
              value={formatarCep(cep)}
              onChange={(e) => {
                setCep(e.target.value)
                setEnderecoCep(null)
              }}
              className="flex-1 rounded border px-3 py-2 text-sm"
            />
            <button
              onClick={buscarCep}
              disabled={buscandoCep}
              className="whitespace-nowrap rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {buscandoCep ? 'Buscando...' : 'Buscar CEP'}
            </button>
          </div>

          {enderecoCep?.encontrado && (
            <div className="rounded-lg border bg-white p-3 text-sm">
              <p className="font-medium">
                {enderecoCep.rua}, {enderecoCep.bairro}
              </p>
              <p className="text-slate-500">
                {enderecoCep.cidade} - {enderecoCep.uf}
              </p>
            </div>
          )}

          {enderecoCep?.encontrado && (
            <>
              <div className="flex gap-2">
                <input
                  placeholder="Numero"
                  value={numero}
                  disabled={semNumero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="flex-1 rounded border px-3 py-2 text-sm disabled:bg-slate-100"
                />
                <label className="flex items-center gap-1 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={semNumero}
                    onChange={(e) => {
                      setSemNumero(e.target.checked)
                      if (e.target.checked) setNumero('')
                    }}
                  />
                  Sem numero
                </label>
              </div>
              <input
                placeholder="Complemento (opcional)"
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
              />
              <input
                placeholder="Ponto de referencia (opcional)"
                value={pontoReferencia}
                onChange={(e) => setPontoReferencia(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
              />

              {erro && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

              <button
                onClick={confirmarEndereco}
                disabled={(!numero.trim() && !semNumero) || confirmandoLocal}
                className="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {confirmandoLocal ? 'Localizando...' : 'Continuar'}
              </button>
            </>
          )}

          {erro && !enderecoCep?.encontrado && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
        </div>
      )}

      {etapa === 'confirmarLocal' && (
        <div className="space-y-4 px-4 py-4">
          <button onClick={() => setEtapa('endereco')} className="text-sm text-brand-600">
            ← Voltar ao endereco
          </button>

          <h2 className="text-base font-semibold">A localizacao esta correta?</h2>
          <p className="text-sm text-slate-500">
            {enderecoCep?.rua}, {semNumero ? 'S/N' : numero}
            {complemento && ` - ${complemento}`} - {enderecoCep?.bairro}, {enderecoCep?.cidade}/{enderecoCep?.uf}
          </p>

          {frete?.latitude && frete?.longitude && (
            <MapaRaio centro={{ lat: frete.latitude, lng: frete.longitude }} camadas={[]} altura={260} />
          )}

          {frete?.dentroDaArea ? (
            <div className="rounded-lg border bg-emerald-50 p-3 text-sm text-emerald-700">
              Taxa de entrega: {brl(frete.taxa ?? 0)} · Tempo estimado: {frete.tempoEstimadoMin}min
            </div>
          ) : (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {erro ?? 'Esse endereco esta fora da nossa area de entrega.'}
            </p>
          )}

          {frete?.dentroDaArea && (
            <button
              onClick={() => setEtapa('checkout')}
              className="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white"
            >
              Confirmar localizacao
            </button>
          )}
        </div>
      )}

      {etapa === 'checkout' && (
        <div className="space-y-4 px-4 py-4">
          <button onClick={() => setEtapa('confirmarLocal')} className="text-sm text-brand-600">
            ← Voltar
          </button>

          <div className="rounded-lg border bg-white p-3">
            {carrinho.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                <span className="flex-1">{item.nome}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alterarQuantidade(item.id, -1)}
                    className="h-6 w-6 rounded bg-slate-100 text-slate-600"
                  >
                    -
                  </button>
                  <span className="w-4 text-center">{item.quantidade}</span>
                  <button
                    onClick={() => alterarQuantidade(item.id, 1)}
                    className="h-6 w-6 rounded bg-slate-100 text-slate-600"
                  >
                    +
                  </button>
                </div>
                <span className="w-16 text-right">{brl(item.quantidade * item.preco)}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Pagamento na entrega</p>
            <div className="flex gap-2">
              <button
                onClick={() => setFormaPagamento('dinheiro')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  formaPagamento === 'dinheiro' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300'
                }`}
              >
                Dinheiro
              </button>
              <button
                onClick={() => setFormaPagamento('cartao_entrega')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  formaPagamento === 'cartao_entrega' ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300'
                }`}
              >
                Cartao (maquininha)
              </button>
            </div>
            {formaPagamento === 'dinheiro' && (
              <input
                placeholder="Troco para quanto? (opcional)"
                value={trocoPara}
                onChange={(e) => setTrocoPara(e.target.value)}
                type="number"
                className="mt-2 w-full rounded border px-3 py-2 text-sm"
              />
            )}
          </div>

          <div className="space-y-2">
            <input
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            />
            <input
              placeholder="Telefone / WhatsApp"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>

          <textarea
            placeholder="Observacoes (opcional)"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
            rows={2}
          />

          {erro && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

          <div className="rounded-lg border bg-white p-3 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Valor dos itens</span>
              <span>{brl(totalProdutos)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Taxa de entrega</span>
              <span>{frete?.dentroDaArea ? brl(frete.taxa ?? 0) : '—'}</span>
            </div>
            <div className="mt-1 flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{brl(total)}</span>
            </div>
          </div>

          <button
            onClick={enviarPedido}
            disabled={enviando}
            className="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {enviando ? 'Enviando pedido...' : 'Confirmar pedido'}
          </button>
        </div>
      )}

      {etapa === 'cardapio' && carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white px-4 py-3">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <div className="text-sm">
              <p className="font-semibold">{carrinho.reduce((a, i) => a + i.quantidade, 0)} item(ns)</p>
              <p className="text-slate-500">{brl(totalProdutos)}</p>
              {abaixoDoMinimo && (
                <p className="text-xs text-amber-600">
                  Faltam {brl((cardapio.loja.pedidoMinimo ?? 0) - totalProdutos)} para o pedido minimo
                </p>
              )}
            </div>
            <button
              onClick={() => setEtapa('endereco')}
              disabled={abaixoDoMinimo}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Ver carrinho
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
