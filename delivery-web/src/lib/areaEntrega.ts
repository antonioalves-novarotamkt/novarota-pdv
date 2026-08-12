import { prisma } from './prisma'

export interface CamadaEncontrada {
  id: string
  raioKm: number
  taxa: number
  tempoEstimadoMin: number
}

/** Encontra a menor camada de raio (km) cadastrada que cobre a distancia informada. */
export async function encontrarCamadaPorDistancia(distanciaKm: number): Promise<CamadaEncontrada | null> {
  const camada = await prisma.areaEntrega.findFirst({
    where: {
      ativo: true,
      raioKm: { gte: distanciaKm }
    },
    orderBy: { raioKm: 'asc' }
  })

  if (!camada) return null

  return {
    id: camada.id,
    raioKm: camada.raioKm,
    taxa: camada.taxa,
    tempoEstimadoMin: camada.tempoEstimadoMin
  }
}
