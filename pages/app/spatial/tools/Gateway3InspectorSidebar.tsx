import * as React from 'react'
import { useMemo, useState } from 'react'
import { CouncilData, Gateway3InspectorReport, Plan } from '../../../../data/types'
import { callLLM } from '../../../../utils/llmClient'
import { MarkdownContent } from '../../../../components/MarkdownContent'
import { LoadingSpinner } from '../../shared/LoadingSpinner'

function statusBadge(val?: string) {
  const base = 'px-2 py-0.5 text-[11px] rounded-full border'
  if (val === 'pass') return `${base} bg-green-50 text-green-800 border-green-200`
  if (val === 'risk') return `${base} bg-amber-50 text-amber-800 border-amber-200`
  if (val === 'fail') return `${base} bg-red-50 text-red-800 border-red-200`
  return `${base} bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-edge)]`
}

function buildPlanSnapshot(plan?: Plan, council?: CouncilData) {
  if (!plan || !council) return 'No plan context.'
  const vision = (plan.visionStatements || []).map(v => v.text).filter(Boolean).join('; ') || 'No vision recorded.'
  const outcomes = (plan.smartOutcomes || []).map(o => o.outcomeStatement || o.theme).filter(Boolean).join('; ') || 'No SMART outcomes logged.'
  const strategy = plan.preferredOptions?.strategy?.analysis
    || plan.preferredOptions?.strategy?.label
    || 'No spatial strategy captured.'
  const sites = (plan.sites || []).map(s => {
    const decision = (plan.siteDecisions || []).find(d => d.siteId === s.id)
    const rag = [s.suitability, s.availability, s.achievability].filter(Boolean).join('/') || 'n/a'
    return `${s.name}: RAG ${rag}; decision ${decision?.decision || 'undecided'}; ${s.notes || 'no summary'}`
  }).join('\n') || 'No sites recorded.'
  const evidence = (plan.evidenceInventory || []).map(ev => `${ev.title}${ev.status ? ` [${ev.status}]` : ''}${ev.year ? ` (${ev.year})` : ''}`).join('; ') || 'Evidence not logged.'
  const consultations = (plan.consultationSummaries || []).map(c => `${c.stageId}: ${c.mainIssues?.join(', ') || 'no issues recorded'}`).join('; ') || 'No consultation summaries.'
  const seaHra = plan.seaHra
    ? [
        plan.seaHra.seaScopingStatus ? `SEA scoping: ${plan.seaHra.seaScopingStatus}` : '',
        plan.seaHra.hraBaselineSummary ? `HRA: ${plan.seaHra.hraBaselineSummary}` : '',
        plan.seaHra.cumulativeEffects ? `Cumulative: ${plan.seaHra.cumulativeEffects}` : ''
      ].filter(Boolean).join('; ')
    : 'No SEA/HRA text.'
  return [
    `Authority: ${council.name}`,
    `Plan: ${plan.title} | Stage: ${plan.planStage || 'unknown'}`,
    `Vision: ${vision}`,
    `Outcomes: ${outcomes}`,
    `Strategy: ${strategy}`,
    `Sites: ${sites}`,
    `Evidence: ${evidence}`,
    `Consultations: ${consultations}`,
    `SEA/HRA: ${seaHra}`,
  ].join('\n')
}

export const Gateway3InspectorSidebar: React.FC<{ plan?: Plan; councilData: CouncilData }> = ({ plan, councilData }) => {
  const workingPlan = plan?.councilId === councilData.id ? plan : undefined
  const report: Gateway3InspectorReport = (workingPlan?.gateway3Inspector as Gateway3InspectorReport) || {}
  const topics = report.matrix || []

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const planSnapshot = useMemo(() => buildPlanSnapshot(workingPlan, councilData), [workingPlan, councilData])

  const askInspector = async () => {
    if (!workingPlan || !question.trim()) return
    setLoading(true)
    setError(null)
    try {
      const prompt = [
        'You are the Gateway 3 AI Inspector. Answer the specific question using the existing inspection findings and plan snapshot.',
        'Be concise and professional. Do not invent new data.',
        `Existing findings: ${JSON.stringify(report).slice(0, 1500)}`,
        `Plan snapshot:\n${planSnapshot}`,
        `Question: ${question}`
      ].join('\n')
      const raw = await callLLM({ mode: 'markdown', prompt })
      setAnswer(raw)
      setShowAnswerModal(true)
      setStatus('Inspector response ready.')
    } catch (e: any) {
      setError(e?.message || 'Unable to answer question.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 lg:sticky lg:top-20">
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-3">
        <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Submission checklist</div>
        <div className="space-y-2">
          {report.checklist && report.checklist.length > 0 ? report.checklist.map((c, idx) => (
            <div key={idx} className="flex items-start justify-between gap-2 border border-[var(--color-edge)] rounded p-2 bg-[var(--color-surface)]">
              <div className="text-sm text-[var(--color-ink)]">{c.item}</div>
              <div className="flex flex-col items-end gap-1">
                <span className={statusBadge(c.status)}>{c.status}</span>
                {c.note && <span className="text-[11px] text-[var(--color-muted)] max-w-[180px] text-right">{c.note}</span>}
              </div>
            </div>
          )) : <div className="text-xs text-[var(--color-muted)]">No checklist yet. Run the inspection.</div>}
        </div>
      </div>

      {report.actions && report.actions.length > 0 && (
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-3">
          <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Before you submit</div>
          <ul className="list-disc ml-5 text-sm text-[var(--color-ink)] space-y-1">
            {report.actions.map((a, idx) => <li key={idx}>{a}</li>)}
          </ul>
        </div>
      )}

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-3 space-y-2">
        <div className="text-sm font-semibold text-[var(--color-ink)]">Ask the inspector</div>
        <div className="flex flex-col gap-2">
          <textarea
            className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-ink)]"
            rows={6}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Why is transport amber? What should be tightened before submission?"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <button className="px-3 py-1.5 text-sm rounded bg-[var(--color-accent)] text-white" onClick={askInspector} disabled={loading || !question.trim()}>
              {loading ? 'Working…' : 'Ask'}
            </button>
            {status && <span className="text-[11px] text-[var(--color-muted)]">{status}</span>}
            {error && <span className="text-[11px] text-red-600">{error}</span>}
            {answer && <button className="text-[11px] text-[var(--color-accent)] hover:underline" onClick={() => setShowAnswerModal(true)}>View last answer</button>}
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-3">
        <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Inspection snapshot</div>
        <div className="text-xs text-[var(--color-muted)]">RAG: {topics.filter(m => (m.rag || '').toLowerCase() === 'green').length} green / {topics.filter(m => (m.rag || '').toLowerCase() === 'amber').length} amber / {topics.filter(m => (m.rag || '').toLowerCase() === 'red').length} red</div>
        {report.hearingTopics && report.hearingTopics.length > 0 && (
          <div className="mt-2">
            <div className="text-[11px] text-[var(--color-muted)]">Hearing focus</div>
            <ul className="list-disc ml-4 text-xs text-[var(--color-ink)] space-y-1">
              {report.hearingTopics.slice(0, 3).map((h, idx) => <li key={idx}>{h}</li>)}
            </ul>
          </div>
        )}
        {report.actions && report.actions.length > 0 && (
          <div className="mt-2">
            <div className="text-[11px] text-[var(--color-muted)]">Actions</div>
            <ul className="list-disc ml-4 text-xs text-[var(--color-ink)] space-y-1">
              {report.actions.slice(0, 3).map((a, idx) => <li key={idx}>{a}</li>)}
            </ul>
          </div>
        )}
      </div>

      {showAnswerModal && answer && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl shadow-xl max-w-3xl w-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-edge)]">
              <div className="font-semibold text-[var(--color-ink)]">Inspector response</div>
              <button className="text-sm text-[var(--color-accent)] hover:underline" onClick={() => setShowAnswerModal(false)}>Close</button>
            </div>
            <div className="p-4 prose prose-sm max-w-none text-[var(--color-ink)]">
              <MarkdownContent content={answer} />
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-20">
          <LoadingSpinner />
        </div>
      )}
    </div>
  )
}
