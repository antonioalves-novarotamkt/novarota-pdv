import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validarTokenSync } from '@/lib/auth'

interface Params {
  params: { id: string }
}

export async function POST(request: Request, { params }: Params): Promise<NextResponse> {
  if (!validarTokenSync(request)) {
    return NextResponse.json({ erro: 'Token invalido.' }, { status: 401 })
  }

  const pedido = await prisma.pedido.update({
    where: { id: params.id },
    data: { sincronizadoPdv: true, status: 'preparo' }
  })

  return NextResponse.json(pedido)
}
