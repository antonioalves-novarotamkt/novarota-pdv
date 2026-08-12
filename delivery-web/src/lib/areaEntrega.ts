import { prisma } from './prisma'
import { cepParaNumero } from './viacep'

export interface AreaEncontrada {
  id: string
  descricao: string
  taxa: number
  tempoEstimadoMin: number
}

export async function encontrarAreaPorCep(cep: string): Promise<AreaEncontrada | null> {
  const cepNumero = cepParaNumero(cep)

  const area = await prisma.areaEntrega.findFirst({
    where: {
      ativo: true,
      cepInicio: { lte: cepNumero },
      cepFim: { gte: cepNumero }
    },
    orderBy: { taxa: 'asc' }
  })

  if (!area) return null

  return {
    id: area.id,
    descricao: area.descricao,
    taxa: area.taxa,
    tempoEstimadoMin: area.tempoEstimadoMin
  }
}
