import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validarTokenSync } from '@/lib/auth'

interface ProdutoRecebido {
  pdvId: number
  nome: string
  descricao?: string | null
  preco: number
  categoria: string
  ativo: boolean
}

/**
 * Recebe o catalogo enviado pelo PDV desktop (produtos marcados com "Delivery Online" ativo).
 * O PDV e a fonte da verdade: cada produto e identificado pelo pdvId e faz upsert aqui. Produtos
 * cadastrados manualmente pelo admin do delivery (sem pdvId) nao sao tocados por esta rota.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!validarTokenSync(request)) {
    return NextResponse.json({ erro: 'Token invalido.' }, { status: 401 })
  }

  const body = (await request.json()) as { produtos?: ProdutoRecebido[] }
  const produtos = body.produtos ?? []

  let sincronizados = 0
  for (const produto of produtos) {
    if (!produto.pdvId || !produto.nome?.trim()) continue

    await prisma.produto.upsert({
      where: { pdvId: produto.pdvId },
      create: {
        pdvId: produto.pdvId,
        nome: produto.nome.trim(),
        descricao: produto.descricao?.trim() || null,
        preco: produto.preco,
        categoria: produto.categoria?.trim() || 'Cardapio',
        ativo: produto.ativo
      },
      update: {
        nome: produto.nome.trim(),
        descricao: produto.descricao?.trim() || null,
        preco: produto.preco,
        categoria: produto.categoria?.trim() || 'Cardapio',
        ativo: produto.ativo
      }
    })
    sincronizados++
  }

  return NextResponse.json({ ok: true, sincronizados })
}
