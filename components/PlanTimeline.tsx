import * as React from 'react'
import type { Plan, PlanStageId } from '../data/types'
import { NEW_SYSTEM_STAGES } from '../constants'

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

export function PlanTimeline({ plan, onSelectStage }: { plan: Plan; onSelectStage?: (id: PlanStageId) => void }) {
  if (plan.systemType !== 'new') return null

  const stageMap = React.useMemo(() => {
    const map: Record<string, any> = {}
    ;(plan.stages || []).forEach(s => {
      map[s.id] = { ...s }
    })
    ;(plan.timetable?.milestones || []).forEach(m => {
      if (m.stageId) {
        map[m.stageId] = { ...(map[m.stageId] || { id: m.stageId }), targetDate: m.date }
      }
    })
    return map
  }, [plan.stages, plan.timetable?.milestones])

  const ordered = NEW_SYSTEM_STAGES.map(def => {
    const fromPlan = stageMap[def.id] || {}
    const targetDate = fromPlan.targetDate
    return { ...def, ...fromPlan, targetDate }
  })
  const stageOrder = ordered.map(s => s.id)
  const currentStageId = (plan.planStage || plan.currentStage) as PlanStageId | undefined
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

  const byBand = {
    'get-ready': ordered.filter(s => s.band === 'get-ready'),
    'plan-making': ordered.filter(s => s.band === 'plan-making'),
  }

  const renderStage = (stage: typeof ordered[number]) => {
    const status = statusForStage(stage.id)
    return (
      <li key={stage.id} className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            status === 'current'
              ? 'bg-[var(--color-brand)]'
              : status === 'done'
              ? 'bg-[var(--color-ink)]'
              : 'bg-[var(--color-edge)]'
          }`}
        />
        <div className="flex-1">
          <div className="text-sm text-[var(--color-ink)]">{stage.title}</div>
          {stage.timingNote && <div className="text-[11px] text-[var(--color-muted)]">{stage.timingNote}</div>}
          {stage.targetDate && (
            <div className="text-[11px] text-[var(--color-muted)]">Target: {formatDate(stage.targetDate)}</div>
          )}
        </div>
        {onSelectStage && (
          <button className="text-xs text-[var(--color-accent)]" onClick={() => onSelectStage(stage.id)}>
            Open
          </button>
        )}
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl">
      <div className="font-semibold text-[var(--color-ink)]">Plan Timeline</div>

      <div>
        <div className="text-xs font-semibold text-[var(--color-muted)] mb-1">Get ready (before 30-month process)</div>
        <ol className="space-y-2">
          {byBand['get-ready'].map(renderStage)}
        </ol>
      </div>

      <div className="text-[11px] text-[var(--color-muted)]">
        30-month clock starts after Gateway 1 summary{clockStartLabel ? ` — recorded ${clockStartLabel}` : ''}{deadline ? ` | deadline ${deadline}` : ''}
      </div>

      <div>
        <div className="text-xs font-semibold text-[var(--color-muted)] mb-1">30-month plan-making process</div>
        <ol className="space-y-2">
          {byBand['plan-making'].map(renderStage)}
        </ol>
      </div>
    </div>
  )
}
