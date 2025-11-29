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
        const trimmedPlan = {
          id: plan.id,
          title: plan.title,
          area: plan.area,
          planStage: plan.planStage,
          stages: plan.stages,
          timetable: plan.timetable,
          visionStatements: plan.visionStatements,
          sites: plan.sites,
          evidenceInventory: plan.evidenceInventory,
          baselineNarrative: plan.baselineNarrative,
          readinessAssessment: plan.readinessAssessment,
          gateway1SummaryText: plan.gateway1SummaryText,
          consultationSummaries: plan.consultationSummaries,
        }
        const prompt = [
          'You are a UK planning inspector reviewing a Local Plan under the CULP system.',
          'Return JSON only with fields: { "cards": [ { "title": string, "status": "R"|"A"|"G", "reason": string } ] }',
          'Provide detailed reasoning inside each card. Omit any summary field to avoid duplication.',
          'Prioritise the top ~3 risks/issues across the whole plan. No extra text.',
          `Stage: ${stageMeta.label}`,
          `Plan: ${trimmedPlan.title} (${trimmedPlan.area})`,
          `Plan object: ${JSON.stringify(trimmedPlan)}`
        ].join('\n')
        const raw = await callLLM(prompt)
        const parsed = extractJsonObject(raw)
        const summary = parsed ? (typeof parsed.summary === 'string' ? parsed.summary : '') : (raw || 'Inspector analysis unavailable.')
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
