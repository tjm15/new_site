import React, { useEffect, useMemo, useState } from 'react'
import {
  CouncilData,
  Plan,
  EvaluationWorkspace,
  EvaluationGridItem,
  EvaluationPerformanceSummary,
  EvaluationClassification
} from '../../../../data/types'
import { usePlan } from '../../../../contexts/PlanContext'
import { callLLM } from '../../../../utils/llmClient'
import { MarkdownContent } from '../../../../components/MarkdownContent'

function timestamp(): string {
  return new Date().toISOString()
}

function parseJsonObject(raw: string): any {
  if (!raw) return undefined
  const candidates = [raw]
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) candidates.push(fenced[1])
  const first = raw.indexOf('{')
  const last = raw.lastIndexOf('}')
  if (first !== -1 && last > first) candidates.push(raw.slice(first, last + 1))
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch {
      continue
    }
  }
  return undefined
}

function seedGrid(plan?: Plan, existing?: EvaluationGridItem[]): EvaluationGridItem[] {
  if (existing && existing.length) return existing
  const fromSites = (plan?.sites || []).map(site => ({
    id: `site_${site.id}`,
    refType: 'site' as const,
    name: site.name || 'Site',
    classification: 'keep',
    rationale: site.notes || '',
    indicatorSignals: [],
    status: 'amber' as const
  }))
  const seaRow: EvaluationGridItem = {
    id: 'sea',
    refType: 'sea',
    name: 'SEA/HRA effects & mitigation',
    classification: 'amend',
    rationale: plan?.seaHra?.cumulativeEffects || 'Review mitigation delivery and monitoring coverage.',
    indicatorSignals: [],
    status: 'amber'
  }
  return [...fromSites, seaRow]
}

function seedWorkspace(plan?: Plan): EvaluationWorkspace {
  const mock: EvaluationWorkspace = {
    performance: { worked: ['Active travel uptake'], notWorked: ['Slow brownfield delivery'], unexpected: ['Extra windfall sites'], triggerEvents: ['Land supply dipped year 3'], housingVsPlan: 'Slightly below trajectory in year 3' },
    evaluationGrid: seedGrid(plan, plan?.evaluationWorkspace?.evaluationGrid),
    spatialFindings: [{ id: 'mock_spatial', theme: 'Growth corridors', observation: 'Completions concentrated around corridor A; allocation B lagging.', severity: 'medium' }],
    seedPack: { evidenceRefresh: ['Housing needs update'], risks: ['Viability pressure'], strategicOptions: ['Corridor shift to station cluster'], visionRefresh: 'Refocus on 15-minute neighbourhoods', gateway1Prep: 'Draft timetable and notice' },
    reportVersions: []
  }
  if (plan?.evaluationWorkspace) {
    return { ...mock, ...plan.evaluationWorkspace, evaluationGrid: seedGrid(plan, plan.evaluationWorkspace.evaluationGrid) }
  }
  return mock
}

export const Year4EvaluationTool: React.FC<{ plan?: Plan; councilData: CouncilData }> = ({ plan, councilData }) => {
  const { updatePlan } = usePlan()
  const [workspace, setWorkspace] = useState<EvaluationWorkspace>(seedWorkspace())
  const [loading, setLoading] = useState(false)
  const [reportNote, setReportNote] = useState('')
  const authorityName = councilData.name
  const [smartBusy, setSmartBusy] = useState(false)
  const autoPrefillRan = React.useRef(false)

  useEffect(() => {
    if (!plan) return
    autoPrefillRan.current = false
    setWorkspace(seedWorkspace(plan))
  }, [plan?.id])

  useEffect(() => {
    if (!plan) return
    if (autoPrefillRan.current) return
    autoPrefillRan.current = true
    smartPrefill()
  }, [plan?.id])

  const persist = (next: EvaluationWorkspace, audit?: string) => {
    setWorkspace(next)
    if (plan) {
      const year4Text = reportNote || next.reportVersions?.slice(-1)[0]?.content
      const patch: any = { evaluationWorkspace: next }
      if (year4Text) patch.year4Evaluation = year4Text
      updatePlan(plan.id, patch)
    }
  }

  const updatePerformance = (field: keyof EvaluationPerformanceSummary, value: any) => {
    const perf = { ...(workspace.performance || {}) as EvaluationPerformanceSummary, [field]: value }
    persist({ ...workspace, performance: perf })
  }

  const updateGridItem = (id: string, patch: Partial<EvaluationGridItem>) => {
    const nextGrid = (workspace.evaluationGrid || []).map(item => item.id === id ? { ...item, ...patch } : item)
    persist({ ...workspace, evaluationGrid: nextGrid })
  }

  const addGridItem = () => {
    const item: EvaluationGridItem = { id: `item_${Date.now()}`, refType: 'policy', name: 'New policy', classification: 'amend', rationale: '', indicatorSignals: [], status: 'amber' }
    persist({ ...workspace, evaluationGrid: [...(workspace.evaluationGrid || []), item] })
  }

  const generatePerformance = async () => {
    if (!plan) return
    setLoading(true)
    try {
      const prompt = [
        'Generate a 4-year performance overview.',
        `Plan: ${plan.title} (${plan.area})`,
        `Authority: ${authorityName}`,
        `Monitoring highlights: ${JSON.stringify(plan.monitoringWorkspace || {})}`,
        `Sites: ${(plan.sites || []).map(s => `${s.name} ${s.capacityEstimate || ''}`).join('; ')}`,
        'Return JSON: { "worked": [string], "notWorked": [string], "unexpected": [string], "triggerEvents": [string], "housingVsPlan": string }'
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const parsed = (() => { try { return JSON.parse(raw) } catch { return {} } })()
      const perf: EvaluationPerformanceSummary = {
        worked: parsed.worked || [],
        notWorked: parsed.notWorked || [],
        unexpected: parsed.unexpected || [],
        triggerEvents: parsed.triggerEvents || [],
        housingVsPlan: parsed.housingVsPlan || ''
      }
      persist({ ...workspace, performance: perf }, 'Generated performance overview')
    } finally {
      setLoading(false)
    }
  }

  const autoClassify = async () => {
    if (!plan) return
    setLoading(true)
    try {
      const prompt = [
        'Classify policies/sites/SEA topics as keep/amend/remove/replace.',
        `Plan data: ${plan.title} (${plan.area})`,
        `Grid: ${JSON.stringify(workspace.evaluationGrid || [])}`,
        'Return JSON array with items: { id, classification, rationale, status }.'
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const parsed = (() => { try { return JSON.parse(raw) } catch { return [] } })()
      if (Array.isArray(parsed)) {
        const nextGrid = (workspace.evaluationGrid || []).map(item => {
          const match = parsed.find((p: any) => p.id === item.id)
          if (!match) return item
          return { ...item, classification: match.classification as EvaluationClassification, rationale: match.rationale || item.rationale, status: match.status || item.status }
        })
        persist({ ...workspace, evaluationGrid: nextGrid }, 'Auto-classified evaluation grid')
      }
    } finally {
      setLoading(false)
    }
  }

  const generateSpatialNarrative = async () => {
    if (!plan) return
    setLoading(true)
    try {
      const prompt = [
        'Write a spatial strategy effectiveness summary (heatmaps, corridor analysis, infrastructure timing, environmental outcomes).',
        `Sites: ${(plan.sites || []).map(s => s.name).join(', ') || 'none'}`,
        `SEA/HRA: ${plan.seaHra?.cumulativeEffects || 'n/a'}`,
        'Return markdown bullets.'
      ].join('\n')
      const summary = await callLLM({ mode: 'markdown', prompt })
      const finding = { id: `spatial_${Date.now()}`, theme: 'Spatial effectiveness', observation: summary, evidence: '', severity: 'medium' as const }
      persist({ ...workspace, spatialFindings: [...(workspace.spatialFindings || []), finding] }, 'Added spatial effectiveness finding')
    } finally {
      setLoading(false)
    }
  }

  const generateSeedPack = async () => {
    if (!plan) return
    setLoading(true)
    try {
      const prompt = [
        'Create a Next-Plan Seed Pack after the 4-year evaluation.',
        `Performance: ${JSON.stringify(workspace.performance || {})}`,
        `Evaluation grid: ${JSON.stringify(workspace.evaluationGrid || [])}`,
        'Return JSON: { visionRefresh: string, evidenceRefresh: [string], strategicOptions: [string], risks: [string], gateway1Prep: string }'
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const parsed = (() => { try { return JSON.parse(raw) } catch { return {} } })()
      const seed = {
        visionRefresh: parsed.visionRefresh || '',
        evidenceRefresh: parsed.evidenceRefresh || [],
        strategicOptions: parsed.strategicOptions || [],
        risks: parsed.risks || [],
        gateway1Prep: parsed.gateway1Prep || ''
      }
      persist({ ...workspace, seedPack: seed }, 'Generated Next-Plan Seed Pack')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    const lines = [
      `# Year-4 Evaluation – ${plan?.title || ''}`,
      '## Performance overview',
      `Worked: ${(workspace.performance?.worked || []).join('; ')}`,
      `Not worked: ${(workspace.performance?.notWorked || []).join('; ')}`,
      `Unexpected: ${(workspace.performance?.unexpected || []).join('; ')}`,
      `Trigger events: ${(workspace.performance?.triggerEvents || []).join('; ')}`,
      `Housing vs plan: ${workspace.performance?.housingVsPlan || 'n/a'}`,
      '## Keep / Amend / Delete',
      ...(workspace.evaluationGrid || []).map(i => `- ${i.name}: ${i.classification} | ${i.rationale || ''}`),
      '## Spatial strategy effectiveness',
      ...(workspace.spatialFindings || []).map(f => `- ${f.theme}: ${f.observation}`),
      '## Next-plan seed pack',
      `Vision refresh: ${workspace.seedPack?.visionRefresh || ''}`,
      `Evidence refresh: ${(workspace.seedPack?.evidenceRefresh || []).join('; ')}`,
      `Strategic options: ${(workspace.seedPack?.strategicOptions || []).join('; ')}`,
      `Risks: ${(workspace.seedPack?.risks || []).join('; ')}`,
      `Gateway 1 prep: ${workspace.seedPack?.gateway1Prep || ''}`
    ]
    const content = lines.join('\n\n')
    const version = { id: `eval_${Date.now()}`, title: 'Year-4 evaluation', content, createdAt: timestamp(), status: 'draft' as const }
    const nextVersions = [...(workspace.reportVersions || []), version]
    setReportNote(content)
    persist({ ...workspace, reportVersions: nextVersions }, 'Exported Year-4 evaluation pack')
  }

  const smartPrefill = async () => {
    if (!plan) return
    setSmartBusy(true)
    try {
      const prompt = [
        'You are preparing the Year-4 evaluation.',
        `Authority: ${authorityName}`,
        `Plan: ${plan.title} (${plan.area})`,
        `Monitoring highlights: ${JSON.stringify(plan.monitoringWorkspace || {})}`,
        `Sites: ${(plan.sites || []).map(s => `${s.name}:${s.capacityEstimate || ''}`).join('; ') || 'n/a'}`,
        `SEA/HRA: ${plan.seaHra?.cumulativeEffects || 'n/a'}`,
        'Return JSON: { performance: { worked:[], notWorked:[], unexpected:[], triggerEvents:[], housingVsPlan: string }, evaluationGrid: [{ id?:string, refType:"policy|site|sea|objective", name:string, classification:string, rationale:string }], seedPack: { visionRefresh, evidenceRefresh:[], strategicOptions:[], risks:[], gateway1Prep } }'
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const parsed = parseJsonObject(raw) || {}
      const nextGrid: EvaluationGridItem[] = Array.isArray(parsed.evaluationGrid)
        ? parsed.evaluationGrid.map((item: any, idx: number) => ({
            id: item.id || `prefill_${idx}`,
            refType: item.refType || 'policy',
            name: item.name || `Item ${idx + 1}`,
            classification: item.classification || 'amend',
            rationale: item.rationale || '',
            indicatorSignals: [],
            status: 'amber'
          }))
        : workspace.evaluationGrid || []
      const perf = parsed.performance ? {
        worked: parsed.performance.worked || [],
        notWorked: parsed.performance.notWorked || [],
        unexpected: parsed.performance.unexpected || [],
        triggerEvents: parsed.performance.triggerEvents || [],
        housingVsPlan: parsed.performance.housingVsPlan || ''
      } : workspace.performance
      const seed = parsed.seedPack ? {
        visionRefresh: parsed.seedPack.visionRefresh || '',
        evidenceRefresh: parsed.seedPack.evidenceRefresh || [],
        strategicOptions: parsed.seedPack.strategicOptions || [],
        risks: parsed.seedPack.risks || [],
        gateway1Prep: parsed.seedPack.gateway1Prep || ''
      } : workspace.seedPack
      persist({ ...workspace, evaluationGrid: nextGrid, performance: perf, seedPack: seed }, 'Smart-prefilled Year-4 evaluation')
    } finally {
      setSmartBusy(false)
    }
  }

  if (!plan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan loaded</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to run the Year-4 Evaluation tool. Mock evaluation content is shown.</p>
        <div className="mt-3 text-xs text-[var(--color-muted)]">
          <MarkdownContent markdown={workspace.seedPack?.visionRefresh || 'Mock evaluation content'} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold text-[var(--color-ink)]">Year-4 Evaluation & Next-Plan Seeding</div>
        <button onClick={exportReport} className="px-3 py-2 rounded bg-[var(--color-accent)] text-white text-xs">Export evaluation pack</button>
        <div className="text-xs text-[var(--color-muted)]">Versions: {(workspace.reportVersions || []).length}</div>
        <button onClick={smartPrefill} disabled={smartBusy} className="text-xs px-3 py-2 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">
          {smartBusy ? 'Prefilling…' : 'Smart fill from plan'}
        </button>
      </div>

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">1) Performance Overview Dashboard</div>
            <p className="text-xs text-[var(--color-muted)]">4-year trends: what worked, what has not, unexpected outcomes, triggers, housing trajectory.</p>
          </div>
          <button onClick={generatePerformance} disabled={loading} className="text-xs px-3 py-2 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">{loading ? 'Building…' : 'Auto-generate'}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <textarea value={(workspace.performance?.worked || []).join('\n')} onChange={e => updatePerformance('worked', e.target.value.split('\n').filter(Boolean))} rows={4} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2" placeholder="What worked (one per line)" />
          <textarea value={(workspace.performance?.notWorked || []).join('\n')} onChange={e => updatePerformance('notWorked', e.target.value.split('\n').filter(Boolean))} rows={4} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2" placeholder="What has not worked" />
          <textarea value={(workspace.performance?.unexpected || []).join('\n')} onChange={e => updatePerformance('unexpected', e.target.value.split('\n').filter(Boolean))} rows={4} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2" placeholder="Unexpected outcomes" />
          <textarea value={(workspace.performance?.triggerEvents || []).join('\n')} onChange={e => updatePerformance('triggerEvents', e.target.value.split('\n').filter(Boolean))} rows={4} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2" placeholder="Trigger events" />
          <textarea value={workspace.performance?.housingVsPlan || ''} onChange={e => updatePerformance('housingVsPlan', e.target.value)} rows={3} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2 md:col-span-2" placeholder="Housing delivery vs plan trajectory" />
        </div>
      </div>

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">2) Policy & Site Evaluation Grid</div>
            <p className="text-xs text-[var(--color-muted)]">Keep / amend / remove / replace recommendations with rationale, indicator signals, and overrides.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={addGridItem} className="text-xs px-3 py-2 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">Add row</button>
            <button onClick={autoClassify} disabled={loading} className="text-xs px-3 py-2 rounded bg-[var(--color-accent)] text-white">{loading ? 'Classifying…' : 'AI classify'}</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(workspace.evaluationGrid || []).map(item => (
            <div key={item.id} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)] space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase text-[var(--color-muted)]">{item.refType}</span>
                <input value={item.name} onChange={e => updateGridItem(item.id, { name: e.target.value })} className="flex-1 text-sm px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
                <select value={item.classification} onChange={e => updateGridItem(item.id, { classification: e.target.value as EvaluationClassification })} className="text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]">
                  <option value="keep">Keep</option>
                  <option value="amend">Amend</option>
                  <option value="remove">Remove</option>
                  <option value="replace">Replace</option>
                </select>
              </div>
              <textarea value={item.rationale || ''} onChange={e => updateGridItem(item.id, { rationale: e.target.value })} placeholder="Rationale / evidence" className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" rows={3} />
              <textarea value={(item.indicatorSignals || []).join(', ')} onChange={e => updateGridItem(item.id, { indicatorSignals: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Indicator signals" className="w-full text-[11px] px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
              <textarea value={item.officerOverride || ''} onChange={e => updateGridItem(item.id, { officerOverride: e.target.value })} placeholder="Officer override / rationale" className="w-full text-[11px] px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">3) Spatial Strategy Effectiveness Review</div>
            <p className="text-xs text-[var(--color-muted)]">Heatmaps, corridor analysis, infrastructure timing vs expected, environmental outcomes.</p>
          </div>
          <button onClick={generateSpatialNarrative} disabled={loading} className="text-xs px-3 py-2 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">{loading ? 'Drafting…' : 'Auto-draft'}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(workspace.spatialFindings || []).map(f => (
            <div key={f.id} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)] space-y-2">
              <input value={f.theme} onChange={e => {
                const next = (workspace.spatialFindings || []).map(s => s.id === f.id ? { ...s, theme: e.target.value } : s)
                persist({ ...workspace, spatialFindings: next })
              }} className="w-full text-sm px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
              <textarea value={f.observation} onChange={e => {
                const next = (workspace.spatialFindings || []).map(s => s.id === f.id ? { ...s, observation: e.target.value } : s)
                persist({ ...workspace, spatialFindings: next })
              }} rows={3} className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
              <textarea value={f.evidence || ''} onChange={e => {
                const next = (workspace.spatialFindings || []).map(s => s.id === f.id ? { ...s, evidence: e.target.value } : s)
                persist({ ...workspace, spatialFindings: next })
              }} rows={2} className="w-full text-[11px] px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" placeholder="Evidence / map refs" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">4) Next-Plan Seed Pack Generator</div>
            <p className="text-xs text-[var(--color-muted)]">Vision refresh, evidence refresh list, strategic options, Gateway 1 prep.</p>
          </div>
          <button onClick={generateSeedPack} disabled={loading} className="text-xs px-3 py-2 rounded bg-[var(--color-accent)] text-white">{loading ? 'Drafting…' : 'Auto-generate seed pack'}</button>
        </div>
        <textarea value={workspace.seedPack?.visionRefresh || ''} onChange={e => persist({ ...workspace, seedPack: { ...(workspace.seedPack || {}), visionRefresh: e.target.value } })} rows={3} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2" placeholder="Vision refresh note" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <textarea value={(workspace.seedPack?.evidenceRefresh || []).join('\n')} onChange={e => persist({ ...workspace, seedPack: { ...(workspace.seedPack || {}), evidenceRefresh: e.target.value.split('\n').filter(Boolean) } })} rows={4} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2" placeholder="Evidence refresh list" />
          <textarea value={(workspace.seedPack?.strategicOptions || []).join('\n')} onChange={e => persist({ ...workspace, seedPack: { ...(workspace.seedPack || {}), strategicOptions: e.target.value.split('\n').filter(Boolean) } })} rows={4} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2" placeholder="Strategic options to test" />
          <textarea value={(workspace.seedPack?.risks || []).join('\n')} onChange={e => persist({ ...workspace, seedPack: { ...(workspace.seedPack || {}), risks: e.target.value.split('\n').filter(Boolean) } })} rows={4} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2" placeholder="Risks / issues" />
          <textarea value={workspace.seedPack?.gateway1Prep || ''} onChange={e => persist({ ...workspace, seedPack: { ...(workspace.seedPack || {}), gateway1Prep: e.target.value } })} rows={4} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2" placeholder="Gateway 1 prep note" />
        </div>
      </div>

      {workspace.reportVersions && workspace.reportVersions.length > 0 && (
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
          <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Evaluation report versions</div>
          <div className="space-y-2">
            {workspace.reportVersions.slice(-3).map(v => (
              <div key={v.id} className="border border-dashed border-[var(--color-edge)] rounded p-2 bg-[var(--color-surface)]">
                <div className="text-sm font-semibold text-[var(--color-ink)]">{v.title || v.id}</div>
                <div className="text-[10px] text-[var(--color-muted)]">{v.status || 'draft'} · {new Date(v.createdAt).toLocaleString()}</div>
                <MarkdownContent markdown={v.content.slice(0, 320) + (v.content.length > 320 ? '…' : '')} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
