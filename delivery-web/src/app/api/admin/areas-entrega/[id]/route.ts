import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sessaoAdminValida } from '@/lib/auth'
import { cepParaNumero } from '@/lib/viacep'

interface Params {
  params: { id: string }
}

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  const body = await request.json()

  const area = await prisma.areaEntrega.update({
    where: { id: params.id },
    data: {
      descricao: body.descricao,
      cepInicio: body.cepInicio !== undefined ? cepParaNumero(String(body.cepInicio)) : undefined,
      cepFim: body.cepFim !== undefined ? cepParaNumero(String(body.cepFim)) : undefined,
      taxa: body.taxa,
      tempoEstimadoMin: body.tempoEstimadoMin,
      ativo: body.ativo
    }
  })
  return NextResponse.json(area)
}

export async function DELETE(_request: Request, { params }: Params): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  await prisma.areaEntrega.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
