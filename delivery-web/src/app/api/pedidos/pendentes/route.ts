import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validarTokenSync } from '@/lib/auth'

export async function GET(request: Request): Promise<NextResponse> {
  if (!validarTokenSync(request)) {
    return NextResponse.json({ erro: 'Token invalido.' }, { status: 401 })
  }

  const pedidos = await prisma.pedido.findMany({
    where: { sincronizadoPdv: false, status: { not: 'cancelado' } },
    orderBy: { criadoEm: 'asc' },
    include: { itens: true }
  })

  return NextResponse.json(pedidos)
}
