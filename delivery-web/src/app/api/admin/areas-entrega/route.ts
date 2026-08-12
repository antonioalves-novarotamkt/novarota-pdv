import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sessaoAdminValida } from '@/lib/auth'
import { cepParaNumero } from '@/lib/viacep'

export async function GET(): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  const areas = await prisma.areaEntrega.findMany({ orderBy: { taxa: 'asc' } })
  return NextResponse.json(areas)
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  const body = await request.json()

  if (!body.descricao?.trim() || !body.cepInicio || !body.cepFim) {
    return NextResponse.json({ erro: 'Descricao e faixa de CEP sao obrigatorios.' }, { status: 400 })
  }

  const cepInicio = cepParaNumero(String(body.cepInicio))
  const cepFim = cepParaNumero(String(body.cepFim))

  if (cepInicio > cepFim) {
    return NextResponse.json({ erro: 'O CEP inicial deve ser menor ou igual ao CEP final.' }, { status: 400 })
  }

  const area = await prisma.areaEntrega.create({
    data: {
      descricao: body.descricao.trim(),
      cepInicio,
      cepFim,
      taxa: body.taxa ?? 0,
      tempoEstimadoMin: body.tempoEstimadoMin ?? 45,
      ativo: body.ativo ?? true
    }
  })
  return NextResponse.json(area, { status: 201 })
}
