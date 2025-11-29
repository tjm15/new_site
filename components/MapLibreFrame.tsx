import { useEffect, useMemo, useRef } from 'react'
import maplibregl, { type LngLatBoundsLike, type Map } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { GeoLayerSet } from '../data/geojsonLayers'

// Use the external CSP-safe worker instead of the inline Blob worker to avoid missing
// helpers (e.g., __publicField) in the worker bundle when built via Vite/esbuild.
const workerUrl = new URL('maplibre-gl/dist/maplibre-gl-csp-worker.js', import.meta.url).toString()
if (typeof (maplibregl as any).setWorkerUrl === 'function') {
  ;(maplibregl as any).setWorkerUrl(workerUrl)
} else {
  ;(maplibregl as any).workerUrl = workerUrl
}

type MapLibreFrameProps = {
  layers: GeoLayerSet
  height?: number
  selectedAllocationId?: string | null
  onSelectAllocation?: (id: string) => void
}

export function MapLibreFrame({ layers, height = 360, selectedAllocationId, onSelectAllocation }: MapLibreFrameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const isLoadedRef = useRef(false)
  const allocationEventsBoundRef = useRef(false)

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
      // Keep the base style minimal so the map loads even if external tiles fail.
      style: {
        version: 8,
        name: 'Planning demo',
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {},
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#eef2f7' } },
        ]
      },
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      bounds,
      fitBoundsOptions: { padding: 20 }
    })

    const ensureLayers = () => {
      if (!map.isStyleLoaded()) return
      isLoadedRef.current = true

      // Base map (non-blocking; skip if it already exists)
      if (!map.getSource('osm')) {
        try {
          map.addSource('osm', {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          })
          map.addLayer({ id: 'osm-tiles', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 })
        } catch (e) {
          console.warn('OSM raster failed to load; continuing with plain background', e)
        }
      }

      const upsertGeoSource = (id: string, data?: any) => {
        if (!data) return
        const src = map.getSource(id) as any
        if (src?.setData) {
          src.setData(data)
        } else if (!src) {
          map.addSource(id, { type: 'geojson', data })
        }
      }

      upsertGeoSource('outline', layers.outline)
      upsertGeoSource('constraints', layers.constraints)
      upsertGeoSource('allocations', layers.allocations)
      upsertGeoSource('centres', layers.centres)

      if (layers.outline) {
        if (!map.getLayer('outline-fill')) map.addLayer({ id: 'outline-fill', type: 'fill', source: 'outline', paint: { 'fill-color': '#e2e8f0', 'fill-outline-color': '#475569', 'fill-opacity': 0.75 } })
        if (!map.getLayer('outline-line')) map.addLayer({ id: 'outline-line', type: 'line', source: 'outline', paint: { 'line-color': '#475569', 'line-width': 2 } })
      }

      if (layers.constraints) {
        if (!map.getLayer('constraints-fill')) {
          map.addLayer({
            id: 'constraints-fill',
            type: 'fill',
            source: 'constraints',
            paint: {
              'fill-color': '#ef4444',
              'fill-opacity': 0.22,
              'fill-outline-color': '#ef4444'
            }
          })
        }
      }

      if (layers.allocations) {
        if (!map.getLayer('allocations-fill')) map.addLayer({ id: 'allocations-fill', type: 'fill', source: 'allocations', paint: { 'fill-color': '#22c55e', 'fill-opacity': 0.35 } })
        if (!map.getLayer('allocations-outline')) map.addLayer({ id: 'allocations-outline', type: 'line', source: 'allocations', paint: { 'line-color': '#15803d', 'line-width': 2 } })

        if (onSelectAllocation && !allocationEventsBoundRef.current && map.getLayer('allocations-fill')) {
          map.on('click', 'allocations-fill', (e) => {
            const feature = e.features?.[0]
            const id = feature?.properties?.id as string | undefined
            if (id) onSelectAllocation(id)
          })
          map.on('mouseenter', 'allocations-fill', () => { map.getCanvas().style.cursor = 'pointer' })
          map.on('mouseleave', 'allocations-fill', () => { map.getCanvas().style.cursor = '' })
          allocationEventsBoundRef.current = true
        }
      }

      if (layers.centres) {
        if (!map.getLayer('centres-circle')) map.addLayer({ id: 'centres-circle', type: 'circle', source: 'centres', paint: { 'circle-color': '#2563eb', 'circle-radius': 7, 'circle-opacity': 0.9, 'circle-stroke-color': '#1d4ed8', 'circle-stroke-width': 1 } })
        if (!map.getLayer('centres-label')) map.addLayer({ id: 'centres-label', type: 'symbol', source: 'centres', layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-offset': [0, 1.2], 'text-anchor': 'top' }, paint: { 'text-color': '#0f172a', 'text-halo-color': '#e2e8f0', 'text-halo-width': 1 } })
      }
    }

    mapRef.current = map

    const handleLoad = () => {
      ensureLayers()
      // Expose for quick console debugging in devtools
      if (import.meta.env.DEV) {
        (window as any).__planningMap = map
      }
    }

    map.on('load', handleLoad)
    map.on('styledata', ensureLayers)
    map.on('error', (e) => console.warn('MapLibre error', e?.error || e))

    return () => {
      map.remove()
      mapRef.current = null
      isLoadedRef.current = false
      allocationEventsBoundRef.current = false
    }
  }, [bounds, layers, onSelectAllocation])

  // Re-fit when the outline bounds change (e.g., switching council)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !bounds) return
    const fit = () => map.fitBounds(bounds, { padding: 20, duration: 0 })
    if (map.isStyleLoaded() || isLoadedRef.current) {
      fit()
    } else {
      map.once('load', fit)
    }
  }, [bounds])

  // Highlight the active allocation when it changes
  useEffect(() => {
    const map = mapRef.current
    const updateHighlight = () => {
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
    }
    if (map) {
      if (map.isStyleLoaded() || isLoadedRef.current) {
        updateHighlight()
      } else {
        map.once('load', updateHighlight)
      }
    }
  }, [selectedAllocationId])

  // Update data sources if layers prop changes
  useEffect(() => {
    const map = mapRef.current
    const applyData = () => {
      if (!map) return
      if (layers.outline && map.getSource('outline')) (map.getSource('outline') as any).setData(layers.outline)
      if (layers.constraints && map.getSource('constraints')) (map.getSource('constraints') as any).setData(layers.constraints)
      if (layers.allocations && map.getSource('allocations')) (map.getSource('allocations') as any).setData(layers.allocations)
      if (layers.centres && map.getSource('centres')) (map.getSource('centres') as any).setData(layers.centres)
    }
    if (map) {
      if (map.isStyleLoaded() || isLoadedRef.current) {
        applyData()
      } else {
        map.once('load', applyData)
      }
    }
  }, [layers])

  return <div ref={containerRef} className="w-full rounded-xl overflow-hidden border border-[var(--color-edge)]" style={{ height }} />
}
