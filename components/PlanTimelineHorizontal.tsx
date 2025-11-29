import * as React from 'react'
import type { Plan, PlanStageId } from '../data/types'

type Props = {
  plan: Plan
  currentStageId?: PlanStageId
  onSelectStage?: (stageId: PlanStageId) => void
}

export const PlanTimelineHorizontal: React.FC<Props> = ({ plan, currentStageId, onSelectStage }) => {
  if (plan.systemType !== 'new') return null
  const stages = plan.stages || []
  const currentIdx = stages.findIndex(s => s.id === currentStageId)
  return (
    <div className="w-full py-3 overflow-x-auto">
      <div className="flex items-center gap-4 px-2 min-w-max">
        {stages.map((stage, idx) => {
          const isCurrent = stage.id === currentStageId
          const isPast = currentIdx > -1 && idx < currentIdx
          return (
            <React.Fragment key={stage.id}>
              <button
                className="flex flex-col items-center gap-1 focus:outline-none"
                onClick={() => onSelectStage?.(stage.id as PlanStageId)}
              >
                <div className={`h-3 w-3 rounded-full ${isCurrent ? 'bg-[#f5c315]' : isPast ? 'bg-[#27324A]' : 'bg-[var(--color-muted)]/60'}`} />
                <div className={`text-xs text-center ${isCurrent ? 'text-[var(--color-ink)] font-semibold' : 'text-[var(--color-muted)]'}`}>{stage.title}</div>
              </button>
              {idx < stages.length - 1 && (
                <div className={`h-px flex-1 min-w-[60px] ${isPast ? 'bg-[var(--color-ink)]/60' : 'bg-[var(--color-edge)]'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
