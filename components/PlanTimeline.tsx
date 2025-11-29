import * as React from 'react'
import type { Plan } from '../data/types'

export function PlanTimeline({ plan, onSelectStage }: { plan: Plan; onSelectStage?: (id: string) => void }) {
  if (plan.systemType !== 'new') return null
  const stages = plan.stages
  const current = plan.planStage || plan.currentStage
  return (
    <div className="flex flex-col gap-3 p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl">
      <div className="font-semibold text-[var(--color-ink)]">Plan Timeline</div>
      <ol className="space-y-2">
        {stages.map(s => (
          <li key={s.id} className="flex items-center gap-3">
            <span
              className={
                `h-2 w-2 rounded-full ` + (current === s.id ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-edge)]')
              }
            />
            <div className="flex-1">
              <div className="text-sm text-[var(--color-ink)]">{s.title}</div>
              {s.targetDate && (
                <div className="text-xs text-[var(--color-muted)]">Target: {new Date(s.targetDate).toLocaleDateString()}</div>
              )}
            </div>
            {onSelectStage && (
              <button className="text-xs text-[var(--color-accent)]" onClick={() => onSelectStage(s.id)}>Open</button>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}