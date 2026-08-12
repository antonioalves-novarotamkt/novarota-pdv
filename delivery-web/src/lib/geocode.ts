export interface Coordenadas {
  latitude: number
  longitude: number
}

/**
 * Geocodifica um endereco em texto livre usando o Nominatim (OpenStreetMap),
 * um servico gratuito. Respeita a politica de uso deles com um User-Agent
 * proprio. Para volumes maiores ou maior precisao (distancia real de rota,
 * nao linha reta), considere trocar por Google Geocoding/Distance Matrix.
 */
export async function geocodificarEndereco(endereco: string): Promise<Coordenadas | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', endereco)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'br')

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'NovaRotaDelivery/1.0 (contato via painel administrativo)'
    }
  })

  if (!response.ok) return null

  const resultados = (await response.json()) as Array<{ lat: string; lon: string }>
  if (!resultados.length) return null

  return {
    latitude: Number(resultados[0].lat),
    longitude: Number(resultados[0].lon)
  }
}
