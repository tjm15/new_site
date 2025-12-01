import React, { useEffect, useMemo, useState } from 'react'
import { CouncilData, Plan, AdoptionChecklistItem, AdoptionStatementWorkspace, RagStatus } from '../../../../data/types'
import { usePlan } from '../../../../contexts/PlanContext'
import { callLLM } from '../../../../utils/llmClient'
import { MarkdownContent } from '../../../../components/MarkdownContent'

const CHECKLIST_TEMPLATE: AdoptionChecklistItem[] = [
  { id: 'council_resolution', title: 'Full Council adoption resolution', status: 'amber' },
  { id: 'publish_inspector', title: 'Publish inspector’s report (with schedule of modifications)', status: 'amber' },
  { id: 'adoption_statement', title: 'Draft statutory Adoption Statement', status: 'amber' },
  { id: 'policies_map', title: 'Finalise and publish Policies Map and spatial datasets', status: 'amber' },
  { id: 'sea_reg16', title: 'SEA Reg 16 Post-Adoption publication', status: 'amber' },
  { id: 'notifications', title: 'Send adoption notices to interested parties', status: 'amber' },
  { id: 'lds_update', title: 'Update the Local Development Scheme', status: 'amber' },
  { id: 'archive_manifest', title: 'Archive superseded documents and create manifest', status: 'amber' }
]

const statusClass: Record<RagStatus, string> = {
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

const ADOPTION_MOCK: AdoptionStatementWorkspace = {
  readinessStatus: 'amber',
  checklist: mergeChecklist([
    { id: 'council_resolution', status: 'green', owner: 'Governance lead', notes: 'Council met 14/04; resolution passed.' },
    { id: 'policies_map', status: 'amber', owner: 'GIS', notes: 'Awaiting final tile cache export.' }
  ]),
  adoptionStatement: {
    metadata: {
      planName: 'Demo Local Plan',
      area: 'Demo Borough',
      planPeriod: '2025-2040',
      modificationSummary: 'Main mods accepted; schedule appended.',
      inspectorSummary: 'Inspector recommends adoption with mods.',
      whereInspect: ['Council website', 'Central library deposit point']
    },
    currentDraft: '## Adoption Statement (demo)\nThis mock statement shows structure before AI fill.',
    versions: []
  },
  seaHraStatement: {
    currentDraft: '## SEA/HRA Post-Adoption (demo)\nSummarise integration, consultation influence, alternatives, monitoring.',
    monitoringHooks: 'Link SEA monitoring to AMR housing/transport indicators.',
    versions: []
  },
  publication: {
    website: false,
    policiesMapPublished: false,
    datasets: ['Policies map tiles (v1.0)', 'SEA layers'],
    physicalDeposits: ['Main library'],
    notificationLog: [{ audience: 'Statutory consultees', channel: 'Email', status: 'pending' }]
  },
  auditLog: []
}

function parseJsonObject(raw: string): any {
  if (!raw) return undefined
  const candidates: string[] = []
  candidates.push(raw)
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced && fenced[1]) candidates.push(fenced[1])
  const first = raw.indexOf('{')
  const last = raw.lastIndexOf('}')
  if (first !== -1 && last > first) candidates.push(raw.slice(first, last + 1))
  for (const c of candidates) {
    try {
      return JSON.parse(c)
    } catch {
      continue
    }
  }
  return undefined
}

function mergeChecklist(existing?: AdoptionChecklistItem[]): AdoptionChecklistItem[] {
  const base = CHECKLIST_TEMPLATE.map(item => {
    const found = existing?.find(i => i.id === item.id)
    return { ...item, ...(found || {}) }
  })
  const custom = (existing || []).filter(i => !CHECKLIST_TEMPLATE.find(t => t.id === i.id))
  return [...base, ...custom]
}

function computeReadiness(checklist: AdoptionChecklistItem[]): RagStatus {
  if (!checklist || checklist.length === 0) return 'amber'
  if (checklist.some(i => i.status === 'red')) return 'red'
  if (checklist.some(i => i.status === 'amber')) return 'amber'
  return 'green'
}

function timestamp(): string {
  return new Date().toISOString()
}

export const AdoptionTool: React.FC<{ plan?: Plan; councilData: CouncilData }> = ({ plan, councilData }) => {
  const { updatePlan } = usePlan()
  const [workspace, setWorkspace] = useState<AdoptionStatementWorkspace>(ADOPTION_MOCK)
  const [loading, setLoading] = useState(false)
  const [seaLoading, setSeaLoading] = useState(false)
  const [aiBusyId, setAiBusyId] = useState<string | null>(null)
  const [prefillBusy, setPrefillBusy] = useState(false)
  const autoPrefillRan = React.useRef(false)
  const authorityName = councilData.name

  useEffect(() => {
    if (!plan) return
    autoPrefillRan.current = false
    const seeded: AdoptionStatementWorkspace = {
      checklist: mergeChecklist(plan.adoptionWorkspace?.checklist),
      readinessStatus: plan.adoptionWorkspace?.readinessStatus,
      adoptionStatement: { versions: [], ...(plan.adoptionWorkspace?.adoptionStatement || {}) },
      seaHraStatement: { versions: [], ...(plan.adoptionWorkspace?.seaHraStatement || {}) },
      publication: { notificationLog: [], datasets: [], physicalDeposits: [], ...(plan.adoptionWorkspace?.publication || {}) },
      adoptionPackExport: plan.adoptionWorkspace?.adoptionPackExport,
      auditLog: plan.adoptionWorkspace?.auditLog || []
    }
    // Seed metadata defaults if blank
    if (!seeded.adoptionStatement?.metadata) {
      seeded.adoptionStatement = {
        ...(seeded.adoptionStatement || {}),
        metadata: {
          planName: plan.title,
          area: plan.area || authorityName,
          planPeriod: 'Plan period',
          whereInspect: ['Council website', 'Main library/deposit location'],
        }
      }
    }
    setWorkspace(seeded)
  }, [plan?.id])

  useEffect(() => {
    if (!plan) return
    if (autoPrefillRan.current) return
    autoPrefillRan.current = true
    smartPrefill()
  }, [plan?.id])

  const smartPrefill = async () => {
    if (!plan) return
    setPrefillBusy(true)
    try {
      const prompt = [
        'You are preparing adoption/Post-Adoption outputs for a Local Plan.',
        `Plan: ${plan.title} (${plan.area || authorityName})`,
        `Vision: ${(plan.visionStatements || []).map(v => v.text).join('; ') || 'n/a'}`,
        `Inspector notes: ${plan.gateway3Inspector?.verdict || 'Inspector report issued'}`,
        `SEA/HRA: ${plan.seaHra?.cumulativeEffects || plan.seaHra?.seaScopingNotes || 'n/a'}`,
        `Sites: ${(plan.sites || []).map(s => s.name).join(', ') || 'n/a'}`,
        `Consultations: ${(plan.consultationSummaries || []).length} entries`,
        'Return JSON with shape:',
        '{ "metadata": { "planPeriod": string, "modificationSummary": string, "inspectorSummary": string, "whereInspect": [string] }, "publication": { "datasets": [string], "physicalDeposits": [string], "legalAdvert": string }, "checklistNotes": [ { "id": string, "status": "red|amber|green", "notes": string } ] }'
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const parsed = parseJsonObject(raw) || {}
      const meta = { ...(workspace.adoptionStatement?.metadata || {}), ...(parsed.metadata || {}) }
      const publication = { ...(workspace.publication || {}), ...(parsed.publication || {}) }
      let nextChecklist = workspace.checklist || []
      if (Array.isArray(parsed.checklistNotes)) {
        nextChecklist = nextChecklist.map(item => {
          const match = parsed.checklistNotes.find((c: any) => c.id === item.id)
          if (!match) return item
          return { ...item, status: match.status || item.status, notes: match.notes || item.notes }
        })
      }
      persist({
        ...workspace,
        adoptionStatement: { ...(workspace.adoptionStatement || {}), metadata: meta },
        publication,
        checklist: nextChecklist
      }, 'Smart-prefilled adoption workspace')
    } finally {
      setPrefillBusy(false)
    }
  }

  const readiness = useMemo(() => workspace.readinessStatus || computeReadiness(workspace.checklist || []), [workspace.readinessStatus, workspace.checklist])

  const persist = (next: AdoptionStatementWorkspace, audit?: string) => {
    const patched = {
      ...next,
      readinessStatus: next.readinessStatus || computeReadiness(next.checklist || [])
    }
    if (audit) {
      const logEntry = { id: `log_${Date.now()}`, action: audit, at: timestamp() }
      patched.auditLog = [...(patched.auditLog || []), logEntry]
    }
    setWorkspace(patched)
    if (plan) {
      const legacyChecklist = (patched.checklist || []).map(i => `${i.title}: ${i.status}`).join(' | ')
      updatePlan(plan.id, { adoptionWorkspace: patched, adoptionChecklist: legacyChecklist })
    }
  }

  const updateChecklistItem = (id: string, patch: Partial<AdoptionChecklistItem>) => {
    const nextChecklist = (workspace.checklist || []).map(item => item.id === id ? { ...item, ...patch, lastUpdated: timestamp() } : item)
    persist({ ...workspace, checklist: nextChecklist })
  }

  const addCustomChecklistItem = () => {
    const id = `custom_${Date.now()}`
    const next = [...(workspace.checklist || []), { id, title: 'Custom check', status: 'amber' as RagStatus }]
    persist({ ...workspace, checklist: next })
  }

  const explainStatus = async (item: AdoptionChecklistItem) => {
    if (!plan) return
    setAiBusyId(item.id)
    try {
      const prompt = [
        'You are an adoption compliance assistant.',
        `Plan: ${plan.title} (${plan.area})`,
        `Item: ${item.title}`,
        `Status: ${item.status}`,
        `Notes: ${item.notes || 'n/a'}`,
        'Give a short explanation and next action for this status. Keep to 2 sentences.'
      ].join('\n')
      const aiHint = await callLLM({ mode: 'markdown', prompt })
      updateChecklistItem(item.id, { aiHint })
    } finally {
      setAiBusyId(null)
    }
  }

  const generateAdoptionStatement = async () => {
    if (!plan) return
    setLoading(true)
    try {
      const meta = workspace.adoptionStatement?.metadata || {}
      const prompt = [
        'SYSTEM: Draft the statutory Adoption Statement for a Local Plan.',
        'Include: plan name/area, adoption date, plan period, summary of inspector recommendations and modifications, where to inspect (web + deposit locations), and a short compliance note.',
        'Add an optional easy-read paragraph at the end.',
        'USER CONTEXT:',
        `Plan title: ${plan.title}`,
        `Area: ${meta.area || plan.area || authorityName}`,
        `Adoption date: ${meta.adoptionDate || 'TBC'}`,
        `Plan period: ${meta.planPeriod || 'TBC'}`,
        `Inspector: ${meta.inspectorSummary || plan.gateway3Inspector?.verdict || 'Inspector’s report issued'}`,
        `Modifications: ${meta.modificationSummary || 'See schedule of modifications'}`,
        `Where to inspect: ${(meta.whereInspect || []).join('; ') || 'Website and deposit locations'}`,
        `Checklist signals: ${(workspace.checklist || []).map(i => `${i.title}=${i.status}`).join(' | ')}`,
        'TASK: Return the statement as markdown (no JSON).'
      ].join('\n')
      const statement = await callLLM({ mode: 'markdown', prompt })
      const next = {
        ...workspace,
        adoptionStatement: {
          ...(workspace.adoptionStatement || {}),
          currentDraft: statement
        }
      }
      persist(next, 'Generated adoption statement')
    } finally {
      setLoading(false)
    }
  }

  const rewriteEasyRead = async () => {
    if (!workspace.adoptionStatement?.currentDraft) return
    setLoading(true)
    try {
      const prompt = [
        'Rewrite this adoption statement into an easy-read summary (max 200 words, plain language).',
        workspace.adoptionStatement.currentDraft
      ].join('\n\n')
      const easy = await callLLM({ mode: 'markdown', prompt })
      const next = { ...workspace, adoptionStatement: { ...(workspace.adoptionStatement || {}), easyRead: easy } }
      persist(next, 'Generated easy-read adoption statement')
    } finally {
      setLoading(false)
    }
  }

  const saveStatementVersion = (type: 'adoption' | 'sea_hra') => {
    const source = type === 'adoption' ? workspace.adoptionStatement?.currentDraft : workspace.seaHraStatement?.currentDraft
    if (!source) return
    const version = {
      id: `${type}_${Date.now()}`,
      content: source,
      createdAt: timestamp(),
      status: type === 'adoption' && workspace.adoptionStatement?.markedFinalId ? 'draft' : 'draft',
      type
    }
    if (type === 'adoption') {
      const next = { ...workspace, adoptionStatement: { ...(workspace.adoptionStatement || {}), versions: [...(workspace.adoptionStatement?.versions || []), version] } }
      persist(next, 'Saved adoption statement version')
    } else {
      const next = { ...workspace, seaHraStatement: { ...(workspace.seaHraStatement || {}), versions: [...(workspace.seaHraStatement?.versions || []), version] } }
      persist(next, 'Saved SEA/HRA statement version')
    }
  }

  const markAdoptionFinal = () => {
    if (!workspace.adoptionStatement?.currentDraft) return
    const version = {
      id: `final_${Date.now()}`,
      content: workspace.adoptionStatement.currentDraft,
      createdAt: timestamp(),
      status: 'final' as const,
      type: 'adoption' as const,
      title: 'Marked as final'
    }
    const next = {
      ...workspace,
      adoptionStatement: {
        ...(workspace.adoptionStatement || {}),
        markedFinalId: version.id,
        versions: [...(workspace.adoptionStatement?.versions || []), version]
      }
    }
    persist(next, 'Marked adoption statement as final')
  }

  const generateSeaStatement = async () => {
    if (!plan) return
    setSeaLoading(true)
    try {
      const prompt = [
        'SYSTEM: Draft a SEA/HRA post-adoption statement.',
        'Cover: (1) How environmental considerations were integrated, (2) How the Environmental Report & consultations influenced the plan, (3) Reasons for choosing the plan vs alternatives, (4) Monitoring measures and mitigation hooks.',
        'Keep concise but specific; include monitoring/mitigation hand-offs.',
        `Plan: ${plan.title} (${plan.area})`,
        `Authority: ${authorityName}`,
        `SEA/HRA baseline: ${plan.seaHra?.seaScopingNotes || 'Baseline notes pending'}`,
        `Consultation: ${(plan.consultationSummaries || []).length} summaries`,
        `Inspector recommendations: ${plan.gateway3Inspector?.verdict || 'see report'}`,
        'Return markdown (no JSON).'
      ].join('\n')
      const draft = await callLLM({ mode: 'markdown', prompt })
      const sections = {
        integration: '## Integration of environmental considerations\n' + draft,
      }
      const next = { ...workspace, seaHraStatement: { ...(workspace.seaHraStatement || {}), currentDraft: draft, sections } }
      persist(next, 'Generated SEA/HRA post-adoption statement')
    } finally {
      setSeaLoading(false)
    }
  }

  const exportPack = () => {
    const lines = [
      `# Adoption pack – ${plan?.title || 'Plan'}`,
      `Readiness: ${readiness}`,
      '## Checklist',
      ...(workspace.checklist || []).map(i => `- ${i.title}: ${i.status}${i.owner ? ` (Owner: ${i.owner})` : ''}${i.dueDate ? ` due ${i.dueDate}` : ''}`),
      '## Adoption Statement (current)',
      workspace.adoptionStatement?.currentDraft || 'Not drafted',
      '## SEA/HRA Post-Adoption Statement',
      workspace.seaHraStatement?.currentDraft || 'Not drafted',
      '## Publication & notifications',
      `Website: ${workspace.publication?.website ? '✅' : '⏳'}`,
      `Policies map: ${workspace.publication?.policiesMapPublished ? '✅' : '⏳'}`,
      `Notifications: ${(workspace.publication?.notificationLog || []).map(n => `${n.audience} (${n.status || 'pending'})`).join('; ') || 'None logged'}`,
      `Archive: ${workspace.publication?.archiveManifest || 'Not recorded'}`
    ]
    const compiled = lines.join('\n\n')
    persist({ ...workspace, adoptionPackExport: compiled }, 'Exported adoption pack')
  }

  if (!plan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan loaded</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to use the Adoption & Post-Adoption Builder. Mock data shown below.</p>
        <div className="mt-3 text-xs text-[var(--color-muted)]">
          <MarkdownContent markdown={workspace.adoptionStatement?.currentDraft || 'Mock adoption content will appear once a plan is loaded.'} />
        </div>
      </div>
    )
  }

  const checklist = workspace.checklist || []
  const adoptionStatement = workspace.adoptionStatement || {}
  const seaHraStatement = workspace.seaHraStatement || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className={`px-3 py-2 rounded-lg border text-sm ${statusClass[readiness]}`}>
          Adoption readiness: <span className="font-semibold uppercase">{readiness}</span>
        </div>
        <button onClick={exportPack} className="px-3 py-2 rounded-lg bg-[var(--color-panel)] border border-[var(--color-edge)] text-sm hover:border-[var(--color-accent)]">Export adoption pack</button>
        <button onClick={smartPrefill} disabled={prefillBusy} className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm">
          {prefillBusy ? 'Prefilling…' : 'Smart fill from plan'}
        </button>
        <div className="text-xs text-[var(--color-muted)]">Audit log entries: {(workspace.auditLog || []).length}</div>
      </div>

      {/* Section 1: Checklist */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">1) Adoption Checklist (RAG)</div>
            <p className="text-xs text-[var(--color-muted)]">Track statutory adoption actions with owners, deadlines, and AI help for amber/red.</p>
          </div>
          <button onClick={addCustomChecklistItem} className="text-xs px-3 py-1.5 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">Add custom item</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checklist.map(item => (
            <div key={item.id} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="font-semibold text-[var(--color-ink)] text-sm">{item.title}</div>
                <select value={item.status} onChange={e => updateChecklistItem(item.id, { status: e.target.value as RagStatus })} className={`text-xs rounded px-2 py-1 border ${statusClass[item.status]}`}>
                  <option value="red">Red</option>
                  <option value="amber">Amber</option>
                  <option value="green">Green</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input value={item.owner || ''} onChange={e => updateChecklistItem(item.id, { owner: e.target.value })} placeholder="Owner" className="text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
                <input value={item.dueDate || ''} onChange={e => updateChecklistItem(item.id, { dueDate: e.target.value })} placeholder="Due date" className="text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
              </div>
              <textarea value={item.notes || ''} onChange={e => updateChecklistItem(item.id, { notes: e.target.value })} placeholder="Notes / links" className="w-full text-xs px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" rows={2} />
              <div className="flex items-center justify-between mt-2">
                <div className="text-[10px] text-[var(--color-muted)]">{item.lastUpdated ? `Updated ${new Date(item.lastUpdated).toLocaleString()}` : 'Not updated'}</div>
                {item.status !== 'green' && (
                  <button onClick={() => explainStatus(item)} disabled={aiBusyId === item.id} className="text-[10px] px-2 py-1 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">
                    {aiBusyId === item.id ? 'Thinking…' : 'AI reason'}
                  </button>
                )}
              </div>
              {item.aiHint && <div className="mt-2 text-[11px] text-[var(--color-muted)] bg-[var(--color-panel)] border border-dashed border-[var(--color-edge)] rounded p-2">{item.aiHint}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Adoption Statement */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">2) Adoption Statement Generator</div>
            <p className="text-xs text-[var(--color-muted)]">Auto-populate statutory content, easy-read summary, and manage versions.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={generateAdoptionStatement} disabled={loading} className="px-3 py-2 rounded bg-[var(--color-accent)] text-white text-xs">{loading ? 'Generating…' : 'Generate statement'}</button>
            <button onClick={() => saveStatementVersion('adoption')} className="px-3 py-2 rounded border border-[var(--color-edge)] text-xs hover:border-[var(--color-accent)]">Save version</button>
            <button onClick={markAdoptionFinal} className="px-3 py-2 rounded border border-[var(--color-edge)] text-xs hover:border-[var(--color-accent)]">Mark as final</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={adoptionStatement.metadata?.adoptionDate || ''} onChange={e => persist({ ...workspace, adoptionStatement: { ...(adoptionStatement || {}), metadata: { ...(adoptionStatement.metadata || {}), adoptionDate: e.target.value } } })} placeholder="Adoption date" className="text-sm px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
          <input value={adoptionStatement.metadata?.planPeriod || ''} onChange={e => persist({ ...workspace, adoptionStatement: { ...(adoptionStatement || {}), metadata: { ...(adoptionStatement.metadata || {}), planPeriod: e.target.value } } })} placeholder="Plan period" className="text-sm px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
          <input value={adoptionStatement.metadata?.modificationSummary || ''} onChange={e => persist({ ...workspace, adoptionStatement: { ...(adoptionStatement || {}), metadata: { ...(adoptionStatement.metadata || {}), modificationSummary: e.target.value } } })} placeholder="Modifications summary" className="text-sm px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
          <input value={adoptionStatement.metadata?.inspectorSummary || ''} onChange={e => persist({ ...workspace, adoptionStatement: { ...(adoptionStatement || {}), metadata: { ...(adoptionStatement.metadata || {}), inspectorSummary: e.target.value } } })} placeholder="Inspector recommendations summary" className="text-sm px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
          <input value={adoptionStatement.metadata?.whereInspect?.join('; ') || ''} onChange={e => persist({ ...workspace, adoptionStatement: { ...(adoptionStatement || {}), metadata: { ...(adoptionStatement.metadata || {}), whereInspect: e.target.value.split(';').map(s => s.trim()).filter(Boolean) } } })} placeholder="Where to inspect (semicolon separated)" className="text-sm px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)] md:col-span-2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-[var(--color-muted)] mb-1">Adoption Statement (HTML-ready markdown)</div>
            <textarea value={adoptionStatement.currentDraft || ''} onChange={e => persist({ ...workspace, adoptionStatement: { ...(adoptionStatement || {}), currentDraft: e.target.value } })} rows={14} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2 font-mono" placeholder="Draft adoption statement..." />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[var(--color-muted)]">Easy-read summary</div>
              <button onClick={rewriteEasyRead} disabled={loading || !adoptionStatement.currentDraft} className="text-[10px] px-2 py-1 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">AI rewrite</button>
            </div>
            <textarea value={adoptionStatement.easyRead || ''} onChange={e => persist({ ...workspace, adoptionStatement: { ...(adoptionStatement || {}), easyRead: e.target.value } })} rows={10} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2" placeholder="Easy-read summary..." />
            <div className="text-[11px] text-[var(--color-muted)]">Versions: {(adoptionStatement.versions || []).length} {adoptionStatement.markedFinalId ? '(final marked)' : ''}</div>
            {(adoptionStatement.versions || []).slice(-3).map(v => (
              <div key={v.id} className="text-[11px] border border-dashed border-[var(--color-edge)] rounded p-2 bg-[var(--color-surface)]">
                <div className="font-semibold text-[var(--color-ink)]">{v.title || v.id}</div>
                <div className="text-[10px] text-[var(--color-muted)]">{v.status || 'draft'} · {new Date(v.createdAt).toLocaleString()}</div>
                <MarkdownContent markdown={v.content.slice(0, 280) + (v.content.length > 280 ? '…' : '')} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: SEA/HRA */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">3) SEA/HRA Post-Adoption Statement</div>
            <p className="text-xs text-[var(--color-muted)]">Cover integration of environmental considerations, influence of the Environmental Report/consultation, alternatives, and monitoring measures.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={generateSeaStatement} disabled={seaLoading} className="px-3 py-2 rounded bg-[var(--color-accent)] text-white text-xs">{seaLoading ? 'Generating…' : 'Auto-draft'}</button>
            <button onClick={() => saveStatementVersion('sea_hra')} className="px-3 py-2 rounded border border-[var(--color-edge)] text-xs hover:border-[var(--color-accent)]">Save version</button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <textarea value={seaHraStatement.currentDraft || ''} onChange={e => persist({ ...workspace, seaHraStatement: { ...(seaHraStatement || {}), currentDraft: e.target.value } })} rows={10} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2 font-mono" placeholder="SEA/HRA Post-Adoption statement..." />
          <div className="space-y-2">
            <textarea value={seaHraStatement.monitoringHooks || ''} onChange={e => persist({ ...workspace, seaHraStatement: { ...(seaHraStatement || {}), monitoringHooks: e.target.value } })} rows={4} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2" placeholder="Monitoring measures / mitigation hand-off" />
            <div className="text-[11px] text-[var(--color-muted)]">Version history: {(seaHraStatement.versions || []).length}</div>
          </div>
        </div>
      </div>

      {/* Section 4: Publication */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">4) Publication & Notification Manager</div>
            <p className="text-xs text-[var(--color-muted)]">Track publication routes, policies map upload, physical deposit locations, and notifications.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!workspace.publication?.website} onChange={e => persist({ ...workspace, publication: { ...(workspace.publication || {}), website: e.target.checked } })} />
            Website publication confirmed
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!workspace.publication?.policiesMapPublished} onChange={e => persist({ ...workspace, publication: { ...(workspace.publication || {}), policiesMapPublished: e.target.checked } })} />
            Policies map uploaded
          </label>
          <input value={(workspace.publication?.datasets || []).join('; ')} onChange={e => persist({ ...workspace, publication: { ...(workspace.publication || {}), datasets: e.target.value.split(';').map(s => s.trim()).filter(Boolean) } })} placeholder="Spatial datasets / metadata (semicolon separated)" className="text-sm px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)] md:col-span-2" />
          <input value={(workspace.publication?.physicalDeposits || []).join('; ')} onChange={e => persist({ ...workspace, publication: { ...(workspace.publication || {}), physicalDeposits: e.target.value.split(';').map(s => s.trim()).filter(Boolean) } })} placeholder="Physical deposit locations" className="text-sm px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
          <input value={workspace.publication?.legalAdvert || ''} onChange={e => persist({ ...workspace, publication: { ...(workspace.publication || {}), legalAdvert: e.target.value } })} placeholder="Legal advert / placement note" className="text-sm px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" />
          <textarea value={workspace.publication?.archiveManifest || ''} onChange={e => persist({ ...workspace, publication: { ...(workspace.publication || {}), archiveManifest: e.target.value } })} rows={3} className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm px-3 py-2 md:col-span-2" placeholder="Archive manifest for superseded documents" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-[var(--color-muted)]">Notification log</div>
            <button onClick={() => persist({ ...workspace, publication: { ...(workspace.publication || {}), notificationLog: [...(workspace.publication?.notificationLog || []), { audience: 'New audience', status: 'pending', channel: 'Email' }] } })} className="text-[11px] px-2 py-1 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]">Add notification</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(workspace.publication?.notificationLog || []).map((note, idx) => (
              <div key={idx} className="border border-[var(--color-edge)] rounded p-2 bg-[var(--color-surface)]">
                <input value={note.audience} onChange={e => {
                  const nextLog = [...(workspace.publication?.notificationLog || [])]
                  nextLog[idx] = { ...note, audience: e.target.value }
                  persist({ ...workspace, publication: { ...(workspace.publication || {}), notificationLog: nextLog } })
                }} className="text-sm w-full mb-1 rounded border border-[var(--color-edge)] px-2 py-1 bg-[var(--color-surface)]" />
                <div className="flex gap-2">
                  <input value={note.channel || ''} onChange={e => {
                    const nextLog = [...(workspace.publication?.notificationLog || [])]
                    nextLog[idx] = { ...note, channel: e.target.value }
                    persist({ ...workspace, publication: { ...(workspace.publication || {}), notificationLog: nextLog } })
                  }} placeholder="Channel" className="text-[11px] flex-1 rounded border border-[var(--color-edge)] px-2 py-1 bg-[var(--color-surface)]" />
                  <input value={note.status || ''} onChange={e => {
                    const nextLog = [...(workspace.publication?.notificationLog || [])]
                    nextLog[idx] = { ...note, status: e.target.value }
                    persist({ ...workspace, publication: { ...(workspace.publication || {}), notificationLog: nextLog } })
                  }} placeholder="Status" className="text-[11px] w-24 rounded border border-[var(--color-edge)] px-2 py-1 bg-[var(--color-surface)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {workspace.adoptionPackExport && (
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
          <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Adoption Pack Preview</div>
          <MarkdownContent markdown={workspace.adoptionPackExport} />
        </div>
      )}
    </div>
  )
}
