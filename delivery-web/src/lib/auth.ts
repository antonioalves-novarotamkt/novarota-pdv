import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'nr_admin_session'
const UM_DIA_MS = 24 * 60 * 60 * 1000

function segredo(): string {
  const valor = process.env.SESSION_SECRET
  if (!valor) throw new Error('SESSION_SECRET nao configurado.')
  return valor
}

function assinar(payload: string): string {
  return createHmac('sha256', segredo()).update(payload).digest('hex')
}

export function criarTokenSessao(): string {
  const expiraEm = Date.now() + UM_DIA_MS
  const payload = String(expiraEm)
  const assinatura = assinar(payload)
  return `${payload}.${assinatura}`
}

function tokenValido(token: string | undefined): boolean {
  if (!token) return false
  const [payload, assinatura] = token.split('.')
  if (!payload || !assinatura) return false

  const esperado = assinar(payload)
  const bufA = Buffer.from(assinatura)
  const bufB = Buffer.from(esperado)
  if (bufA.length !== bufB.length || !timingSafeEqual(bufA, bufB)) return false

  return Number(payload) > Date.now()
}

export function validarSenhaAdmin(senha: string): boolean {
  const esperada = process.env.ADMIN_PASSWORD
  if (!esperada) return false
  const bufA = Buffer.from(senha)
  const bufB = Buffer.from(esperada)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function sessaoAdminValida(): boolean {
  const token = cookies().get(COOKIE_NAME)?.value
  return tokenValido(token)
}

export const NOME_COOKIE_ADMIN = COOKIE_NAME

export function validarTokenSync(request: Request): boolean {
  const esperado = process.env.PDV_SYNC_TOKEN
  if (!esperado) return false
  const header = request.headers.get('authorization') ?? ''
  const token = header.replace(/^Bearer\s+/i, '')
  if (!token) return false
  const bufA = Buffer.from(token)
  const bufB = Buffer.from(esperado)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
