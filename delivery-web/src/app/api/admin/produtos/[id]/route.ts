import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sessaoAdminValida } from '@/lib/auth'

interface Params {
  params: { id: string }
}

export async function PATCH(request: Request, { params }: Params): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  const body = await request.json()

  const produto = await prisma.produto.update({
    where: { id: params.id },
    data: {
      nome: body.nome,
      descricao: body.descricao,
      preco: body.preco,
      categoria: body.categoria,
      ativo: body.ativo,
      ordem: body.ordem
    }
  })
  return NextResponse.json(produto)
}

export async function DELETE(_request: Request, { params }: Params): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  await prisma.produto.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
