import { NextResponse } from 'next/server'
import { criarTokenSessao, validarSenhaAdmin, NOME_COOKIE_ADMIN } from '@/lib/auth'

export async function POST(request: Request): Promise<NextResponse> {
  const { senha } = (await request.json()) as { senha?: string }

  if (!senha || !validarSenhaAdmin(senha)) {
    return NextResponse.json({ erro: 'Senha incorreta.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(NOME_COOKIE_ADMIN, criarTokenSessao(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/'
  })
  return response
}
