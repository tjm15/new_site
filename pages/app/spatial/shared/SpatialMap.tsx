import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Allocation } from '../../../../data/types';
import { useMediaQuery } from '../../../../hooks/useMediaQuery';
import type { GeoLayerSet } from '../../../../data/geojsonLayers';
import { MapLibreFrame } from '../../../../components/MapLibreFrame';

interface SpatialMapProps {
  boroughOutline: string;
  constraints?: string[];
  centres?: string[];
  allocations?: Allocation[];
  selectedSite?: string | null;
  onSiteSelect?: (siteId: string) => void;
  showConstraints?: boolean;
  showCentres?: boolean;
  showAllocations?: boolean;
  geojsonLayers?: GeoLayerSet | null;
}

export const SpatialMap: React.FC<SpatialMapProps> = ({
  boroughOutline,
  constraints = [],
  centres = [],
  allocations = [],
  selectedSite = null,
  onSiteSelect,
  showConstraints = true,
  showCentres = true,
  showAllocations = true,
  geojsonLayers = null,
}) => {
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Prefer maplibre when geojson layers are available
  if (geojsonLayers) {
    return (
      <div className="relative">
        {isMobile && (
          <div className="mb-3 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">Sites & context</h3>
            {selectedSite && <span className="text-xs text-[var(--color-muted)]">Selected: {selectedSite}</span>}
          </div>
        )}
        <MapLibreFrame
          layers={geojsonLayers}
          height={isMobile ? 320 : 420}
          selectedAllocationId={selectedSite || undefined}
          onSelectAllocation={onSiteSelect}
        />
      </div>
    )
  }

  if (isMobile && viewMode === 'list') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">Sites</h3>
          <button
            onClick={() => setViewMode('map')}
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            View Map →
          </button>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {allocations.map((site) => (
            <motion.div
              key={site.id}
              whileHover={{ x: 4 }}
              onClick={() => onSiteSelect?.(site.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedSite === site.id
                  ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]'
                  : 'bg-[var(--color-panel)] border-[var(--color-edge)] hover:border-[var(--color-accent)]/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-[var(--color-ink)] mb-1">{site.name}</h4>
                  {site.description && (
                    <p className="text-sm text-[var(--color-muted)] mb-2">{site.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {site.area && (
                      <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]">
                        {site.area} ha
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]">
                      {site.capacity}
                    </span>
                  </div>
                </div>
                {selectedSite === site.id && (
                  <span className="text-[var(--color-accent)] text-xl">✓</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isMobile && (
        <button
          onClick={() => setViewMode('list')}
          className="absolute top-4 right-4 z-10 px-4 py-2 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg text-sm text-[var(--color-ink)] shadow-lg"
        >
          ← Back to List
        </button>
      )}
      <svg
        viewBox="0 0 800 600"
        className="w-full h-auto bg-[var(--color-surface)] rounded-xl border border-[var(--color-edge)]"
      >
        {/* Borough outline */}
        <path
          d={boroughOutline}
          fill="var(--panel)"
          stroke="var(--edge)"
          strokeWidth="2"
        />

        {/* Constraints layer (e.g., green belt, flood zones) */}
        {showConstraints && constraints.map((path, idx) => (
          <path
            key={`constraint-${idx}`}
            d={path}
            fill="rgba(239, 68, 68, 0.1)"
            stroke="rgba(239, 68, 68, 0.3)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {/* Town centres */}
        {showCentres && centres.map((path, idx) => (
          <path
            key={`centre-${idx}`}
            d={path}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="rgba(59, 130, 246, 0.6)"
            strokeWidth="2"
          />
        ))}

        {/* Site allocations */}
        {showAllocations && allocations.map((site) => (
          <g key={site.id}>
            <path
              d={site.path}
              fill={
                selectedSite === site.id
                  ? 'rgba(16, 185, 129, 0.4)'
                  : hoveredSite === site.id
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'rgba(16, 185, 129, 0.2)'
              }
              stroke={
                selectedSite === site.id
                  ? 'rgb(16, 185, 129)'
                  : 'rgba(16, 185, 129, 0.6)'
              }
              strokeWidth={selectedSite === site.id ? '3' : '2'}
              className="cursor-pointer transition-all"
              onClick={() => onSiteSelect?.(site.id)}
              onMouseEnter={() => setHoveredSite(site.id)}
              onMouseLeave={() => setHoveredSite(null)}
            />
            {(hoveredSite === site.id || selectedSite === site.id) && (
              <text
                x={site.labelX || site.center.x}
                y={site.labelY || site.center.y}
                fontSize="12"
                fill="var(--ink)"
                textAnchor="middle"
                className="pointer-events-none font-semibold"
                style={{ textShadow: '0 0 4px var(--panel), 0 0 4px var(--panel)' }}
              >
                {site.name}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg border border-[var(--color-edge)] shadow-lg p-3 text-xs">
        <div className="font-semibold text-[var(--color-ink)] mb-2">Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(76, 175, 80, 0.3)' }}></div>
            <span className="text-[var(--color-muted)]">Open Space</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}></div>
            <span className="text-[var(--color-muted)]">Allocation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[var(--color-accent)]"></div>
            <span className="text-[var(--color-muted)]">Selected Site</span>
          </div>
        </div>
      </div>
    </div>
  );
};
