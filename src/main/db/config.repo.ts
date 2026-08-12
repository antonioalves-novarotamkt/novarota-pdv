import { getDb } from './index'
import type { AppConfig } from '../../shared/types'

const CONFIG_KEY = 'app_config'

const DEFAULT_CONFIG: AppConfig = {
  loja: { nomeFantasia: '', razaoSocial: '', cnpj: '', endereco: '' },
  impressora: { tipo: 'nenhuma', largura: 48 },
  fiscal: {
    ambiente: 'homologacao',
    focusNfeToken: '',
    cnpjEmitente: '',
    ufEmitente: 'SP',
    csc: '',
    cscId: ''
  }
}

export function obterConfig(): AppConfig {
  const db = getDb()
  const row = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get(CONFIG_KEY) as
    | { valor: string }
    | undefined
  if (!row) return DEFAULT_CONFIG
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(row.valor) } as AppConfig
  } catch {
    return DEFAULT_CONFIG
  }
}

export function salvarConfig(config: AppConfig): AppConfig {
  const db = getDb()
  db.prepare(
    'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor'
  ).run(CONFIG_KEY, JSON.stringify(config))
  return config
}
