import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sessaoAdminValida } from '@/lib/auth'

export async function GET(): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  const config = await prisma.configuracaoLoja.findUnique({ where: { id: 'config' } })
  return NextResponse.json(config)
}

export async function PUT(request: Request): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  const body = await request.json()

  const config = await prisma.configuracaoLoja.upsert({
    where: { id: 'config' },
    create: {
      id: 'config',
      nomeFantasia: body.nomeFantasia ?? '',
      telefone: body.telefone ?? '',
      enderecoLoja: body.enderecoLoja ?? '',
      pedidoMinimo: body.pedidoMinimo ?? 0,
      tempoEstimadoMin: body.tempoEstimadoMin ?? 45,
      aceitandoPedidos: body.aceitandoPedidos ?? true
    },
    update: {
      nomeFantasia: body.nomeFantasia,
      telefone: body.telefone,
      enderecoLoja: body.enderecoLoja,
      pedidoMinimo: body.pedidoMinimo,
      tempoEstimadoMin: body.tempoEstimadoMin,
      aceitandoPedidos: body.aceitandoPedidos
    }
  })

  return NextResponse.json(config)
}
