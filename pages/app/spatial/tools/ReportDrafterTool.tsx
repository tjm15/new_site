import React, { useMemo, useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CouncilData, Plan } from '../../../../data/types'
import { callLLM } from '../../../../utils/llmClient'
import { LoadingSpinner } from '../../shared/LoadingSpinner'
import { MarkdownContent } from '../../../../components/MarkdownContent'
import { usePlan } from '../../../../contexts/PlanContext'
import { summarizeSeaHra } from '../../../../utils/seaHra'

type DraftResponse = { reportMarkdown: string; warningsMarkdown: string }

const OUTLINE = [
  { id: 'vision', label: 'Vision & Strategic Fit' },
  { id: 'pattern', label: 'Chosen Spatial Pattern' },
  { id: 'sites', label: 'Site Allocations' },
  { id: 'alternatives', label: 'Reasonable Alternatives' },
  { id: 'cumulative', label: 'Cumulative Impacts & Risks' },
  { id: 'sea', label: 'SEA / HRA Summary' },
  { id: 'delivery', label: 'Conclusion & Delivery' }
]

function buildPlanStateMarkdown(plan: Plan, council: CouncilData): string {
  const visionMarkdown = (plan.visionStatements || []).map(v => `- ${v.text}${v.metric ? ` (Metric: ${v.metric})` : ''}`).join('\n') || 'No vision statements logged.'
  const goalsMarkdown = (plan.smartOutcomes || []).map(o => `- ${o.outcomeStatement || o.text || o.theme || 'Outcome'}${o.indicators?.length ? ` | Indicators: ${o.indicators.map(i => i.name || i.id).filter(Boolean).join(', ')}` : ''}${o.target ? ` | Target: ${o.target}` : ''}`).join('\n')
    || 'No SMART outcomes recorded.'
  const policySummaryMarkdown = plan.preferredOptions?.policy?.draft
    || 'Policy hooks: see drafted policies and topic summaries.'
  const evidenceMarkdown = [
    plan.baselineNarrative ? `Baseline narrative:\n${plan.baselineNarrative}` : '',
    plan.baselineTrends ? Object.entries(plan.baselineTrends).map(([k, v]) => `- ${k}: ${v}`).join('\n') : '',
    (plan.evidenceInventory || []).length ? `Evidence inventory:\n${(plan.evidenceInventory || []).map(ev => `- ${ev.title}${ev.status ? ` [${ev.status}]` : ''}${ev.year ? ` (${ev.year})` : ''}`).join('\n')}` : ''
  ].filter(Boolean).join('\n\n') || 'Evidence base not summarised yet.'

  const scenarioSummaries = (council.strategies || []).map(s => `- ${s.label}: ${s.desc}`).join('\n') || 'No scenarios recorded.'
  const chosenScenarioId = plan.preferredOptions?.strategy?.id || (council.strategies && council.strategies[0]?.id) || 'none'
  const chosenScenarioLabel = (council.strategies || []).find(s => s.id === chosenScenarioId)?.label || 'Not set'
  const chosenScenarioMarkdown = plan.preferredOptions?.strategy?.analysis || `Chosen scenario: ${chosenScenarioLabel}`

  const siteLines = (plan.sites || []).map(s => {
    const rag = [s.suitability, s.availability, s.achievability].filter(Boolean).join('/')
    const decision = (plan.siteDecisions || []).find(d => d.siteId === s.id)
    return `### ${s.name}\n${s.notes || s.description || 'No summary'}\nRAG: ${rag || 'n/a'}\nCapacity: ${s.capacityEstimate || s.capacity || 'n/a'}\nDecision: ${decision?.decision || 'undecided'}\nReasons: ${decision?.rationale || 'n/a'}`
  }).join('\n\n') || 'No site records.'

  const seaSummary = summarizeSeaHra(plan)
  const seaHraText = [
    seaSummary.statusLine,
    `Baseline: ${seaSummary.baseline}`,
    `HRA: ${seaSummary.hra}`,
    `Consultation: ${seaSummary.consultation}`,
    `Mitigation: ${seaSummary.mitigation}`,
    `Risks: ${seaSummary.risks}`,
    `Cumulative: ${seaSummary.cumulative}`,
    `Datasets: ${seaSummary.environmentalDatabase}`
  ].join('\n')

  const cumulativeMarkdown = seaSummary.cumulative || 'No cumulative impacts summary.'

  return [
    '[VISION]\n' + visionMarkdown,
    '[GOALS]\n' + goalsMarkdown,
    '[POLICIES]\n' + policySummaryMarkdown,
    '[EVIDENCE]\n' + evidenceMarkdown,
    '[SCENARIOS]\n' + scenarioSummaries,
    '[CHOSEN_SCENARIO]\n' + chosenScenarioMarkdown,
    '[SITES]\n' + siteLines,
    '[SEA_HRA]\n' + seaHraText,
    '[CUMULATIVE_IMPACTS]\n' + cumulativeMarkdown
  ].join('\n\n')
}

async function draftReport(plan: Plan, council: CouncilData, focusSection?: string): Promise<DraftResponse> {
  const planState = buildPlanStateMarkdown(plan, council)
  const outline = OUTLINE.map(o => `- ${o.label}`).join('\n')
  const prompt = [
    'SYSTEM:',
    'You are generating a spatial strategy chapter for a demo Local Plan.',
    'Use ONLY the provided text. DO NOT invent new sites, policies, or numbers.',
    'Write in formal Local Plan style and be as long and comprehensive as possible, expanding every section with all available details. Avoid brevity; maximise length while staying grounded in provided content.',
    '',
    'USER:',
    `PlanState markdown:\n${planState}`,
    '',
    `Outline to respect:\n${outline}`,
    focusSection ? `Focus: regenerate only the section titled "${focusSection}" and keep other content consistent.` : 'Generate the full draft.',
    '',
    'TASK:',
    '1) Draft a coherent markdown chapter for the spatial strategy, using only provided content.',
    '2) Identify contradictions between goals, policies, evidence, selected sites, and cumulative impacts.',
    '3) Return JSON ONLY with shape { "reportMarkdown": string, "warningsMarkdown": string }.',
    'Warnings must be short bullets prefixed with ⚠️.',
    'Do not add fields beyond those two. If data is sparse, say so briefly in the report.'
  ].join('\n')

  const raw = await callLLM({ mode: 'json', prompt })
  try {
    const parsed = JSON.parse(raw || '{}')
    if (parsed.reportMarkdown && parsed.warningsMarkdown) return parsed as DraftResponse
  } catch {
    // fallthrough
  }
  return { reportMarkdown: typeof raw === 'string' ? raw : 'No draft generated.', warningsMarkdown: '⚠️ Unable to parse warnings.' }
}

export const ReportDrafterTool: React.FC<{ plan: Plan | undefined; councilData: CouncilData }> = ({ plan, councilData }) => {
  const { updatePlan } = usePlan()
  const planMatchesCouncil = plan && plan.councilId === councilData.id
  const [reportText, setReportText] = useState<string>('')
  const [warningsText, setWarningsText] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string>('vision')
  const [mode, setMode] = useState<'edit' | 'preview'>('preview')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!plan) return
    if (plan.strategyDraft?.reportMarkdown) setReportText(plan.strategyDraft.reportMarkdown)
    if (plan.strategyDraft?.warningsMarkdown) setWarningsText(plan.strategyDraft.warningsMarkdown)
  }, [plan?.id])

  const dataPalette = useMemo(() => {
    if (!plan) return []
    return [
      { title: 'Vision', body: buildPlanStateMarkdown(plan, councilData).split('[GOALS]')[0].replace('[VISION]\n', '').trim() },
      { title: 'Goals', body: buildPlanStateMarkdown(plan, councilData).split('[GOALS]\n')[1]?.split('[POLICIES]')[0]?.trim() || '' },
      { title: 'Policies', body: plan.preferredOptions?.policy?.draft || 'No preferred policy draft saved.' },
      { title: 'Sites', body: (plan.sites || []).map(s => `${s.name}: ${s.notes || s.description || ''}`).join('\n') || 'No sites recorded.' },
      { title: 'SEA / HRA', body: plan.seaHra?.seaScopingNotes || plan.seaHra?.cumulativeEffects || 'No SEA/HRA text.' }
    ]
  }, [plan, councilData])

  const handleGenerate = async (section?: string) => {
    if (!plan) return
    setLoading(true)
    setError(null)
    try {
      const { reportMarkdown, warningsMarkdown } = await draftReport(plan, councilData, section ? OUTLINE.find(o => o.id === section)?.label : undefined)
      setReportText(reportMarkdown)
      setWarningsText(warningsMarkdown)
      if (planMatchesCouncil) {
        updatePlan(plan.id, { strategyDraft: { reportMarkdown, warningsMarkdown } })
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to generate draft.')
    } finally {
      setLoading(false)
    }
  }

  const insertText = (text: string) => {
    if (!textareaRef.current) {
      setReportText(prev => `${prev}\n${text}`)
      return
    }
    const el = textareaRef.current
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = reportText.slice(0, start) + text + reportText.slice(end)
    setReportText(next)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + text.length
      el.focus()
    })
  }

  if (!plan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan loaded</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to draft the spatial strategy.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr,320px] gap-4">
      {/* Outline */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-2">
        <div className="text-sm font-semibold text-[var(--color-ink)]">Outline</div>
        <div className="space-y-1">
          {OUTLINE.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedSection(item.id)}
              className={`w-full text-left px-3 py-2 rounded border ${selectedSection === item.id ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-edge)] bg-[var(--color-surface)]'} text-sm`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => handleGenerate(selectedSection)}
          className="w-full mt-3 px-3 py-2 text-sm rounded bg-[var(--color-panel)] border border-[var(--color-edge)] hover:border-[var(--color-accent)]"
          disabled={loading}
        >
          {loading ? 'Generating…' : 'Regenerate section'}
        </button>
        <button
          onClick={() => handleGenerate()}
          className="w-full mt-2 px-3 py-2 text-sm rounded bg-[var(--color-accent)] text-white"
          disabled={loading}
        >
          {loading ? 'Working…' : 'Generate full draft'}
        </button>
        {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
      </div>

      {/* Draft canvas */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">Draft Canvas</div>
            <div className="text-xs text-[var(--color-muted)]">Fully editable markdown. Switch between edit/preview.</div>
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
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-8"
            >
              <LoadingSpinner />
            </motion.div>
          )}
        </AnimatePresence>
        {!loading && mode === 'edit' && (
          <textarea
            ref={textareaRef}
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            rows={24}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg p-3 text-sm text-[var(--color-ink)]"
            placeholder="Click Generate to draft the spatial strategy chapter."
          />
        )}
        {!loading && mode === 'preview' && (
          <div className="prose prose-sm max-w-none text-[var(--color-ink)]">
            {reportText ? <MarkdownContent content={reportText} /> : <div className="text-sm text-[var(--color-muted)]">No draft yet. Generate to begin.</div>}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-3">
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">⚠️ Warning Bubbles</div>
          <div className="text-xs text-[var(--color-muted)] mb-2">Contradiction highlights from the last draft.</div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded p-2 text-sm whitespace-pre-wrap">
            {warningsText ? <MarkdownContent content={warningsText} /> : 'No warnings yet.'}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)] mb-1">Data Palette</div>
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
