import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sessaoAdminValida } from '@/lib/auth'

export async function GET(): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  const camadas = await prisma.areaEntrega.findMany({ orderBy: { raioKm: 'asc' } })
  return NextResponse.json(camadas)
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  const body = await request.json()

  if (!body.raioKm || body.raioKm <= 0) {
    return NextResponse.json({ erro: 'Informe um raio valido (km).' }, { status: 400 })
  }

  const camada = await prisma.areaEntrega.create({
    data: {
      raioKm: body.raioKm,
      taxa: body.taxa ?? 0,
      tempoEstimadoMin: body.tempoEstimadoMin ?? 45,
      ativo: body.ativo ?? true
    }
  })
  return NextResponse.json(camada, { status: 201 })
}
