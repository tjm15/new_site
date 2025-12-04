import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CouncilData, Gateway2Pack, Gateway2PackSection, Gateway2SectionStatus, Plan } from '../../../../data/types'
import { usePlan } from '../../../../contexts/PlanContext'
import { callLLM } from '../../../../utils/llmClient'
import { summarizeSeaHra } from '../../../../utils/seaHra'
import { LoadingSpinner } from '../../shared/LoadingSpinner'
import { MarkdownContent } from '../../../../components/MarkdownContent'

const PACK_SECTIONS: Gateway2PackSection[] = [
  { id: 'summary', title: 'Gateway 2 Summary Document', status: 'draft' },
  { id: 'evidence', title: 'Evidence Tracker', status: 'draft' },
  { id: 'risks', title: 'Soundness Risk Commentary', status: 'draft' },
  { id: 'workshop', title: 'Gateway 2 Workshop Briefing Pack', status: 'draft' },
  { id: 'consistency', title: 'Consistency & Alignment Map', status: 'draft' },
  { id: 'checklist', title: 'Readiness Checklist & Next Steps', status: 'draft' }
]

const STATUS_LABEL: Record<Gateway2SectionStatus, string> = {
  draft: 'Draft',
  needs_review: 'Needs Review',
  ready: 'Ready',
  locked: 'Locked'
}

type ScorecardArea = { id: string; title: string; rag: 'red' | 'amber' | 'green'; reason?: string }

type GeneratorResponse = {
  summary?: string
  evidenceTracker?: string
  soundnessRisks?: string
  workshop?: string
  consistency?: string
  checklist?: string
  warnings?: string[] | string
  diagnostics?: string
  actions?: string[]
  questions?: string[]
  manifest?: Array<{ id: string; title: string; status: string; note?: string }>
  scorecard?: { overall?: 'Red' | 'Amber' | 'Green'; areas?: ScorecardArea[] }
}

function extractJson(raw: string): GeneratorResponse | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  const candidates: string[] = [trimmed]
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced && fenced[1]) candidates.push(fenced[1].trim())
  const first = trimmed.indexOf('{')
  const last = trimmed.lastIndexOf('}')
  if (first !== -1 && last > first) candidates.push(trimmed.slice(first, last + 1))
  for (const c of candidates) {
    try {
      return JSON.parse(c)
    } catch {
      continue
    }
  }
  return undefined
}

function ragBadge(rag?: string) {
  const base = 'px-2 py-1 text-[11px] rounded-full border'
  if (rag === 'green' || rag === 'Green') return `${base} bg-green-100 text-green-800 border-green-200`
  if (rag === 'amber' || rag === 'Amber') return `${base} bg-amber-100 text-amber-800 border-amber-200`
  if (rag === 'red' || rag === 'Red') return `${base} bg-red-100 text-red-800 border-red-200`
  return `${base} bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-edge)]`
}

function statusBadge(status?: Gateway2SectionStatus) {
  const base = 'px-2 py-1 text-[11px] rounded-full border'
  if (status === 'ready') return `${base} bg-green-50 text-green-700 border-green-200`
  if (status === 'needs_review') return `${base} bg-amber-50 text-amber-800 border-amber-200`
  if (status === 'locked') return `${base} bg-slate-100 text-[var(--color-ink)] border-[var(--color-edge)]`
  return `${base} bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-edge)]`
}

function mergeSections(existing: Gateway2PackSection[] | undefined): Gateway2PackSection[] {
  return PACK_SECTIONS.map(section => {
    const found = existing?.find(s => s.id === section.id)
    return { ...section, ...found, status: (found?.status || section.status || 'draft') as Gateway2SectionStatus }
  })
}

function buildPlanSnapshot(plan?: Plan, council?: CouncilData) {
  if (!plan || !council) return 'No plan context.'
  const vision = (plan.visionStatements || []).map(v => `- ${v.text}${v.metric ? ` (${v.metric})` : ''}`).join('\n') || 'No vision statements recorded.'
  const outcomes = (plan.smartOutcomes || []).map(o => `- ${o.text}${o.metric ? ` | Metric: ${o.metric}` : ''}`).join('\n') || 'No SMART outcomes logged.'
  const strategy = plan.preferredOptions?.strategy?.analysis
    || plan.preferredOptions?.strategy?.label
    || (council.strategies || []).map(s => `${s.label}: ${s.desc}`).join('\n') || 'No strategy recorded.'
  const sites = (plan.sites || []).map(s => {
    const decision = (plan.siteDecisions || []).find(d => d.siteId === s.id)
    return `- ${s.name}: ${s.notes || s.description || 'No summary'} | RAG ${[s.suitability, s.availability, s.achievability].filter(Boolean).join('/') || 'n/a'} | Decision: ${decision?.decision || 'undecided'}`
  }).join('\n') || 'No site records.'
  const evidence = (plan.evidenceInventory || []).map(ev => `- ${ev.title}${ev.status ? ` [${ev.status}]` : ''}${ev.year ? ` (${ev.year})` : ''}${ev.core ? ' • core' : ''}${ev.seaHraRelevant ? ' • SEA/HRA' : ''}`).join('\n') || 'No evidence logged.'
  const seaSummary = summarizeSeaHra(plan)
  const seaHra = [
    seaSummary.statusLine,
    `Baseline: ${seaSummary.baseline}`,
    `HRA: ${seaSummary.hra}`,
    `Mitigation: ${seaSummary.mitigation}`,
    `Risks: ${seaSummary.risks}`,
    `Consultation: ${seaSummary.consultation}`,
    `Cumulative: ${seaSummary.cumulative}`
  ].join('\n')
  const consultations = (plan.consultationSummaries || []).map(c => `- ${c.stageId}: ${c.who} | ${c.when} | ${c.how} | Issues: ${(c.mainIssues || []).join('; ')}`).join('\n') || 'No consultation summaries captured.'
  const timetable = (plan.timetable?.milestones || []).map(m => `- ${m.stageId}: ${m.date}`).join('\n') || 'No timetable recorded.'
  const risks = plan.gateway2Risks || plan.prepRiskAssessment?.overallComment || 'No Gateway 2 risks recorded.'
  return [
    `Authority: ${council.name}`,
    `Plan: ${plan.title} | Stage: ${plan.planStage || 'unknown'}`,
    '[Vision]\n' + vision,
    '[SMART Outcomes]\n' + outcomes,
    '[Strategy]\n' + strategy,
    '[Sites]\n' + sites,
    '[Evidence]\n' + evidence,
    '[SEA / HRA]\n' + seaHra,
    '[Consultation summaries]\n' + consultations,
    '[Timetable]\n' + timetable,
    '[Recorded risks]\n' + risks
  ].join('\n\n')
}

export const Gateway2ReadinessTool: React.FC<{ plan?: Plan; councilData: CouncilData; autoRun?: boolean }> = ({ plan, councilData, autoRun }) => {
  const { updatePlan } = usePlan()
  const [sections, setSections] = useState<Gateway2PackSection[]>(PACK_SECTIONS)
  const [selectedSectionId, setSelectedSectionId] = useState<string>('summary')
  const [warnings, setWarnings] = useState<string>('')
  const [diagnostics, setDiagnostics] = useState<string>('')
  const [actions, setActions] = useState<string[]>([])
  const [questions, setQuestions] = useState<string[]>([])
  const [manifest, setManifest] = useState<Array<{ id: string; title: string; status: string; note?: string }>>([])
  const [scorecard, setScorecard] = useState<{ overall?: string; areas?: ScorecardArea[] }>({})
  const [readinessRag, setReadinessRag] = useState<'red' | 'amber' | 'green' | undefined>()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'edit' | 'preview'>('preview')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const autoRan = useRef(false)

  const workingPlan = plan?.councilId === councilData.id ? plan : undefined
  const selectedSection = sections.find(s => s.id === selectedSectionId) || sections[0]
  const planSnapshot = useMemo(() => buildPlanSnapshot(workingPlan, councilData), [workingPlan, councilData])

  useEffect(() => {
    if (!workingPlan) return
    const existingPack: Gateway2Pack | undefined = workingPlan.gateway2Pack
    if (existingPack) {
      setSections(mergeSections(existingPack.sections))
      setSelectedSectionId('summary')
      setWarnings(existingPack.warningsMarkdown || workingPlan.gateway2Risks || '')
      setDiagnostics(existingPack.diagnostics || '')
      setActions(existingPack.actions || [])
      setQuestions(existingPack.questions || [])
      setManifest(existingPack.manifest || [])
      const storedAreas = Array.isArray(existingPack.scorecard) ? existingPack.scorecard as ScorecardArea[] : (existingPack.scorecard as any)?.areas
      const storedOverall = !Array.isArray(existingPack.scorecard) ? (existingPack.scorecard as any)?.overall : undefined
      setScorecard({ overall: storedOverall || existingPack.readinessRag, areas: storedAreas })
      setReadinessRag((existingPack.readinessRag || storedOverall?.toLowerCase?.()) as any)
      setStatus('Loaded previous Gateway 2 pack.')
      return
    }
    // no saved pack: seed defaults
    setSections(mergeSections(undefined))
    setSelectedSectionId('summary')
    setWarnings(workingPlan.gateway2Risks || '')
    setDiagnostics('')
    setActions([])
    setQuestions([])
    setManifest([])
    setScorecard({})
    setReadinessRag(undefined)
    setStatus(null)
  }, [workingPlan?.id])

  useEffect(() => {
    if (autoRun && workingPlan && !autoRan.current) {
      const hasContent = (workingPlan.gateway2Pack?.sections || []).some(s => s.content)
      if (!hasContent) {
        autoRan.current = true
        runGeneration()
      }
    }
  }, [autoRun, workingPlan])

  const readinessScore = useMemo(() => {
    if (!scorecard?.areas || scorecard.areas.length === 0) return undefined
    const map: Record<string, number> = { red: 1, amber: 2, green: 3, Red: 1, Amber: 2, Green: 3 }
    const scores = scorecard.areas.map(a => map[a.rag] || 0).filter(Boolean)
    if (!scores.length) return undefined
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    return Math.round(avg * 10) / 10
  }, [scorecard])

  const updateSectionContent = (id: string, content: string) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, content } : s)))
  }

  const updateSectionStatus = (id: string, status: Gateway2SectionStatus) => {
    setSections(prev => prev.map(s => (s.id === id ? { ...s, status } : s)))
  }

  const persistToPlan = (nextPack: Partial<Gateway2Pack>) => {
    if (!workingPlan) return
    const sectionsToSave = (nextPack.sections as Gateway2PackSection[] | undefined) || sections
    const manifestToSave = nextPack.manifest || manifest
    const actionsToSave = nextPack.actions || actions
    const questionsToSave = nextPack.questions || questions
    const warningsToSave = nextPack.warningsMarkdown || warnings
    const diagnosticsToSave = nextPack.diagnostics || diagnostics
    const scorecardToSave = nextPack.scorecard || (scorecard?.areas ? scorecard.areas : scorecard)
    const readinessRagToSave = nextPack.readinessRag ?? readinessRag
    const readinessScoreToSave = nextPack.readinessScore ?? readinessScore
    const mergedPack: Gateway2Pack = {
      ...workingPlan.gateway2Pack,
      ...nextPack,
      sections: sectionsToSave,
      manifest: manifestToSave,
      actions: actionsToSave,
      questions: questionsToSave,
      warningsMarkdown: warningsToSave,
      diagnostics: diagnosticsToSave,
      generatedAt: new Date().toISOString(),
      readinessRag: readinessRagToSave,
      readinessScore: readinessScoreToSave,
      scorecard: scorecardToSave,
    }
    updatePlan(workingPlan.id, {
      gateway2Pack: mergedPack,
      gateway2Checklist: sectionsToSave.find(s => s.id === 'checklist')?.content || workingPlan.gateway2Checklist,
      gateway2Risks: sectionsToSave.find(s => s.id === 'risks')?.content || workingPlan.gateway2Risks || warningsToSave,
      gateway2Summary: sectionsToSave.find(s => s.id === 'summary')?.content || workingPlan.gateway2Summary,
    })
    setStatus('Saved to plan.')
  }

  const runGeneration = async (focusId?: string) => {
    if (!workingPlan) return
    setLoading(true)
    setStatus(null)
    setError(null)
    const prompt = [
      'SYSTEM:',
      'You are the Gateway 2 Readiness Pack builder for a Local Plan (MHCLG CULP workflow).',
      'You must assemble the pack to: demonstrate progress, flag soundness/legal risks, cross-check consistency, and prepare for the Gateway 2 workshop.',
      'Keep SEA/HRA progress, alternatives testing, and consultation evidence visible. Do not invent new sites/policies/numbers.',
      '',
      'OUTPUT: Return JSON ONLY with keys: {',
      '  "summary": string (Gateway 2 summary doc),',
      '  "evidenceTracker": string (table/markdown),',
      '  "soundnessRisks": string (risk commentary + mitigations),',
      '  "workshop": string (briefing topics/questions),',
      '  "consistency": string (highlight alignment + contradictions),',
      '  "checklist": string (readiness checklist with actions),',
      '  "scorecard": { "overall": "Red|Amber|Green", "areas": [{ "title": string, "rag": "Red|Amber|Green", "reason": string }] },',
      '  "actions": [string],',
      '  "questions": [string],',
      '  "manifest": [{ "id": string, "title": string, "status": "present|missing|weak|draft", "note": string }],',
      '  "warnings": [string],',
      '  "diagnostics": string',
      '}',
      'Rules:',
      '- Ground everything in the provided plan snapshot and consultation/evidence signals.',
      '- Prefer concise, inspector-facing markdown. Bullets where helpful.',
      '- Checklist must cover completeness, consistency, and SEA/alternatives coverage.',
      '- If data is sparse, say so plainly and suggest what to add.',
      focusId ? `Focus: refresh the "${PACK_SECTIONS.find(s => s.id === focusId)?.title || focusId}" section but keep the rest coherent.` : 'Generate all sections.',
      '',
      'PLAN SNAPSHOT:',
      planSnapshot
    ].join('\n')

    try {
      const raw = await callLLM({ prompt, mode: 'json' })
      const parsed = extractJson(raw || '') || (raw ? { summary: raw } : {})
      const nextWarnings = Array.isArray(parsed?.warnings) ? parsed.warnings.join('\n') : (parsed?.warnings || '')
      const nextSections = mergeSections(sections).map(section => {
        const current = sections.find(s => s.id === section.id)
        const contentMap: Record<string, string | undefined> = {
          summary: parsed?.summary,
          evidence: parsed?.evidenceTracker,
          risks: parsed?.soundnessRisks,
          workshop: parsed?.workshop,
          consistency: parsed?.consistency,
          checklist: parsed?.checklist
        }
        return {
          ...section,
          status: current?.status || section.status || 'draft',
          content: contentMap[section.id] !== undefined ? (contentMap[section.id] || '') : (current?.content || section.content || '')
        }
      })
      let nextScorecard: { overall?: string; areas?: ScorecardArea[] } = {}
      if (Array.isArray(parsed?.scorecard)) {
        nextScorecard = { areas: parsed.scorecard as ScorecardArea[] }
      } else if (parsed?.scorecard && typeof parsed.scorecard === 'object') {
        const sc: any = parsed.scorecard
        nextScorecard = { overall: sc.overall || sc.status, areas: sc.areas }
      }
      const rag = (nextScorecard.overall || '').toLowerCase() as 'red' | 'amber' | 'green'
      setSections(nextSections)
      setWarnings(nextWarnings)
      setDiagnostics(parsed?.diagnostics || '')
      setActions(parsed?.actions || [])
      setQuestions(parsed?.questions || [])
      setManifest(parsed?.manifest || [])
      setScorecard(nextScorecard)
      setReadinessRag(rag || readinessRag)
      setStatus('AI-generated pack draft ready.')
      persistToPlan({
        sections: nextSections,
        actions: parsed?.actions || actions,
        questions: parsed?.questions || questions,
        manifest: parsed?.manifest || manifest,
        warningsMarkdown: nextWarnings,
        diagnostics: parsed?.diagnostics || '',
        readinessRag: (rag || readinessRag) as any,
        scorecard: nextScorecard.areas || nextScorecard,
        generatedAt: new Date().toISOString()
      })
    } catch (e: any) {
      setError(e?.message || 'Unable to generate the pack right now.')
    } finally {
      setLoading(false)
    }
  }

  if (!workingPlan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan loaded</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to build the Gateway 2 readiness pack.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-[var(--color-muted)]">Gateway 2</div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Gateway 2 Readiness Pack</h2>
          <p className="text-sm text-[var(--color-muted)]">Assemble the submission pack, run readiness diagnostics, and prep the assessor briefing.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => runGeneration()}
            className="px-3 py-2 text-sm rounded bg-[var(--color-accent)] text-white border border-[var(--color-accent)] disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Building…' : 'Run readiness check'}
          </button>
          <button
            onClick={() => persistToPlan({})}
            className="px-3 py-2 text-sm rounded border border-[var(--color-edge)] bg-[var(--color-surface)]"
            disabled={loading}
          >
            Save pack
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr,320px] gap-4">
        {/* Section tree */}
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-2">
          <div className="text-sm font-semibold text-[var(--color-ink)]">Pack section tree</div>
          <p className="text-xs text-[var(--color-muted)] mb-2">Status: Draft / Needs review / Ready / Locked</p>
          <div className="space-y-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setSelectedSectionId(section.id)}
                className={`w-full text-left px-3 py-2 rounded border flex items-center justify-between gap-2 ${selectedSectionId === section.id ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-edge)] bg-[var(--color-surface)]'}`}
              >
                <span className="text-sm text-[var(--color-ink)]">{section.title}</span>
                <span className={statusBadge(section.status)}>{STATUS_LABEL[section.status || 'draft']}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {(['draft', 'needs_review', 'ready', 'locked'] as Gateway2SectionStatus[]).map(st => (
              <button
                key={st}
                onClick={() => updateSectionStatus(selectedSection.id, st)}
                className="text-xs border border-[var(--color-edge)] rounded px-2 py-1 hover:border-[var(--color-accent)]"
              >
                Set {STATUS_LABEL[st]}
              </button>
            ))}
          </div>
          <button
            onClick={() => runGeneration(selectedSectionId)}
            className="w-full mt-2 px-3 py-2 text-sm rounded bg-[var(--color-surface)] border border-[var(--color-edge)] hover:border-[var(--color-accent)]"
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Regenerate selected section'}
          </button>
          {status && <div className="text-[11px] text-[var(--color-muted)] mt-2">{status}</div>}
          {error && <div className="text-[11px] text-red-600 mt-2">{error}</div>}
        </div>

        {/* Main panel */}
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={ragBadge(readinessRag || scorecard?.overall)}>Readiness {scorecard?.overall || readinessRag || 'n/a'}</span>
              {readinessScore && <span className="px-2 py-1 text-[11px] rounded bg-[var(--color-surface)] border border-[var(--color-edge)]">Score: {readinessScore}/3</span>}
              {scorecard?.areas?.length ? <span className="text-xs text-[var(--color-muted)]">{scorecard.areas.length} checks</span> : null}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <button
                className={`px-3 py-1.5 rounded border ${mode === 'edit' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-edge)]'}`}
                onClick={() => setMode('edit')}
              >
                Edit
              </button>
              <button
                className={`px-3 py-1.5 rounded border ${mode === 'preview' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-edge)]'}`}
                onClick={() => setMode('preview')}
              >
                Preview
              </button>
            </div>
          </div>

          {scorecard?.areas?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {scorecard.areas.map((area, idx) => (
                <div key={idx} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)] flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-ink)]">{area.title || area.id}</div>
                    {area.reason && <div className="text-xs text-[var(--color-muted)] leading-snug">{area.reason}</div>}
                  </div>
                  <span className={ragBadge(area.rag)}>{area.rag?.toUpperCase?.() || area.rag}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[var(--color-muted)]">No scorecard yet. Run the readiness check.</div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">{selectedSection.title}</div>
                <div className="text-xs text-[var(--color-muted)]">AI-drafted and fully editable. Status: {STATUS_LABEL[selectedSection.status || 'draft']}.</div>
              </div>
            </div>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center py-8"
                >
                  <LoadingSpinner />
                </motion.div>
              ) : mode === 'edit' ? (
                <textarea
                  key="editor"
                  value={selectedSection.content || ''}
                  onChange={(e) => updateSectionContent(selectedSection.id, e.target.value)}
                  rows={16}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg p-3 text-sm text-[var(--color-ink)]"
                  placeholder="Run the readiness check to draft this section."
                />
              ) : (
                <div key="preview" className="prose prose-sm max-w-none text-[var(--color-ink)]">
                  {selectedSection.content ? <MarkdownContent content={selectedSection.content} /> : <div className="text-sm text-[var(--color-muted)]">No draft yet.</div>}
                </div>
              )}
            </AnimatePresence>
          </div>

          {(actions.length || questions.length) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {actions.length ? (
                <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                  <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Mitigations & next steps</div>
                  <ul className="list-disc ml-4 text-sm text-[var(--color-ink)] space-y-1">
                    {actions.map((a, idx) => <li key={idx}>{a}</li>)}
                  </ul>
                </div>
              ) : null}
              {questions.length ? (
                <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                  <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Likely assessor questions</div>
                  <ul className="list-disc ml-4 text-sm text-[var(--color-ink)] space-y-1">
                    {questions.map((q, idx) => <li key={idx}>{q}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Right rail */}
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-3">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">⚠️ Warnings & diagnostics</div>
            <div className="text-xs text-[var(--color-muted)] mb-2">Soundness/legal flags and consistency issues.</div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded p-2 text-sm whitespace-pre-wrap">
              {warnings ? <MarkdownContent content={warnings} /> : 'No warnings yet.'}
            </div>
            {diagnostics && <div className="text-xs text-[var(--color-muted)] mt-1">{diagnostics}</div>}
          </div>

          {manifest.length ? (
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Pack manifest</div>
              <div className="space-y-2">
                {manifest.map((item, idx) => (
                  <div key={idx} className="border border-[var(--color-edge)] rounded p-2 bg-[var(--color-surface)]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-[var(--color-ink)]">{item.title}</div>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-edge)]">{item.status}</span>
                    </div>
                    {item.note && <div className="text-xs text-[var(--color-muted)] mt-1">{item.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Sources used</div>
            <div className="text-xs text-[var(--color-muted)] mb-2">Snapshot of plan content feeding the pack.</div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded p-2 text-xs text-[var(--color-ink)] whitespace-pre-wrap max-h-64 overflow-auto">
              {planSnapshot}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
