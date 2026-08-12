import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buscarEnderecoPorCep } from '@/lib/viacep'
import { encontrarAreaPorCep } from '@/lib/areaEntrega'
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

  // Endereco e taxa sempre recalculados no servidor a partir do CEP, ignorando qualquer valor
  // de frete enviado pelo cliente.
  const enderecoCep = await buscarEnderecoPorCep(body.endereco.cep)
  if (!enderecoCep) {
    return NextResponse.json({ erro: 'CEP informado nao foi encontrado.' }, { status: 422 })
  }

  const area = await encontrarAreaPorCep(body.endereco.cep)
  if (!area) {
    return NextResponse.json({ erro: 'Esse CEP esta fora da nossa area de entrega.' }, { status: 422 })
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

  const total = totalProdutos + area.taxa

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
      areaEntregaDescricao: area.descricao,
      taxaEntrega: area.taxa,
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
    tempoEstimadoMin: area.tempoEstimadoMin
  }
  return NextResponse.json(resposta, { status: 201 })
}
