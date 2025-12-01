import * as React from 'react'
import type { Plan, PlanStageId } from '../data/types'
import { NEW_SYSTEM_STAGES } from '../constants'

type Props = {
  plan: Plan
  currentStageId?: PlanStageId
  onSelectStage?: (stageId: PlanStageId) => void
}

const formatDate = (iso?: string) => {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const addMonths = (date: Date, months: number) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export const PlanTimelineHorizontal: React.FC<Props> = ({ plan, currentStageId, onSelectStage }) => {
  if (plan.systemType !== 'new') return null

  const stageMap = React.useMemo(() => {
    const map: Record<string, any> = {}
    ;(plan.stages || []).forEach(s => {
      map[s.id] = { ...s }
    })
    ;(plan.timetable?.milestones || []).forEach(m => {
      if (m.stageId && m.date) map[m.stageId] = { ...(map[m.stageId] || { id: m.stageId }), targetDate: m.date }
    })
    return map
  }, [plan.stages, plan.timetable?.milestones])

  const ordered = NEW_SYSTEM_STAGES.map(def => {
    const fromPlan = stageMap[def.id] || {}
    const targetDate = fromPlan.targetDate || def.targetDate
    // Stage definitions should always control the label/title; plan data can add dates/status.
    return { ...fromPlan, ...def, targetDate }
  })

  const stageOrder = ordered.map(s => s.id)
  const currentIdx = currentStageId ? stageOrder.indexOf(currentStageId) : -1
  const statusForStage = (id: PlanStageId) => {
    const idx = stageOrder.indexOf(id)
    if (idx === -1 || currentIdx === -1) return 'future'
    if (idx < currentIdx) return 'done'
    if (idx === currentIdx) return 'current'
    return 'future'
  }

  const clockStart =
    plan.gateway1PublishedAt ||
    stageMap['G1_SUMMARY']?.targetDate ||
    stageMap['GATEWAY_1']?.targetDate
  const clockStartLabel = clockStart ? formatDate(clockStart) : undefined
  const deadline = clockStart ? formatDate(addMonths(new Date(clockStart), 30).toISOString()) : undefined

  const banded = {
    'get-ready': ordered.filter(s => s.band === 'get-ready'),
    'plan-making': ordered.filter(s => s.band === 'plan-making'),
  }

  const renderBand = (label: string, stages: typeof ordered, marker?: React.ReactNode) => (
    <div className="flex items-center gap-3">
      <div className="w-44 shrink-0 text-xs text-[var(--color-muted)] font-semibold">
        <div>{label}</div>
        {marker}
      </div>
      <div className="flex items-center gap-2 flex-1">
        {stages.map((stage, idx) => {
          const status = statusForStage(stage.id)
          const dateLabel = formatDate(stage.targetDate)
          return (
            <React.Fragment key={stage.id}>
              <button
                className={`flex flex-col items-center gap-1 min-w-[130px] px-2 py-1 rounded-lg border ${
                  status === 'current'
                    ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10'
                    : status === 'done'
                    ? 'border-[var(--color-ink)]/30 bg-[var(--color-surface)]'
                    : 'border-[var(--color-edge)] bg-[var(--color-panel)]'
                }`}
                onClick={() => onSelectStage?.(stage.id as PlanStageId)}
              >
                {dateLabel && <div className="text-[10px] text-[var(--color-muted)]">{dateLabel}</div>}
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      status === 'current'
                        ? 'bg-[var(--color-brand)]'
                        : status === 'done'
                        ? 'bg-[var(--color-ink)]'
                        : 'bg-[var(--color-edge)]'
                    }`}
                  />
                  <div className="text-xs text-left text-[var(--color-ink)] font-semibold leading-tight">{stage.title}</div>
                </div>
                {stage.timingNote && <div className="text-[10px] text-[var(--color-muted)] text-left w-full">{stage.timingNote}</div>}
              </button>
              {idx < stages.length - 1 && (
                <div className={`h-px flex-1 min-w-[60px] ${status === 'done' ? 'bg-[var(--color-ink)]/60' : 'bg-[var(--color-edge)]'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="w-full py-3 overflow-x-auto">
      <div className="flex flex-col gap-3 px-2 min-w-max">
        {renderBand('Get ready (before 30-month process)', banded['get-ready'])}
        {renderBand(
          '30-month plan-making process',
          banded['plan-making'],
          <div className="text-[11px] text-[var(--color-muted)]">
            {clockStartLabel ? `Clock started ${clockStartLabel}` : 'Clock starts after Gateway 1 summary'}
            {deadline ? ` · Deadline ${deadline}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
