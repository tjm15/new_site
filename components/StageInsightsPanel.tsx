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
  const baselineChecks = stageId === 'BASELINING' ? computeBaselineChecks(plan) : []

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
            {baselineChecks.length ? 'Baseline checks' : statusLabel}
          </span>
        </div>
      </div>

      {baselineChecks.length > 0 && (
        <div className="mt-3 space-y-2">
          {baselineChecks.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <span className={`mt-1 inline-block w-2 h-2 rounded-full ${item.status === 'G' ? 'bg-green-500' : item.status === 'A' ? 'bg-amber-500' : 'bg-red-500'}`} />
              <div>
                <div className="font-semibold text-[var(--color-ink)]">{item.label}</div>
                {item.detail && <div className="text-xs text-[var(--color-muted)] leading-snug">{item.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {!baselineChecks.length && insights?.cards?.length ? (
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

function computeBaselineChecks(plan?: Plan) {
  if (!plan) return []
  const evidence = plan.evidenceInventory || []
  const themes: Array<{ id: string; label: string; keywords: string[] }> = [
    { id: 'housing', label: 'Housing', keywords: ['housing'] },
    { id: 'economy', label: 'Economy & employment', keywords: ['economy', 'jobs', 'employment', 'industry'] },
    { id: 'transport', label: 'Transport & accessibility', keywords: ['transport', 'travel', 'highway', 'bus', 'rail'] },
    { id: 'environment', label: 'Environment & climate', keywords: ['environment', 'climate', 'flood', 'air', 'carbon', 'biodiversity'] },
    { id: 'infrastructure', label: 'Infrastructure', keywords: ['infrastructure', 'utilities', 'energy', 'digital', 'water'] },
    { id: 'design', label: 'Design & place', keywords: ['design', 'place', 'urban', 'townscape'] },
    { id: 'demography', label: 'Demography & health', keywords: ['health', 'demography', 'population', 'equal'] },
  ]
  const matchTheme = (topic: string) => {
    const t = (topic || '').toLowerCase()
    const found = themes.find(th => th.id === t || th.keywords.some(k => t.includes(k)))
    return found?.id || 'general'
  }
  const coverage = themes.map(theme => {
    const hasAny = evidence.some(ev => matchTheme(ev.topic || '') === theme.id)
    const hasCore = evidence.some(ev => matchTheme(ev.topic || '') === theme.id && (ev.core || ev.status === 'complete' || ev.status === 'in_progress'))
    const status: 'G' | 'A' | 'R' = hasCore ? 'G' : hasAny ? 'A' : 'R'
    return { label: `${theme.label}`, status, detail: hasCore ? 'At least one core dataset logged.' : hasAny ? 'Some datasets logged; mark core evidence.' : 'No datasets yet.' }
  })
  const oldDatasets = evidence.filter(ev => {
    const year = ev.year ? parseInt(ev.year, 10) : undefined
    if (!year || Number.isNaN(year)) return false
    return new Date().getFullYear() - year > 5
  })
  const seaRelevant = evidence.filter(ev => ev.seaHraRelevant).length
  const seaNarrative = (plan.baselineNarrative || '').toLowerCase().includes('sea') || (plan.baselineNarrative || '').toLowerCase().includes('hra')
  const equalitiesCovered = evidence.some(ev => matchTheme(ev.topic || '') === 'demography')

  const checks: Array<{ label: string; detail?: string; status: 'G' | 'A' | 'R' }> = [
    ...coverage,
    {
      label: 'Data quality & recency',
      status: oldDatasets.length ? 'A' : 'G',
      detail: oldDatasets.length ? `${oldDatasets.length} datasets older than 5 years` : 'All recorded datasets within 5 years',
    },
    {
      label: 'SEA/HRA baseline',
      status: seaRelevant && seaNarrative ? 'G' : seaRelevant ? 'A' : 'R',
      detail: seaRelevant ? (seaNarrative ? 'SEA/HRA datasets tagged and narrative present' : 'Datasets tagged; add SEA/HRA narrative') : 'No SEA/HRA datasets tagged',
    },
    {
      label: 'Equalities & health',
      status: equalitiesCovered ? 'G' : 'A',
      detail: equalitiesCovered ? 'Evidence includes equalities/health datasets' : 'Add deprivation/health evidence',
    }
  ]
  return checks
}

function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return `${diff}s ago`
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}
