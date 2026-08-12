import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buscarEnderecoPorCep } from '@/lib/viacep'
import { geocodificarEndereco, calcularDistanciaKm } from '@/lib/mapbox'
import { encontrarCamadaPorDistancia } from '@/lib/areaEntrega'
import type { CriarPedidoInput, CriarPedidoResponse } from '@/lib/types'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as CriarPedidoInput

  if (!body.clienteNome?.trim() || !body.clienteTelefone?.trim()) {
    return NextResponse.json({ erro: 'Nome e telefone sao obrigatorios.' }, { status: 400 })
  }
  if (!body.endereco?.cep || (!body.endereco.numero?.trim() && !body.endereco.semNumero)) {
    return NextResponse.json({ erro: 'Endereco incompleto.' }, { status: 400 })
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

  // Endereco, distancia e taxa sempre recalculados no servidor a partir do CEP + geocoding,
  // ignorando qualquer valor de frete enviado pelo cliente.
  const enderecoCep = await buscarEnderecoPorCep(body.endereco.cep)
  if (!enderecoCep) {
    return NextResponse.json({ erro: 'CEP informado nao foi encontrado.' }, { status: 422 })
  }

  const numero = body.endereco.semNumero ? '' : body.endereco.numero
  const enderecoCompleto = [enderecoCep.rua, numero, enderecoCep.bairro, enderecoCep.cidade, enderecoCep.uf]
    .filter(Boolean)
    .join(', ')
  const coordenadas = await geocodificarEndereco(enderecoCompleto)
  if (!coordenadas) {
    return NextResponse.json({ erro: 'Nao conseguimos localizar o endereco informado no mapa.' }, { status: 422 })
  }

  const distanciaKm = calcularDistanciaKm(
    { latitude: config.latitudeLoja, longitude: config.longitudeLoja },
    coordenadas
  )
  const camada = await encontrarCamadaPorDistancia(distanciaKm)
  if (!camada) {
    return NextResponse.json({ erro: 'Esse endereco esta fora da nossa area de entrega.' }, { status: 422 })
  }

  // Preco e disponibilidade tambem sempre recalculados a partir do banco.
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

  const totalProdutos = itensValidados.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0)

  if (totalProdutos < config.pedidoMinimo) {
    return NextResponse.json(
      { erro: `O pedido minimo e de R$ ${config.pedidoMinimo.toFixed(2)}.` },
      { status: 422 }
    )
  }

  const total = totalProdutos + camada.taxa

  if (body.formaPagamento === 'dinheiro' && body.trocoPara != null && body.trocoPara < total) {
    return NextResponse.json({ erro: 'O valor para troco deve ser maior ou igual ao total do pedido.' }, { status: 400 })
  }

  const pedido = await prisma.pedido.create({
    data: {
      clienteNome: body.clienteNome.trim(),
      clienteTelefone: body.clienteTelefone.trim(),
      cep: enderecoCep.cep,
      rua: enderecoCep.rua,
      numero: body.endereco.semNumero ? 'S/N' : body.endereco.numero.trim(),
      semNumero: body.endereco.semNumero,
      complemento: body.endereco.complemento?.trim() || null,
      bairro: enderecoCep.bairro,
      cidade: enderecoCep.cidade,
      uf: enderecoCep.uf,
      pontoReferencia: body.endereco.pontoReferencia?.trim() || null,
      latitude: coordenadas.latitude,
      longitude: coordenadas.longitude,
      distanciaKm: Number(distanciaKm.toFixed(2)),
      taxaEntrega: camada.taxa,
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
    tempoEstimadoMin: camada.tempoEstimadoMin
  }
  return NextResponse.json(resposta, { status: 201 })
}
