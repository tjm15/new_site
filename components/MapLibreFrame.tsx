import { useEffect, useMemo, useRef } from 'react'
import maplibregl, { type LngLatBoundsLike, type Map } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { GeoLayerSet } from '../data/geojsonLayers'

type MapLibreFrameProps = {
  layers: GeoLayerSet
  height?: number
  selectedAllocationId?: string | null
  onSelectAllocation?: (id: string) => void
}

export function MapLibreFrame({ layers, height = 360, selectedAllocationId, onSelectAllocation }: MapLibreFrameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)

  const bounds: LngLatBoundsLike | undefined = useMemo(() => {
    if (!layers.outline?.features?.length) return undefined
    const coords: number[][] = []
    layers.outline.features.forEach(f => {
      const geom: any = f.geometry
      if (geom?.coordinates) {
        const pushCoords = (arr: any) => {
          if (typeof arr[0] === 'number' && typeof arr[1] === 'number') {
            coords.push(arr as number[])
            return
          }
          if (Array.isArray(arr)) arr.forEach(pushCoords)
        }
        pushCoords(geom.coordinates)
      }
    })
    const lngs = coords.map(c => c[0])
    const lats = coords.map(c => c[1])
    if (!lngs.length || !lats.length) return undefined
    const minX = Math.min(...lngs)
    const maxX = Math.max(...lngs)
    const minY = Math.min(...lats)
    const maxY = Math.max(...lats)
    return [
      [minX, minY],
      [maxX, maxY]
    ]
  }, [layers.outline])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        name: 'Planning demo',
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          },
          'outline': { type: 'geojson', data: layers.outline },
          ...(layers.constraints ? { 'constraints': { type: 'geojson', data: layers.constraints } } : {}),
          ...(layers.allocations ? { 'allocations': { type: 'geojson', data: layers.allocations } } : {}),
          ...(layers.centres ? { 'centres': { type: 'geojson', data: layers.centres } } : {})
        },
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#eef2f7' } },
          { id: 'osm-tiles', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 },
          { id: 'outline-fill', type: 'fill', source: 'outline', paint: { 'fill-color': '#f8fafc', 'fill-outline-color': '#94a3b8', 'fill-opacity': 0.65 } },
          ...(layers.constraints ? [{
            id: 'constraints-fill',
            type: 'fill',
            source: 'constraints',
            paint: {
              'fill-color': '#ef4444',
              'fill-opacity': 0.16,
              'fill-outline-color': '#ef4444'
            }
          } as const] : []),
          ...(layers.allocations ? [
            { id: 'allocations-fill', type: 'fill', source: 'allocations', paint: { 'fill-color': '#10b981', 'fill-opacity': 0.25 } },
            { id: 'allocations-outline', type: 'line', source: 'allocations', paint: { 'line-color': '#0f766e', 'line-width': 2 } }
          ] : []),
          ...(layers.centres ? [
            { id: 'centres-circle', type: 'circle', source: 'centres', paint: { 'circle-color': '#2563eb', 'circle-radius': 6, 'circle-opacity': 0.85 } },
            { id: 'centres-label', type: 'symbol', source: 'centres', layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-offset': [0, 1.2] }, paint: { 'text-color': '#1f2937' } }
          ] : [])
        ]
      },
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    })

    mapRef.current = map
    if (bounds) {
      map.fitBounds(bounds, { padding: 20, duration: 0 })
    }

    if (layers.allocations && onSelectAllocation) {
      map.on('click', 'allocations-fill', (e) => {
        const feature = e.features?.[0]
        const id = feature?.properties?.id as string | undefined
        if (id) onSelectAllocation(id)
      })
      map.on('mouseenter', 'allocations-fill', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'allocations-fill', () => { map.getCanvas().style.cursor = '' })
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [bounds, layers, onSelectAllocation])

  // Highlight the active allocation when it changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getLayer('allocations-fill')) return
    map.setPaintProperty('allocations-fill', 'fill-opacity', [
      'case',
      ['==', ['get', 'id'], selectedAllocationId || ''],
      0.5,
      0.25
    ])
    if (map.getLayer('allocations-outline')) {
      map.setPaintProperty('allocations-outline', 'line-width', [
        'case',
        ['==', ['get', 'id'], selectedAllocationId || ''],
        3,
        2
      ])
    }
  }, [selectedAllocationId])

  return <div ref={containerRef} className="w-full rounded-xl overflow-hidden border border-[var(--color-edge)]" style={{ height }} />
}
