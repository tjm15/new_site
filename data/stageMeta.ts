export type PlanStageId =
  | 'PREP'
  | 'GATEWAY_1'
  | 'BASELINING'
  | 'VISION_OUTCOMES'
  | 'SITE_SELECTION'
  | 'CONSULTATION_1'
  | 'GATEWAY_2'
  | 'CONSULTATION_2'
  | 'GATEWAY_3'
  | 'SUBMISSION_EXAM'
  | 'ADOPTION_MONITORING'

export type StageMeta = {
  id: PlanStageId
  label: string
  description: string
  longDescription?: string
  aim: string
  llmTaskId: string
  recommendedTools: Array<
    | 'EvidenceTool'
    | 'VisionConceptsTool'
    | 'PolicyDrafterTool'
    | 'StrategyModelerTool'
    | 'SiteAssessmentTool'
    | 'FeedbackAnalysisTool'
    | 'SEATool'
    | 'SCITool'
  >
  tasks: string[]
  coreTasks?: string[]
  actionsRecommended?: Array<{
    id: string
    label: string
    shortExplainer: string
    primaryToolId?: 'EvidenceTool' | 'VisionConceptsTool' | 'PolicyDrafterTool' | 'StrategyModelerTool' | 'SiteAssessmentTool' | 'FeedbackAnalysisTool' | 'SEATool' | 'SCITool'
    assistantPromptHint?: string
  }>
  stageTools?: Array<'EvidenceTool' | 'VisionConceptsTool' | 'PolicyDrafterTool' | 'StrategyModelerTool' | 'SiteAssessmentTool' | 'FeedbackAnalysisTool' | 'SEATool' | 'SCITool'>
  aiTools?: {
    id: string
    name: string
    description: string
    status?: 'available' | 'planned'
    launchToolId?: 'EvidenceTool' | 'VisionConceptsTool' | 'PolicyDrafterTool' | 'StrategyModelerTool' | 'SiteAssessmentTool' | 'FeedbackAnalysisTool' | 'SEATool' | 'SCITool' | 'CULPToolkit'
  }[]
  qaNotes?: string[]
  qaChecks?: string[]
}

export const STAGES: StageMeta[] = [
  {
    id: 'PREP',
    label: 'Preparation / Notice to Commence',
    description: 'Notice period, governance, and timetable setup before Gateway 1.',
    aim: 'Get Gateway-1 ready with a credible timetable, notice text, and realistic governance/risks.',
    llmTaskId: 'plan_stage_help_prep',
    recommendedTools: ['EvidenceTool'],
    tasks: [
      'Draft a realistic 30-month timetable with milestones and dependencies.',
      'Prepare notice-to-commence text for publication with timetable link.',
      'Capture governance, resources, and early risks for the PID/readiness view.'
    ],
    coreTasks: [
      'Draft the 30-month timetable with dependencies.',
      'Prepare Notice to Commence text and publication route.',
      'Record governance, resources, and early risks.'
    ],
    actionsRecommended: [
      { id: 'prep_timetable', label: 'Draft the 30-month timetable', shortExplainer: 'Auto-propose milestones and dates, then edit.', primaryToolId: 'EvidenceTool', assistantPromptHint: 'Draft a 30-month timetable with Gateway 1 and consultations' },
      { id: 'prep_notice', label: 'Draft Notice to Commence', shortExplainer: 'Generate compliant notice text ready for publication.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft a Notice to Commence for this authority' },
      { id: 'prep_risk', label: 'Assess prep risks', shortExplainer: 'RAG governance/resources and log actions before Gateway 1.', primaryToolId: 'EvidenceTool', assistantPromptHint: 'What are the top prep risks before Gateway 1?' }
    ],
    stageTools: ['EvidenceTool', 'PolicyDrafterTool', 'SCITool'],
    aiTools: [
      { id: 'prep_timetable', name: 'Timetable Designer', description: 'Suggest a 30-month timetable with milestones and dates you can tweak.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'prep_notice', name: 'Notice to Commence Drafter', description: 'Draft publishable notice text that meets the content requirements.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'prep_risk', name: 'Preparation Risk Assessor', description: 'RAG readiness on governance/resources with actions before Gateway 1.', status: 'available', launchToolId: 'EvidenceTool' }
    ],
    qaNotes: ['Timetable includes Gateway 1 date', 'Governance route and project board are recorded', 'Resources/risks captured before submission to Gateway 1'],
    qaChecks: ['Timetable is 30 months with milestones', 'Governance and decision path logged', 'Notice to Commence drafted for publication']
  },
  {
    id: 'GATEWAY_1',
    label: 'Gateway 1',
    description: 'Readiness self-assessment across timetable, governance, engagement, evidence, SEA/HRA.',
    aim: 'Complete Gateway 1 self-assessment with evidence-backed RAG and a publishable summary.',
    llmTaskId: 'plan_stage_help_gateway1',
    recommendedTools: ['EvidenceTool', 'SCITool', 'SEATool'],
    tasks: [
      'Capture structured answers for readiness areas and run RAG automatically.',
      'Generate a short, web-ready Gateway 1 summary with intro + five sections.',
      'Publish results once governance is satisfied and move to baselining.'
    ],
    coreTasks: [
      'Complete readiness answers for timetable, governance, engagement, evidence, SEA/HRA.',
      'Run RAG and generate publishable Gateway 1 summary.',
      'Publish readiness and move to baselining.'
    ],
    actionsRecommended: [
      { id: 'g1_rag', label: 'Run readiness RAG', shortExplainer: 'Auto-score all five areas with gaps.', primaryToolId: 'EvidenceTool', assistantPromptHint: 'Are we Gateway 1 ready? List gaps.' },
      { id: 'g1_summary', label: 'Generate Gateway 1 summary', shortExplainer: 'Publishable summary per area plus intro.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft a short Gateway 1 self-assessment summary' },
      { id: 'g1_guidance', label: 'Review guidance alignment', shortExplainer: 'Compare answers to what Gateway 1 expects.', primaryToolId: 'EvidenceTool', assistantPromptHint: 'What does Gateway 1 require and how do we align?' }
    ],
    stageTools: ['EvidenceTool', 'SCITool', 'SEATool', 'PolicyDrafterTool'],
    aiTools: [
      { id: 'g1_rag', name: 'Readiness RAG Engine', description: 'Colour each readiness area with reasons and critical gaps.', status: 'available', launchToolId: 'EvidenceTool' },
      { id: 'g1_summary', name: 'Gateway-1 Summary Generator', description: 'Produce a web-ready summary per readiness area with intro.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g1_guidance', name: 'Guidance Explainer', description: 'Explain what Gateway 1 requires and how your answers map to it.', status: 'available', launchToolId: 'EvidenceTool' }
    ],
    qaNotes: ['All five readiness areas assessed', 'SEA/HRA scoping status recorded', 'Engagement/SCI outline captured'],
    qaChecks: ['All readiness areas answered', 'SEA scoping status recorded', 'Engagement/SCI outline captured']
  },
  {
    id: 'BASELINING',
    label: 'Baselining & Evidence',
    description: 'Evidence inventory, trends, constraints, and baseline narrative.',
    aim: 'Build a coherent evidence baseline and narrative that feeds vision and options.',
    llmTaskId: 'plan_stage_help_baselining',
    recommendedTools: ['EvidenceTool', 'SiteAssessmentTool', 'VisionConceptsTool'],
    tasks: [
      'Seed the evidence inventory with expected datasets by topic and fill gaps.',
      'Summarise trends/issues and constraints per topic with supporting sources.',
      'Draft SWOT/challenge map and a short baseline narrative.'
    ],
    coreTasks: [
      'Seed evidence inventory with expected datasets and fill gaps.',
      'Summarise trends/issues and constraints per topic.',
      'Draft SWOT/challenge map and baseline narrative.'
    ],
    actionsRecommended: [
      { id: 'base_datasets', label: 'Seed evidence inventory', shortExplainer: 'Auto-suggest datasets by topic with sources.', primaryToolId: 'EvidenceTool', assistantPromptHint: 'What datasets should be in our baseline?' },
      { id: 'base_trends', label: 'Generate trends & issues', shortExplainer: 'Summaries per topic using evidence notes.', primaryToolId: 'EvidenceTool', assistantPromptHint: 'Summarise housing, economy, transport trends' },
      { id: 'base_swot', label: 'Draft SWOT / challenges', shortExplainer: 'Constraints + opportunities into SWOT/challenges.', primaryToolId: 'EvidenceTool', assistantPromptHint: 'Create a SWOT for this plan area' },
      { id: 'base_narrative', label: 'Write baseline narrative', shortExplainer: 'Short narrative for plan/consultation.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft a 200-word baseline narrative' }
    ],
    stageTools: ['EvidenceTool', 'SiteAssessmentTool', 'VisionConceptsTool', 'PolicyDrafterTool'],
    aiTools: [
      { id: 'base_datasets', name: 'Evidence Dataset Recommender', description: 'Suggest national/local datasets by topic to seed the inventory.', status: 'available', launchToolId: 'EvidenceTool' },
      { id: 'base_trends', name: 'Trend & Issues Synthesiser', description: 'Turn reports + officer notes into bullet trends/issues per topic.', status: 'available', launchToolId: 'EvidenceTool' },
      { id: 'base_swot', name: 'SWOT / Challenge Map Generator', description: 'Build SWOT/challenge lists grounded in constraints and context.', status: 'available', launchToolId: 'EvidenceTool' },
      { id: 'base_narrative', name: 'Baseline Narrative Writer', description: 'Draft a 1–2 page baseline narrative for plan and consultation use.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Evidence inventory includes sources and gaps', 'Constraints layers logged for site filtering', 'Baseline narrative cites data sources']
  },
  {
    id: 'VISION_OUTCOMES',
    label: 'Vision & Outcomes',
    description: 'Vision statement plus ≤10 measurable outcomes linked to policies/sites.',
    aim: 'Produce a distinctive vision and a disciplined, measurable outcome set.',
    llmTaskId: 'plan_stage_help_vision',
    recommendedTools: ['VisionConceptsTool', 'PolicyDrafterTool', 'StrategyModelerTool'],
    tasks: [
      'Draft candidate vision statements rooted in baseline and national policy.',
      'Distil up to 10 outcomes with indicators/targets and time horizons.',
      'Map outcomes to emerging policies and potential sites to expose gaps.'
    ],
    coreTasks: [
      'Draft candidate vision statements grounded in baseline and policy.',
      'Distil up to 10 outcomes with indicators/targets and time horizons.',
      'Map outcomes to policies/sites to expose gaps.'
    ],
    actionsRecommended: [
      { id: 'vision_assistant', label: 'Draft vision options', shortExplainer: 'Generate locally distinctive vision statements.', primaryToolId: 'VisionConceptsTool', assistantPromptHint: 'Draft a distinctive vision for this authority' },
      { id: 'outcome_metrics', label: 'Curate outcomes & metrics', shortExplainer: 'Keep ≤10 outcomes with indicators/targets.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Suggest outcomes with indicators and targets' },
      { id: 'outcome_linker', label: 'Link outcomes to policies/sites', shortExplainer: 'Map each outcome to supporting policies/allocations.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Which policies and sites support each outcome?' }
    ],
    stageTools: ['VisionConceptsTool', 'PolicyDrafterTool', 'StrategyModelerTool', 'EvidenceTool'],
    aiTools: [
      { id: 'vision_assistant', name: 'Vision Drafting Assistant', description: 'Draft locally distinctive vision options.', status: 'available', launchToolId: 'VisionConceptsTool' },
      { id: 'outcome_metrics', name: 'Outcome Distiller & Metric Designer', description: 'Curate ≤10 outcomes with indicators and targets.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'outcome_linker', name: 'Outcome-to-Policy/Site Linker', description: 'Suggest policy/site links per outcome to spot gaps.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['No more than 10 outcomes with measurable indicators', 'Vision references baseline evidence and national policy', 'Each outcome has at least one supporting policy/site']
  },
  {
    id: 'SITE_SELECTION',
    label: 'Site Selection & Spatial Strategy',
    description: 'Long list → assessment → preferred allocations → decisions log.',
    aim: 'Work through the four-stage site process and record reasons for choices.',
    llmTaskId: 'plan_stage_help_sites',
    recommendedTools: ['SiteAssessmentTool', 'StrategyModelerTool', 'PolicyDrafterTool'],
    tasks: [
      'Generate structured site profiles with constraints/context.',
      'Pre-fill RAG for suitability/availability/achievability with reasons.',
      'Estimate indicative capacity and record selection/rejection reasons.'
    ],
    coreTasks: [
      'Generate structured site profiles with constraints/context.',
      'Pre-fill RAG for suitability/availability/achievability with reasons.',
      'Estimate indicative capacity and record selection/rejection reasons.'
    ],
    actionsRecommended: [
      { id: 'site_profile', label: 'Create site profiles', shortExplainer: 'Summarise constraints, access, and context for each site.', primaryToolId: 'SiteAssessmentTool', assistantPromptHint: 'Summarise constraints and context for our sites' },
      { id: 'site_rag', label: 'Run S/A/A RAG', shortExplainer: 'Auto-score suitability/availability/achievability.', primaryToolId: 'SiteAssessmentTool', assistantPromptHint: 'RAG score sites on suitability, availability, achievability' },
      { id: 'site_capacity', label: 'Estimate capacity', shortExplainer: 'Indicative dwellings/sqm using standards/typology.', primaryToolId: 'SiteAssessmentTool', assistantPromptHint: 'Estimate capacity for key sites with policy standards' },
      { id: 'site_decision', label: 'Draft selection/rejection reasons', shortExplainer: 'Log why sites were selected or rejected.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft reasons for selecting or rejecting candidate sites' }
    ],
    stageTools: ['SiteAssessmentTool', 'StrategyModelerTool', 'PolicyDrafterTool', 'EvidenceTool'],
    aiTools: [
      { id: 'site_profile', name: 'Site Context Summariser', description: 'Create concise site profiles from geometry/constraints.', status: 'available', launchToolId: 'SiteAssessmentTool' },
      { id: 'site_rag', name: 'RAG Site Assessor', description: 'Auto-score S/A/A with rationale.', status: 'available', launchToolId: 'SiteAssessmentTool' },
      { id: 'site_capacity', name: 'Capacity Estimator', description: 'Estimate capacity with policy standards and typology.', status: 'available', launchToolId: 'SiteAssessmentTool' },
      { id: 'site_decision', name: 'Allocation Decision Justifier', description: 'Draft reasons for selection/rejection of candidate sites.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Reasonable alternatives recorded', 'Capacity assumptions documented', 'Decisions log captures reasons for selection/rejection']
  },
  {
    id: 'CONSULTATION_1',
    label: 'Consultation 1',
    description: 'Plan scope, evidence, early vision/strategy consultation.',
    aim: 'Design and summarise the first consultation so it is proportionate and evidenced.',
    llmTaskId: 'plan_stage_help_consult1',
    recommendedTools: ['FeedbackAnalysisTool', 'EvidenceTool'],
    tasks: [
      'Plan who to consult and which methods match the issues.',
      'Draft neutral, open consultation questions tied to issues/options.',
      'Cluster early responses into themes and draft C1 summary.'
    ],
    coreTasks: [
      'Plan who to consult and which methods match the issues.',
      'Draft neutral, open consultation questions tied to issues/options.',
      'Cluster early responses into themes and draft C1 summary.'
    ],
    actionsRecommended: [
      { id: 'c1_plan', label: 'Draft consultation plan', shortExplainer: 'Audiences, methods, and web copy.', primaryToolId: 'FeedbackAnalysisTool', assistantPromptHint: 'Design the Consultation 1 plan and methods' },
      { id: 'c1_questions', label: 'Generate consultation questions', shortExplainer: 'Open, unbiased questions aligned to issues.', primaryToolId: 'FeedbackAnalysisTool', assistantPromptHint: 'Draft neutral questions for Consultation 1' },
      { id: 'c1_cluster', label: 'Cluster early responses', shortExplainer: 'Turn reps into themes with example quotes.', primaryToolId: 'FeedbackAnalysisTool', assistantPromptHint: 'Cluster early responses into themes' },
      { id: 'c1_summary', label: 'Write C1 summary', shortExplainer: 'Who/when/how, main issues, and influence.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft the Consultation 1 summary' }
    ],
    stageTools: ['FeedbackAnalysisTool', 'EvidenceTool', 'PolicyDrafterTool'],
    aiTools: [
      { id: 'c1_plan', name: 'Consultation Plan Generator', description: 'Suggest audiences, methods, and draft web copy.', status: 'available', launchToolId: 'FeedbackAnalysisTool' },
      { id: 'c1_questions', name: 'Consultation Question Designer', description: 'Write plain-language, unbiased questions for surveys/web forms.', status: 'available', launchToolId: 'FeedbackAnalysisTool' },
      { id: 'c1_cluster', name: 'Response Theme Clusterer', description: 'Cluster representations into themes with example quotes.', status: 'available', launchToolId: 'FeedbackAnalysisTool' },
      { id: 'c1_summary', name: 'Consultation Summary Writer (C1)', description: 'Draft who/when/how, main issues, and influence on plan.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Audiences/methods are justified', 'Questions align to issues/options', 'Themes and summary captured for Gateway 2 evidence']
  },
  {
    id: 'GATEWAY_2',
    label: 'Gateway 2',
    description: 'PINS advice / submission-ready check on emerging plan.',
    aim: 'Check pack completeness and surface soundness/legal risks early.',
    llmTaskId: 'plan_stage_help_gateway2',
    recommendedTools: ['PolicyDrafterTool', 'StrategyModelerTool', 'EvidenceTool'],
    tasks: [
      'Run completeness check on the Gateway 2 pack with gaps flagged.',
      'Generate top soundness/legal risks with suggested mitigations.',
      'Draft matters to discuss with the assessor and a covering summary.'
    ],
    coreTasks: [
      'Check pack completeness and flag gaps.',
      'Surface early soundness/legal risks with mitigation.',
      'Draft matters for discussion and covering summary.'
    ],
    actionsRecommended: [
      { id: 'g2_completeness', label: 'Check Gateway 2 pack', shortExplainer: 'Flag missing/weak components.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'What is missing from the Gateway 2 pack?' },
      { id: 'g2_risks', label: 'List soundness/legal risks', shortExplainer: 'Top risks with mitigation steps.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'List early soundness and legal risks and mitigations' },
      { id: 'g2_matters', label: 'Draft matters to discuss', shortExplainer: 'Issues/questions for assessor meeting.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft matters to discuss with the Gateway assessor' },
      { id: 'g2_summary', label: 'Write submission summary', shortExplainer: 'Concise covering note for Gateway 2.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft a short Gateway 2 submission summary' }
    ],
    stageTools: ['PolicyDrafterTool', 'StrategyModelerTool', 'EvidenceTool'],
    aiTools: [
      { id: 'g2_completeness', name: 'Gateway 2 Pack Completeness Checker', description: 'Flag missing or weak components before assessor review.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g2_risks', name: 'Early Soundness Risk Snapshot', description: 'List top soundness/legal risks with plain-language mitigation.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g2_matters', name: 'Matters for Discussion Generator', description: 'Bullet questions/issues to raise with the assessor.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g2_summary', name: 'Gateway 2 Submission Summary Writer', description: 'Covering note for what is presented and feedback sought.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Pack completeness checked', 'Soundness/legal risks noted with mitigation', 'Matters for discussion prepared']
  },
  {
    id: 'CONSULTATION_2',
    label: 'Consultation 2',
    description: 'Proposed Local Plan consultation.',
    aim: 'Tag issues per policy/site, summarise objections, and draft the C2 summary.',
    llmTaskId: 'plan_stage_help_consult2',
    recommendedTools: ['FeedbackAnalysisTool', 'PolicyDrafterTool'],
    tasks: [
      'Tag each representation against policies/sites with sentiment.',
      'Summarise soundness/legal objections as main issues with counts.',
      'Draft the Consultation 2 summary with issues and intended changes.'
    ],
    coreTasks: [
      'Tag each representation against policies/sites with sentiment.',
      'Summarise soundness/legal objections as main issues with counts.',
      'Draft the Consultation 2 summary with issues and intended changes.'
    ],
    actionsRecommended: [
      { id: 'c2_tagger', label: 'Tag reps to policies/sites', shortExplainer: 'Issues + sentiment per policy/site.', primaryToolId: 'FeedbackAnalysisTool', assistantPromptHint: 'Tag representations to policies and sites with sentiment' },
      { id: 'c2_soundness', label: 'Summarise objections', shortExplainer: 'Likely main issues with counts/examples.', primaryToolId: 'FeedbackAnalysisTool', assistantPromptHint: 'Summarise soundness objections and likely main issues' },
      { id: 'c2_summary', label: 'Draft C2 summary', shortExplainer: 'Who/when/how, issues, intended changes.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft the Consultation 2 summary' }
    ],
    stageTools: ['FeedbackAnalysisTool', 'PolicyDrafterTool'],
    aiTools: [
      { id: 'c2_tagger', name: 'Policy/Site Issue Tagger', description: 'Map reps to policies/sites and sentiment.', status: 'available', launchToolId: 'FeedbackAnalysisTool' },
      { id: 'c2_soundness', name: 'Soundness Objection Summariser', description: 'List likely main issues with counts/examples.', status: 'available', launchToolId: 'FeedbackAnalysisTool' },
      { id: 'c2_summary', name: 'Consultation Summary Writer (C2)', description: 'Draft who/when/how, main issues, and intended changes.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Reps tagged to policies/sites', 'Main issues identified in inspector language', 'C2 summary drafted with initial responses']
  },
  {
    id: 'GATEWAY_3',
    label: 'Gateway 3',
    description: 'Prescribed requirements and examination readiness check.',
    aim: 'Check legal/prescribed requirements and draft the three key statements.',
    llmTaskId: 'plan_stage_help_gateway3',
    recommendedTools: ['PolicyDrafterTool', 'EvidenceTool'],
    tasks: [
      'Run prescribed-requirements check with reasons for any fails/uncertainty.',
      'Draft Statement of Compliance and Statement of Soundness.',
      'Draft Examination Readiness Statement with practical arrangements.'
    ],
    coreTasks: [
      'Check prescribed requirements with reasons for fails/uncertainty.',
      'Draft Statement of Compliance and Statement of Soundness.',
      'Draft Examination Readiness Statement with practical arrangements.'
    ],
    actionsRecommended: [
      { id: 'g3_requirements', label: 'Run requirements check', shortExplainer: 'Requirement-by-requirement RAG with explanations.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Run prescribed requirements checklist and flag gaps' },
      { id: 'g3_compliance', label: 'Draft Statement of Compliance', shortExplainer: 'Narrative on compliance with regs/requirements.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft a Statement of Compliance' },
      { id: 'g3_soundness', label: 'Draft Statement of Soundness', shortExplainer: 'Tests of soundness with evidence references.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft a Statement of Soundness' },
      { id: 'g3_readiness', label: 'Draft Examination Readiness', shortExplainer: 'Practical readiness note (team, logistics).', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft an Examination Readiness Statement' }
    ],
    stageTools: ['PolicyDrafterTool', 'EvidenceTool'],
    aiTools: [
      { id: 'g3_requirements', name: 'Prescribed Requirements Checker', description: 'Requirement-by-requirement RAG with explanations.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g3_compliance', name: 'Statement of Compliance Drafter', description: 'Narrative for compliance with regs and requirements.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g3_soundness', name: 'Statement of Soundness Drafter', description: 'Draft around tests of soundness using evidence, trajectory, sites.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g3_readiness', name: 'Examination Readiness Statement Drafter', description: 'Short readiness statement covering logistics and maturity.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Requirements checklist complete', 'Statements drafted with references', 'Readiness covers logistics and data availability']
  },
  {
    id: 'SUBMISSION_EXAM',
    label: 'Submission & Examination Rehearsal',
    description: 'Finalise submission bundle and rehearse examination.',
    aim: 'Validate the bundle and rehearse soundness/legal tests with inspector-style Q&A.',
    llmTaskId: 'plan_stage_help_submission',
    recommendedTools: ['PolicyDrafterTool', 'EvidenceTool'],
    tasks: [
      'Validate the submission bundle against the expected set and versions.',
      'Run exam rehearsal tests and generate inspector-style questions.',
      'Flag lines of cross-examination for contentious policies/sites.'
    ],
    coreTasks: [
      'Validate submission bundle against expected set and versions.',
      'Run exam rehearsal tests and generate inspector questions.',
      'Flag cross-examination lines for contentious policies/sites.'
    ],
    actionsRecommended: [
      { id: 'sub_bundle', label: 'Validate submission bundle', shortExplainer: 'Check for missing/duplicated/outdated items.', primaryToolId: 'EvidenceTool', assistantPromptHint: 'Validate the submission bundle against expected items' },
      { id: 'sub_rehearsal', label: 'Run exam rehearsal', shortExplainer: 'Simulate inspector questions and highlight risks.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Simulate inspector questions for contentious policies/sites' }
    ],
    stageTools: ['PolicyDrafterTool', 'EvidenceTool'],
    aiTools: [
      { id: 'sub_bundle', name: 'Submission Bundle Validator', description: 'Check for missing/duplicated/outdated items in the bundle.', status: 'available', launchToolId: 'EvidenceTool' },
      { id: 'sub_rehearsal', name: 'Exam Rehearsal Engine', description: 'Run tests, simulate inspector questions, highlight cross-exam lines.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Bundle validated with dates/versions', 'Rehearsal covers soundness/legal compliance', 'Contentious items have prep notes']
  },
  {
    id: 'ADOPTION_MONITORING',
    label: 'Adoption & Monitoring',
    description: 'Adoption tasks, monitoring framework, and year-4 evaluation setup.',
    aim: 'Capture adoption details, set indicators, and prepare for year-4 evaluation.',
    llmTaskId: 'plan_stage_help_adoption',
    recommendedTools: ['EvidenceTool', 'PolicyDrafterTool'],
    tasks: [
      'Complete adoption compliance checklist and map updates.',
      'Propose indicators, baselines, and sources per outcome.',
      'Draft annual monitoring narrative and year-4 evaluation skeleton.'
    ],
    coreTasks: [
      'Complete adoption compliance checklist and map updates.',
      'Propose indicators, baselines, and sources per outcome.',
      'Draft annual monitoring narrative and year-4 evaluation skeleton.'
    ],
    actionsRecommended: [
      { id: 'adopt_compliance', label: 'Check adoption compliance', shortExplainer: 'Post-adoption checklist with RAG.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Run adoption compliance check' },
      { id: 'adopt_indicators', label: 'Suggest indicators/baselines', shortExplainer: 'Indicators, baselines, sources per outcome.', primaryToolId: 'EvidenceTool', assistantPromptHint: 'Suggest outcome indicators and baselines' },
      { id: 'adopt_monitoring', label: 'Draft monitoring narrative', shortExplainer: 'Annual monitoring text with performance highlights.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft annual monitoring narrative' },
      { id: 'adopt_eval', label: 'Prepare year-4 evaluation', shortExplainer: 'Keep/amend/delete flags and evaluation skeleton.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft a year-4 evaluation outline' }
    ],
    stageTools: ['EvidenceTool', 'PolicyDrafterTool'],
    aiTools: [
      { id: 'adopt_compliance', name: 'Adoption Compliance Check', description: 'Checklist that post-adoption tasks are complete.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'adopt_indicators', name: 'Outcome-Indicator Suggestion', description: 'Suggest indicators, baselines, sources per outcome.', status: 'available', launchToolId: 'EvidenceTool' },
      { id: 'adopt_monitoring', name: 'Annual Monitoring Narrative Writer', description: 'Draft monitoring text showing delivery/performance.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'adopt_eval', name: 'Year-4 Evaluation Assistant', description: 'Flag keep/amend/delete per policy/site with reasoning.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Adoption resolution + modifications recorded', 'Monitoring indicators and sources agreed', 'Year-4 evaluation path noted']
  }
]

export const CROSS_CUTTING_AI = [
  {
    id: 'plan_assistant',
    name: 'Plan-aware assistant (“Ask anything”)',
    description: 'Answers free-form questions about the plan, evidence, sites, and guidance using local retrieval plus LLM.',
  },
  {
    id: 'checklist_engine',
    name: 'Checklist & test engine',
    description: 'Runs scripted tests with pass/risk/fail/not-applicable/insufficient_data outputs and suggested actions.',
  },
  {
    id: 'doc_drafter',
    name: 'Document drafter / editor',
    description: 'Takes structured inputs and references to produce notices, summaries, and statements with regenerate + edit.',
  },
]
