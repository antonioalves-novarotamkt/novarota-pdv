import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sessaoAdminValida } from '@/lib/auth'

export async function GET(): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  const produtos = await prisma.produto.findMany({ orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] })
  return NextResponse.json(produtos)
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!sessaoAdminValida()) return NextResponse.json({ erro: 'Nao autorizado.' }, { status: 401 })
  const body = await request.json()

  if (!body.nome?.trim() || typeof body.preco !== 'number') {
    return NextResponse.json({ erro: 'Nome e preco sao obrigatorios.' }, { status: 400 })
  }

  const produto = await prisma.produto.create({
    data: {
      nome: body.nome.trim(),
      descricao: body.descricao?.trim() || null,
      preco: body.preco,
      categoria: body.categoria?.trim() || 'Cardapio',
      ativo: body.ativo ?? true,
      ordem: body.ordem ?? 0
    }
  })
  return NextResponse.json(produto, { status: 201 })
}
