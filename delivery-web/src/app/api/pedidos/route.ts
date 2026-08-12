import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geocodificarEndereco } from '@/lib/geocode'
import { calcularDistanciaKm, calcularTaxaEntrega, type FaixaTaxa } from '@/lib/distancia'
import type { CriarPedidoInput, CriarPedidoResponse } from '@/lib/types'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as CriarPedidoInput

  if (!body.clienteNome?.trim() || !body.clienteTelefone?.trim() || !body.enderecoEntrega?.trim()) {
    return NextResponse.json({ erro: 'Nome, telefone e endereco sao obrigatorios.' }, { status: 400 })
  }
  if (!body.itens?.length) {
    return NextResponse.json({ erro: 'O pedido precisa ter ao menos um item.' }, { status: 400 })
  }

  const config = await prisma.configuracaoLoja.findUnique({ where: { id: 'config' } })
  if (!config) {
    return NextResponse.json({ erro: 'Loja ainda nao configurada. Fale com o estabelecimento.' }, { status: 503 })
  }
  if (!config.aceitandoPedidos) {
    return NextResponse.json({ erro: 'A loja nao esta aceitando pedidos no momento.' }, { status: 503 })
  }
  if (!config.latitudeLoja || !config.longitudeLoja) {
    return NextResponse.json({ erro: 'Area de entrega ainda nao configurada pela loja.' }, { status: 503 })
  }

  // Preco e disponibilidade sempre recalculados a partir do banco - nunca confiar em valores vindos do cliente.
  const produtoIds = body.itens.map((i) => i.produtoId)
  const produtos = await prisma.produto.findMany({ where: { id: { in: produtoIds }, ativo: true } })
  const produtosPorId = new Map(produtos.map((p) => [p.id, p]))

  const itensValidados: Array<{ produtoId: string; nomeProduto: string; quantidade: number; precoUnitario: number }> = []
  for (const item of body.itens) {
    const produto = produtosPorId.get(item.produtoId)
    if (!produto || item.quantidade < 1) {
      return NextResponse.json({ erro: 'Um dos itens do pedido nao esta mais disponivel.' }, { status: 422 })
    }
    itensValidados.push({
      produtoId: produto.id,
      nomeProduto: produto.nome,
      quantidade: item.quantidade,
      precoUnitario: produto.preco
    })
  }

  // Endereco e taxa tambem recalculados no servidor, ignorando qualquer valor de frete enviado pelo cliente.
  const coordenadasCliente = await geocodificarEndereco(body.enderecoEntrega)
  if (!coordenadasCliente) {
    return NextResponse.json({ erro: 'Nao conseguimos localizar o endereco informado.' }, { status: 422 })
  }

  const distanciaKm = calcularDistanciaKm(
    { latitude: config.latitudeLoja, longitude: config.longitudeLoja },
    coordenadasCliente
  )
  const faixas = config.faixasTaxa as unknown as FaixaTaxa[]
  const frete = calcularTaxaEntrega(distanciaKm, faixas, config.raioMaximoKm)

  if (!frete.dentroDaArea) {
    return NextResponse.json(
      { erro: `Esse endereco esta fora da area de entrega (raio de ${config.raioMaximoKm} km).` },
      { status: 422 }
    )
  }

  const totalProdutos = itensValidados.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0)
  const total = totalProdutos + frete.taxa

  if (body.formaPagamento === 'dinheiro' && body.trocoPara != null && body.trocoPara < total) {
    return NextResponse.json({ erro: 'O valor para troco deve ser maior ou igual ao total do pedido.' }, { status: 400 })
  }

  const pedido = await prisma.pedido.create({
    data: {
      clienteNome: body.clienteNome.trim(),
      clienteTelefone: body.clienteTelefone.trim(),
      enderecoEntrega: body.enderecoEntrega.trim(),
      latitude: coordenadasCliente.latitude,
      longitude: coordenadasCliente.longitude,
      distanciaKm: Number(distanciaKm.toFixed(2)),
      taxaEntrega: frete.taxa,
      totalProdutos,
      total,
      formaPagamento: body.formaPagamento,
      trocoPara: body.formaPagamento === 'dinheiro' ? body.trocoPara ?? null : null,
      observacoes: body.observacoes?.trim() || null,
      itens: { create: itensValidados }
    }
  })

  const resposta: CriarPedidoResponse = {
    id: pedido.id,
    total: pedido.total,
    taxaEntrega: pedido.taxaEntrega,
    tempoEstimadoMin: config.tempoEstimadoMin
  }
  return NextResponse.json(resposta, { status: 201 })
}
