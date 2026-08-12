import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { AppConfig, Mesa } from '../../../../shared/types'

const CONFIG_VAZIA: AppConfig = {
  loja: { nomeFantasia: '', razaoSocial: '', cnpj: '', endereco: '' },
  impressora: { tipo: 'nenhuma', largura: 48 },
  fiscal: { ambiente: 'homologacao', focusNfeToken: '', cnpjEmitente: '', ufEmitente: 'SP', csc: '', cscId: '' },
  delivery: { ativo: false, apiUrl: '', syncToken: '', intervaloSegundos: 30 }
}

export default function ConfiguracoesPage(): JSX.Element {
  const [config, setConfig] = useState<AppConfig>(CONFIG_VAZIA)
  const [salvando, setSalvando] = useState(false)
  const [mensagemImpressora, setMensagemImpressora] = useState<string | null>(null)
  const [mensagemFiscal, setMensagemFiscal] = useState<string | null>(null)
  const [mensagemDelivery, setMensagemDelivery] = useState<string | null>(null)
  const [sincronizando, setSincronizando] = useState(false)

  const [mesas, setMesas] = useState<Mesa[]>([])
  const [novaMesa, setNovaMesa] = useState('')

  useEffect(() => {
    api.config.obter().then(setConfig)
    api.mesas.listar().then(setMesas)
  }, [])

  async function salvar(): Promise<void> {
    setSalvando(true)
    try {
      await api.config.salvar(config)
    } finally {
      setSalvando(false)
    }
  }

  async function testarImpressora(): Promise<void> {
    setMensagemImpressora('Testando...')
    const resultado = await api.config.testarImpressora()
    setMensagemImpressora(resultado.mensagem)
  }

  async function testarFiscal(): Promise<void> {
    setMensagemFiscal('Testando...')
    const resultado = await api.config.testarFiscal()
    setMensagemFiscal(resultado.mensagem)
  }

  async function sincronizarDeliveryAgora(): Promise<void> {
    setSincronizando(true)
    setMensagemDelivery('Sincronizando...')
    try {
      const resultado = await api.config.sincronizarDeliveryAgora()
      setMensagemDelivery(
        resultado.ok
          ? `${resultado.produtosSincronizados ?? 0} produto(s) enviados ao catalogo, ${resultado.importados} pedido(s) importado(s) como comanda.`
          : resultado.mensagemErro ?? 'Falha ao sincronizar.'
      )
    } finally {
      setSincronizando(false)
    }
  }

  async function adicionarMesa(): Promise<void> {
    if (!novaMesa.trim()) return
    await api.mesas.salvar({ numero: novaMesa })
    setNovaMesa('')
    setMesas(await api.mesas.listar())
  }

  async function removerMesa(id: number): Promise<void> {
    await api.mesas.remover(id)
    setMesas(await api.mesas.listar())
  }

  return (
    <div className="h-full space-y-6 overflow-y-auto p-6">
      <h2 className="text-xl font-semibold">Configuracoes</h2>

      <section className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-semibold">Dados da loja</h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Nome fantasia"
            value={config.loja.nomeFantasia}
            onChange={(e) => setConfig({ ...config, loja: { ...config.loja, nomeFantasia: e.target.value } })}
            className="rounded border px-2 py-1 text-sm"
          />
          <input
            placeholder="Razao social"
            value={config.loja.razaoSocial}
            onChange={(e) => setConfig({ ...config, loja: { ...config.loja, razaoSocial: e.target.value } })}
            className="rounded border px-2 py-1 text-sm"
          />
          <input
            placeholder="CNPJ"
            value={config.loja.cnpj}
            onChange={(e) => setConfig({ ...config, loja: { ...config.loja, cnpj: e.target.value } })}
            className="rounded border px-2 py-1 text-sm"
          />
          <input
            placeholder="Endereco"
            value={config.loja.endereco}
            onChange={(e) => setConfig({ ...config, loja: { ...config.loja, endereco: e.target.value } })}
            className="rounded border px-2 py-1 text-sm"
          />
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-semibold">Impressora termica</h3>
        <p className="mb-3 text-xs text-slate-500">
          Usada para o comprovante nao fiscal e para imprimir o resumo da NFC-e apos autorizacao.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={config.impressora.tipo}
            onChange={(e) =>
              setConfig({
                ...config,
                impressora: { ...config.impressora, tipo: e.target.value as AppConfig['impressora']['tipo'] }
              })
            }
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="nenhuma">Nenhuma</option>
            <option value="usb">USB</option>
            <option value="network">Rede (IP)</option>
          </select>
          <select
            value={config.impressora.largura ?? 48}
            onChange={(e) =>
              setConfig({
                ...config,
                impressora: { ...config.impressora, largura: Number(e.target.value) as 32 | 42 | 48 }
              })
            }
            className="rounded border px-2 py-1 text-sm"
          >
            <option value={32}>32 colunas</option>
            <option value={42}>42 colunas</option>
            <option value={48}>48 colunas</option>
          </select>
          {config.impressora.tipo === 'network' && (
            <>
              <input
                placeholder="Endereco IP"
                value={config.impressora.enderecoIp ?? ''}
                onChange={(e) =>
                  setConfig({ ...config, impressora: { ...config.impressora, enderecoIp: e.target.value } })
                }
                className="rounded border px-2 py-1 text-sm"
              />
              <input
                type="number"
                placeholder="Porta (padrao 9100)"
                value={config.impressora.porta ?? 9100}
                onChange={(e) =>
                  setConfig({ ...config, impressora: { ...config.impressora, porta: Number(e.target.value) } })
                }
                className="rounded border px-2 py-1 text-sm"
              />
            </>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={testarImpressora} className="rounded border px-3 py-1 text-sm">
            Testar impressora
          </button>
          {mensagemImpressora && <span className="text-xs text-slate-500">{mensagemImpressora}</span>}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-semibold">Fiscal (NFC-e via Focus NFe)</h3>
        <p className="mb-3 text-xs text-slate-500">
          Use o ambiente de homologacao para testar sem valor fiscal. So mude para producao quando o cadastro do
          certificado A1 e da empresa estiver concluido no painel da Focus NFe.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={config.fiscal.ambiente}
            onChange={(e) =>
              setConfig({
                ...config,
                fiscal: { ...config.fiscal, ambiente: e.target.value as AppConfig['fiscal']['ambiente'] }
              })
            }
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="homologacao">Homologacao (testes)</option>
            <option value="producao">Producao</option>
          </select>
          <input
            placeholder="UF do emitente"
            value={config.fiscal.ufEmitente}
            onChange={(e) => setConfig({ ...config, fiscal: { ...config.fiscal, ufEmitente: e.target.value } })}
            className="rounded border px-2 py-1 text-sm"
          />
          <input
            placeholder="CNPJ do emitente"
            value={config.fiscal.cnpjEmitente}
            onChange={(e) => setConfig({ ...config, fiscal: { ...config.fiscal, cnpjEmitente: e.target.value } })}
            className="rounded border px-2 py-1 text-sm"
          />
          <input
            placeholder="Token Focus NFe"
            value={config.fiscal.focusNfeToken}
            onChange={(e) => setConfig({ ...config, fiscal: { ...config.fiscal, focusNfeToken: e.target.value } })}
            className="rounded border px-2 py-1 text-sm"
          />
          <input
            placeholder="CSC"
            value={config.fiscal.csc}
            onChange={(e) => setConfig({ ...config, fiscal: { ...config.fiscal, csc: e.target.value } })}
            className="rounded border px-2 py-1 text-sm"
          />
          <input
            placeholder="CSC ID"
            value={config.fiscal.cscId}
            onChange={(e) => setConfig({ ...config, fiscal: { ...config.fiscal, cscId: e.target.value } })}
            className="rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={testarFiscal} className="rounded border px-3 py-1 text-sm">
            Testar conexao
          </button>
          {mensagemFiscal && <span className="text-xs text-slate-500">{mensagemFiscal}</span>}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-semibold">Delivery (pedidos online)</h3>
        <p className="mb-3 text-xs text-slate-500">
          Conecta com o site de delivery (novarota-delivery) para puxar pedidos automaticamente como
          comandas. Preencha a URL do site publicado e o mesmo token configurado la (PDV_SYNC_TOKEN).
        </p>
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.delivery.ativo}
            onChange={(e) => setConfig({ ...config, delivery: { ...config.delivery, ativo: e.target.checked } })}
          />
          Sincronizacao automatica ativa
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="URL do site de delivery (ex: https://meudelivery.vercel.app)"
            value={config.delivery.apiUrl}
            onChange={(e) => setConfig({ ...config, delivery: { ...config.delivery, apiUrl: e.target.value } })}
            className="col-span-2 rounded border px-2 py-1 text-sm"
          />
          <input
            placeholder="Token de sincronizacao (PDV_SYNC_TOKEN)"
            value={config.delivery.syncToken}
            onChange={(e) => setConfig({ ...config, delivery: { ...config.delivery, syncToken: e.target.value } })}
            className="rounded border px-2 py-1 text-sm"
          />
          <input
            type="number"
            min={10}
            placeholder="Intervalo (segundos)"
            value={config.delivery.intervaloSegundos}
            onChange={(e) =>
              setConfig({ ...config, delivery: { ...config.delivery, intervaloSegundos: Number(e.target.value) } })
            }
            className="rounded border px-2 py-1 text-sm"
          />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={sincronizarDeliveryAgora}
            disabled={sincronizando}
            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
          >
            Sincronizar agora
          </button>
          {mensagemDelivery && <span className="text-xs text-slate-500">{mensagemDelivery}</span>}
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4">
        <h3 className="mb-3 font-semibold">Mesas</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {mesas.map((mesa) => (
            <span key={mesa.id} className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              {mesa.numero}
              <button onClick={() => removerMesa(mesa.id)} className="text-red-600">
                x
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Numero/identificacao da mesa"
            value={novaMesa}
            onChange={(e) => setNovaMesa(e.target.value)}
            className="flex-1 rounded border px-2 py-1 text-sm"
          />
          <button onClick={adicionarMesa} className="rounded bg-brand-600 px-3 py-1 text-sm text-white">
            Adicionar
          </button>
        </div>
      </section>

      <button
        onClick={salvar}
        disabled={salvando}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {salvando ? 'Salvando...' : 'Salvar configuracoes'}
      </button>
    </div>
  )
}
