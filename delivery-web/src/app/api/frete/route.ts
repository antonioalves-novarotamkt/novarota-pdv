import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geocodificarEndereco } from '@/lib/geocode'
import { calcularDistanciaKm, calcularTaxaEntrega, type FaixaTaxa } from '@/lib/distancia'
import type { FreteResponse } from '@/lib/types'

export async function POST(request: Request): Promise<NextResponse<FreteResponse>> {
  const body = (await request.json()) as { endereco?: string }
  const endereco = body.endereco?.trim()

  if (!endereco || endereco.length < 8) {
    return NextResponse.json({ dentroDaArea: false, mensagem: 'Informe um endereco completo.' }, { status: 400 })
  }

  const config = await prisma.configuracaoLoja.findUnique({ where: { id: 'config' } })
  if (!config?.latitudeLoja || !config?.longitudeLoja) {
    return NextResponse.json(
      { dentroDaArea: false, mensagem: 'Area de entrega ainda nao configurada pela loja.' },
      { status: 503 }
    )
  }

  const coordenadasCliente = await geocodificarEndereco(endereco)
  if (!coordenadasCliente) {
    return NextResponse.json(
      { dentroDaArea: false, mensagem: 'Nao conseguimos localizar esse endereco. Confira e tente novamente.' },
      { status: 422 }
    )
  }

  const distanciaKm = calcularDistanciaKm(
    { latitude: config.latitudeLoja, longitude: config.longitudeLoja },
    coordenadasCliente
  )

  const faixas = config.faixasTaxa as unknown as FaixaTaxa[]
  const resultado = calcularTaxaEntrega(distanciaKm, faixas, config.raioMaximoKm)

  if (!resultado.dentroDaArea) {
    return NextResponse.json({
      dentroDaArea: false,
      distanciaKm: Number(resultado.distanciaKm.toFixed(1)),
      mensagem: `Esse endereco esta fora da nossa area de entrega (raio de ${config.raioMaximoKm} km).`
    })
  }

  return NextResponse.json({
    dentroDaArea: true,
    distanciaKm: Number(resultado.distanciaKm.toFixed(1)),
    taxa: resultado.taxa
  })
}
