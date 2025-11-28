import React from 'react';
import type { CouncilData } from '../data/types';
import { Chip } from '../pages/app/shared/Chip';

interface ContextSidebarProps {
  councilData: CouncilData;
  selectedTopics?: string[];
  onToggleTopic?: (id: string) => void;
  onBackToTools?: () => void;
}

export function ContextSidebar({ councilData, selectedTopics = [], onToggleTopic, onBackToTools }: ContextSidebarProps) {
  const boroughAsset = `/assets/boroughs/${councilData.id}.svg`;
  const hasAllocations = councilData.spatialData?.allocations?.length > 0;

  return (
    <div className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-4 space-y-4">
      <div>
        <h3 className="text-[color:var(--ink)] text-lg font-semibold">{councilData.planContext.title}</h3>
        <p className="text-sm text-[color:var(--muted)]">{councilData.planContext.authority}</p>
        <p className="text-sm text-[color:var(--muted)] mt-2">{councilData.planContext.summary}</p>
      </div>

      <div className="border-t border-[color:var(--edge)]/50 pt-3">
        <div className="text-sm font-semibold text-[color:var(--ink)] mb-2">Policy Topics</div>
        <div className="flex flex-wrap gap-2">
          {councilData.topics.slice(0, 6).map((t) => (
            <Chip key={t.id} label={t.label} active={selectedTopics.includes(t.id)} onClick={() => onToggleTopic?.(t.id)} />
          ))}
        </div>
      </div>

      <div className="border-t border-[color:var(--edge)]/50 pt-3 space-y-2">
        <div className="text-sm font-semibold text-[color:var(--ink)]">Spatial Context</div>
        <img src={boroughAsset} alt={`${councilData.name} borough`} className="w-full h-auto rounded border border-[color:var(--edge)]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        {hasAllocations && (
          <div>
            <div className="text-xs text-[color:var(--muted)] mb-1">Available sites</div>
            <ul className="max-h-28 overflow-y-auto text-sm text-[color:var(--muted)] list-disc pl-5">
              {councilData.spatialData.allocations.slice(0, 10).map((s) => (
                <li key={s.id}>{s.id}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-[color:var(--edge)]/50 pt-3 flex items-center justify-between">
        <button onClick={onBackToTools} className="text-sm text-[color:var(--accent)] hover:underline">← Back to Tools</button>
        <button className="text-sm text-[color:var(--muted)] hover:underline">Switch Plan</button>
      </div>
    </div>
  );
}
