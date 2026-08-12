'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { circuloGeoJSON } from '@/lib/geoCircle'

interface CamadaRaio {
  raioKm: number
  cor: string
}

interface MapaRaioProps {
  centro: { lat: number; lng: number } | null
  camadas: CamadaRaio[]
  altura?: number
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export default function MapaRaio({ centro, camadas, altura = 360 }: MapaRaioProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return
    mapboxgl.accessToken = TOKEN

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: centro ? [centro.lng, centro.lat] : [-46.6333, -23.5505],
      zoom: centro ? 12 : 10
    })
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !TOKEN) return

    function desenhar(): void {
      if (!map) return

      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      camadas.forEach((_, index) => {
        const idAtual = `raio-${index}`
        if (map.getLayer(idAtual)) map.removeLayer(idAtual)
        if (map.getLayer(`${idAtual}-linha`)) map.removeLayer(`${idAtual}-linha`)
        if (map.getSource(idAtual)) map.removeSource(idAtual)
      })

      if (!centro) return

      map.setCenter([centro.lng, centro.lat])

      // Do maior para o menor, para o menor ficar por cima (efeito de camadas concentricas).
      const ordenadas = [...camadas].sort((a, b) => b.raioKm - a.raioKm)
      ordenadas.forEach((camada, index) => {
        const idAtual = `raio-${index}`
        map.addSource(idAtual, { type: 'geojson', data: circuloGeoJSON(centro, camada.raioKm) })
        map.addLayer({
          id: idAtual,
          type: 'fill',
          source: idAtual,
          paint: { 'fill-color': camada.cor, 'fill-opacity': 0.18 }
        })
        map.addLayer({
          id: `${idAtual}-linha`,
          type: 'line',
          source: idAtual,
          paint: { 'line-color': camada.cor, 'line-width': 1.5 }
        })
      })

      markerRef.current = new mapboxgl.Marker({ color: '#1f63d6' })
        .setLngLat([centro.lng, centro.lat])
        .addTo(map)
    }

    if (map.isStyleLoaded()) desenhar()
    else map.once('load', desenhar)
  }, [centro, camadas])

  if (!TOKEN) {
    return (
      <div
        style={{ height: altura }}
        className="flex items-center justify-center rounded-lg border border-dashed bg-slate-50 px-4 text-center text-sm text-slate-500"
      >
        Configure a variavel <code className="mx-1 rounded bg-slate-200 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> para
        ver o mapa aqui.
      </div>
    )
  }

  if (!centro) {
    return (
      <div
        style={{ height: altura }}
        className="flex items-center justify-center rounded-lg border border-dashed bg-slate-50 px-4 text-center text-sm text-slate-500"
      >
        Cadastre o endereco da loja em Configuracoes para ver o mapa.
      </div>
    )
  }

  return <div ref={containerRef} style={{ height: altura }} className="overflow-hidden rounded-lg border" />
}
