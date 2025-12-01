import React, { useEffect, useMemo, useState } from 'react'
import {
  CouncilData,
  Plan,
  MonitoringIndicatorDefinition,
  MonitoringWorkspace,
  MonitoringProfile,
  MonitoringReportDraft,
  TriggerRule
} from '../../../../data/types'
import { callLLM } from '../../../../utils/llmClient'
import { usePlan } from '../../../../contexts/PlanContext'
import { MarkdownContent } from '../../../../components/MarkdownContent'

const THEMES = ['housing', 'economy', 'transport', 'environment', 'infrastructure', 'sea/hra']

const MONITORING_MOCK: MonitoringWorkspace = {
  mode: 'configuration',
  indicatorRegistry: [
    { id: 'ind_housing', name: 'Housing delivery vs requirement', category: 'housing', baseline: '92% (year 1-3)', target: '100%', source: 'LPA completions', frequency: 'annual', trigger: '<95% for 2 years', seaHraRelevant: false },
    { id: 'ind_sea', name: 'SEA mitigation delivery', category: 'environment', baseline: 'Two measures in place', target: 'All critical mitigation funded', source: 'SEA monitoring log', frequency: 'annual', trigger: 'Mitigation slippage >6 months', seaHraRelevant: true }
  ],
  mitigationMonitoring: [
    { effect: 'Transport emissions increase near growth corridors', indicators: ['ind_sea'], team: 'Transport', coverage: 'weak', note: 'Align with LTCP data' }
  ],
  profiles: [
    { id: 'amr', name: 'Annual Monitoring Report', type: 'AMR', indicators: ['ind_housing', 'ind_sea'], schedule: 'Annual', outputs: ['HTML', 'PDF'] },
    { id: 'sea', name: 'SEA/HRA monitoring', type: 'SEA_HRA', indicators: ['ind_sea'], schedule: 'Annual' }
  ],
  triggerRules: [{ id: 'tr_hls', title: 'Housing land supply drop', condition: '<5Y land supply for 2 consecutive years', response: 'Trigger early review discussion', status: 'watch' }],
  configVersions: [],
  annualReports: [
    { year: String(new Date().getFullYear()), narratives: { overview: 'Mock AMR narrative placeholder.' }, keyMessages: ['Housing delivery stable', 'SEA mitigation lagging'], status: 'draft' }
  ],
  variationSummary: 'Mock variation summary across years.',
  lastCommittedAt: undefined
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

function timestamp(): string {
  return new Date().toISOString()
}

function seedWorkspace(existing?: MonitoringWorkspace): MonitoringWorkspace {
  const base: MonitoringWorkspace = {
    ...MONITORING_MOCK,
    indicatorRegistry: [...(MONITORING_MOCK.indicatorRegistry || [])],
    mitigationMonitoring: [...(MONITORING_MOCK.mitigationMonitoring || [])],
    profiles: [...(MONITORING_MOCK.profiles || [])],
    triggerRules: [...(MONITORING_MOCK.triggerRules || [])],
    configVersions: [...(MONITORING_MOCK.configVersions || [])],
    annualReports: [...(MONITORING_MOCK.annualReports || [])],
  }
  if (!existing) return base
  return {
    ...base,
    ...existing,
    indicatorRegistry: existing.indicatorRegistry ? [...existing.indicatorRegistry] : base.indicatorRegistry,
    mitigationMonitoring: existing.mitigationMonitoring ? [...existing.mitigationMonitoring] : base.mitigationMonitoring,
    profiles: existing.profiles ? [...existing.profiles] : base.profiles,
    triggerRules: existing.triggerRules ? [...existing.triggerRules] : base.triggerRules,
    configVersions: existing.configVersions ? [...existing.configVersions] : base.configVersions,
    annualReports: existing.annualReports ? [...existing.annualReports] : base.annualReports,
    variationSummary: existing.variationSummary ?? base.variationSummary,
    lastCommittedAt: existing.lastCommittedAt ?? base.lastCommittedAt
  }
}

function parseIndicatorSuggestions(raw: string): MonitoringIndicatorDefinition[] {
  try {
    const json = JSON.parse(raw)
    if (Array.isArray(json)) {
      return json.map((j, idx) => ({
        id: j.id || `ind_${Date.now()}_${idx}`,
        name: j.name || j.title || `Indicator ${idx + 1}`,
        category: j.category || j.theme,
        baseline: j.baseline,
        target: j.target,
        source: j.source,
        trigger: j.trigger,
        frequency: j.frequency,
        seaHraRelevant: !!j.seaHraRelevant
      }))
    }
  } catch {
    // ignore
  }
  return raw.split('\n').filter(line => line.trim().startsWith('-')).map((line, idx) => ({
    id: `ind_${Date.now()}_${idx}`,
    name: line.replace(/^-+\s*/, '').trim(),
    category: 'general'
  }))
}

export const MonitoringBuilderTool: React.FC<{ plan?: Plan; councilData: CouncilData }> = ({ plan, councilData }) => {
  const { updatePlan } = usePlan()
  const [workspace, setWorkspace] = useState<MonitoringWorkspace>(seedWorkspace())
  const [mode, setMode] = useState<'configuration' | 'reporting'>('configuration')
  const [year, setYear] = useState<string>(String(new Date().getFullYear()))
  const [loading, setLoading] = useState(false)
  const authorityName = councilData.name
  const [smartBusy, setSmartBusy] = useState(false)
  const autoPrefillRan = React.useRef(false)
  const [narrativeMode, setNarrativeMode] = useState<'preview' | 'edit'>('preview')
  const [variationMode, setVariationMode] = useState<'preview' | 'edit'>('preview')

  useEffect(() => {
    if (!plan) return
    autoPrefillRan.current = false
    const seeded = seedWorkspace(plan.monitoringWorkspace)
    setWorkspace(seeded)
    setMode(seeded.mode || 'configuration')
    const latestYear = seeded.annualReports?.slice(-1)[0]?.year
    if (latestYear) setYear(latestYear)
  }, [plan?.id])

  useEffect(() => {
    if (!plan) return
    if (autoPrefillRan.current) return
    autoPrefillRan.current = true
    smartConfig()
  }, [plan?.id])

  const persist = (next: MonitoringWorkspace, audit?: string) => {
    const patched = { ...next, mode }
    setWorkspace(patched)
    if (plan) {
      updatePlan(plan.id, { monitoringWorkspace: patched, monitoringIndicators: patched.indicatorRegistry })
    }
  }

  const addIndicator = () => {
    const indicator: MonitoringIndicatorDefinition = {
      id: `ind_${Date.now()}`,
      name: 'New indicator',
      category: 'general',
      frequency: 'annual',
      status: 'draft'
    }
    persist({ ...workspace, indicatorRegistry: [...(workspace.indicatorRegistry || []), indicator] })
  }

  const updateIndicator = (id: string, patch: Partial<MonitoringIndicatorDefinition>) => {
    const nextRegistry = (workspace.indicatorRegistry || []).map(ind => ind.id === id ? { ...ind, ...patch } : ind)
    persist({ ...workspace, indicatorRegistry: nextRegistry })
  }

  const suggestIndicators = async () => {
    if (!plan) return
    setLoading(true)
    try {
      const prompt = [
        'You are configuring a Local Plan monitoring registry.',
        `Authority: ${authorityName}`,
        `Plan: ${plan.title} (${plan.area})`,
        `Outcomes: ${(plan.smartOutcomes || []).map(o => o.outcomeStatement || o.theme).join('; ') || 'Not captured'}`,
        `SEA/HRA risks: ${(plan.seaHra?.keyRisks || []).join('; ') || 'Not specified'}`,
        'Return JSON array with fields: id, name, category, baseline, target, source, trigger, frequency, seaHraRelevant (boolean).'
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const suggestions = parseIndicatorSuggestions(raw)
      if (suggestions.length) {
        persist({ ...workspace, indicatorRegistry: [...(workspace.indicatorRegistry || []), ...suggestions] }, 'Added AI indicator suggestions')
      }
    } finally {
      setLoading(false)
    }
  }

  const smartConfig = async () => {
    if (!plan) return
    setSmartBusy(true)
    try {
      const prompt = [
        'You are configuring monitoring after Local Plan adoption.',
        `Authority: ${authorityName}`,
        `Plan: ${plan.title} (${plan.area})`,
        `Outcomes: ${(plan.smartOutcomes || []).map(o => o.outcomeStatement || o.theme).join('; ') || 'n/a'}`,
        `SEA/HRA mitigation: ${(plan.seaHra?.mitigationIdeas || []).join('; ') || 'n/a'}`,
        `Sites: ${(plan.sites || []).map(s => s.name).join(', ') || 'n/a'}`,
        'Return JSON: { indicators: [{ id,name,category,baseline,target,source,trigger,frequency,seaHraRelevant }], mitigationMonitoring: [{ effect, indicators, team, coverage, note }], triggerRules: [{ id,title,condition,response,status }] }'
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const parsed = parseJsonObject(raw) || {}
      const indicators = Array.isArray(parsed.indicators) ? parsed.indicators.map((ind: any, idx: number) => ({
        id: ind.id || `ind_${Date.now()}_${idx}`,
        name: ind.name || ind.title || 'Indicator',
        category: ind.category || ind.theme,
        baseline: ind.baseline,
        target: ind.target,
        source: ind.source,
        trigger: ind.trigger,
        frequency: ind.frequency || 'annual',
        seaHraRelevant: !!ind.seaHraRelevant
      })) : []
      const mitigation = Array.isArray(parsed.mitigationMonitoring) ? parsed.mitigationMonitoring : []
      const triggers = Array.isArray(parsed.triggerRules) ? parsed.triggerRules : []
      persist({
        ...workspace,
        indicatorRegistry: indicators.length ? indicators : workspace.indicatorRegistry,
        mitigationMonitoring: mitigation.length ? mitigation : workspace.mitigationMonitoring,
        triggerRules: triggers.length ? triggers : workspace.triggerRules
      }, 'Smart-prefilled monitoring configuration')
    } finally {
      setSmartBusy(false)
    }
  }

  const addProfile = () => {
    const profile: MonitoringProfile = { id: `profile_${Date.now()}`, name: 'New profile', type: 'custom', indicators: [] }
    persist({ ...workspace, profiles: [...(workspace.profiles || []), profile] })
  }

  const addTrigger = () => {
    const trigger: TriggerRule = { id: `trigger_${Date.now()}`, title: 'New trigger', condition: 'Define condition', response: 'Define response', status: 'watch' }
    persist({ ...workspace, triggerRules: [...(workspace.triggerRules || []), trigger] })
  }

  const addMitigation = () => {
    const effect = { effect: 'Significant effect', indicators: [], team: 'Responsible team', coverage: 'gap' as const, note: '' }
    persist({ ...workspace, mitigationMonitoring: [...(workspace.mitigationMonitoring || []), effect] })
  }

  const commitConfiguration = () => {
    const version = { id: `cfg_${Date.now()}`, summary: `Committed ${workspace.indicatorRegistry?.length || 0} indicators`, createdAt: timestamp() }
    const next = { ...workspace, configVersions: [...(workspace.configVersions || []), version], lastCommittedAt: version.createdAt }
    persist(next, 'Committed monitoring configuration')
  }

  const generateReport = async () => {
    if (!plan) return
    setLoading(true)
    try {
      const indicators = (workspace.indicatorRegistry || []).map(ind => `${ind.name}${ind.target ? ` (target ${ind.target})` : ''}${ind.trigger ? ` | Trigger: ${ind.trigger}` : ''}`).join('\n')
      const prompt = [
        'Draft a concise Annual Monitoring Report narrative.',
        `Authority: ${authorityName}`,
        `Year: ${year}`,
        `Plan: ${plan.title}`,
        `Indicators: \n${indicators || 'No indicators captured'}`,
        `SEA/HRA monitoring hooks: ${(workspace.mitigationMonitoring || []).map(m => `${m.effect}: ${m.indicators.join(',') || 'indicator to add'}`).join('; ') || 'None logged'}`,
        'Cover: trend summary per theme, performance explanation, policy implications, key messages, and SEA/HRA effects summary.',
        'Return markdown; keep it publishable.'
      ].join('\n')
      const markdown = await callLLM({ mode: 'markdown', prompt })
      const draft: MonitoringReportDraft = {
        year,
        narratives: { overview: markdown },
        keyMessages: [],
        status: 'draft',
        generatedAt: timestamp()
      }
      const nextReports = [...(workspace.annualReports || []).filter(r => r.year !== year), draft]
      persist({ ...workspace, annualReports: nextReports }, 'Generated AMR narrative')
    } finally {
      setLoading(false)
    }
  }

  const addVariationSummary = async () => {
    setLoading(true)
    try {
      const prompt = [
        'Write an annual variation summary across years using the following reports.',
        JSON.stringify(workspace.annualReports || [])
      ].join('\n')
      const summary = await callLLM({ mode: 'markdown', prompt })
      persist({ ...workspace, variationSummary: summary }, 'Generated annual variation summary')
    } finally {
      setLoading(false)
    }
  }

  const currentReport = useMemo(() => (workspace.annualReports || []).find(r => r.year === year), [workspace.annualReports, year])

  if (!plan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan loaded</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to configure monitoring. Mock monitoring data is shown.</p>
        <div className="mt-3 text-xs text-[var(--color-muted)]">
          <MarkdownContent markdown={workspace.annualReports?.[0]?.narratives?.overview || 'Mock monitoring narrative'} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold text-[var(--color-ink)]">Monitoring Configuration & Annual Monitoring Builder</div>
        <div className="flex items-center gap-2 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-full px-2 py-1">
          <button className={`text-xs px-2 py-1 rounded-full ${mode === 'configuration' ? 'bg-[var(--color-accent)] text-white' : ''}`} onClick={() => setMode('configuration')}>Configuration</button>
          <button className={`text-xs px-2 py-1 rounded-full ${mode === 'reporting' ? 'bg-[var(--color-accent)] text-white' : ''}`} onClick={() => setMode('reporting')}>Reporting</button>
        </div>
        <div className="text-xs text-[var(--color-muted)]">Indicators: {workspace.indicatorRegistry?.length || 0}</div>
        <div className="text-xs text-[var(--color-muted)]">Triggers: {workspace.triggerRules?.length || 0}</div>
        <button onClick={smartConfig} disabled={smartBusy} className="text-xs px-3 py-2 rounded bg-[var(--color-accent)] text-white">
          {smartBusy ? 'Smart filling…' : 'Smart fill from plan'}
        </button>
      </div>

      {mode === 'configuration' ? (
        <div className="space-y-4">
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">Indicator Registry</div>
                <p className="text-xs text-[var(--color-muted)]">Define indicators, baselines, targets, sources, and triggers. AI can suggest missing indicators.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={addIndicator} className="text-xs px-3 py-2 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">Add indicator</button>
                <button onClick={suggestIndicators} disabled={loading} className="text-xs px-3 py-2 rounded bg-[var(--color-accent)] text-white">{loading ? 'Thinking…' : 'Suggest indicators'}</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(workspace.indicatorRegistry || []).map(ind => (
                <div key={ind.id} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)] space-y-2">
                  <input value={ind.name} onChange={e => updateIndicator(ind.id, { name: e.target.value })} className="w-full text-sm px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={ind.category || ''} onChange={e => updateIndicator(ind.id, { category: e.target.value })} placeholder="Category" className="text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
                    <input value={ind.frequency || ''} onChange={e => updateIndicator(ind.id, { frequency: e.target.value })} placeholder="Frequency" className="text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
                  </div>
                  <textarea value={ind.baseline || ''} onChange={e => updateIndicator(ind.id, { baseline: e.target.value })} placeholder="Baseline" className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" rows={2} />
                  <textarea value={ind.target || ''} onChange={e => updateIndicator(ind.id, { target: e.target.value })} placeholder="Target / direction" className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" rows={2} />
                  <textarea value={ind.trigger || ''} onChange={e => updateIndicator(ind.id, { trigger: e.target.value })} placeholder="Trigger threshold" className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" rows={2} />
                  <textarea value={ind.source || ''} onChange={e => updateIndicator(ind.id, { source: e.target.value })} placeholder="Data source" className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" rows={2} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">SEA/HRA Mitigation Monitoring</div>
                <p className="text-xs text-[var(--color-muted)]">Map significant effects to indicators, teams, and coverage strength.</p>
              </div>
              <button onClick={addMitigation} className="text-xs px-3 py-2 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">Add effect</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(workspace.mitigationMonitoring || []).map((item, idx) => (
                <div key={idx} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)] space-y-2">
                  <input value={item.effect} onChange={e => {
                    const next = [...(workspace.mitigationMonitoring || [])]
                    next[idx] = { ...item, effect: e.target.value }
                    persist({ ...workspace, mitigationMonitoring: next })
                  }} className="w-full text-sm px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
                  <input value={(item.indicators || []).join(', ')} onChange={e => {
                    const next = [...(workspace.mitigationMonitoring || [])]
                    next[idx] = { ...item, indicators: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                    persist({ ...workspace, mitigationMonitoring: next })
                  }} placeholder="Indicators" className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={item.team || ''} onChange={e => {
                      const next = [...(workspace.mitigationMonitoring || [])]
                      next[idx] = { ...item, team: e.target.value }
                      persist({ ...workspace, mitigationMonitoring: next })
                    }} placeholder="Team" className="text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
                    <select value={item.coverage || 'gap'} onChange={e => {
                      const next = [...(workspace.mitigationMonitoring || [])]
                      next[idx] = { ...item, coverage: e.target.value as any }
                      persist({ ...workspace, mitigationMonitoring: next })
                    }} className="text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]">
                      <option value="strong">Strong</option>
                      <option value="weak">Weak</option>
                      <option value="gap">Gap</option>
                    </select>
                  </div>
                  <textarea value={item.note || ''} onChange={e => {
                    const next = [...(workspace.mitigationMonitoring || [])]
                    next[idx] = { ...item, note: e.target.value }
                    persist({ ...workspace, mitigationMonitoring: next })
                  }} placeholder="Notes / follow-up" className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" rows={2} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">Monitoring Profiles</div>
                <p className="text-xs text-[var(--color-muted)]">Group indicators into AMR, SEA/HRA, and Year-4 profiles.</p>
              </div>
              <button onClick={addProfile} className="text-xs px-3 py-2 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">Add profile</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(workspace.profiles || []).map(profile => (
                <div key={profile.id} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)] space-y-2">
                  <input value={profile.name} onChange={e => {
                    const next = (workspace.profiles || []).map(p => p.id === profile.id ? { ...p, name: e.target.value } : p)
                    persist({ ...workspace, profiles: next })
                  }} className="w-full text-sm px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
                  <input value={profile.indicators.join(', ')} onChange={e => {
                    const next = (workspace.profiles || []).map(p => p.id === profile.id ? { ...p, indicators: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : p)
                    persist({ ...workspace, profiles: next })
                  }} placeholder="Indicators" className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
                  <input value={profile.schedule || ''} onChange={e => {
                    const next = (workspace.profiles || []).map(p => p.id === profile.id ? { ...p, schedule: e.target.value } : p)
                    persist({ ...workspace, profiles: next })
                  }} placeholder="Schedule" className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">Trigger Rules</div>
                <p className="text-xs text-[var(--color-muted)]">Define early review triggers (housing land supply, strategy drift, environmental thresholds).</p>
              </div>
              <button onClick={addTrigger} className="text-xs px-3 py-2 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">Add trigger</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(workspace.triggerRules || []).map(trigger => (
                <div key={trigger.id} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)] space-y-2">
                  <input value={trigger.title} onChange={e => {
                    const next = (workspace.triggerRules || []).map(t => t.id === trigger.id ? { ...t, title: e.target.value } : t)
                    persist({ ...workspace, triggerRules: next })
                  }} className="w-full text-sm px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
                  <textarea value={trigger.condition} onChange={e => {
                    const next = (workspace.triggerRules || []).map(t => t.id === trigger.id ? { ...t, condition: e.target.value } : t)
                    persist({ ...workspace, triggerRules: next })
                  }} placeholder="Condition" className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" rows={2} />
                  <textarea value={trigger.response || ''} onChange={e => {
                    const next = (workspace.triggerRules || []).map(t => t.id === trigger.id ? { ...t, response: e.target.value } : t)
                    persist({ ...workspace, triggerRules: next })
                  }} placeholder="Response" className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" rows={2} />
                  <select value={trigger.status || 'watch'} onChange={e => {
                    const next = (workspace.triggerRules || []).map(t => t.id === trigger.id ? { ...t, status: e.target.value as any } : t)
                    persist({ ...workspace, triggerRules: next })
                  }} className="text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]">
                    <option value="watch">Watch</option>
                    <option value="breach">Breach</option>
                    <option value="ok">OK</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="text-xs text-[var(--color-muted)]">Last committed: {workspace.lastCommittedAt ? new Date(workspace.lastCommittedAt).toLocaleString() : 'Not committed'}</div>
            <button onClick={commitConfiguration} className="px-4 py-2 rounded bg-[var(--color-accent)] text-white text-xs">Commit configuration</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">Pull live indicators</div>
                <p className="text-xs text-[var(--color-muted)]">Shows indicator definitions with baseline/target context. Use charts/maps from Monitoring Engine.</p>
              </div>
              <div className="flex items-center gap-2">
                <input value={year} onChange={e => setYear(e.target.value)} className="text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)] w-24" />
                <button onClick={generateReport} disabled={loading} className="px-3 py-2 rounded bg-[var(--color-accent)] text-white text-xs">{loading ? 'Drafting…' : 'Draft AMR narrative'}</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(workspace.indicatorRegistry || []).map(ind => (
                <div key={ind.id} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                  <div className="font-semibold text-sm text-[var(--color-ink)]">{ind.name}</div>
                  <div className="text-[11px] text-[var(--color-muted)]">{ind.category || 'general'} • {ind.frequency || 'annual'}</div>
                  <div className="text-[11px] mt-1">Baseline: {ind.baseline || 'TBC'}</div>
                  <div className="text-[11px]">Target: {ind.target || 'TBC'}</div>
                  {ind.trigger && <div className="text-[11px] text-[var(--color-muted)]">Trigger: {ind.trigger}</div>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
            <div className="text-sm font-semibold text-[var(--color-ink)]">AI Narrative drafting</div>
            <p className="text-xs text-[var(--color-muted)]">Trend summary, performance explanation, policy implications, key messages, and SEA/HRA effects.</p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--color-muted)]">Narrative ({narrativeMode === 'preview' ? 'preview' : 'edit'})</div>
              <button onClick={() => setNarrativeMode(narrativeMode === 'preview' ? 'edit' : 'preview')} className="text-[11px] px-2 py-1 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">
                {narrativeMode === 'preview' ? 'Edit markdown' : 'Preview'}
              </button>
            </div>
            {narrativeMode === 'preview' ? (
              <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)] min-h-[200px] text-sm">
                <MarkdownContent markdown={currentReport?.narratives?.overview || '_No narrative drafted yet._'} />
              </div>
            ) : (
              <textarea value={currentReport?.narratives?.overview || ''} onChange={e => {
                const next = [...(workspace.annualReports || [])]
                const idx = next.findIndex(r => r.year === year)
                if (idx >= 0) {
                  next[idx] = { ...next[idx], narratives: { ...(next[idx].narratives || {}), overview: e.target.value } }
                } else {
                  next.push({ year, narratives: { overview: e.target.value }, status: 'draft' })
                }
                persist({ ...workspace, annualReports: next })
              }} rows={12} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2 font-mono" placeholder="Annual Monitoring narrative..." />
            )}
            <div className="text-[11px] text-[var(--color-muted)]">Key messages (one per line)</div>
            <textarea value={(currentReport?.keyMessages || []).join('\n')} onChange={e => {
              const messages = e.target.value.split('\n').filter(Boolean)
              const next = [...(workspace.annualReports || [])]
              const idx = next.findIndex(r => r.year === year)
              if (idx >= 0) {
                next[idx] = { ...next[idx], keyMessages: messages }
              } else {
                next.push({ year, narratives: {}, keyMessages: messages, status: 'draft' })
              }
              persist({ ...workspace, annualReports: next })
            }} rows={4} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2" />
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">Annual Variation Summary</div>
                <p className="text-xs text-[var(--color-muted)]">Summarise year-to-year performance and trigger events.</p>
              </div>
              <button onClick={addVariationSummary} disabled={loading} className="text-xs px-3 py-2 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">{loading ? 'Building…' : 'Auto-summarise'}</button>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--color-muted)]">Variation summary ({variationMode === 'preview' ? 'preview' : 'edit'})</div>
              <button onClick={() => setVariationMode(variationMode === 'preview' ? 'edit' : 'preview')} className="text-[11px] px-2 py-1 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">
                {variationMode === 'preview' ? 'Edit markdown' : 'Preview'}
              </button>
            </div>
            {variationMode === 'preview' ? (
              <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)] min-h-[140px] text-sm">
                <MarkdownContent markdown={workspace.variationSummary || '_No variation summary drafted yet._'} />
              </div>
            ) : (
              <textarea value={workspace.variationSummary || ''} onChange={e => persist({ ...workspace, variationSummary: e.target.value })} rows={6} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2 font-mono" placeholder="Year-to-year performance summary..." />
            )}
          </div>

          {currentReport?.narratives?.overview && (
            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
              <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">AMR Preview ({year})</div>
              <MarkdownContent markdown={currentReport.narratives.overview} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
