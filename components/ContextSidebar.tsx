import React from 'react';
import type { CouncilData } from '../data/types';
import { Chip } from '../pages/app/shared/Chip';
import { usePlan } from '../contexts/PlanContext';
import { Link } from 'react-router-dom';

interface ContextSidebarProps {
  councilData: CouncilData;
  selectedTopics?: string[];
  onToggleTopic?: (id: string) => void;
  onBackToTools?: () => void;
}

export function ContextSidebar({ councilData, selectedTopics = [], onToggleTopic, onBackToTools }: ContextSidebarProps) {
  const { activePlan } = usePlan();
  const boroughAsset = `/assets/boroughs/${councilData.id}.svg`;
  const hasAllocations = councilData.spatialData?.allocations?.length > 0;
  const humanizeId = (id: string) => id
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-4">
      <div>
        <h3 className="text-[var(--color-ink)] text-lg font-semibold">{councilData.planContext.title}</h3>
        <p className="text-sm text-[var(--color-muted)]">{councilData.planContext.authority}</p>
        <p className="text-sm text-[var(--color-muted)] mt-2">{councilData.planContext.summary}</p>
      </div>

      <div className="border-t border-[var(--color-edge)]/50 pt-3">
        <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Policy Topics</div>
        <div className="flex flex-wrap gap-2">
          {councilData.topics.slice(0, 6).map((t) => (
            <Chip key={t.id} label={t.label} active={selectedTopics.includes(t.id)} onClick={() => onToggleTopic?.(t.id)} />
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--color-edge)]/50 pt-3 space-y-2">
        <div className="text-sm font-semibold text-[var(--color-ink)]">Spatial Context</div>
        <img src={boroughAsset} alt={`${councilData.name} borough`} className="w-full h-auto rounded border border-[var(--color-edge)]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        {hasAllocations && (
          <div>
            <div className="text-xs text-[var(--color-muted)] mb-1">Available sites</div>
            <ul className="max-h-28 overflow-y-auto text-sm text-[var(--color-muted)] list-disc pl-5">
              {councilData.spatialData.allocations.slice(0, 10).map((s) => (
                <li key={s.id}>{s.name || humanizeId(s.id)}</li>
              ))}
            </ul>
          </div>
        )}
        {activePlan?.systemType === 'new' && activePlan?.councilId === councilData.id && (
          <div className="mt-3">
            <Link to="/app/gateway1" className="text-sm text-[var(--color-accent)] hover:underline">Gateway 1 →</Link>
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-edge)]/50 pt-3 flex items-center justify-between">
        <button onClick={onBackToTools} className="text-sm text-[var(--color-accent)] hover:underline">← Back to Tools</button>
        <button className="text-sm text-[var(--color-muted)] hover:underline">Switch Plan</button>
      </div>
    </div>
  );
}
