import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geocodificarEndereco, calcularDistanciaKm } from '@/lib/mapbox'
import { encontrarCamadaPorDistancia } from '@/lib/areaEntrega'
import type { FreteResponse } from '@/lib/types'

interface FreteRequestBody {
  rua: string
  numero: string
  semNumero: boolean
  complemento?: string
  bairro: string
  cidade: string
  uf: string
}

function montarEnderecoParaGeocode(body: FreteRequestBody): string {
  const numero = body.semNumero ? '' : body.numero
  return [body.rua, numero, body.bairro, body.cidade, body.uf].filter(Boolean).join(', ')
}

export async function POST(request: Request): Promise<NextResponse<FreteResponse>> {
  const body = (await request.json()) as FreteRequestBody

  if (!body.rua?.trim() || !body.bairro?.trim() || (!body.numero?.trim() && !body.semNumero)) {
    return NextResponse.json({ dentroDaArea: false, mensagem: 'Endereco incompleto.' }, { status: 400 })
  }

  const config = await prisma.configuracaoLoja.findUnique({ where: { id: 'config' } })
  if (!config?.aceitandoPedidos) {
    return NextResponse.json(
      { dentroDaArea: false, mensagem: 'A loja nao esta aceitando pedidos no momento.' },
      { status: 503 }
    )
  }
  if (!config.latitudeLoja || !config.longitudeLoja) {
    return NextResponse.json(
      { dentroDaArea: false, mensagem: 'Area de entrega ainda nao configurada pela loja.' },
      { status: 503 }
    )
  }

  let coordenadas
  try {
    coordenadas = await geocodificarEndereco(montarEnderecoParaGeocode(body))
  } catch (error) {
    return NextResponse.json({ dentroDaArea: false, mensagem: (error as Error).message }, { status: 500 })
  }

  if (!coordenadas) {
    return NextResponse.json(
      { dentroDaArea: false, mensagem: 'Nao conseguimos localizar esse endereco no mapa. Confira e tente novamente.' },
      { status: 422 }
    )
  }

  const distanciaKm = calcularDistanciaKm(
    { latitude: config.latitudeLoja, longitude: config.longitudeLoja },
    coordenadas
  )

  const camada = await encontrarCamadaPorDistancia(distanciaKm)
  if (!camada) {
    return NextResponse.json({
      dentroDaArea: false,
      latitude: coordenadas.latitude,
      longitude: coordenadas.longitude,
      distanciaKm: Number(distanciaKm.toFixed(2)),
      mensagem: 'Esse endereco esta fora da nossa area de entrega.'
    })
  }

  return NextResponse.json({
    dentroDaArea: true,
    latitude: coordenadas.latitude,
    longitude: coordenadas.longitude,
    distanciaKm: Number(distanciaKm.toFixed(2)),
    taxa: camada.taxa,
    tempoEstimadoMin: camada.tempoEstimadoMin
  })
}
