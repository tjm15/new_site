import type { FeatureCollection, Geometry } from 'geojson'

export type GeoLayerSet = {
  outline: FeatureCollection<Geometry>
  constraints?: FeatureCollection<Geometry>
  allocations?: FeatureCollection<Geometry>
  centres?: FeatureCollection<Geometry>
}

const camden: GeoLayerSet = {
  outline: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Camden outline' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-0.175, 51.57],
              [-0.095, 51.57],
              [-0.095, 51.515],
              [-0.175, 51.515],
              [-0.175, 51.57]
            ]
          ]
        }
      }
    ]
  },
  constraints: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Flood zone' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-0.16, 51.56],
              [-0.13, 51.56],
              [-0.13, 51.545],
              [-0.16, 51.545],
              [-0.16, 51.56]
            ]
          ]
        }
      }
    ]
  },
  allocations: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: 'regis_road', name: 'Regis Road' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-0.15, 51.555],
              [-0.136, 51.555],
              [-0.136, 51.545],
              [-0.15, 51.545],
              [-0.15, 51.555]
            ]
          ]
        }
      },
      {
        type: 'Feature',
        properties: { id: 'murphy_yard', name: "Murphy's Yard" },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-0.14, 51.535],
              [-0.12, 51.535],
              [-0.12, 51.525],
              [-0.14, 51.525],
              [-0.14, 51.535]
            ]
          ]
        }
      },
      {
        type: 'Feature',
        properties: { id: 'o2_centre', name: 'O2 Centre' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-0.12, 51.555],
              [-0.105, 51.555],
              [-0.105, 51.545],
              [-0.12, 51.545],
              [-0.12, 51.555]
            ]
          ]
        }
      }
    ]
  },
  centres: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Kentish Town' }, geometry: { type: 'Point', coordinates: [-0.141, 51.553] } },
      { type: 'Feature', properties: { name: 'Camden Town' }, geometry: { type: 'Point', coordinates: [-0.143, 51.539] } },
      { type: 'Feature', properties: { name: 'Kings Cross' }, geometry: { type: 'Point', coordinates: [-0.123, 51.532] } }
    ]
  }
}

const cornwall: GeoLayerSet = {
  outline: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Cornwall outline' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-5.25, 50.5],
              [-4.5, 50.5],
              [-4.5, 50.15],
              [-5.25, 50.15],
              [-5.25, 50.5]
            ]
          ]
        }
      }
    ]
  },
  constraints: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Coastal flood' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-5.2, 50.32],
              [-4.9, 50.32],
              [-4.9, 50.26],
              [-5.2, 50.26],
              [-5.2, 50.32]
            ]
          ]
        }
      }
    ]
  },
  allocations: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: 'truro_threemilestone', name: 'Truro & Threemilestone' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-5.07, 50.28],
              [-4.98, 50.28],
              [-4.98, 50.24],
              [-5.07, 50.24],
              [-5.07, 50.28]
            ]
          ]
        }
      },
      {
        type: 'Feature',
        properties: { id: 'st_austell', name: 'St Austell Renewal' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-4.9, 50.36],
              [-4.82, 50.36],
              [-4.82, 50.33],
              [-4.9, 50.33],
              [-4.9, 50.36]
            ]
          ]
        }
      },
      {
        type: 'Feature',
        properties: { id: 'west_carclaze', name: 'West Carclaze Eco-community' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-4.92, 50.34],
              [-4.88, 50.34],
              [-4.88, 50.31],
              [-4.92, 50.31],
              [-4.92, 50.34]
            ]
          ]
        }
      },
      {
        type: 'Feature',
        properties: { id: 'par_docks', name: 'Par Docks' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-4.85, 50.35],
              [-4.83, 50.35],
              [-4.83, 50.33],
              [-4.85, 50.33],
              [-4.85, 50.35]
            ]
          ]
        }
      },
      {
        type: 'Feature',
        properties: { id: 'hayle_harbour', name: 'Hayle Harbour' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-5.42, 50.2],
              [-5.38, 50.2],
              [-5.38, 50.18],
              [-5.42, 50.18],
              [-5.42, 50.2]
            ]
          ]
        }
      }
    ]
  },
  centres: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Truro' }, geometry: { type: 'Point', coordinates: [-5.05, 50.26] } },
      { type: 'Feature', properties: { name: 'Penzance' }, geometry: { type: 'Point', coordinates: [-5.53, 50.12] } },
      { type: 'Feature', properties: { name: 'Newquay' }, geometry: { type: 'Point', coordinates: [-5.08, 50.41] } }
    ]
  }
}

const manchester: GeoLayerSet = {
  outline: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Manchester outline' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-2.32, 53.53],
              [-2.15, 53.53],
              [-2.15, 53.45],
              [-2.32, 53.45],
              [-2.32, 53.53]
            ]
          ]
        }
      }
    ]
  },
  constraints: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'River floodplain' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-2.28, 53.51],
              [-2.2, 53.51],
              [-2.2, 53.49],
              [-2.28, 53.49],
              [-2.28, 53.51]
            ]
          ]
        }
      }
    ]
  },
  allocations: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: 'eastlands', name: 'Eastlands / Sportcity' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-2.22, 53.49],
              [-2.18, 53.49],
              [-2.18, 53.47],
              [-2.22, 53.47],
              [-2.22, 53.49]
            ]
          ]
        }
      },
      {
        type: 'Feature',
        properties: { id: 'airport_city', name: 'Airport City & Enterprise Zone' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-2.31, 53.47],
              [-2.26, 53.47],
              [-2.26, 53.45],
              [-2.31, 53.45],
              [-2.31, 53.47]
            ]
          ]
        }
      },
      {
        type: 'Feature',
        properties: { id: 'city_centre_growth', name: 'City Centre Core' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-2.25, 53.5],
              [-2.2, 53.5],
              [-2.2, 53.48],
              [-2.25, 53.48],
              [-2.25, 53.5]
            ]
          ]
        }
      },
      {
        type: 'Feature',
        properties: { id: 'central_park', name: 'Central Park' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-2.24, 53.51],
              [-2.2, 53.51],
              [-2.2, 53.5],
              [-2.24, 53.5],
              [-2.24, 53.51]
            ]
          ]
        }
      },
      {
        type: 'Feature',
        properties: { id: 'northern_gateway', name: 'Northern Gateway' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-2.26, 53.53],
              [-2.21, 53.53],
              [-2.21, 53.51],
              [-2.26, 53.51],
              [-2.26, 53.53]
            ]
          ]
        }
      }
    ]
  },
  centres: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'City Centre' }, geometry: { type: 'Point', coordinates: [-2.24, 53.48] } },
      { type: 'Feature', properties: { name: 'Salford Quays' }, geometry: { type: 'Point', coordinates: [-2.29, 53.47] } },
      { type: 'Feature', properties: { name: 'Oxford Road Corridor' }, geometry: { type: 'Point', coordinates: [-2.24, 53.46] } }
    ]
  }
}

export function getGeoLayerSet(councilId: string): GeoLayerSet | null {
  switch (councilId) {
    case 'camden':
      return camden
    case 'cornwall':
      return cornwall
    case 'manchester':
      return manchester
    default:
      return null
  }
}
