import { NextResponse } from 'next/server'
import { buscarEnderecoPorCep } from '@/lib/viacep'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { cep?: string }
  const cep = body.cep?.replace(/\D/g, '')

  if (!cep || cep.length !== 8) {
    return NextResponse.json({ encontrado: false, mensagem: 'Informe um CEP valido (8 digitos).' }, { status: 400 })
  }

  const endereco = await buscarEnderecoPorCep(cep)
  if (!endereco) {
    return NextResponse.json({ encontrado: false, mensagem: 'CEP nao encontrado. Confira e tente novamente.' }, { status: 422 })
  }

  return NextResponse.json({ encontrado: true, ...endereco })
}
