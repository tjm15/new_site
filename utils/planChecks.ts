import type { Plan, VisionOutcome } from '../data/types'
import { runLLMTask } from './llmTasks'

export type CheckResult = {
  id: string
  status: 'pass' | 'risk' | 'fail'
  summary: string
  affectedEntities?: string[]
}

export async function runPlanChecks(plan: Plan): Promise<CheckResult[]> {
  const results: CheckResult[] = []
  // Simple pre-filters
  if (!plan.visionStatements || plan.visionStatements.length === 0) {
    results.push({ id: 'vision_present', status: 'fail', summary: 'No vision outcomes defined.' })
  } else {
    results.push({ id: 'vision_present', status: 'pass', summary: 'Vision outcomes present.' })
  }
  const anyRed = plan.sites?.some(s => s.suitability === 'R' || s.availability === 'R' || s.achievability === 'R')
  results.push({ id: 'site_red_flags', status: anyRed ? 'risk' : 'pass', summary: anyRed ? 'Some sites have Red flags.' : 'No Red flags on sites.' })

  // LLM checklist run for qualitative assessment
  try {
    const llmRes = await runLLMTask('plan_checklist_run', {
      authorityName: plan.area,
      outcomes: plan.visionStatements,
      sites: plan.sites,
      timetable: plan.timetable
    })
    if (Array.isArray(llmRes)) {
      return results.concat(llmRes as CheckResult[])
    }
  } catch (e) {
    results.push({ id: 'llm_check_error', status: 'risk', summary: 'AI checks failed to run; review manually.' })
  }
  return results
}
