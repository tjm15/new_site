import * as React from 'react'
import type { Plan, PlanStageId } from '../data/types'
import { STAGES } from '../data/stageMeta'
import { useStageInsights } from '../hooks/useStageInsights'

export type StageInsightsPanelProps = {
  plan: Plan
  stageId: PlanStageId
  qaNotes?: string[]
  showQA?: boolean
}

export const StageInsightsPanel: React.FC<StageInsightsPanelProps> = ({ plan, stageId, qaNotes, showQA = true }) => {
  const { insights } = useStageInsights(plan, stageId)
  const statusLabel = insights?.source === 'fallback' ? 'fallback' : 'LLM'

  return (
    <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">AI Inspector report</div>
          <div className="text-xs text-[var(--color-muted)]">{stageIdToLabel(stageId)}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {insights?.updatedAt && (
            <span className="text-[11px] text-[var(--color-muted)]">Updated {timeAgo(insights.updatedAt)}</span>
          )}
          <span className="px-2 py-1 text-[11px] rounded bg-[var(--color-surface)] border border-[var(--color-edge)]">
            {statusLabel}
          </span>
        </div>
      </div>

      {insights?.cards?.length ? (
        <div className="grid grid-cols-1 gap-2 mt-3">
            {insights.cards.slice(0, 3).map((card, idx) => (
              <div key={idx} className="flex items-start justify-between border border-[var(--color-edge)] rounded p-2 bg-[var(--color-surface)]">
                <div className="pr-2">
                  <div className="text-sm font-semibold text-[var(--color-ink)]">{card.title}</div>
                  {card.reason && <div className="text-xs text-[var(--color-muted)] leading-snug">{card.reason}</div>}
                </div>
                <span
                  className={`px-2 py-1 text-[11px] rounded-full border ${
                    card.status === 'G' ? 'bg-green-100 text-green-800 border-green-200'
                    : card.status === 'A' ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                {card.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-[var(--color-muted)] mt-3">Inspector analysis unavailable.</div>
      )}

      {showQA && (
        <div className="mt-3 border-t border-[var(--color-edge)] pt-3">
          <div className="font-semibold text-[var(--color-ink)] mb-1 text-sm">QA & checks</div>
          {qaNotes && qaNotes.length > 0 ? (
            <ul className="list-disc ml-5 text-sm text-[var(--color-ink)] space-y-1">
              {qaNotes.map((q, idx) => <li key={idx}>{q}</li>)}
            </ul>
          ) : (
            <div className="text-xs text-[var(--color-muted)]">No QA checks defined for this stage.</div>
          )}
        </div>
      )}
    </div>
  )
}

function stageIdToLabel(id: PlanStageId) {
  const meta = STAGES.find(s => s.id === id)
  return meta?.label || id
}

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}
