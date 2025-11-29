export type PlanStageId =
  | 'PREP'
  | 'GATEWAY_1'
  | 'BASELINING'
  | 'CONSULTATION_1'
  | 'GATEWAY_2'
  | 'CONSULTATION_2'
  | 'GATEWAY_3'
  | 'SUBMISSION'
  | 'ADOPTION'

export type StageMeta = {
  id: PlanStageId
  label: string
  description: string
  llmTaskId: string
  recommendedTools: Array<
    | 'EvidenceTool'
    | 'VisionConceptsTool'
    | 'PolicyDrafterTool'
    | 'StrategyModelerTool'
    | 'SiteAssessmentTool'
    | 'FeedbackAnalysisTool'
  >
}

export const STAGES: StageMeta[] = [
  {
    id: 'PREP',
    label: 'Preparation',
    description: 'Set up timetable, scope, and baseline tasks to start the 30-month plan.',
    llmTaskId: 'plan_stage_help_prep',
    recommendedTools: ['EvidenceTool', 'PolicyDrafterTool']
  },
  {
    id: 'GATEWAY_1',
    label: 'Gateway 1',
    description: 'Readiness check before formal baselining and early engagement.',
    llmTaskId: 'plan_stage_help_gateway1',
    recommendedTools: ['EvidenceTool', 'PolicyDrafterTool']
  },
  {
    id: 'BASELINING',
    label: 'Baselining & Evidence',
    description: 'Compile and review the baseline evidence base and constraints.',
    llmTaskId: 'plan_stage_help_baselining',
    recommendedTools: ['EvidenceTool', 'SiteAssessmentTool', 'VisionConceptsTool']
  },
  {
    id: 'CONSULTATION_1',
    label: 'Consultation 1',
    description: 'Early consultation to gather feedback on issues and options.',
    llmTaskId: 'plan_stage_help_consult1',
    recommendedTools: ['FeedbackAnalysisTool', 'EvidenceTool']
  },
  {
    id: 'GATEWAY_2',
    label: 'Gateway 2',
    description: 'Check readiness to proceed to preferred strategy and policies.',
    llmTaskId: 'plan_stage_help_gateway2',
    recommendedTools: ['StrategyModelerTool', 'PolicyDrafterTool']
  },
  {
    id: 'CONSULTATION_2',
    label: 'Consultation 2',
    description: 'Consult on draft policies and preferred strategy.',
    llmTaskId: 'plan_stage_help_consult2',
    recommendedTools: ['FeedbackAnalysisTool', 'PolicyDrafterTool']
  },
  {
    id: 'GATEWAY_3',
    label: 'Gateway 3',
    description: 'Final readiness check before submission.',
    llmTaskId: 'plan_stage_help_gateway3',
    recommendedTools: ['PolicyDrafterTool', 'EvidenceTool']
  },
  {
    id: 'SUBMISSION',
    label: 'Submission',
    description: 'Submit plan and supporting evidence for examination.',
    llmTaskId: 'plan_stage_help_submission',
    recommendedTools: ['PolicyDrafterTool', 'EvidenceTool']
  },
  {
    id: 'ADOPTION',
    label: 'Adoption',
    description: 'Adopt plan following examination and modifications.',
    llmTaskId: 'plan_stage_help_adoption',
    recommendedTools: ['PolicyDrafterTool']
  }
]
