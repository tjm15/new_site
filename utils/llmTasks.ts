import { callLLM } from './llmClient'
import { buildPrompt } from '../prompts/taskPrompts'
import type { Plan, ReadinessAssessment, VisionOutcome, SiteCandidate, PlanTimetable } from '../data/types'

export type LLMTaskId =
  | 'plan_suggest_timetable'
  | 'plan_stage_help'
  | 'plan_next_stage_suggestion'
  | 'ask_question_router'
  | 'stage_insights'
  | 'followup_questions'
  | 'gateway1_readiness_rag'
  | 'gateway1_summary'
  | 'vision_suggest'
  | 'vision_refine'
  | 'site_rag_classify'
  | 'site_capacity_estimate'
  | 'plan_checklist_run'
  | 'tool_suggest_prefill'

type AnyInput = Record<string, any>

export async function runLLMTask<TOutput = any>(
  taskId: LLMTaskId,
  input: AnyInput
): Promise<TOutput> {
  const promptId = PROMPT_MAP[taskId]
  // Prefer local template rendering when available to get structured JSON output.
  let prompt: string
  try {
    prompt = buildPrompt(promptId, input as AnyInput)
  } catch (e) {
    prompt = `[${promptId}]\nInput:\n${JSON.stringify(input)}`
  }
  const text = await callLLM(prompt)
  try {
    return JSON.parse(text) as TOutput
  } catch {
    // Fallback: return raw text if not JSON
    return text as unknown as TOutput
  }
}

const PROMPT_MAP: Record<LLMTaskId, string> = {
  plan_suggest_timetable: 'timetable_suggest_v1',
  plan_stage_help: 'plan_stage_help_v1',
  plan_next_stage_suggestion: 'plan_next_stage_suggestion_v1',
  ask_question_router: 'ask_question_router_v1',
  stage_insights: 'stage_insights_v1',
  followup_questions: 'followup_questions_v1',
  gateway1_readiness_rag: 'gateway1_rag_v1',
  gateway1_summary: 'gateway1_summary_v1',
  vision_suggest: 'vision_suggest_v1',
  vision_refine: 'vision_refine_v1',
  site_rag_classify: 'site_rag_v1',
  site_capacity_estimate: 'site_capacity_v1',
  plan_checklist_run: 'plan_checklist_v1',
  tool_suggest_prefill: 'tool_suggest_prefill_v1',
}

// Convenience helpers for common tasks (optional light wrappers)
export async function suggestTimetable(authorityName: string, area: string): Promise<PlanTimetable> {
  return runLLMTask('plan_suggest_timetable', { authorityName, area })
}

export async function assessGateway1(payload: Record<string, any>): Promise<ReadinessAssessment> {
  return runLLMTask('gateway1_readiness_rag', payload)
}

export async function refineVision(rawOutcomes: string[]): Promise<VisionOutcome[]> {
  return runLLMTask('vision_refine', { rawOutcomes })
}

export async function classifySite(site: SiteCandidate, plan: Plan): Promise<any> {
  return runLLMTask('site_rag_classify', { site, plan })
}

// New Plan Hub helpers
export async function planStageHelp(stageId: string, planState: Plan): Promise<{
  description: string
  actions: string[]
  recommendedToolId?: string
  reason?: string
}> {
  return runLLMTask('plan_stage_help', { stageId, planState })
}

export async function planNextStageSuggestion(planState: Plan): Promise<{
  suggestedStageId: string
  reasonText: string
}> {
  return runLLMTask('plan_next_stage_suggestion', { planState })
}

export async function askQuestionRouter(question: string, planState: Plan, stageId?: string, contextChunks?: Array<{ text: string; source?: string }>): Promise<{
  targetToolId: string
  proposedAction?: string
  shortAnswer?: string
  why?: string
}> {
  return runLLMTask('ask_question_router', { question, planState, stageId, contextChunks })
}

// Stage insights and follow-ups
export async function getStageInsights(input: {
  authorityName: string
  stageId: string
  planSummary: Record<string, any>
  recentActivity?: Record<string, any>
}): Promise<{
  summary: string
  actions: string[]
  risks?: string[]
  primaryToolIds?: string[]
}> {
  return runLLMTask('stage_insights', input)
}

export async function getFollowupQuestions(input: {
  question: string
  answer: string
  stageId: string
}): Promise<{ followups: string[] }> {
  return runLLMTask('followup_questions', input)
}

// Suggest initial field prefills for a given tool based on the current plan state and stage
export async function suggestToolPrefill(toolId: string, planState: Plan, stageId?: string): Promise<Record<string, any>> {
  return runLLMTask('tool_suggest_prefill', { toolId, planState, stageId })
}