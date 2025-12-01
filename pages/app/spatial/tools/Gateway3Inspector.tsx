import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CouncilData, Gateway3InspectorReport, Gateway3InspectorTopic, Gateway3Pack, Plan, RagStatus } from '../../../../data/types'
import { usePlan } from '../../../../contexts/PlanContext'
import { callLLM } from '../../../../utils/llmClient'
import { LoadingSpinner } from '../../shared/LoadingSpinner'
import { MarkdownContent } from '../../../../components/MarkdownContent'

type InspectionResponse = {
  verdict?: string
  matrix?: Gateway3InspectorTopic[]
  crossCutting?: Array<{ title: string; detail?: string; severity?: 'low' | 'medium' | 'high' }>
  checklist?: Array<{ item: string; status: 'pass' | 'risk' | 'fail'; note?: string }>
  actions?: string[]
  finalNote?: string
}

function ragBadge(status?: RagStatus | string) {
  const t = (status || '').toLowerCase()
  const base = 'px-2 py-0.5 text-[11px] rounded-full border'
  if (t.startsWith('g')) return `${base} bg-green-100 text-green-800 border-green-200`
  if (t.startsWith('a')) return `${base} bg-amber-100 text-amber-800 border-amber-200`
  if (t.startsWith('r')) return `${base} bg-red-100 text-red-800 border-red-200`
  return `${base} bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-edge)]`
}

function statusBadge(val?: string) {
  const base = 'px-2 py-0.5 text-[11px] rounded-full border'
  if (val === 'pass') return `${base} bg-green-50 text-green-800 border-green-200`
  if (val === 'risk') return `${base} bg-amber-50 text-amber-800 border-amber-200`
  if (val === 'fail') return `${base} bg-red-50 text-red-800 border-red-200`
  return `${base} bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-edge)]`
}

function extractJsonObject(raw: string): any | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  const candidates: string[] = [trimmed]
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) candidates.push(fenced[1].trim())
  const first = trimmed.indexOf('{')
  const last = trimmed.lastIndexOf('}')
  if (first !== -1 && last > first) candidates.push(trimmed.slice(first, last + 1))
  for (const cand of candidates) {
    try {
      return JSON.parse(cand)
    } catch {
      continue
    }
  }
  return undefined
}

function summarizePack(pack?: Gateway3Pack) {
  if (!pack) return 'Gateway 3 pack not yet built.'
  const reqs = pack.requirements || []
  const rag = { g: reqs.filter(r => r.status === 'green').length, a: reqs.filter(r => r.status === 'amber').length, r: reqs.filter(r => r.status === 'red').length }
  const statements = [
    pack.compliance?.text ? 'Compliance drafted' : 'Compliance missing',
    pack.soundness?.text ? 'Soundness drafted' : 'Soundness missing',
    pack.readiness?.text ? 'Readiness drafted' : 'Readiness missing'
  ].join(' | ')
  const manifest = (pack.validator?.manifest || [])
  const manifestSummary = manifest.length
    ? `${manifest.length} items; missing ${manifest.filter(m => m.status === 'missing').length}; outdated ${manifest.filter(m => m.status === 'outdated').length}`
    : 'Manifest not validated.'
  return `Requirements RAG ${rag.g}G/${rag.a}A/${rag.r}R; ${statements}; Manifest ${manifestSummary}`
}

function buildPlanSnapshot(plan?: Plan, council?: CouncilData) {
  if (!plan || !council) return 'No plan context.'
  const vision = (plan.visionStatements || []).map(v => v.text).filter(Boolean).join('; ') || 'No vision recorded.'
  const outcomes = (plan.smartOutcomes || []).map(o => o.outcomeStatement || o.text || o.theme).filter(Boolean).join('; ') || 'No SMART outcomes logged.'
  const strategy = plan.preferredOptions?.strategy?.analysis
    || plan.preferredOptions?.strategy?.label
    || 'No spatial strategy captured.'
  const sites = (plan.sites || []).map(s => {
    const decision = (plan.siteDecisions || []).find(d => d.siteId === s.id)
    const rag = [s.suitability, s.availability, s.achievability].filter(Boolean).join('/') || 'n/a'
    return `${s.name}: RAG ${rag}; decision ${decision?.decision || 'undecided'}; ${s.notes || s.description || 'no summary'}`
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
  const pack = summarizePack(plan.gateway3Pack)
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
    `Gateway 3 pack: ${pack}`
  ].join('\n')
}

export const Gateway3Inspector: React.FC<{ plan?: Plan; councilData: CouncilData; autoRun?: boolean; hideSidebar?: boolean }> = ({ plan, councilData, autoRun, hideSidebar }) => {
  const { updatePlan } = usePlan()
  const workingPlan = plan?.councilId === councilData.id ? plan : undefined
  const [report, setReport] = useState<Gateway3InspectorReport>({})
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [showAnswerModal, setShowAnswerModal] = useState(false)
  const autoRan = useRef(false)

  useEffect(() => {
    if (!workingPlan) {
      setReport({})
      return
    }
    if (workingPlan.gateway3Inspector) setReport(workingPlan.gateway3Inspector)
  }, [workingPlan?.id])

  useEffect(() => {
    if (autoRun && workingPlan && !autoRan.current) {
      autoRan.current = true
      runInspection()
    }
  }, [autoRun, workingPlan])

  const planSnapshot = useMemo(() => buildPlanSnapshot(workingPlan, councilData), [workingPlan, councilData])

  const persistReport = (next: Gateway3InspectorReport) => {
    if (!workingPlan) return
    const merged = { ...next, generatedAt: next.generatedAt || new Date().toISOString() }
    setReport(merged)
    updatePlan(workingPlan.id, { gateway3Inspector: merged })
  }

  const runInspection = async () => {
    if (!workingPlan) return
    setLoading(true)
    setError(null)
    try {
      const prompt = [
        'You are the Gateway 3 AI Inspector (pre-examination, advisory).',
        'Use ONLY the provided plan snapshot; do not invent sites or documents. Judge submission readiness, coherence, legal/process sufficiency, and examination risks.',
        'Return JSON only with shape:',
        '{ "verdict": string, "matrix": [{ "id": string, "title": string, "rag": "red|amber|green", "severity": "low|medium|high", "summary": string, "issues": [string], "showstoppers": [string] }], "crossCutting": [{ "title": string, "detail": string, "severity": "low|medium|high" }], "checklist": [{ "item": string, "status": "pass|risk|fail", "note": string }], "actions": [string], "hearingTopics": [string], "examinerQuestions": [string], "finalNote": string }',
        'Gateway 3 lens: completeness, coherence, legal/procedural soundness, examination viability. Highlight SEA/HRA, evidence gaps, policies map, and deliverability/viability clashes. Provide likely hearing topics and specific examiner-style questions.',
        'Keep it concise, inspector-tone (calm, professional).',
        `Plan snapshot:\n${planSnapshot}`
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const parsed = extractJsonObject(raw) as InspectionResponse
      const next: Gateway3InspectorReport = {
        verdict: parsed?.verdict || raw,
        matrix: parsed?.matrix,
        crossCutting: parsed?.crossCutting,
        checklist: parsed?.checklist,
        actions: parsed?.actions,
        hearingTopics: parsed?.hearingTopics,
        examinerQuestions: parsed?.examinerQuestions,
        finalNote: parsed?.finalNote,
        generatedAt: new Date().toISOString()
      }
      persistReport(next)
      setStatus('Inspection generated.')
    } catch (e: any) {
      setError(e?.message || 'Unable to generate inspection.')
    } finally {
      setLoading(false)
    }
  }

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

  const topics = report.matrix || []

  if (!workingPlan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan loaded</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to run the Gateway 3 AI Inspector.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">Final AI Inspection</div>
          <div className="text-xs text-[var(--color-muted)]">Inspector-style readiness verdict for Gateway 3 submission.</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]" onClick={runInspection} disabled={loading}>
            {loading ? 'Working…' : 'Run inspection'}
          </button>
          {report.generatedAt && <span className="text-[11px] text-[var(--color-muted)]">Last run: {new Date(report.generatedAt).toLocaleString()}</span>}
        </div>
      </div>
      {status && <div className="text-xs text-[var(--color-ink)]">{status}</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
      <div className={`grid grid-cols-1 ${hideSidebar ? 'lg:grid-cols-[1.1fr,1fr]' : 'lg:grid-cols-[1.1fr,1fr,320px]'} gap-4 items-start`}>
        {/* Column 1: verdict + RAG */}
        <div className="space-y-3">
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-3">
            <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Executive verdict</div>
            <div className="text-sm text-[var(--color-ink)]">{report.verdict || 'Run the inspection to generate a verdict.'}</div>
          </div>
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-3">
            <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Gateway 3 RAG matrix</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {topics.length ? topics.map(t => (
                <div key={t.id} className="border border-[var(--color-edge)] rounded-lg p-2 bg-[var(--color-surface)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-[var(--color-ink)]">{t.title || t.id}</div>
                    <div className="flex items-center gap-1">
                      <span className={ragBadge(t.rag)}>{t.rag || 'n/a'}</span>
                      {t.severity && <span className="text-[11px] text-[var(--color-muted)] capitalize">{t.severity}</span>}
                    </div>
                  </div>
                  {t.summary && <div className="text-xs text-[var(--color-muted)] mt-1">{t.summary}</div>}
                  {(t.issues && t.issues.length > 0) && (
                    <ul className="list-disc ml-5 text-xs text-[var(--color-ink)] space-y-1 mt-1">
                      {t.issues.map((i, idx) => <li key={idx}>{i}</li>)}
                    </ul>
                  )}
                  {(t.showstoppers && t.showstoppers.length > 0) && (
                    <div className="mt-1">
                      <div className="text-[11px] text-red-700 font-semibold">Show-stoppers</div>
                      <ul className="list-disc ml-5 text-xs text-red-700 space-y-1">
                        {t.showstoppers.map((i, idx) => <li key={idx}>{i}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )) : <div className="text-xs text-[var(--color-muted)]">Run the inspection to populate the matrix.</div>}
            </div>
          </div>
        </div>

        {/* Column 2: cross-cutting + hearing focus + narrative */}
        <div className="space-y-3">
          {report.crossCutting && report.crossCutting.length > 0 && (
            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-3">
              <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Cross-cutting examination risks</div>
              <div className="space-y-2">
                {report.crossCutting.map((c, idx) => (
                  <div key={idx} className="border border-[var(--color-edge)] rounded p-2 bg-[var(--color-surface)]">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-[var(--color-ink)]">{c.title}</div>
                      {c.severity && <span className="text-[11px] text-[var(--color-muted)] capitalize">{c.severity}</span>}
                    </div>
                    {c.detail && <div className="text-xs text-[var(--color-ink)] mt-1">{c.detail}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {report.hearingTopics && report.hearingTopics.length > 0 && (
            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-3">
              <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Expected hearing focus</div>
              <ul className="list-disc ml-5 text-sm text-[var(--color-ink)] space-y-1">
                {report.hearingTopics.map((h, idx) => <li key={idx}>{h}</li>)}
              </ul>
            </div>
          )}
          {report.finalNote && (
            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-3">
              <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Final advisory note</div>
              <div className="text-sm text-[var(--color-ink)]">{report.finalNote}</div>
            </div>
          )}
          {report.examinerQuestions && report.examinerQuestions.length > 0 && (
            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-3">
              <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Likely inspector questions</div>
              <ul className="list-disc ml-5 text-sm text-[var(--color-ink)] space-y-1">
                {report.examinerQuestions.map((q, idx) => <li key={idx}>{q}</li>)}
              </ul>
            </div>
          )}
        </div>

        {!hideSidebar && (
        /* Column 3: submission/readiness artifacts + interaction */
        <div className="space-y-3 lg:sticky lg:top-4">
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
            <div className="text-xs text-[var(--color-muted)]">RAG: {(topics || []).filter(m => (m.rag || '').toLowerCase() === 'green').length} green / {(topics || []).filter(m => (m.rag || '').toLowerCase() === 'amber').length} amber / {(topics || []).filter(m => (m.rag || '').toLowerCase() === 'red').length} red</div>
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
        </div>
        )}
      </div>
      {!hideSidebar && showAnswerModal && answer && (
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
