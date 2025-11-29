import { useEffect, useMemo, useRef, useState } from 'react'
import type { Plan, PlanStageId } from '../data/types'
import { getStageInsights } from '../utils/llmTasks'

export type StageInsights = {
  summary: string
  actions: string[]
  risks?: string[]
  primaryToolIds?: string[]
  updatedAt: number
}

export function useStageInsights(plan: Plan | undefined, stageId: PlanStageId | undefined) {
  const [data, setData] = useState<Record<string, StageInsights>>({})
  const pending = useRef<Set<string>>(new Set())

  const current = useMemo(() => (stageId ? data[stageId] : undefined), [data, stageId])

  useEffect(() => {
    if (!plan || !stageId) return
    const key = `${plan.id}:${stageId}`
    if (pending.current.has(key)) return

    const planSummary = {
      outcomesCount: plan.visionStatements?.length || 0,
      sitesScored: plan.sites?.filter(s => s.suitability || s.availability || s.achievability).length || 0,
      timetable: plan.timetable,
      hasGateway1Summary: !!plan.gateway1SummaryText,
    }

    pending.current.add(key)
    getStageInsights({
      authorityName: plan.area || '',
      stageId,
      planSummary,
      recentActivity: {},
    })
      .then(res => {
        setData(prev => ({
          ...prev,
          [stageId]: {
            summary: res.summary || '',
            actions: res.actions || [],
            risks: res.risks || [],
            primaryToolIds: res.primaryToolIds || [],
            updatedAt: Date.now(),
          },
        }))
      })
      .finally(() => {
        pending.current.delete(key)
      })
  }, [plan?.id, plan?.visionStatements?.length, plan?.sites?.length, plan?.timetable, plan?.gateway1SummaryText, stageId])

  return { insights: current, cache: data }
}
