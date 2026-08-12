import type { Coordenadas } from './geocode'

const RAIO_TERRA_KM = 6371

/**
 * Distancia em linha reta (haversine), nao e a distancia real de rota.
 * Suficiente para estimar taxa de entrega por raio; se precisar de distancia
 * de rota (mais precisa em cidades com rios/avenidas), trocar por uma API
 * de rotas (ex: Google Distance Matrix, OSRM).
 */
export function calcularDistanciaKm(origem: Coordenadas, destino: Coordenadas): number {
  const dLat = grausParaRad(destino.latitude - origem.latitude)
  const dLon = grausParaRad(destino.longitude - origem.longitude)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(grausParaRad(origem.latitude)) *
      Math.cos(grausParaRad(destino.latitude)) *
      Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return RAIO_TERRA_KM * c
}

function grausParaRad(graus: number): number {
  return (graus * Math.PI) / 180
}

export interface FaixaTaxa {
  ateKm: number
  taxa: number
}

export interface ResultadoFrete {
  dentroDaArea: boolean
  distanciaKm: number
  taxa: number
}

export function calcularTaxaEntrega(
  distanciaKm: number,
  faixas: FaixaTaxa[],
  raioMaximoKm: number
): ResultadoFrete {
  if (distanciaKm > raioMaximoKm) {
    return { dentroDaArea: false, distanciaKm, taxa: 0 }
  }

  const faixasOrdenadas = [...faixas].sort((a, b) => a.ateKm - b.ateKm)
  const faixa = faixasOrdenadas.find((f) => distanciaKm <= f.ateKm)
  const taxa = faixa ? faixa.taxa : faixasOrdenadas[faixasOrdenadas.length - 1]?.taxa ?? 0

  return { dentroDaArea: true, distanciaKm, taxa }
}
