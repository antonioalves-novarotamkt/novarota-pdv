export interface Coordenadas {
  latitude: number
  longitude: number
}

function token(): string {
  const valor = process.env.MAPBOX_TOKEN
  if (!valor) throw new Error('MAPBOX_TOKEN nao configurado.')
  return valor
}

/**
 * Geocodifica um endereco em texto (idealmente ja resolvido a partir do CEP + numero, mais
 * preciso do que texto livre) usando a Mapbox Geocoding API. Mesmo provedor usado para o mapa
 * no admin e no checkout, entao um unico token cobre tudo.
 */
export async function geocodificarEndereco(endereco: string): Promise<Coordenadas | null> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(endereco)}.json`
  )
  url.searchParams.set('access_token', token())
  url.searchParams.set('country', 'br')
  url.searchParams.set('limit', '1')

  const response = await fetch(url)
  if (!response.ok) return null

  const dados = (await response.json()) as { features?: Array<{ center: [number, number] }> }
  const feature = dados.features?.[0]
  if (!feature) return null

  const [longitude, latitude] = feature.center
  return { latitude, longitude }
}

const RAIO_TERRA_KM = 6371

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
