import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { CouncilData } from '../../../../data/types'
import { usePlan } from '../../../../contexts/PlanContext'
import { STAGES } from '../../../../data/stageMeta'
import { callLLM } from '../../../../utils/llmClient'

type BaselineGrid = {
  biodiversity?: string
  water?: string
  climate?: string
  landscape?: string
  heritage?: string
}

type BaselineStatus = 'red' | 'amber' | 'green'
type ConsultationStatus = 'not_started' | 'live' | 'complete'

const GRID_KEYS: Array<keyof BaselineGrid> = ['biodiversity', 'water', 'climate', 'landscape', 'heritage']
const GRID_LABELS: Record<keyof BaselineGrid, string> = {
  biodiversity: 'Biodiversity',
  water: 'Water',
  climate: 'Climate',
  landscape: 'Landscape',
  heritage: 'Cultural heritage'
}

const defaultGrid: BaselineGrid = { biodiversity: '', water: '', climate: '', landscape: '', heritage: '' }

function splitLines(val: string | undefined): string[] {
  if (!val) return []
  return val
    .split('\n')
    .map(v => v.trim())
    .filter(Boolean)
}

function joinLines(arr: string[] | undefined): string {
  return (arr || []).filter(Boolean).join('\n')
}

function clamp(num: number, min = 0, max = 100) {
  if (Number.isNaN(num)) return min
  return Math.max(min, Math.min(max, num))
}

function extractJsonObject(raw: string): any | undefined {
  if (!raw) return undefined
  const candidates: string[] = []
  const trimmed = raw.trim()
  candidates.push(trimmed)
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) candidates.push(fenced[1].trim())
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

function computeBaselineCompleteness(grid: BaselineGrid): BaselineStatus {
  const total = GRID_KEYS.length
  const filled = GRID_KEYS.filter(k => (grid[k] || '').trim().length > 0).length
  const ratio = filled / total
  if (ratio >= 0.9) return 'green'
  if (ratio >= 0.5) return 'amber'
  return 'red'
}

function buildScopingReport(opts: {
  area?: string
  scopingStatus: string
  consultationStatus: ConsultationStatus
  baseline: BaselineGrid
  baselineStatus: BaselineStatus
  hra: string
  mitigation: string[]
  risks: string[]
  cumulativeEffects: string
  notes: string
}) {
  const { area, scopingStatus, consultationStatus, baseline, baselineStatus, hra, mitigation, risks, cumulativeEffects, notes } = opts
  const blocks = GRID_KEYS.map(k => `- ${GRID_LABELS[k]}: ${baseline[k] || 'Not captured yet'}`).join('\n')
  const mitigationText = mitigation.length ? mitigation.map(m => `- ${m}`).join('\n') : '- Not set'
  const risksText = risks.length ? risks.map(r => `- ${r}`).join('\n') : '- Not logged'
  return [
    `SEA/HRA Scoping Summary for ${area || 'the plan area'}`,
    `Scoping status: ${scopingStatus} | Consultation: ${consultationStatus} | Baseline completeness: ${baselineStatus.toUpperCase()}`,
    'Baseline grid:',
    blocks,
    `HRA baseline: ${hra || 'Not captured'}`,
    'Mitigation & monitoring ideas:',
    mitigationText,
    'Key risks / likely significant effects:',
    risksText,
    `Cumulative / in-combination effects: ${cumulativeEffects || 'Not captured'}`,
    `Notes: ${notes || 'None recorded'}`
  ].join('\n\n')
}

export interface SEAToolProps {
  councilData: CouncilData
  autoRun?: boolean
  onSaved?: () => void
  initialData?: Record<string, any>
}

export const SEATool: React.FC<SEAToolProps> = ({ councilData, onSaved, initialData, autoRun }) => {
  const { activePlan, updatePlan } = usePlan()
  const [scopingStatus, setScopingStatus] = useState<'Not started' | 'Drafted' | 'Consulted'>('Not started')
  const [scopingNotes, setScopingNotes] = useState('')
  const [hraSummary, setHraSummary] = useState('')
  const [baselineGrid, setBaselineGrid] = useState<BaselineGrid>(defaultGrid)
  const [baselineCompleteness, setBaselineCompleteness] = useState<BaselineStatus>('red')
  const [consultationStatus, setConsultationStatus] = useState<ConsultationStatus>('not_started')
  const [consultationNotes, setConsultationNotes] = useState('')
  const [mitigationIdeas, setMitigationIdeas] = useState<string[]>([])
  const [keyRisks, setKeyRisks] = useState<string[]>([])
  const [cumulativeEffects, setCumulativeEffects] = useState('')
  const [readinessScore, setReadinessScore] = useState<number>(0)
  const [readinessNotes, setReadinessNotes] = useState('')
  const [environmentalDatabase, setEnvironmentalDatabase] = useState<string[]>([])
  const [reportDraft, setReportDraft] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const stageMeta = useMemo(() => STAGES.find(s => s.id === activePlan?.planStage), [activePlan?.planStage])
  const areaName = useMemo(() => activePlan?.area || councilData?.name || 'Local Plan area', [activePlan?.area, councilData?.name])

  useEffect(() => {
    if (!activePlan) return
    const s = activePlan.seaHra || {}
    setScopingStatus((s.seaScopingStatus as any) || 'Not started')
    setScopingNotes(s.seaScopingNotes || '')
    setHraSummary(s.hraBaselineSummary || '')
    setBaselineGrid({ ...defaultGrid, ...(s.baselineGrid || {}) })
    setBaselineCompleteness((s.baselineCompleteness as BaselineStatus) || computeBaselineCompleteness(s.baselineGrid || defaultGrid))
    setConsultationStatus((s.consultationStatus as ConsultationStatus) || 'not_started')
    setConsultationNotes(s.consultationNotes || '')
    setMitigationIdeas(s.mitigationIdeas || [])
    setKeyRisks(s.keyRisks || [])
    setCumulativeEffects(s.cumulativeEffects || '')
    setReadinessScore(typeof s.readinessScore === 'number' ? s.readinessScore : 0)
    setReadinessNotes(s.readinessNotes || '')
    setEnvironmentalDatabase(s.environmentalDatabase || [])
    setReportDraft(s.reportDraft || '')
  }, [activePlan?.id])

  // Apply LLM/tool prefill if provided and fields are blank
  useEffect(() => {
    if (!initialData) return
    setBaselineGrid(prev => ({ ...prev, ...(initialData.baselineGrid || {}) }))
    if (initialData.seaScopingStatus && scopingStatus === 'Not started') setScopingStatus(initialData.seaScopingStatus)
    if (initialData.seaScopingNotes && !scopingNotes) setScopingNotes(initialData.seaScopingNotes)
    if (initialData.hraBaselineSummary && !hraSummary) setHraSummary(initialData.hraBaselineSummary)
    if (initialData.mitigationIdeas && mitigationIdeas.length === 0) setMitigationIdeas(initialData.mitigationIdeas)
    if (initialData.keyRisks && keyRisks.length === 0) setKeyRisks(initialData.keyRisks)
    if (initialData.consultationStatus && consultationStatus === 'not_started') setConsultationStatus(initialData.consultationStatus)
    if (initialData.consultationNotes && !consultationNotes) setConsultationNotes(initialData.consultationNotes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData])

  useEffect(() => {
    setBaselineCompleteness(computeBaselineCompleteness(baselineGrid))
  }, [baselineGrid])

  useEffect(() => {
    if (!autoRun) return
    if (!reportDraft) {
      setReportDraft(buildScopingReport({
        area: areaName,
        scopingStatus,
        consultationStatus,
        baseline: baselineGrid,
        baselineStatus: baselineCompleteness,
        hra: hraSummary,
        mitigation: mitigationIdeas,
        risks: keyRisks,
        cumulativeEffects,
        notes: scopingNotes || readinessNotes
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun])

  const derivedReadiness = useMemo(() => {
    if (readinessScore > 0) return clamp(readinessScore)
    let score = 20
    if (scopingStatus === 'Drafted') score += 20
    if (scopingStatus === 'Consulted') score += 35
    if (baselineCompleteness === 'amber') score += 15
    if (baselineCompleteness === 'green') score += 30
    if (consultationStatus === 'live') score += 10
    if (consultationStatus === 'complete') score += 20
    return clamp(score)
  }, [readinessScore, scopingStatus, baselineCompleteness, consultationStatus])

  const warnings = useMemo(() => {
    const list: string[] = []
    if (scopingStatus === 'Not started') list.push('SEA scoping not started.')
    if (baselineCompleteness === 'red') list.push('Baseline grid is incomplete; fill all five topics.')
    if (!hraSummary.trim()) list.push('HRA baseline is blank.')
    if (consultationStatus === 'not_started') list.push('SEA/HRA consultation not logged.')
    if (keyRisks.length === 0) list.push('No risks or likely significant effects captured.')
    return list
  }, [scopingStatus, baselineCompleteness, hraSummary, consultationStatus, keyRisks.length])

  const baselineStatusColor = baselineCompleteness === 'green' ? 'bg-green-100 text-green-800 border-green-200' : baselineCompleteness === 'amber' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-red-100 text-red-800 border-red-200'

  const handleQuickFill = async () => {
    if (!activePlan) return
    setAiLoading(true)
    setError(null)
    try {
      const prompt = [
        'You are a SEA/HRA scoping assistant. Return JSON only.',
        'Shape: { baseline: { biodiversity, water, climate, landscape, heritage }, hra: string, notes: string, mitigation: [string], risks: [string], consultationNote?: string, cumulative?: string }',
        `Plan area: ${areaName}`,
        `Plan title: ${activePlan.title || areaName}`,
        `Stage: ${stageMeta?.label || activePlan.planStage}`,
        `Existing baseline notes: ${JSON.stringify(baselineGrid)}`,
        `SEA status: ${scopingStatus}; Consultation: ${consultationStatus}`,
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const parsed = extractJsonObject(raw)
      const fallback = {
        baseline: {
          biodiversity: 'Statutory sites and SINCs mapped; flag priority habitats near allocations.',
          water: 'Flood zones/Surface water hotspots noted; check WFD status and catchment phosphates.',
          climate: 'Net zero targets; UHI/overheating hotspots; resilience measures expected.',
          landscape: 'Character/landscape sensitivity near centres and edges; tall building zones flagged.',
          heritage: 'Conservation areas/listed assets; consider setting/visual impacts for growth sites.'
        },
        notes: 'Record receptors, likely significant effects, consultation feedback, and data gaps.',
        hra: 'Screen nearby European sites; identify air, water, and recreation pathways (in-combination too).',
        mitigation: ['SuDS + green/blue infrastructure to reduce flood/heat', 'Mode shift and AQ mitigation near AQMAs'],
        risks: ['Baseline gaps across one or more topics', 'Scoping consultation not yet logged'],
        consultationNote: 'Log statutory consultees and publish scoping note.',
        cumulative: 'Check in-combination effects with neighbouring plans and major infrastructure.'
      }
      const data = parsed ? {
        baseline: { ...fallback.baseline, ...(parsed.baseline || {}) },
        notes: parsed.notes || fallback.notes,
        hra: parsed.hra || fallback.hra,
        mitigation: parsed.mitigation && parsed.mitigation.length ? parsed.mitigation : fallback.mitigation,
        risks: parsed.risks && parsed.risks.length ? parsed.risks : fallback.risks,
        consultationNote: parsed.consultationNote || fallback.consultationNote,
        cumulative: parsed.cumulative || fallback.cumulative
      } : fallback

      setBaselineGrid(prev => ({ ...prev, ...data.baseline }))
      if (!scopingNotes || scopingNotes.trim().length < 10) setScopingNotes(data.notes)
      if (!hraSummary || hraSummary.trim().length < 10) setHraSummary(data.hra)
      setMitigationIdeas(data.mitigation)
      setKeyRisks(data.risks)
      if (!consultationNotes || consultationNotes.trim().length < 10) setConsultationNotes(data.consultationNote || '')
      if (!cumulativeEffects || cumulativeEffects.trim().length < 5) setCumulativeEffects(data.cumulative)
      setError(parsed ? null : 'Used fallback prefills (LLM output not parsed).')
    } catch (e: any) {
      setError(e?.message || 'Failed to generate quick-fill content')
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateReport = () => {
    const draft = buildScopingReport({
      area: areaName,
      scopingStatus,
      consultationStatus,
      baseline: baselineGrid,
      baselineStatus: baselineCompleteness,
      hra: hraSummary,
      mitigation: mitigationIdeas,
      risks: keyRisks,
      cumulativeEffects,
      notes: scopingNotes || readinessNotes
    })
    setReportDraft(draft)
  }

  const save = async () => {
    if (!activePlan) return
    setSaving(true)
    setError(null)
    try {
      updatePlan(activePlan.id, {
        seaHra: {
          seaScopingStatus: scopingStatus,
          seaScopingNotes: scopingNotes,
          hraBaselineSummary: hraSummary,
          baselineGrid,
          baselineCompleteness,
          consultationStatus,
          consultationNotes,
          mitigationIdeas,
          keyRisks,
          cumulativeEffects,
          readinessScore: derivedReadiness,
          readinessNotes,
          environmentalDatabase,
          reportDraft
        }
      } as any)
      setSavedAt(Date.now())
      if (onSaved) onSaved()
    } catch (e: any) {
      setError(e?.message || 'Failed to save SEA/HRA')
    } finally {
      setSaving(false)
    }
  }

  const readinessDialStyle = {
    background: `conic-gradient(var(--color-accent) ${derivedReadiness * 3.6}deg, var(--color-surface) 0deg)`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--color-muted)]">SEA/HRA mission dashboard</div>
            <div className="text-lg font-semibold text-[var(--color-ink)]">{stageMeta?.label || 'Current stage'}</div>
            <p className="text-sm text-[var(--color-muted)]">{stageMeta?.seaHraFocus || 'Keep SEA/HRA visible at every stage.'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-[11px] rounded-full border ${baselineStatusColor}`}>Baseline: {baselineCompleteness.toUpperCase()}</span>
            <span className="px-2 py-1 text-[11px] rounded-full border bg-[var(--color-surface)] border-[var(--color-edge)]">Status: {scopingStatus}</span>
          </div>
        </div>
        {stageMeta?.dashboardNotes && stageMeta.dashboardNotes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {stageMeta.dashboardNotes.slice(0, 3).map((note, idx) => (
              <div key={idx} className="text-xs text-[var(--color-muted)] border border-[var(--color-edge)] rounded-lg p-2 bg-[var(--color-surface)]">{note}</div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="border border-[var(--color-edge)] rounded-xl p-4 bg-[var(--color-panel)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)]">Readiness & indicators</div>
              <p className="text-xs text-[var(--color-muted)]">Dial blends scoping status, baseline completeness, consultation, and any manual override.</p>
            </div>
            <div className="w-20 h-20 rounded-full border border-[var(--color-edge)] flex items-center justify-center text-lg font-semibold text-[var(--color-ink)]" style={readinessDialStyle}>
              <span className="bg-[var(--color-panel)] rounded-full w-14 h-14 flex items-center justify-center border border-[var(--color-edge)]">{derivedReadiness}%</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="text-sm text-[var(--color-ink)]">
              <div className="font-semibold">SEA scoping</div>
              <select value={scopingStatus} onChange={e => setScopingStatus(e.target.value as any)} className="mt-1 w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded">
                <option>Not started</option>
                <option>Drafted</option>
                <option>Consulted</option>
              </select>
            </div>
            <div className="text-sm text-[var(--color-ink)]">
              <div className="font-semibold">Consultation status</div>
              <select value={consultationStatus} onChange={e => setConsultationStatus(e.target.value as ConsultationStatus)} className="mt-1 w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded">
                <option value="not_started">Not started</option>
                <option value="live">Live</option>
                <option value="complete">Complete</option>
              </select>
            </div>
            <div className="text-sm text-[var(--color-ink)]">
              <div className="font-semibold">Manual readiness (optional)</div>
              <input type="range" min={0} max={100} value={readinessScore || derivedReadiness} onChange={e => setReadinessScore(Number(e.target.value))} className="w-full" />
              <div className="text-xs text-[var(--color-muted)]">Manual value overrides auto-dial when set.</div>
            </div>
          </div>
          <div className="mt-3">
            <label className="text-sm text-[var(--color-ink)] font-semibold">Readiness notes</label>
            <textarea value={readinessNotes} onChange={e => setReadinessNotes(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" placeholder="Quick-fix suggestions, blockers, evidence gaps" />
          </div>
        </div>

        <div className="border border-[var(--color-edge)] rounded-xl p-4 bg-[var(--color-panel)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)]">Actions</div>
              <p className="text-xs text-[var(--color-muted)]">Prefill, generate scoping report, and save back to the plan.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleQuickFill} disabled={aiLoading} className="px-3 py-2 text-sm rounded border border-[var(--color-edge)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]">
                {aiLoading ? 'Generating…' : 'AI quick-fill'}
              </button>
              <button type="button" onClick={handleGenerateReport} className="px-3 py-2 text-sm rounded border border-[var(--color-edge)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]">Generate scoping report</button>
              <button type="button" onClick={save} disabled={saving || !activePlan} className="px-3 py-2 text-sm rounded bg-[var(--color-accent)] text-white disabled:opacity-60 disabled:cursor-not-allowed">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
          {error && <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">Error: {error}</div>}
          {savedAt && !error && (
            <div className="mt-2 text-xs text-[var(--color-muted)]">Saved to plan at {new Date(savedAt).toLocaleTimeString()}</div>
          )}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-[var(--color-ink)]">SEA scoping notes</label>
              <textarea value={scopingNotes} onChange={e => setScopingNotes(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" placeholder="Key receptors, likely significant effects, data gaps" />
            </div>
            <div>
              <label className="text-sm font-semibold text-[var(--color-ink)]">Consultation notes</label>
              <textarea value={consultationNotes} onChange={e => setConsultationNotes(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" placeholder="Who/when/how, statutory body concerns, common themes" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="border border-[var(--color-edge)] rounded-xl p-4 bg-[var(--color-panel)]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)]">Baseline grid (5 blocks)</div>
              <p className="text-xs text-[var(--color-muted)]">Fill each block; completeness drives the readiness dial.</p>
            </div>
            <span className={`px-2 py-1 text-[11px] rounded-full border ${baselineStatusColor}`}>Completeness: {baselineCompleteness.toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GRID_KEYS.map(key => (
              <div key={key}>
                <div className="text-sm font-semibold text-[var(--color-ink)]">{GRID_LABELS[key]}</div>
                <textarea
                  value={baselineGrid[key] || ''}
                  onChange={e => setBaselineGrid(prev => ({ ...prev, [key]: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded"
                  placeholder="Auto-fill or capture from datasets (MAGIC, ONS, EA, local constraints)"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[var(--color-edge)] rounded-xl p-4 bg-[var(--color-panel)] space-y-3">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">HRA baseline</div>
            <textarea value={hraSummary} onChange={e => setHraSummary(e.target.value)} rows={4} className="mt-1 w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" placeholder="Screening starters, European sites, pathways, in-combination risks" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">Environmental database (datasets)</div>
            <textarea value={joinLines(environmentalDatabase)} onChange={e => setEnvironmentalDatabase(splitLines(e.target.value))} rows={3} className="mt-1 w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" placeholder="List datasets (e.g. MAGIC layers, EA flood zones, ONS emissions, local constraints)" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">Consultation status</div>
            <div className="text-xs text-[var(--color-muted)] mt-1">Public + statutory SEA consultation visibility.</div>
            <div className="mt-2 text-sm text-[var(--color-ink)] border border-[var(--color-edge)] rounded p-2 bg-[var(--color-surface)]">
              <div className="font-semibold mb-1">Public status: {consultationStatus === 'complete' ? 'Completed' : consultationStatus === 'live' ? 'Live' : 'Not started'}</div>
              <div className="text-xs text-[var(--color-muted)]">Keep this updated to reflect scoping/statutory engagement.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        <div className="border border-[var(--color-edge)] rounded-xl p-4 bg-[var(--color-panel)] space-y-3">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">Cumulative / in-combination effects</div>
            <textarea value={cumulativeEffects} onChange={e => setCumulativeEffects(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" placeholder="Summarise cumulative and in-combination effects (transport corridors, flood zones, nearby plans)" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)]">Mitigation & monitoring ideas</div>
              <textarea value={joinLines(mitigationIdeas)} onChange={e => setMitigationIdeas(splitLines(e.target.value))} rows={3} className="mt-1 w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" placeholder="One per line. E.g. habitat banking, phasing, modal shift requirements." />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)]">Risks / likely significant effects</div>
              <textarea value={joinLines(keyRisks)} onChange={e => setKeyRisks(splitLines(e.target.value))} rows={3} className="mt-1 w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" placeholder="One per line. E.g. coastal squeeze, air quality near AQMA, phosphate loading." />
            </div>
          </div>
        </div>

        <div className="border border-[var(--color-edge)] rounded-xl p-4 bg-[var(--color-panel)] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)]">Scoping report (auto template)</div>
              <p className="text-xs text-[var(--color-muted)]">Generated from grid, HRA, mitigation, risks.</p>
            </div>
            <button onClick={handleGenerateReport} className="text-xs text-[var(--color-accent)] hover:underline">Refresh draft</button>
          </div>
          <textarea value={reportDraft} onChange={e => setReportDraft(e.target.value)} rows={10} className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" placeholder="Generate a draft then edit. Use for SEA/HRA scoping publication." />
        </div>
      </div>

      <div className="border border-[var(--color-edge)] rounded-xl p-4 bg-[var(--color-panel)]">
        <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Inspector-style warnings</div>
        {warnings.length ? (
          <ul className="list-disc ml-5 text-sm text-[var(--color-ink)] space-y-1">
            {warnings.map((w, idx) => <li key={idx}>{w}</li>)}
          </ul>
        ) : (
          <div className="text-xs text-[var(--color-muted)]">No critical warnings. Keep SEA/HRA visible and update as you progress.</div>
        )}
      </div>
    </div>
  )
}
