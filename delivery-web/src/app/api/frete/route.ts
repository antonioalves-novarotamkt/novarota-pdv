import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buscarEnderecoPorCep } from '@/lib/viacep'
import { encontrarAreaPorCep } from '@/lib/areaEntrega'
import type { FreteResponse } from '@/lib/types'

export async function POST(request: Request): Promise<NextResponse<FreteResponse>> {
  const body = (await request.json()) as { cep?: string }
  const cep = body.cep?.replace(/\D/g, '')

  if (!cep || cep.length !== 8) {
    return NextResponse.json({ dentroDaArea: false, mensagem: 'Informe um CEP valido (8 digitos).' }, { status: 400 })
  }

  const config = await prisma.configuracaoLoja.findUnique({ where: { id: 'config' } })
  if (!config?.aceitandoPedidos) {
    return NextResponse.json(
      { dentroDaArea: false, mensagem: 'A loja nao esta aceitando pedidos no momento.' },
      { status: 503 }
    )
  }

  const endereco = await buscarEnderecoPorCep(cep)
  if (!endereco) {
    return NextResponse.json({ dentroDaArea: false, mensagem: 'CEP nao encontrado. Confira e tente novamente.' }, { status: 422 })
  }

  const area = await encontrarAreaPorCep(cep)
  if (!area) {
    return NextResponse.json({
      dentroDaArea: false,
      rua: endereco.rua,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      uf: endereco.uf,
      mensagem: 'Esse CEP esta fora da nossa area de entrega no momento.'
    })
  }

  return NextResponse.json({
    dentroDaArea: true,
    rua: endereco.rua,
    bairro: endereco.bairro,
    cidade: endereco.cidade,
    uf: endereco.uf,
    areaDescricao: area.descricao,
    taxa: area.taxa,
    tempoEstimadoMin: area.tempoEstimadoMin
  })
}
