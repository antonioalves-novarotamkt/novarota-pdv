/** Gera um poligono GeoJSON aproximando um circulo geografico (sem depender de turf.js). */
export function circuloGeoJSON(
  centro: { lat: number; lng: number },
  raioKm: number,
  pontos = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coordenadas: [number, number][] = []
  const raioTerraKm = 6371

  for (let i = 0; i <= pontos; i++) {
    const angulo = (i * 360) / pontos
    const anguloRad = (angulo * Math.PI) / 180
    const latRad = (centro.lat * Math.PI) / 180

    const dLat = (raioKm / raioTerraKm) * Math.cos(anguloRad)
    const dLng = ((raioKm / raioTerraKm) * Math.sin(anguloRad)) / Math.cos(latRad)

    const lat = centro.lat + (dLat * 180) / Math.PI
    const lng = centro.lng + (dLng * 180) / Math.PI
    coordenadas.push([lng, lat])
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [coordenadas] }
  }
}
