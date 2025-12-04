import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { CouncilData, Plan } from '../../../../data/types'
import { usePlan } from '../../../../contexts/PlanContext'
import { summarizeSeaHra } from '../../../../utils/seaHra'
import { callLLM } from '../../../../utils/llmClient'
import { MarkdownContent } from '../../../../components/MarkdownContent'
import { LoadingSpinner } from '../../shared/LoadingSpinner'

type SectionStatus = 'draft' | 'edited' | 'reviewed' | 'locked'

type PackSection = {
  id: string
  title: string
  content: string
  include: boolean
  status: SectionStatus
  questions?: string[]
}

type PackDraft = {
  sections: PackSection[]
  warningsMarkdown: string
  summaryMarkdown: string
  easyReadMarkdown?: string
}

const DEFAULT_SECTIONS: PackSection[] = [
  { id: 'overview', title: 'Overview & Purpose', content: '', include: true, status: 'draft' },
  { id: 'vision', title: 'Vision & Objectives', content: '', include: true, status: 'draft' },
  { id: 'options', title: 'Spatial Options', content: '', include: true, status: 'draft' },
  { id: 'evidence', title: 'Evidence & Data Story', content: '', include: true, status: 'draft' },
  { id: 'sea', title: 'SEA / HRA at this stage', content: '', include: true, status: 'draft' },
  { id: 'tradeoffs', title: 'Key Trade-offs', content: '', include: true, status: 'draft' },
  { id: 'questions', title: 'Consultation Questions', content: '', include: true, status: 'draft' },
  { id: 'respond', title: 'How to Comment', content: '', include: true, status: 'draft' }
]

const QUESTION_TEMPLATES = [
  { label: 'Agree/Disagree', text: 'Do you agree with the proposed vision and objectives? Why or why not?' },
  { label: 'Options preference', text: 'Which spatial option do you prefer and why? What would you change about it?' },
  { label: 'Missing issues', text: 'Is anything important missing from the options or evidence presented?' },
  { label: 'Site feedback', text: 'Are there sites or locations you think we should consider? Please explain why.' },
  { label: 'SEA/HRA', text: 'Have we captured the right environmental issues at this stage? What else should we consider?' },
  { label: 'How to respond', text: 'Is the consultation material clear? How could we make it more accessible?' }
]

const statusLabel: Record<SectionStatus, string> = {
  draft: 'Draft',
  edited: 'Edited',
  reviewed: 'Reviewed',
  locked: 'Locked'
}

function alignSections(saved?: PackSection[]): PackSection[] {
  const byId = new Map((saved || []).map(s => [s.id, s]))
  const merged = DEFAULT_SECTIONS.map(base => ({
    ...base,
    ...(byId.get(base.id) || {}),
    include: byId.has(base.id) ? (byId.get(base.id)!.include ?? true) : base.include,
    status: (byId.get(base.id)?.status as SectionStatus) || base.status,
    questions: byId.get(base.id)?.questions || []
  }))
  ;(saved || []).forEach(sec => {
    if (!merged.find(s => s.id === sec.id)) {
      merged.push({ ...sec, include: sec.include ?? true, status: (sec.status as SectionStatus) || 'draft', questions: sec.questions || [] })
    }
  })
  return merged
}

function buildPlanContext(plan: Plan, councilData: CouncilData): string {
  const vision = (plan.visionStatements || []).map(v => `- ${v.text}${v.metric ? ` (metric: ${v.metric})` : ''}`).join('\n') || 'No vision drafted.'
  const outcomes = (plan.smartOutcomes || []).map(o => `- ${o.outcomeStatement}${o.indicators?.length ? ` | indicators: ${o.indicators.map(i => i.name || i.id).join(', ')}` : ''}`).join('\n') || 'No outcomes recorded.'
  const strategies = (councilData.strategies || []).map(s => `- ${s.label}: ${s.desc}`).join('\n') || 'No strategy options defined.'
  const preferred = plan.preferredOptions?.strategy?.analysis ? `Preferred option notes: ${plan.preferredOptions.strategy.analysis}` : ''
  const sites = (plan.sites || []).map(s => {
    const rag = [s.suitability, s.availability, s.achievability].filter(Boolean).join('/')
    return `- ${s.name}${rag ? ` (${rag})` : ''}${s.capacityEstimate ? ` | capacity: ${s.capacityEstimate}` : ''}${s.description ? ` | ${s.description}` : ''}`
  }).join('\n') || 'No sites assessed yet.'
  const evidence = [
    plan.baselineNarrative ? `Baseline narrative: ${plan.baselineNarrative}` : '',
    plan.baselineTrends ? Object.entries(plan.baselineTrends).map(([k, v]) => `- ${k}: ${v}`).join('\n') : '',
    (plan.evidenceInventory || []).map(ev => `- ${ev.title}${ev.status ? ` [${ev.status}]` : ''}${ev.topic ? ` | topic: ${ev.topic}` : ''}`).join('\n')
  ].filter(Boolean).join('\n') || 'Evidence summaries not captured.'
  const seaSummary = summarizeSeaHra(plan)
  const sea = [
    seaSummary.statusLine,
    `Baseline: ${seaSummary.baseline}`,
    `HRA: ${seaSummary.hra}`,
    `Mitigation: ${seaSummary.mitigation}`,
    `Risks: ${seaSummary.risks}`,
    `Consultation: ${seaSummary.consultation}`,
    `Cumulative: ${seaSummary.cumulative}`
  ].join('\n')
  const consultations = (plan.consultationSummaries || []).map(c => `- ${c.stageId}: ${c.who} (${c.when}) via ${c.how} | issues: ${(c.mainIssues || []).join('; ')}`).join('\n') || 'No consultation summaries logged.'
  const milestone = (plan.timetable?.milestones || []).find(m => m.stageId === 'CONSULTATION_1')?.date
  const timeline = milestone ? `Proposed Consultation 1 dates: ${milestone}` : 'Consultation dates not set.'

  return [
    `Authority: ${plan.area}`,
    `Plan title: ${plan.title}`,
    `Vision:`,
    vision,
    `Outcomes:`,
    outcomes,
    `Strategy options:`,
    strategies,
    preferred,
    `Site snapshots:`,
    sites,
    `Evidence:`,
    evidence,
    `SEA/HRA:`,
    sea,
    `Consultations so far:`,
    consultations,
    timeline
  ].filter(Boolean).join('\n')
}

async function generatePackDraft(params: {
  plan: Plan
  councilData: CouncilData
  sections: PackSection[]
  tone: string
  readingLevel: string
  focusSection?: string
}): Promise<PackDraft> {
  const { plan, councilData, sections, tone, readingLevel, focusSection } = params
  const outline = sections
    .filter(s => (focusSection ? s.id === focusSection : s.include))
    .map(s => `- ${s.title} (id: ${s.id})`)
    .join('\n')

  const prompt = [
    'SYSTEM:',
    'You are assembling a Consultation 1 pack (consult on proposed plan content and evidence) for a Local Plan team.',
    'Keep it plain-English and neutral. Do not invent sites, numbers, or policies not provided. Highlight gaps rather than filling them with guesses.',
    `Tone preference: ${tone}. Reading level: ${readingLevel === 'ks4' ? 'approx KS4 (14-16) plain language' : 'professional but clear'}.`,
    'Respect the outline supplied. If context is thin, write concise placeholders and add a warning.',
    '',
    'USER:',
    `Plan context (ground truth):\n${buildPlanContext(plan, councilData)}`,
    `Outline to cover:\n${outline || 'No outline supplied'}`,
    focusSection ? `Focus only on section id "${focusSection}" and leave others unchanged.` : 'Generate all sections listed above.',
    '',
    'TASK:',
    '1) Draft markdown paragraphs/bullets for each section. Make it legible for public consultation.',
    '2) Add 3-10 structured consultation questions in the “Consultation Questions” section (balanced, unbiased).',
    '3) Explain SEA/HRA at a scoping/high-level only; do not over-promise.',
    '4) Add a short “How to comment” with channels/dates if present; otherwise say dates to be confirmed.',
    '5) Return JSON ONLY with shape { sections: [{ id, title, content, questions? }], summaryMarkdown: string, warningsMarkdown: string, easyReadMarkdown?: string }.',
    'Warnings should flag missing evidence, inconsistencies, or jargon. Do not include extra fields.'
  ].join('\n')

  const raw = await callLLM({ mode: 'json', prompt })
  try {
    const parsed = JSON.parse(raw || '{}')
    if (Array.isArray(parsed.sections)) {
      return {
        sections: parsed.sections as PackSection[],
        warningsMarkdown: parsed.warningsMarkdown || '',
        summaryMarkdown: parsed.summaryMarkdown || '',
        easyReadMarkdown: parsed.easyReadMarkdown || ''
      }
    }
  } catch {
    // fallthrough
  }
  return {
    sections: sections,
    warningsMarkdown: typeof raw === 'string' ? raw : '⚠️ Unable to parse warnings.',
    summaryMarkdown: 'No summary generated.',
    easyReadMarkdown: ''
  }
}

export const ConsultationPackGeneratorTool: React.FC<{ plan: Plan | undefined; councilData: CouncilData; autoRun?: boolean; initialData?: Record<string, any> }> = ({ plan, councilData, autoRun = false, initialData }) => {
  const { updatePlan } = usePlan()
  const [sections, setSections] = useState<PackSection[]>(DEFAULT_SECTIONS)
  const [selectedSection, setSelectedSection] = useState<string>(DEFAULT_SECTIONS[0].id)
  const [warnings, setWarnings] = useState('')
  const [summary, setSummary] = useState('')
  const [easyRead, setEasyRead] = useState('')
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [tone, setTone] = useState<'accessible' | 'formal'>('accessible')
  const [readingLevel, setReadingLevel] = useState<'ks4' | 'professional'>('ks4')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!plan) return
    if (plan.consultationPack) {
      setSections(alignSections(plan.consultationPack.sections))
      setWarnings(plan.consultationPack.warningsMarkdown || '')
      setSummary(plan.consultationPack.summaryMarkdown || '')
      setEasyRead(plan.consultationPack.easyReadMarkdown || '')
      if (plan.consultationPack.tone === 'formal' || plan.consultationPack.tone === 'accessible') setTone(plan.consultationPack.tone)
      if (plan.consultationPack.readingLevel === 'professional' || plan.consultationPack.readingLevel === 'ks4') setReadingLevel(plan.consultationPack.readingLevel)
    } else if (initialData?.sections) {
      setSections(alignSections(initialData.sections as PackSection[]))
      setWarnings(initialData.warningsMarkdown || '')
      setSummary(initialData.summaryMarkdown || '')
      setEasyRead(initialData.easyReadMarkdown || '')
    } else {
      const base = alignSections()
      if (plan.seaHra) {
        const seaSummary = summarizeSeaHra(plan)
        const idx = base.findIndex(s => s.id === 'sea')
        if (idx >= 0) {
          base[idx] = {
            ...base[idx],
            content: [
              seaSummary.statusLine,
              `Baseline: ${seaSummary.baseline}`,
              `HRA: ${seaSummary.hra}`,
              `Mitigation: ${seaSummary.mitigation}`,
              `Risks: ${seaSummary.risks}`,
              `Consultation: ${seaSummary.consultation}`,
              `Cumulative: ${seaSummary.cumulative}`
            ].join('\n')
          }
        }
      }
      setSections(base)
      setWarnings('')
      setSummary('')
      setEasyRead('')
    }
    setSelectedSection((plan?.consultationPack?.sections && plan.consultationPack.sections[0]?.id) || DEFAULT_SECTIONS[0].id)
  }, [plan?.id, plan?.consultationPack, initialData])

  useEffect(() => {
    if (!plan || !autoRun) return
    if (plan.consultationPack?.sections && plan.consultationPack.sections.length > 0) return
    handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, plan?.id])

  const dataPalette = useMemo(() => {
    if (!plan) return []
    const seaSummary = summarizeSeaHra(plan)
    return [
      { title: 'Vision & outcomes', body: `${(plan.visionStatements || []).map(v => `- ${v.text}`).join('\n') || 'No vision yet.'}\n${(plan.smartOutcomes || []).map(o => `- ${o.outcomeStatement}`).join('\n') || ''}`.trim() },
      { title: 'Spatial options', body: (councilData.strategies || []).map(s => `${s.label}: ${s.desc}`).join('\n') || 'No options listed.' },
      { title: 'Evidence & trends', body: plan.baselineNarrative || Object.entries(plan.baselineTrends || {}).map(([k, v]) => `${k}: ${v}`).join('\n') || 'No evidence summary.' },
      { title: 'Sites (early view)', body: (plan.sites || []).map(s => `${s.name}: ${s.description || s.notes || 'No notes'}`).join('\n') || 'No sites yet.' },
      { title: 'SEA / HRA', body: [
        seaSummary.statusLine,
        `Baseline: ${seaSummary.baseline}`,
        `HRA: ${seaSummary.hra}`,
        `Mitigation: ${seaSummary.mitigation}`,
        `Risks: ${seaSummary.risks}`,
        `Consultation: ${seaSummary.consultation}`,
        `Cumulative: ${seaSummary.cumulative}`
      ].join('\n') },
      { title: 'Consultations so far', body: (plan.consultationSummaries || []).map(c => `${c.stageId}: ${c.who} (${c.when})`).join('\n') || 'No consultation log.' }
    ]
  }, [plan, councilData])

  const current = sections.find(s => s.id === selectedSection) || sections[0]

  const savePack = () => {
    if (!plan) return
    updatePlan(plan.id, {
      consultationPack: {
        sections,
        warningsMarkdown: warnings,
        summaryMarkdown: summary,
        easyReadMarkdown: easyRead,
        lastGeneratedAt: new Date().toISOString(),
        tone,
        readingLevel
      }
    } as any)
  }

  const handleGenerate = async (focusSection?: string) => {
    if (!plan) return
    setLoading(true)
    setError(null)
    try {
      const draft = await generatePackDraft({ plan, councilData, sections, tone, readingLevel, focusSection })
      const incoming = alignSections(draft.sections)
      const byId = new Map(incoming.map(s => [s.id, s]))
      const merged = alignSections(sections).map(sec => {
        const next = byId.get(sec.id)
        if (!next) return sec
        return { ...sec, content: next.content || '', questions: next.questions || sec.questions || [], status: sec.status }
      })
      setSections(merged)
      setWarnings(draft.warningsMarkdown || '')
      setSummary(draft.summaryMarkdown || '')
      setEasyRead(draft.easyReadMarkdown || '')
      updatePlan(plan.id, {
        consultationPack: {
          sections: merged,
          warningsMarkdown: draft.warningsMarkdown || '',
          summaryMarkdown: draft.summaryMarkdown || '',
          easyReadMarkdown: draft.easyReadMarkdown || '',
          lastGeneratedAt: new Date().toISOString(),
          tone,
          readingLevel
        }
      } as any)
    } catch (e: any) {
      setError(e?.message || 'Could not generate pack right now.')
    } finally {
      setLoading(false)
    }
  }

  const updateSectionContent = (text: string) => {
    setSections(prev => prev.map(s => s.id === current.id ? { ...s, content: text, status: 'edited' } : s))
  }

  const updateQuestions = (text: string) => {
    const qs = text.split('\n').map(q => q.trim()).filter(Boolean)
    setSections(prev => prev.map(s => s.id === current.id ? { ...s, questions: qs, status: 'edited' } : s))
  }

  const insertText = (text: string) => {
    if (!textareaRef.current) {
      updateSectionContent(`${current.content}\n${text}`)
      return
    }
    const el = textareaRef.current
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = current.content.slice(0, start) + text + current.content.slice(end)
    updateSectionContent(next)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + text.length
      el.focus()
    })
  }

  if (!plan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan loaded</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to assemble the consultation pack.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr,320px] gap-4">
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-3">
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">Sections</div>
          <div className="text-xs text-[var(--color-muted)] mb-2">Toggle include/internal and pick a section to edit.</div>
          <div className="space-y-2">
            {sections.map(sec => (
              <button
                key={sec.id}
                onClick={() => setSelectedSection(sec.id)}
                className={`w-full text-left px-3 py-2 rounded border ${selectedSection === sec.id ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-edge)] bg-[var(--color-surface)]'}`}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-ink)]">{sec.title}</span>
                  <span className="text-[11px] text-[var(--color-muted)]">{statusLabel[sec.status]}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className={sec.include ? 'text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}>{sec.include ? 'Included' : 'Internal only'}</span>
                  <button
                    className="text-[var(--color-accent)] hover:underline"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSections(prev => prev.map(s => s.id === sec.id ? { ...s, include: !s.include } : s))
                    }}
                  >
                    {sec.include ? 'Hide externally' : 'Include'}
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-muted)]">Tone</span>
            <button
              className={`px-2 py-1 rounded border text-xs ${tone === 'accessible' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-edge)]'}`}
              onClick={() => setTone('accessible')}
            >
              Accessible
            </button>
            <button
              className={`px-2 py-1 rounded border text-xs ${tone === 'formal' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-edge)]'}`}
              onClick={() => setTone('formal')}
            >
              Formal
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-muted)]">Reading level</span>
            <button
              className={`px-2 py-1 rounded border text-xs ${readingLevel === 'ks4' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-edge)]'}`}
              onClick={() => setReadingLevel('ks4')}
            >
              KS4
            </button>
            <button
              className={`px-2 py-1 rounded border text-xs ${readingLevel === 'professional' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-edge)]'}`}
              onClick={() => setReadingLevel('professional')}
            >
              Professional
            </button>
          </div>
          <button
            onClick={() => handleGenerate()}
            className="w-full px-3 py-2 text-sm rounded bg-[var(--color-accent)] text-white"
            disabled={loading}
          >
            {loading ? 'Generating…' : 'Generate full pack'}
          </button>
          <button
            onClick={() => handleGenerate(selectedSection)}
            className="w-full px-3 py-2 text-sm rounded bg-[var(--color-panel)] border border-[var(--color-edge)] hover:border-[var(--color-accent)]"
            disabled={loading}
          >
            {loading ? 'Working…' : 'Refresh selected section'}
          </button>
          <button
            onClick={savePack}
            className="w-full px-3 py-2 text-sm rounded bg-[var(--color-surface)] border border-[var(--color-edge)] hover:border-[var(--color-accent)]"
          >
            Save draft
          </button>
          {error && <div className="text-xs text-red-600">{error}</div>}
        </div>
      </div>

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">{current.title}</div>
            <div className="text-xs text-[var(--color-muted)]">Edit content and questions. Mark status when reviewed.</div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <select
              value={current.status}
              onChange={(e) => setSections(prev => prev.map(s => s.id === current.id ? { ...s, status: e.target.value as SectionStatus } : s))}
              className="border border-[var(--color-edge)] rounded px-2 py-1 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="edited">Edited</option>
              <option value="reviewed">Reviewed</option>
              <option value="locked">Locked</option>
            </select>
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
        {loading ? (
          <div className="flex justify-center py-6"><LoadingSpinner /></div>
        ) : (
          <>
            {mode === 'edit' ? (
              <textarea
                ref={textareaRef}
                value={current.content}
                onChange={(e) => updateSectionContent(e.target.value)}
                rows={18}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg p-3 text-sm text-[var(--color-ink)]"
                placeholder="Generate or start writing this section."
              />
            ) : (
              <div className="prose prose-sm max-w-none text-[var(--color-ink)]">
                {current.content ? <MarkdownContent content={current.content} /> : <div className="text-sm text-[var(--color-muted)]">No content yet.</div>}
              </div>
            )}

            <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-[var(--color-ink)]">Questions for this section</div>
                <span className="text-[11px] text-[var(--color-muted)]">Balanced and unbiased</span>
              </div>
              <textarea
                value={(current.questions || []).join('\n')}
                onChange={(e) => updateQuestions(e.target.value)}
                rows={5}
                className="w-full bg-[var(--color-panel)] border border-[var(--color-edge)] rounded p-2 text-sm"
                placeholder="Add one question per line."
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {QUESTION_TEMPLATES.map(t => (
                  <button
                    key={t.label}
                    className="px-2 py-1 rounded-full border border-[var(--color-edge)] bg-[var(--color-panel)] text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                    onClick={() => updateQuestions([...(current.questions || []), t.text].join('\n'))}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-3">
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Inspector warnings</div>
          <div className="text-xs text-[var(--color-muted)] mb-1">Gaps, contradictions, or jargon to fix.</div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded p-2 text-sm whitespace-pre-wrap">
            {warnings ? <MarkdownContent content={warnings} /> : 'No warnings yet.'}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Summary</div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded p-2 text-sm whitespace-pre-wrap min-h-[80px]">
            {summary ? <MarkdownContent content={summary} /> : 'Generate to see a pack summary.'}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Easy-read</div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded p-2 text-sm whitespace-pre-wrap min-h-[80px]">
            {easyRead ? <MarkdownContent content={easyRead} /> : 'Will populate when the pack is generated.'}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Source palette</div>
          <div className="grid grid-cols-1 gap-2">
            {dataPalette.map((card, idx) => (
              <button
                key={idx}
                onClick={() => insertText(`\n${card.title}:\n${card.body}\n`)}
                className="text-left bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg p-3 hover:border-[var(--color-accent)]"
              >
                <div className="font-semibold text-[var(--color-ink)] mb-1">{card.title}</div>
                <div className="text-xs text-[var(--color-muted)] line-clamp-3">{card.body || 'No data'}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
