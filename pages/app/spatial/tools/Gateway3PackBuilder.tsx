import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CouncilData, Gateway3ManifestItem, Gateway3Pack, Gateway3Requirement, Gateway3Statement, Plan, RagStatus } from '../../../../data/types'
import { usePlan } from '../../../../contexts/PlanContext'
import { callLLM } from '../../../../utils/llmClient'
import { LoadingSpinner } from '../../shared/LoadingSpinner'
import { MarkdownContent } from '../../../../components/MarkdownContent'
import { summarizeSeaHra } from '../../../../utils/seaHra'

type TabId = 'requirements' | 'compliance' | 'soundness' | 'readiness' | 'validator'
type StatementKey = 'compliance' | 'soundness' | 'readiness'

const BASE_REQUIREMENTS: Gateway3Requirement[] = [
  { id: 'legal', title: 'Legal compliance (Regs 17–19 equivalents)', description: 'Consultation, publication, submission, and sign-off requirements met with evidence of decisions.' },
  { id: 'documents', title: 'Required submission documents', description: 'Plan, policies map, Environmental Report/HRA, statements, evidence index, SoCGs, consultation material.' },
  { id: 'evidence', title: 'Evidence completeness and recency', description: 'Core studies completed, dated within acceptable window, and referenced in the plan.' },
  { id: 'consultation', title: 'Consultation summaries', description: 'Consultation stages summarised with issues and intended changes, plus publication evidence.' },
  { id: 'soundness', title: 'Soundness indicators', description: 'NPPF tests evidenced (positively prepared, justified, effective, consistent with national policy).' },
  { id: 'socg', title: 'Statements of common ground', description: 'Updated SoCGs for cross-boundary matters with signatories and status.' },
  { id: 'seahra', title: 'SEA/HRA requirements', description: 'Environmental Report, HRA screening/AA, alternatives, mitigation and consultation trail captured.' },
  { id: 'coherence', title: 'Internal coherence and versioning', description: 'Vision ↔ strategy ↔ policies consistent; latest versions logged with provenance.' }
]

const BASE_MANIFEST: Gateway3ManifestItem[] = [
  { id: 'plan', title: 'Local Plan document', required: true, status: 'present' },
  { id: 'policies_map', title: 'Policies map (spatial files + render)', required: true, status: 'present' },
  { id: 'compliance', title: 'Statement of Compliance', required: true, status: 'present' },
  { id: 'soundness', title: 'Statement of Soundness', required: true, status: 'present' },
  { id: 'readiness', title: 'Examination Readiness Note', required: true, status: 'present' },
  { id: 'evidence_index', title: 'Evidence base index', required: true, status: 'present' },
  { id: 'consultation', title: 'Consultation summaries (Reg 18/19 equivalent)', required: true, status: 'present' },
  { id: 'socg', title: 'Statements of Common Ground', required: true, status: 'present' },
  { id: 'sea_hra', title: 'SEA / HRA (Environmental Report, HRA)', required: true, status: 'present' }
]

const TAB_LABELS: Record<TabId, string> = {
  requirements: 'Requirements Check (RAG)',
  compliance: 'Statement of Compliance',
  soundness: 'Statement of Soundness',
  readiness: 'Examination Readiness Note',
  validator: 'Submission Bundle Validator'
}

function ragBadge(status?: RagStatus, size: 'sm' | 'md' = 'md') {
  const base = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
  if (status === 'green') return `${base} rounded-full bg-green-100 text-green-800 border border-green-200`
  if (status === 'amber') return `${base} rounded-full bg-amber-100 text-amber-800 border border-amber-200`
  if (status === 'red') return `${base} rounded-full bg-red-100 text-red-800 border border-red-200`
  return `${base} rounded-full bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-edge)]`
}

function manifestBadge(status?: Gateway3ManifestItem['status']) {
  const base = 'px-2 py-0.5 text-[11px] rounded-full border'
  if (status === 'present') return `${base} bg-green-50 text-green-800 border-green-200`
  if (status === 'outdated') return `${base} bg-amber-50 text-amber-800 border-amber-200`
  if (status === 'missing') return `${base} bg-red-50 text-red-800 border-red-200`
  return `${base} bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-edge)]`
}

function mergeRequirements(existing?: Gateway3Requirement[]): Gateway3Requirement[] {
  const map = new Map((existing || []).map(r => [r.id, r]))
  const merged = BASE_REQUIREMENTS.map(req => {
    const found = map.get(req.id)
    return { ...req, ...(found || {}) }
  })
  const extras = (existing || []).filter(r => !BASE_REQUIREMENTS.some(b => b.id === r.id))
  return [...merged, ...extras]
}

function mergeManifest(existing?: Gateway3ManifestItem[]): Gateway3ManifestItem[] {
  const map = new Map((existing || []).map(item => [item.id, item]))
  const merged = BASE_MANIFEST.map(item => {
    const found = map.get(item.id)
    return { ...item, ...(found || {}) }
  })
  const extras = (existing || []).filter(item => !BASE_MANIFEST.some(b => b.id === item.id))
  return [...merged, ...extras]
}

function normalizeRag(status?: string): RagStatus | undefined {
  const t = (status || '').toLowerCase()
  if (t.startsWith('g')) return 'green'
  if (t.startsWith('a')) return 'amber'
  if (t.startsWith('r')) return 'red'
  return undefined
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

function buildPlanSnapshot(plan?: Plan, council?: CouncilData, pack?: Gateway3Pack) {
  if (!plan || !council) return 'No plan context.'
  const vision = (plan.visionStatements || []).map(v => `- ${v.text}${v.metric ? ` (${v.metric})` : ''}`).join('\n') || 'No vision recorded.'
  const outcomes = (plan.smartOutcomes || []).map(o => `- ${o.outcomeStatement || o.text}${o.indicators?.length ? ` | Indicators: ${o.indicators.map(i => i.name || i.id).join(', ')}` : ''}`).join('\n') || 'No SMART outcomes recorded.'
  const strategy = plan.preferredOptions?.strategy?.analysis
    || plan.preferredOptions?.strategy?.label
    || (council.strategies || []).map(s => `${s.label}: ${s.desc}`).join('\n') || 'No spatial strategy captured.'
  const sites = (plan.sites || []).map(s => {
    const decision = (plan.siteDecisions || []).find(d => d.siteId === s.id)
    return `- ${s.name}: ${s.notes || s.description || 'No summary'} | RAG ${[s.suitability, s.availability, s.achievability].filter(Boolean).join('/') || 'n/a'} | Decision: ${decision?.decision || 'undecided'}`
  }).join('\n') || 'No site records.'
  const evidence = (plan.evidenceInventory || []).map(ev => `- ${ev.title}${ev.status ? ` [${ev.status}]` : ''}${ev.year ? ` (${ev.year})` : ''}${ev.core ? ' • core' : ''}${ev.seaHraRelevant ? ' • SEA/HRA' : ''}`).join('\n') || 'No evidence logged.'
  const consultations = (plan.consultationSummaries || []).map(c => `- ${c.stageId}: ${c.who} | ${c.when} | ${c.how} | Issues: ${(c.mainIssues || []).join('; ')}`).join('\n') || 'No consultation summaries captured.'
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
  const timetable = (plan.timetable?.milestones || []).map(m => `- ${m.stageId}: ${m.date}`).join('\n') || 'No timetable recorded.'
  const g2 = plan.gateway2Pack
    ? `Gateway 2 readiness: ${plan.gateway2Pack.readinessRag || 'n/a'} | Sections with content: ${(plan.gateway2Pack.sections || []).filter(s => s.content).length}`
    : 'Gateway 2 pack not stored.'
  const requirementRag = (pack?.requirements || []).map(r => `- ${r.title}: ${r.status || 'unknown'} | ${r.explanation || 'No explanation'}`).join('\n') || 'No Gateway 3 requirements recorded.'
  const statementNotes = [
    pack?.compliance?.text ? 'Compliance draft saved.' : 'No compliance draft.',
    pack?.soundness?.text ? 'Soundness draft saved.' : 'No soundness draft.',
    pack?.readiness?.text ? 'Readiness note saved.' : 'No readiness note.'
  ].join(' ')
  return [
    `Authority: ${council.name}`,
    `Plan: ${plan.title} | Stage: ${plan.planStage || 'unknown'}`,
    '[Vision]\n' + vision,
    '[SMART Outcomes]\n' + outcomes,
    '[Strategy]\n' + strategy,
    '[Sites]\n' + sites,
    '[Evidence]\n' + evidence,
    '[Consultation summaries]\n' + consultations,
    '[SEA / HRA]\n' + seaHra,
    '[Timetable]\n' + timetable,
    '[Gateway 2]\n' + g2,
    '[Gateway 3 RAG]\n' + requirementRag,
    `[Statements]\n${statementNotes}`
  ].join('\n\n')
}

function makeVersionFromText(text: string | undefined, label: string) {
  if (!text) return undefined
  return [{ id: `import_${Date.now()}`, text, createdAt: new Date().toISOString(), summary: `Imported ${label} from existing plan data` }]
}

function mergePackDefaults(existing?: Gateway3Pack, plan?: Plan): Gateway3Pack {
  const baseValidator = { ...existing?.validator, manifest: mergeManifest(existing?.validator?.manifest) }
  let validator = baseValidator
  if ((!baseValidator.manifest || baseValidator.manifest.length === 0) && plan?.submissionBundle?.length) {
    const mapped = mergeManifest(baseValidator.manifest).map(item => {
      const match = plan.submissionBundle?.find(m => m.id === item.id || m.title === item.title)
      return match ? { ...item, status: match.status } : item
    })
    validator = { ...baseValidator, manifest: mapped }
  }

  const compliance = existing?.compliance || (plan?.statementCompliance ? { title: 'Statement of Compliance', text: plan.statementCompliance, versions: makeVersionFromText(plan.statementCompliance, 'compliance') } : { title: 'Statement of Compliance' })
  const soundness = existing?.soundness || (plan?.statementSoundness ? { title: 'Statement of Soundness', text: plan.statementSoundness, versions: makeVersionFromText(plan.statementSoundness, 'soundness') } : { title: 'Statement of Soundness' })
  const readiness = existing?.readiness || (plan?.examReadinessNote ? { title: 'Examination Readiness Note', text: plan.examReadinessNote, versions: makeVersionFromText(plan.examReadinessNote, 'readiness') } : { title: 'Examination Readiness Note' })

  return {
    requirements: mergeRequirements(existing?.requirements),
    compliance,
    soundness,
    readiness,
    validator,
    inspectorFocus: existing?.inspectorFocus || [],
    summary: existing?.summary || plan?.requirementsCheck,
    updatedAt: existing?.updatedAt
  }
}

function formatDate(value?: string) {
  if (!value) return 'n/a'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString()
}

function serialiseRequirements(reqs?: Gateway3Requirement[]): string | undefined {
  if (!reqs || !reqs.length) return undefined
  return reqs.map(r => `${r.title}: ${r.status || 'unknown'}${r.explanation ? ` — ${r.explanation}` : ''}`).join('\n')
}

export const Gateway3PackBuilder: React.FC<{ plan?: Plan; councilData: CouncilData; autoRun?: boolean }> = ({ plan, councilData, autoRun }) => {
  const { updatePlan } = usePlan()
  const workingPlan = plan?.councilId === councilData.id ? plan : undefined
  const [pack, setPack] = useState<Gateway3Pack>(mergePackDefaults(undefined))
  const [activeTab, setActiveTab] = useState<TabId>('requirements')
  const [drafts, setDrafts] = useState<{ compliance: string; soundness: string; readiness: string }>({ compliance: '', soundness: '', readiness: '' })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<Record<StatementKey, boolean>>({ compliance: false, soundness: false, readiness: false })
  const autoRan = useRef(false)

  useEffect(() => {
    if (!workingPlan) {
      setPack(mergePackDefaults(undefined, workingPlan))
      setDrafts({ compliance: '', soundness: '', readiness: '' })
      return
    }
    const merged = mergePackDefaults(workingPlan.gateway3Pack, workingPlan)
    setPack(merged)
    setDrafts({
      compliance: merged.compliance?.text || '',
      soundness: merged.soundness?.text || '',
      readiness: merged.readiness?.text || ''
    })
    setStatus('Loaded Gateway 3 pack.')
  }, [workingPlan?.id])

  useEffect(() => {
    if (autoRun && workingPlan && !autoRan.current) {
      const hasReqs = workingPlan.gateway3Pack?.requirements?.some(r => r.status)
      if (!hasReqs) {
        autoRan.current = true
        runRequirementsCheck()
      }
    }
  }, [autoRun, workingPlan])

  const planSnapshot = useMemo(() => buildPlanSnapshot(workingPlan, councilData, pack), [workingPlan, councilData, pack])

  const requirementStats = useMemo(() => {
    const reqs = pack.requirements || []
    const green = reqs.filter(r => r.status === 'green').length
    const amber = reqs.filter(r => r.status === 'amber').length
    const red = reqs.filter(r => r.status === 'red').length
    return { total: reqs.length, green, amber, red }
  }, [pack.requirements])

  const manifestStats = useMemo(() => {
    const manifest = pack.validator?.manifest || []
    const missing = manifest.filter(m => m.status === 'missing').length
    const outdated = manifest.filter(m => m.status === 'outdated').length
    return { total: manifest.length, missing, outdated }
  }, [pack.validator?.manifest])

  const persistPack = (next: Partial<Gateway3Pack>) => {
    if (!workingPlan) return
    setPack(prev => {
      const merged = mergePackDefaults({ ...prev, ...next, updatedAt: new Date().toISOString() })
      updatePlan(workingPlan.id, {
        gateway3Pack: merged,
        requirementsCheck: merged.summary || serialiseRequirements(merged.requirements),
        statementCompliance: merged.compliance?.text,
        statementSoundness: merged.soundness?.text,
        examReadinessNote: merged.readiness?.text,
        submissionBundle: merged.validator?.manifest?.map(m => ({ id: m.id, title: m.title, status: m.status }))
      })
      return merged
    })
    setStatus('Gateway 3 pack saved to plan.')
    setError(null)
  }

  const updateRequirement = (id: string, patch: Partial<Gateway3Requirement>) => {
    setPack(prev => ({
      ...prev,
      requirements: (prev.requirements || []).map(r => (r.id === id ? { ...r, ...patch, lastUpdated: new Date().toISOString() } : r))
    }))
  }

  const addRequirement = () => {
    const id = `custom_${Date.now()}`
    setPack(prev => ({
      ...prev,
      requirements: [...(prev.requirements || []), { id, title: 'Custom requirement', description: 'Add description', status: undefined }]
    }))
  }

  const updateManifestItem = (id: string, patch: Partial<Gateway3ManifestItem>) => {
    setPack(prev => ({
      ...prev,
      validator: {
        ...(prev.validator || {}),
        manifest: (prev.validator?.manifest || []).map(item => (item.id === id ? { ...item, ...patch } : item))
      }
    }))
  }

  const addManifestItem = () => {
    const id = `item_${Date.now()}`
    setPack(prev => ({
      ...prev,
      validator: {
        ...(prev.validator || {}),
        manifest: [...(prev.validator?.manifest || []), { id, title: 'Additional item', required: false, status: 'present' }]
      }
    }))
  }

  const saveStatement = (key: StatementKey, summary?: string, textOverride?: string) => {
    const text = textOverride !== undefined ? textOverride : drafts[key]
    const existing = pack[key] as Gateway3Statement | undefined
    const versions = [
      { id: `v_${Date.now()}`, text, createdAt: new Date().toISOString(), summary: summary || 'Saved manually' },
      ...(existing?.versions || [])
    ]
    const nextStatement: Gateway3Statement = { ...(existing || { title: TAB_LABELS[key] }), text, versions, lastGeneratedAt: new Date().toISOString() }
    persistPack({ [key]: nextStatement } as Partial<Gateway3Pack>)
  }

  const restoreStatementVersion = (key: StatementKey, versionId: string) => {
    const statement = pack[key] as Gateway3Statement | undefined
    const found = statement?.versions?.find(v => v.id === versionId)
    if (!found) return
    setDrafts(prev => ({ ...prev, [key]: found.text }))
    persistPack({ [key]: { ...(statement || { title: TAB_LABELS[key] }), text: found.text, versions: statement?.versions || [], lastGeneratedAt: new Date().toISOString() } as any })
  }

  const runRequirementsCheck = async () => {
    if (!workingPlan) return
    setLoading(true)
    setError(null)
    try {
      const prompt = [
        'You are the Gateway 3 Pack Builder requirements engine for a Local Plan (CULP workflow).',
        'Tabs: Requirements RAG, Statement of Compliance, Statement of Soundness, Examination Readiness Note, Submission Bundle Validator.',
        'Evaluate each requirement for Gateway 3 and return JSON: { "requirements": [ { "id": string, "title": string, "status": "red"|"amber"|"green", "explanation": string, "suggestedFix": string, "sources": string[] } ], "summary": string, "inspectorFocus": string[] }',
        'Status logic: Green fully evidenced/linked; Amber partial, inconsistent, or outdated; Red missing or contradictory.',
        `Requirement definitions: ${(BASE_REQUIREMENTS.map(r => `${r.id}: ${r.title} — ${r.description}`).join(' | '))}.`,
        `Current stored requirements: ${serialiseRequirements(pack.requirements) || 'none'}`,
        'Apply temporal checks, cross-references (vision ↔ strategy ↔ policies), SEA/HRA coverage, and plan/evidence linkage.',
        `Plan snapshot:\n${planSnapshot}`
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const parsed = extractJsonObject(raw)
      const incoming: Gateway3Requirement[] = mergeRequirements(parsed?.requirements)
      const now = new Date().toISOString()
      const merged = mergeRequirements(pack.requirements).map(req => {
        const found = incoming.find(r => r.id === req.id)
        if (!found) return req
        return {
          ...req,
          ...found,
          status: normalizeRag(found.status) || req.status,
          explanation: found.explanation || req.explanation,
          suggestedFix: found.suggestedFix || req.suggestedFix,
          sources: found.sources || req.sources,
          lastUpdated: now
        }
      })
      const nextPack: Partial<Gateway3Pack> = { requirements: merged, summary: parsed?.summary || pack.summary, inspectorFocus: parsed?.inspectorFocus || pack.inspectorFocus }
      persistPack(nextPack)
      setStatus('Requirements check generated.')
    } catch (e: any) {
      setError(e?.message || 'Unable to run requirements check.')
    } finally {
      setLoading(false)
    }
  }

  const generateStatement = async (key: StatementKey) => {
    if (!workingPlan) return
    setLoading(true)
    setError(null)
    try {
      const requirementText = serialiseRequirements(pack.requirements) || 'No RAG yet.'
      const label = key === 'compliance' ? 'Statement of Compliance' : key === 'soundness' ? 'Statement of Soundness' : 'Examination Readiness Note'
      const focus = key === 'soundness'
        ? 'Cover NPPF tests: positively prepared, justified, effective, consistent with national policy. Flag weaknesses inline as amber bubbles.'
        : key === 'compliance'
          ? 'Draft the formal Statement of Compliance using RAG (Green -> confident text; Amber/Red -> explain mitigation).'
          : 'Draft the readiness briefing: roles, logistics, programme officer contact, documents handling, expected inspector focus areas.'
      const prompt = [
        `You are drafting the ${label} for Gateway 3.`,
        'Use the RAG, evidence, and submission context. Planner-readable, concise but formal.',
        focus,
        'Return JSON only: { "text": string, "summary": string, "inspectorFocus": string[] }',
        `Requirements RAG:\n${requirementText}`,
        `Plan snapshot:\n${planSnapshot}`
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const parsed = extractJsonObject(raw) || {}
      const text = parsed.text || raw || drafts[key]
      setDrafts(prev => ({ ...prev, [key]: text }))
      const updatedFocus = parsed.inspectorFocus || pack.inspectorFocus
      const nextPack: Partial<Gateway3Pack> = { inspectorFocus: updatedFocus }
      setPack(prev => ({ ...prev, inspectorFocus: updatedFocus }))
      persistPack(nextPack)
      saveStatement(key, parsed.summary || 'Auto-generated', text)
      setStatus(`${label} generated.`)
    } catch (e: any) {
      setError(e?.message || 'Unable to generate statement.')
    } finally {
      setLoading(false)
    }
  }

  const validateBundle = async () => {
    if (!workingPlan) return
    setLoading(true)
    setError(null)
    try {
      const prompt = [
        'You are validating the Gateway 3 submission bundle.',
        'Return JSON: { "manifest": [ { "id": string, "title": string, "required": boolean, "status": "present"|"missing"|"outdated", "warning": string } ], "warnings": string[], "summary": string }',
        'Check: required documents present, correct versions, policies map validity, SEA/HRA coverage, SoCGs, consultation evidence, no placeholder content.',
        `Current manifest (with statuses): ${(pack.validator?.manifest || []).map(m => `${m.title}:${m.status}`).join(' | ') || 'none'}`,
        `Plan snapshot:\n${planSnapshot}`
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const parsed = extractJsonObject(raw)
      const incoming = parsed ? mergeManifest(parsed.manifest) : undefined
      const mergedManifest = incoming
        ? mergeManifest(pack.validator?.manifest).map(item => {
            const found = incoming.find(i => i.id === item.id)
            if (!found) return item
            const status = (found.status || item.status) as Gateway3ManifestItem['status']
            return { ...item, ...found, status }
          })
        : mergeManifest(pack.validator?.manifest)
      const nextPack: Partial<Gateway3Pack> = {
        validator: {
          manifest: mergedManifest,
          warnings: parsed?.warnings || [],
          summary: parsed?.summary || pack.validator?.summary,
          lastValidatedAt: new Date().toISOString(),
          notes: pack.validator?.notes
        }
      }
      persistPack(nextPack)
      setStatus('Submission bundle validated.')
    } catch (e: any) {
      setError(e?.message || 'Unable to validate bundle.')
    } finally {
      setLoading(false)
    }
  }

  const autofillFromContext = async () => {
    if (!workingPlan) return
    setLoading(true)
    setError(null)
    try {
      const prompt = [
        'You are the Gateway 3 Pack Builder autofill agent. Use ONLY the provided plan snapshot; do not invent places or documents.',
        'Return JSON: { "requirements": [{ "id": string, "status": "red|amber|green", "explanation": string, "suggestedFix": string, "sources": string[] }], "complianceText": string, "soundnessText": string, "readinessText": string, "manifest": [{ "id": string, "status": "present|missing|outdated", "warning": string }], "summary": string, "inspectorFocus": [string] }',
        'Only populate fields you can ground in the snapshot. Leave unspecified fields null/absent.',
        'Use RAG logic consistent with Gateway 3. Keep text concise and planner-readable.',
        `Requirement definitions: ${(BASE_REQUIREMENTS.map(r => `${r.id}: ${r.title} — ${r.description}`).join(' | '))}.`,
        `Plan snapshot:\n${planSnapshot}`
      ].join('\n')
      const raw = await callLLM({ mode: 'json', prompt })
      const parsed = extractJsonObject(raw) || {}
      const next: Partial<Gateway3Pack> = {}

      if (parsed.requirements) {
        const incoming: Gateway3Requirement[] = mergeRequirements(parsed.requirements)
        next.requirements = mergeRequirements(pack.requirements).map(req => {
          const found = incoming.find(r => r.id === req.id)
          if (!found) return req
          return {
            ...req,
            ...found,
            status: normalizeRag(found.status) || req.status,
            explanation: found.explanation || req.explanation,
            suggestedFix: found.suggestedFix || req.suggestedFix,
            sources: found.sources || req.sources,
            lastUpdated: new Date().toISOString()
          }
        })
      }

      const now = new Date().toISOString()
      if (parsed.complianceText) {
        const versions = [{ id: `auto_${Date.now()}`, text: parsed.complianceText, createdAt: now, summary: 'Context autofill' }, ...(pack.compliance?.versions || [])]
        next.compliance = { ...(pack.compliance || { title: 'Statement of Compliance' }), text: parsed.complianceText, versions, lastGeneratedAt: now }
        setDrafts(prev => ({ ...prev, compliance: parsed.complianceText }))
      }
      if (parsed.soundnessText) {
        const versions = [{ id: `auto_${Date.now()}`, text: parsed.soundnessText, createdAt: now, summary: 'Context autofill' }, ...(pack.soundness?.versions || [])]
        next.soundness = { ...(pack.soundness || { title: 'Statement of Soundness' }), text: parsed.soundnessText, versions, lastGeneratedAt: now }
        setDrafts(prev => ({ ...prev, soundness: parsed.soundnessText }))
      }
      if (parsed.readinessText) {
        const versions = [{ id: `auto_${Date.now()}`, text: parsed.readinessText, createdAt: now, summary: 'Context autofill' }, ...(pack.readiness?.versions || [])]
        next.readiness = { ...(pack.readiness || { title: 'Examination Readiness Note' }), text: parsed.readinessText, versions, lastGeneratedAt: now }
        setDrafts(prev => ({ ...prev, readiness: parsed.readinessText }))
      }

      if (parsed.manifest) {
        const incoming = mergeManifest(parsed.manifest)
        next.validator = {
          ...(pack.validator || {}),
          manifest: mergeManifest(pack.validator?.manifest).map(item => {
            const found = incoming.find(i => i.id === item.id)
            if (!found) return item
            const status = (found.status || item.status) as Gateway3ManifestItem['status']
            return { ...item, ...found, status }
          })
        }
      }

      if (parsed.summary) next.summary = parsed.summary
      if (parsed.inspectorFocus) next.inspectorFocus = parsed.inspectorFocus

      if (Object.keys(next).length > 0) {
        persistPack(next)
        setStatus('Context autofill applied.')
      } else {
        setStatus('No autofill changes returned.')
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to autofill from context.')
    } finally {
      setLoading(false)
    }
  }

  const renderStatementTab = (key: StatementKey) => {
    const title = TAB_LABELS[key]
    const statement = pack[key] as Gateway3Statement | undefined
    const draft = drafts[key]
    const preview = previewMode[key]
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">{title}</div>
            <div className="text-xs text-[var(--color-muted)]">
              {key === 'soundness' ? 'Structure against NPPF tests with evidence links.' : key === 'compliance' ? 'Populate from requirements check, LPA metadata, and evidence.' : 'Practical readiness briefing for Programme Officer.'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]" disabled={loading} onClick={() => generateStatement(key)}>
              {loading ? 'Working…' : 'Generate with AI'}
            </button>
            <button className="px-3 py-1.5 text-sm rounded bg-[var(--color-accent)] text-white" disabled={loading} onClick={() => saveStatement(key, 'Manual save')}>
              {loading ? 'Saving…' : 'Save + version'}
            </button>
            <button className="px-3 py-1.5 text-sm rounded border border-[var(--color-edge)]" onClick={() => setPreviewMode(prev => ({ ...prev, [key]: !prev[key] }))}>
              {preview ? 'Edit mode' : 'Preview'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-xs text-[var(--color-muted)]">Draft text (markdown supported)</div>
            {!preview && (
              <textarea
                value={draft}
                onChange={e => setDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                rows={18}
                className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-ink)]"
                placeholder={`Generate to draft the ${title.toLowerCase()}.`}
              />
            )}
            {preview && (
              <div className="border border-[var(--color-edge)] rounded p-3 bg-[var(--color-surface)] prose prose-sm max-w-none text-[var(--color-ink)]">
                {draft ? <MarkdownContent content={draft} /> : <div className="text-xs text-[var(--color-muted)]">No content yet.</div>}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded p-3">
              <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Version history</div>
              <div className="space-y-2 max-h-[340px] overflow-auto">
                {statement?.versions && statement.versions.length > 0 ? statement.versions.map(v => (
                  <div key={v.id} className="border border-[var(--color-edge)] rounded p-2 bg-[var(--color-surface)]">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-[var(--color-ink)]">Saved {formatDate(v.createdAt)}</div>
                      <button className="text-xs text-[var(--color-accent)] hover:underline" onClick={() => restoreStatementVersion(key, v.id)}>Restore</button>
                    </div>
                    {v.summary && <div className="text-xs text-[var(--color-muted)] mb-1">{v.summary}</div>}
                    <div className="text-xs text-[var(--color-ink)] line-clamp-3 whitespace-pre-line">{v.text}</div>
                  </div>
                )) : <div className="text-xs text-[var(--color-muted)]">No versions saved yet.</div>}
              </div>
            </div>
            {pack.inspectorFocus && pack.inspectorFocus.length > 0 && (
              <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded p-3">
                <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Expected inspector focus</div>
                <ul className="list-disc ml-5 text-sm text-[var(--color-ink)] space-y-1">
                  {pack.inspectorFocus.map((f, idx) => <li key={idx}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderRequirementsTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">Requirements RAG</div>
          <div className="text-xs text-[var(--color-muted)]">Requirement-by-requirement status with explanations and suggested fixes. Officer overrides are allowed.</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]" disabled={loading} onClick={addRequirement}>Add requirement</button>
          <button className="px-3 py-1.5 text-sm rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]" disabled={loading} onClick={() => persistPack({})}>Save changes</button>
          <button className="px-3 py-1.5 text-sm rounded bg-[var(--color-accent)] text-white" disabled={loading} onClick={runRequirementsCheck}>
            {loading ? 'Running…' : 'Run RAG with AI'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {(pack.requirements || []).map(req => (
          <div key={req.id} className="border border-[var(--color-edge)] rounded-xl p-3 bg-[var(--color-surface)]">
            <div className="flex items-start justify-between gap-3">
              <div className="pr-2">
                <div className="text-sm font-semibold text-[var(--color-ink)]">{req.title}</div>
                {req.description && <div className="text-xs text-[var(--color-muted)] mb-1">{req.description}</div>}
                {req.lastUpdated && <div className="text-[11px] text-[var(--color-muted)]">Updated {formatDate(req.lastUpdated)}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className={ragBadge(req.status, 'sm')}>{req.status || 'Set status'}</span>
                <select
                  value={req.status || ''}
                  onChange={e => updateRequirement(req.id, { status: normalizeRag(e.target.value) })}
                  className="text-sm border border-[var(--color-edge)] rounded px-2 py-1 bg-white"
                >
                  <option value="">Set</option>
                  <option value="green">Green</option>
                  <option value="amber">Amber</option>
                  <option value="red">Red</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div className="space-y-1">
                <label className="text-[11px] text-[var(--color-muted)]">Explanation</label>
                <textarea
                  value={req.explanation || ''}
                  onChange={e => updateRequirement(req.id, { explanation: e.target.value })}
                  rows={3}
                  className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-panel)] p-2 text-sm text-[var(--color-ink)]"
                  placeholder="Short reason and source links."
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-[var(--color-muted)]">Suggested fix</label>
                <textarea
                  value={req.suggestedFix || ''}
                  onChange={e => updateRequirement(req.id, { suggestedFix: e.target.value })}
                  rows={3}
                  className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-panel)] p-2 text-sm text-[var(--color-ink)]"
                  placeholder="Actions to reach green."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] text-[var(--color-muted)]">Sources / references</label>
                <input
                  value={(req.sources || []).join(', ')}
                  onChange={e => updateRequirement(req.id, { sources: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-panel)] p-2 text-sm text-[var(--color-ink)]"
                  placeholder="e.g., Regulation 19 statement, Housing Topic Paper (2024)"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-[var(--color-muted)]">Override note</label>
                <input
                  value={req.overrideNote || ''}
                  onChange={e => updateRequirement(req.id, { overrideNote: e.target.value, lastUpdated: new Date().toISOString() })}
                  className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-panel)] p-2 text-sm text-[var(--color-ink)]"
                  placeholder="Officer override rationale"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderValidatorTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">Submission Bundle Validator</div>
          <div className="text-xs text-[var(--color-muted)]">Manifest, completeness check, spatial/map sanity, and warnings before lodging for examination.</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]" onClick={addManifestItem}>Add manifest item</button>
          <button className="px-3 py-1.5 text-sm rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]" disabled={loading} onClick={() => persistPack({})}>Save manifest</button>
          <button className="px-3 py-1.5 text-sm rounded bg-[var(--color-accent)] text-white" disabled={loading} onClick={validateBundle}>
            {loading ? 'Validating…' : 'Validate with AI'}
          </button>
        </div>
      </div>
      <div className="text-xs text-[var(--color-muted)]">
        Last validated: {formatDate(pack.validator?.lastValidatedAt)}{pack.validator?.summary ? ` • ${pack.validator.summary}` : ''}
      </div>
      <div className="space-y-2">
        {(pack.validator?.manifest || []).map(item => (
          <div key={item.id} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">{item.title}</div>
                <div className="text-[11px] text-[var(--color-muted)]">{item.required ? 'Required' : 'Optional'}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={manifestBadge(item.status)}>{item.status || 'unset'}</span>
                <select
                  value={item.status || ''}
                  onChange={e => updateManifestItem(item.id, { status: e.target.value as Gateway3ManifestItem['status'] })}
                  className="text-sm border border-[var(--color-edge)] rounded px-2 py-1 bg-white"
                >
                  <option value="">Set</option>
                  <option value="present">Present</option>
                  <option value="outdated">Outdated</option>
                  <option value="missing">Missing</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <div className="space-y-1">
                <label className="text-[11px] text-[var(--color-muted)]">Version</label>
                <input
                  value={item.version || ''}
                  onChange={e => updateManifestItem(item.id, { version: e.target.value })}
                  className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-panel)] p-2 text-sm text-[var(--color-ink)]"
                  placeholder="v1.0, May 2024"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-[var(--color-muted)]">Hash / signature</label>
                <input
                  value={item.hash || ''}
                  onChange={e => updateManifestItem(item.id, { hash: e.target.value })}
                  className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-panel)] p-2 text-sm text-[var(--color-ink)]"
                  placeholder="Checksum or reference"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-[var(--color-muted)]">Warning / note</label>
                <input
                  value={item.warning || ''}
                  onChange={e => updateManifestItem(item.id, { warning: e.target.value })}
                  className="w-full rounded border border-[var(--color-edge)] bg-[var(--color-panel)] p-2 text-sm text-[var(--color-ink)]"
                  placeholder="E.g., awaiting final maps"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      {pack.validator?.warnings && pack.validator.warnings.length > 0 && (
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-3">
          <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Warnings</div>
          <ul className="list-disc ml-5 text-sm text-[var(--color-ink)] space-y-1">
            {pack.validator.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'requirements':
        return renderRequirementsTab()
      case 'compliance':
        return renderStatementTab('compliance')
      case 'soundness':
        return renderStatementTab('soundness')
      case 'readiness':
        return renderStatementTab('readiness')
      case 'validator':
        return renderValidatorTab()
      default:
        return null
    }
  }

  if (!workingPlan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan loaded</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to use the Gateway 3 Pack Builder.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-panel)]">
          <div className="text-xs text-[var(--color-muted)]">Requirements status</div>
          <div className="text-lg font-semibold text-[var(--color-ink)]">{requirementStats.green}G / {requirementStats.amber}A / {requirementStats.red}R</div>
          <div className="text-[11px] text-[var(--color-muted)]">{requirementStats.total} items tracked</div>
        </div>
        <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-panel)]">
          <div className="text-xs text-[var(--color-muted)]">Statements captured</div>
          <div className="text-lg font-semibold text-[var(--color-ink)]">
            {[pack.compliance?.text, pack.soundness?.text, pack.readiness?.text].filter(Boolean).length}/3
          </div>
          <div className="text-[11px] text-[var(--color-muted)]">Compliance · Soundness · Readiness</div>
        </div>
        <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-panel)]">
          <div className="text-xs text-[var(--color-muted)]">Bundle completeness</div>
          <div className="text-lg font-semibold text-[var(--color-ink)]">
            {manifestStats.total - manifestStats.missing - manifestStats.outdated}/{manifestStats.total} ready
          </div>
          <div className="text-[11px] text-[var(--color-muted)]">
            {manifestStats.missing} missing · {manifestStats.outdated} outdated
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-edge)] flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {(Object.keys(TAB_LABELS) as TabId[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded text-sm border ${activeTab === tab ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-ink)]' : 'border-[var(--color-edge)] text-[var(--color-muted)]'}`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-sm rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)]"
              disabled={loading}
              onClick={autofillFromContext}
            >
              {loading ? 'Working…' : 'Auto-fill from plan context'}
            </button>
            <div className="text-[11px] text-[var(--color-muted)]">Last updated: {formatDate(pack.updatedAt)}</div>
          </div>
        </div>
        <div className="p-4 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10">
              <LoadingSpinner />
            </div>
          )}
          {status && <div className="mb-3 text-xs text-[var(--color-ink)]">{status}</div>}
          {error && <div className="mb-3 text-xs text-red-600">{error}</div>}
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
