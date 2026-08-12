import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sessaoAdminValida } from '@/lib/auth'
import { geocodificarEndereco } from '@/lib/mapbox'

export async function GET(): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  const config = await prisma.configuracaoLoja.findUnique({ where: { id: 'config' } })
  return NextResponse.json(config)
}

export async function PUT(request: Request): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  const body = await request.json()

  let latitudeLoja: number | undefined
  let longitudeLoja: number | undefined

  if (body.enderecoLoja) {
    const coordenadas = await geocodificarEndereco(body.enderecoLoja)
    if (!coordenadas) {
      return NextResponse.json(
        { erro: 'Nao conseguimos localizar o endereco da loja no mapa. Verifique e tente novamente.' },
        { status: 422 }
      )
    }
    latitudeLoja = coordenadas.latitude
    longitudeLoja = coordenadas.longitude
  }

  const config = await prisma.configuracaoLoja.upsert({
    where: { id: 'config' },
    create: {
      id: 'config',
      nomeFantasia: body.nomeFantasia ?? '',
      telefone: body.telefone ?? '',
      enderecoLoja: body.enderecoLoja ?? '',
      latitudeLoja,
      longitudeLoja,
      pedidoMinimo: body.pedidoMinimo ?? 0,
      tempoEstimadoMin: body.tempoEstimadoMin ?? 45,
      aceitandoPedidos: body.aceitandoPedidos ?? true
    },
    update: {
      nomeFantasia: body.nomeFantasia,
      telefone: body.telefone,
      enderecoLoja: body.enderecoLoja,
      ...(latitudeLoja !== undefined ? { latitudeLoja, longitudeLoja } : {}),
      pedidoMinimo: body.pedidoMinimo,
      tempoEstimadoMin: body.tempoEstimadoMin,
      aceitandoPedidos: body.aceitandoPedidos
    }
  })

  return NextResponse.json(config)
}
