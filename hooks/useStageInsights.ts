import { useEffect, useMemo, useRef, useState } from 'react'
import type { Plan, PlanStageId } from '../data/types'
import { callLLM } from '../utils/llmClient'
import { STAGES } from '../data/stageMeta'

function extractJsonObject(raw: string): any | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  const candidates: string[] = [trimmed]

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced && fenced[1]) candidates.push(fenced[1].trim())

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1))
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch {
      continue
    }
  }
  return undefined
}

export type StageInsights = {
  summary: string
  actions: string[]
  risks?: string[]
  primaryToolIds?: string[]
  cards?: Array<{ title: string; status: 'R' | 'A' | 'G'; reason?: string }>
  source?: 'llm' | 'fallback'
  updatedAt: number
}

export function useStageInsights(plan: Plan | undefined, stageId: PlanStageId | undefined) {
  const [data, setData] = useState<Record<string, StageInsights>>({})
  const pending = useRef<Set<string>>(new Set())

  const current = useMemo(() => (stageId ? data[stageId] : undefined), [data, stageId])
  const stageMeta = useMemo(() => (stageId ? STAGES.find(s => s.id === stageId) : undefined), [stageId])

  useEffect(() => {
    if (!plan || !stageId || !stageMeta) return
    const key = `${plan.id}:${stageId}`
    if (pending.current.has(key)) return

    pending.current.add(key)
    ;(async () => {
      try {
        const actionDone = (actionId: string): boolean => {
          const consultSummaries = plan.consultationSummaries || []
          const repTags = plan.representationTags || []
          const sites = plan.sites || []
          const smartCount = plan.smartOutcomes?.length || 0
          const stagesWithDates = (plan.stages || []).filter(s => s.targetDate).length
          const milestoneCount = plan.timetable?.milestones?.length || 0
          switch (actionId) {
            case 'prep_timetable':
              return milestoneCount > 0 || stagesWithDates > 0
            case 'prep_notice':
              return !!plan.prepNoticeText
            case 'prep_risk':
              return !!plan.prepRiskAssessment?.areas?.length
            case 'scoping_plan':
              return !!(plan.sci && (plan.sci.methods?.length || plan.sci.keyStakeholders?.length))
            case 'scoping_questions':
              return !!plan.sci?.methods?.length
            case 'scoping_summary':
              return consultSummaries.some(c => c.stageId === 'SCOPING')
            case 'g1_rag':
              return !!plan.readinessAssessment
            case 'g1_summary':
              return !!plan.gateway1SummaryText
            case 'g1_publish':
              return !!plan.gateway1PublishedAt
            case 'base_datasets':
              return (plan.evidenceInventory || []).length > 0
            case 'base_trends':
              return !!(plan.baselineTrends && Object.keys(plan.baselineTrends).length > 0)
            case 'base_swot':
              return !!(plan.swot && Object.values(plan.swot || {}).some(v => Array.isArray(v) ? v.length : v))
            case 'base_narrative':
              return !!plan.baselineNarrative
            case 'vision_assistant':
              return smartCount > 0 || (plan.visionStatements || []).length > 0
            case 'outcome_metrics':
              return smartCount > 0 || (plan.visionStatements || []).some(v => v.metric)
            case 'outcome_linker':
              return (plan.smartOutcomes || []).some(o => (o.linkedPolicies?.length || o.linkedSites?.length || o.spatialLayers?.length)) || !!(plan.outcomePolicyLinks && Object.keys(plan.outcomePolicyLinks).length > 0)
            case 'site_profile':
              return sites.some(s => s.description || s.notes)
            case 'site_rag':
              return sites.some(s => s.suitability || s.availability || s.achievability)
            case 'site_capacity':
              return sites.some(s => s.capacityEstimate)
            case 'site_decision':
              return (plan.siteDecisions || []).length > 0
            case 'c1_plan':
              return consultSummaries.some(c => c.stageId === 'CONSULTATION_1')
            case 'c1_cluster':
              return repTags.length > 0
            case 'c1_summary':
              return consultSummaries.some(c => c.stageId === 'CONSULTATION_1')
            case 'g2_completeness':
              return !!plan.gateway2Checklist
            case 'g2_risks':
              return !!plan.gateway2Risks
            case 'g2_summary':
              return !!plan.gateway2Summary
            case 'c2_tagger':
              return repTags.length > 0
            case 'c2_summary':
              return consultSummaries.some(c => c.stageId === 'CONSULTATION_2')
            case 'g3_requirements':
              return !!plan.requirementsCheck
            case 'g3_compliance':
              return !!plan.statementCompliance
            case 'g3_soundness':
              return !!plan.statementSoundness
            case 'g3_readiness':
              return !!plan.examReadinessNote
            case 'sub_bundle':
              return (plan.submissionBundle || []).length > 0
            case 'sub_rehearsal':
              return !!plan.examRehearsalNotes
            case 'adopt_compliance':
              return !!plan.adoptionChecklist
            case 'adopt_indicators':
              return (plan.monitoringIndicators || []).length > 0
            case 'adopt_monitoring':
              return (plan.annualMonitoringNarratives || []).length > 0
            case 'adopt_eval':
              return !!plan.year4Evaluation
            default:
              return false
          }
        }
        const actionsMeta = stageMeta.actionsRecommended || []
        const completedActions = actionsMeta.filter(a => actionDone(a.id))
        const progressText = `Stage progress: ${completedActions.length}/${actionsMeta.length} actions completed. Completed IDs: ${completedActions.map(a=>a.id).join(', ') || 'none'}. When progress is strong, lean to amber/green with concise positives and short gaps.`
          const trimmedPlan = {
            id: plan.id,
            title: plan.title,
            area: plan.area,
            planStage: plan.planStage,
            stages: plan.stages,
            timetable: plan.timetable,
            smartOutcomes: plan.smartOutcomes,
            visionStatements: plan.visionStatements,
            sites: plan.sites,
            evidenceInventory: plan.evidenceInventory,
            baselineNarrative: plan.baselineNarrative,
            readinessAssessment: plan.readinessAssessment,
          gateway1SummaryText: plan.gateway1SummaryText,
          seaHra: plan.seaHra,
          consultationSummaries: plan.consultationSummaries,
        }
        const prompt = [
          'You are a UK planning inspector reviewing a Local Plan under the CULP system.',
          'Return JSON only with fields: { "cards": [ { "title": string, "status": "R"|"A"|"G", "reason": string } ] }',
          'Each card reason should be 1–3 sentences. Do not include any summary field.',
          'Prioritise the top ~3 risks/issues across the whole plan. No extra text.',
          'If progress is good, lean to Amber/Green with concise positive framing while still noting any gaps.',
          progressText,
          `Stage: ${stageMeta.label}`,
          `Plan: ${trimmedPlan.title} (${trimmedPlan.area})`,
          `Plan object: ${JSON.stringify(trimmedPlan)}`
        ].join('\n')
        const raw = await callLLM(prompt)
        const parsed = extractJsonObject(raw)
        const summary = ''
        const actions = stageMeta.actionsRecommended?.map(a => a.label) || []
        const risks: string[] = []
        const cards = Array.isArray(parsed?.cards) ? parsed.cards : undefined
        setData(prev => ({
          ...prev,
          [stageId]: {
            summary,
            actions,
            risks,
            primaryToolIds: [],
            cards,
            updatedAt: Date.now(),
            source: parsed ? 'llm' : 'fallback'
          },
        }))
      } catch {
        setData(prev => ({
          ...prev,
          [stageId]: {
            summary: stageMeta.aim || 'Inspector analysis unavailable.',
            actions: (stageMeta.actionsRecommended || []).map(a => a.label),
            risks: [],
            cards: [
              { title: 'Completeness', status: 'A', reason: 'Using default fallback' },
              { title: 'Soundness', status: 'A', reason: 'Using default fallback' },
              { title: 'Evidence', status: 'A', reason: 'Using default fallback' },
            ],
            primaryToolIds: [],
            updatedAt: Date.now(),
            source: 'fallback'
          }
        }))
      } finally {
        pending.current.delete(key)
      }
    })()
  }, [plan?.id, plan?.visionStatements?.length, plan?.sites?.length, plan?.timetable, plan?.gateway1SummaryText, plan?.evidenceInventory?.length, plan?.submissionBundle?.length, stageId, stageMeta?.id])

  return { insights: current, cache: data }
}
