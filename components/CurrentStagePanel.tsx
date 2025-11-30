import * as React from 'react'
import { useEffect, useState } from 'react'
import { STAGES } from '../data/stageMeta'
import { usePlan } from '../contexts/PlanContext'
import { askQuestionRouter, planNextStageSuggestion, getFollowupQuestions } from '../utils/llmTasks'
import { PlanTimeline } from './PlanTimeline'
import { ContextSidebar } from './ContextSidebar'
import { StageInsightsPanel } from './StageInsightsPanel'
import { retrieveContext } from '../lib/localQa'
import { useStageInsights } from '../hooks/useStageInsights'

export const CurrentStagePanel: React.FC<{ councilData: any; showAllTools: () => void; onOpenTool: (toolId: string, ctx?: any) => void }> = ({ councilData, showAllTools, onOpenTool }) => {
  const { activePlan, updatePlan, setPlanStage } = usePlan()
  const [question, setQuestion] = useState('')
  const [routerWhy, setRouterWhy] = useState<string | undefined>()
  const [answer, setAnswer] = useState<string>('')
  const [suggestedQs, setSuggestedQs] = useState<string[]>([])
  const stageId = activePlan?.planStage || STAGES[0].id
  const { insights } = useStageInsights(activePlan, stageId as any)

  useEffect(() => {
    if (!activePlan) return
    ;(async () => {
      const suggestion = await planNextStageSuggestion(activePlan)
      if (suggestion?.suggestedStageId && suggestion.suggestedStageId !== stageId) {
        updatePlan(activePlan.id, { aiSuggestedStageId: suggestion.suggestedStageId, aiSuggestedStageReason: suggestion.reasonText } as any)
      }
    })()
  }, [activePlan?.id])

  const meta = STAGES.find(s => s.id === stageId)!

  return (
    <div className="space-y-4">
      {/* AI Stage Insights */}
      {activePlan && (
        <StageInsightsPanel plan={activePlan} stageId={stageId} />
      )}

      {/* AI recommends chips */}
      <div className="mt-3">
        <div className="text-xs text-[var(--color-muted)] mb-2">AI recommends starting with…</div>
        <div className="flex flex-wrap gap-2">
          { ((insights?.primaryToolIds && insights.primaryToolIds.length)
              ? insights.primaryToolIds
              : meta.recommendedTools).map((t) => (
            <button key={t} className="px-3 py-1.5 text-sm bg-[var(--color-panel)] border border-[var(--color-edge)] rounded hover:border-[var(--color-accent)]" onClick={() => onOpenTool(t, { stageId })}>
              {t.replace('Tool', '').replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
          <button className="px-3 py-1.5 text-sm" onClick={showAllTools}>Browse all tools</button>
        </div>
      </div>

      {/* Ask anything */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
        <h3 className="font-semibold text-[var(--color-ink)] mb-2">Ask anything about this plan</h3>
        <div className="flex gap-2">
          <input value={question} onChange={(e)=>setQuestion(e.target.value)} className="flex-1 px-3 py-3 text-[var(--color-ink)] bg-[var(--color-panel)] border border-[var(--color-edge)] rounded" placeholder="e.g., What should go in my Notice to Commence?" />
          <button className="px-3 py-2 bg-[var(--color-brand)] rounded" onClick={async ()=>{
            if (!activePlan || !question.trim()) return
            // Local retrieval (stubbed)
            const ctx = await retrieveContext(question, activePlan, councilData)
            const r = await askQuestionRouter(question, activePlan, stageId, ctx)
            setRouterWhy(r.why)
            setAnswer(r.shortAnswer || '')
            // Follow-ups
            try {
              const f = await getFollowupQuestions({ question, answer: r.shortAnswer || '', stageId })
              setSuggestedQs(f.followups || [])
            } catch {}
            if (r.targetToolId) onOpenTool(r.targetToolId, { stageId, proposedAction: r.proposedAction, question, ctx })
          }}>Ask</button>
        </div>
        {routerWhy && <p className="text-xs text-[var(--color-muted)] mt-2">Why this tool: {routerWhy}</p>}
        {answer && (
          <div className="mt-3 p-3 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded text-sm text-[var(--color-ink)] whitespace-pre-wrap">{answer}</div>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {(suggestedQs.length ? suggestedQs : stageDefaultSuggestions(stageId)).map((q, i) => (
            <button key={i} className="px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-edge)] text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]" onClick={()=>setQuestion(q)}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Tools for this stage (de-emphasised) */}
      <div className="hidden lg:block">
        <div className="mt-4">
          <div className="text-sm text-[var(--color-muted)] mb-2">Tools for this stage</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id: 'EvidenceTool', icon: '🗺️', label: 'Evidence Base', description: 'Build your foundation by exploring geospatial data and querying a vast library of planning documents.' },
              { id: 'VisionConceptsTool', icon: '🎨', label: 'Vision & Concepts', description: 'Translate data and policy into compelling visuals. Generate high-quality architectural and landscape imagery.' },
              { id: 'PolicyDrafterTool', icon: '📋', label: 'Policy Drafter', description: 'Draft, refine, and validate planning policy. Research, check for national compliance, and get editing suggestions.' },
              { id: 'StrategyModelerTool', icon: '📊', label: 'Strategy Modeler', description: 'Explore the future impact of high-level strategies. Model and compare complex scenarios for informed decisions.' },
              { id: 'SiteAssessmentTool', icon: '📍', label: 'Site Assessment', description: 'Conduct detailed, map-based site assessments. Generate grounded reports for any location or uploaded site data.' },
              { id: 'FeedbackAnalysisTool', icon: '💬', label: 'Feedback Analysis', description: 'Instantly synthesize public and stakeholder feedback. Analyze unstructured text to find actionable insights.' },
            ].map(tool => (
              <button
                key={tool.id}
                className="text-left bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 hover:border-[var(--color-accent)] transition-all"
                onClick={() => onOpenTool(tool.id, { stageId })}
              >
                <div className="text-2xl mb-2">{tool.icon}</div>
                <div className="font-semibold text-[var(--color-ink)]">{tool.label}</div>
                <p className="text-sm text-[var(--color-muted)] mt-1">{tool.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      
    </div>
  )
}

function stageDefaultSuggestions(stageId: string): string[] {
  switch (stageId) {
    case 'TIMETABLE':
    case 'NOTICE':
    case 'SCOPING':
      return [
        'What should go in my Notice to Commence?',
        'What evidence do I already have?',
        'What’s a realistic timetable for this council?',
        'RAG governance and resources before Gateway 1'
      ]
    case 'BASELINING':
      return [
        'Summarise key constraints for our area',
        'Which evidence gaps are most urgent?',
        'What indicators should I monitor?'
      ]
    case 'GATEWAY_1':
    case 'G1_SUMMARY':
      return [
        'Are we Gateway 1 ready?',
        'Draft a Gateway 1 summary',
        'What actions remain before baselining?'
      ]
    default:
      return [
        'Which sites are weakest on deliverability?',
        'Which outcomes lack supporting policies?',
        'What should I do next in this stage?'
      ]
  }
}
