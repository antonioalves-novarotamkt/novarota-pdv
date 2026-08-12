import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { CardapioResponse } from '@/lib/types'

// O cardapio muda (produtos/status da loja), nao pode ser pre-renderizado estaticamente no build.
export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse<CardapioResponse>> {
  const [produtos, config] = await Promise.all([
    prisma.produto.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }]
    }),
    prisma.configuracaoLoja.findUnique({ where: { id: 'config' } })
  ])

  return NextResponse.json({
    loja: {
      nomeFantasia: config?.nomeFantasia || 'Nosso delivery',
      tempoEstimadoMin: config?.tempoEstimadoMin ?? 45,
      aceitandoPedidos: config?.aceitandoPedidos ?? true
    },
    produtos: produtos.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      preco: p.preco,
      categoria: p.categoria
    }))
  })
}
