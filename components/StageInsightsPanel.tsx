import * as React from 'react'
import type { Plan, PlanStageId } from '../data/types'
import { useStageInsights } from '../hooks/useStageInsights'

export type StageInsightsPanelProps = {
  plan: Plan
  stageId: PlanStageId
}

export const StageInsightsPanel: React.FC<StageInsightsPanelProps> = ({ plan, stageId }) => {
  const { insights } = useStageInsights(plan, stageId)
  const status: 'In progress' | 'Not started' | 'Complete' = 'In progress'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left: AI summary */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">{stageIdToLabel(stageId)}</h2>
          <span className="px-2 py-1 text-xs rounded bg-[var(--color-surface)] border border-[var(--color-edge)]">{status}</span>
        </div>
        <p className="text-sm text-[var(--color-ink)] min-h-[40px]">{insights?.summary || 'Analysing the plan and stage context…'}</p>
        {insights?.updatedAt && (
          <div className="text-xs text-[var(--color-muted)] mt-2">Last updated: {timeAgo(insights.updatedAt)}</div>
        )}
      </div>

      {/* Right: actions and risks */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
        <div>
          <div className="font-semibold text-[var(--color-ink)] mb-2">What you should do now</div>
          <ul className="list-disc ml-5 text-sm text-[var(--color-ink)]">
            {(insights?.actions?.length ? insights.actions : ['Confirm draft timetable with senior officers.', 'Draft Notice to Commence using last Cabinet report.', 'Log existing evidence base and flag obvious gaps.']).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
        {insights?.risks?.length ? (
          <div className="mt-3">
            <div className="font-semibold text-[var(--color-ink)] mb-1">Risks & blockers</div>
            <ul className="list-disc ml-5 text-sm text-[var(--color-ink)]">
              {insights.risks.slice(0, 3).map((r, i) => (
                <li key={i} className="text-[var(--color-ink)]">{r}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function stageIdToLabel(id: PlanStageId) {
  const map: Record<PlanStageId, string> = {
    PREP: 'Preparation',
    GATEWAY_1: 'Gateway 1',
    BASELINING: 'Baselining & Evidence',
    CONSULTATION_1: 'Consultation 1',
    GATEWAY_2: 'Gateway 2',
    CONSULTATION_2: 'Consultation 2',
    GATEWAY_3: 'Gateway 3',
    SUBMISSION: 'Submission',
    ADOPTION: 'Adoption',
  }
  return map[id] || id
}

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}
