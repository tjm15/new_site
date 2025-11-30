import type { PlanStageId } from './types'

type StageBand = 'get-ready' | 'plan-making'

export type StageMeta = {
  id: PlanStageId
  band: StageBand
  label: string
  description: string
  timingNote?: string
  sequence?: 'strict' | 'flexible'
  longDescription?: string
  aim: string
  llmTaskId: string
  seaHraFocus?: string
  dashboardNotes?: string[]
  recommendedTools: Array<
    | 'EvidenceTool'
    | 'VisionConceptsTool'
    | 'SmartOutcomesTool'
    | 'PolicyDrafterTool'
    | 'StrategyModelerTool'
    | 'SiteAssessmentTool'
    | 'FeedbackAnalysisTool'
    | 'SEATool'
    | 'SCITool'
    | 'TimetableTool'
    | 'NoticeTool'
    | 'PrepRiskTool'
    | 'BaseliningTool'
    | 'Gateway1Tool'
  >
  tasks: string[]
  coreTasks?: string[]
  actionsRecommended?: Array<{
    id: string
    label: string
    shortExplainer: string
    primaryToolId?: 'EvidenceTool' | 'VisionConceptsTool' | 'SmartOutcomesTool' | 'PolicyDrafterTool' | 'StrategyModelerTool' | 'SiteAssessmentTool' | 'FeedbackAnalysisTool' | 'SEATool' | 'SCITool' | 'TimetableTool' | 'NoticeTool' | 'PrepRiskTool' | 'BaseliningTool' | 'Gateway1Tool'
    assistantPromptHint?: string
  }>
  stageTools?: Array<'EvidenceTool' | 'VisionConceptsTool' | 'SmartOutcomesTool' | 'PolicyDrafterTool' | 'StrategyModelerTool' | 'SiteAssessmentTool' | 'FeedbackAnalysisTool' | 'SEATool' | 'SCITool' | 'TimetableTool' | 'NoticeTool' | 'PrepRiskTool' | 'BaseliningTool' | 'Gateway1Tool'>
  aiTools?: {
    id: string
    name: string
    description: string
    status?: 'available' | 'planned'
    launchToolId?: 'EvidenceTool' | 'VisionConceptsTool' | 'SmartOutcomesTool' | 'PolicyDrafterTool' | 'StrategyModelerTool' | 'SiteAssessmentTool' | 'FeedbackAnalysisTool' | 'SEATool' | 'SCITool' | 'TimetableTool' | 'NoticeTool' | 'PrepRiskTool' | 'BaseliningTool' | 'Gateway1Tool' | 'CULPToolkit'
  }[]
  qaNotes?: string[]
  qaChecks?: string[]
}

export const STAGES: StageMeta[] = [
  {
    id: 'TIMETABLE',
    band: 'get-ready',
    label: 'Timetable published',
    description: 'Publish the Local Plan timetable before issuing the notice to commence.',
    timingNote: 'Pre-30 month | strict sequence',
    sequence: 'strict',
    aim: 'Set a credible 30-month timetable with dependencies before the notice period starts.',
    llmTaskId: 'plan_stage_help_timetable',
    seaHraFocus: 'Light-touch SEA/HRA readiness: requirement checker + baseline database placeholder visible on the timeline.',
    dashboardNotes: [
      'Gantt-style visual timeline with dependency warnings',
      'SEA requirement checker + baseline database slot',
      'Readiness RAG dial including SEA/HRA',
    ],
    recommendedTools: ['TimetableTool', 'PrepRiskTool', 'EvidenceTool', 'SEATool'],
    tasks: [
      'Draft a realistic 30-month timetable with milestones and dependencies.',
      'Sequence pre-commencement steps (notice, scoping consultation, Gateway 1).',
      'Share timetable for sign-off and publication.'
    ],
    coreTasks: [
      'Draft the 30-month timetable with dependencies.',
      'Check dependencies and lead-ins for notice and scoping consultation.'
    ],
    actionsRecommended: [
      { id: 'prep_timetable', label: 'Draft the 30-month timetable', shortExplainer: 'Auto-propose milestones and dates, then edit.', primaryToolId: 'TimetableTool', assistantPromptHint: 'Draft a 30-month timetable with Gateway 1 and consultations' },
      { id: 'prep_risk', label: 'Assess prep risks', shortExplainer: 'RAG governance/resources and log actions before Gateway 1.', primaryToolId: 'PrepRiskTool', assistantPromptHint: 'What are the top prep risks before Gateway 1?' }
    ],
    stageTools: ['TimetableTool', 'PrepRiskTool', 'EvidenceTool', 'SEATool'],
    aiTools: [
      { id: 'prep_timetable', name: 'Timetable Designer', description: 'Suggest a 30-month timetable with milestones and dates you can tweak.', status: 'available', launchToolId: 'TimetableTool' },
      { id: 'prep_risk', name: 'Preparation Risk Assessor', description: 'RAG readiness on governance/resources with actions before Gateway 1.', status: 'available', launchToolId: 'PrepRiskTool' }
    ],
    qaNotes: ['Timetable includes Gateway 1 and consultation milestones', 'Dependencies and lead-ins are recorded', 'SEA/HRA readiness checks are visible in the timeline view']
  },
  {
    id: 'NOTICE',
    band: 'get-ready',
    label: 'Notice to commence (4 months)',
    description: 'Publish the statutory notice with at least a 4-month lead-in and a link to the timetable.',
    timingNote: 'Pre-30 month | 4-month minimum',
    sequence: 'strict',
    aim: 'Issue the notice, confirm governance/resources, and capture risks ahead of Gateway 1.',
    llmTaskId: 'plan_stage_help_notice',
    seaHraFocus: 'Countdown with SEA/HRA readiness banner and baseline completeness indicator before Gateway 1.',
    dashboardNotes: [
      'Countdown timer to earliest Gateway 1 date',
      'Notice preview auto-filled with SEA/HRA banner',
      'Baseline completeness and readiness RAG surfaced',
    ],
    recommendedTools: ['NoticeTool', 'PrepRiskTool', 'SCITool', 'SEATool'],
    tasks: [
      'Prepare notice-to-commence text for publication with timetable link.',
      'Confirm governance, resources, and PID alignment.',
      'Publish notice and record date (≥4 months before Gateway 1).'
    ],
    coreTasks: [
      'Prepare Notice to Commence text and publication route.',
      'Record governance, resources, and early risks.'
    ],
    actionsRecommended: [
      { id: 'prep_notice', label: 'Draft Notice to Commence', shortExplainer: 'Generate compliant notice text ready for publication.', primaryToolId: 'NoticeTool', assistantPromptHint: 'Draft a Notice to Commence for this authority' },
      { id: 'prep_risk', label: 'Assess prep risks', shortExplainer: 'RAG governance/resources and log actions before Gateway 1.', primaryToolId: 'PrepRiskTool', assistantPromptHint: 'What are the top prep risks before Gateway 1?' }
    ],
    stageTools: ['NoticeTool', 'PrepRiskTool', 'SCITool', 'EvidenceTool', 'SEATool'],
    aiTools: [
      { id: 'prep_notice', name: 'Notice to Commence Drafter', description: 'Draft publishable notice text that meets the content requirements.', status: 'available', launchToolId: 'NoticeTool' },
      { id: 'prep_risk', name: 'Preparation Risk Assessor', description: 'RAG readiness on governance/resources with actions before Gateway 1.', status: 'available', launchToolId: 'PrepRiskTool' }
    ],
    qaNotes: ['Notice meets 4-month minimum', 'Governance route and project board are recorded', 'Resources/risks captured before submission to Gateway 1', 'SEA/HRA readiness banner and baseline status displayed with the notice'],
    qaChecks: ['Notice to Commence drafted for publication', 'Governance and decision path logged']
  },
  {
    id: 'SCOPING',
    band: 'get-ready',
    label: 'Scoping consultation',
    description: 'Run the pre-plan scoping consultation before Gateway 1.',
    timingNote: 'Pre-30 month | strict sequence',
    sequence: 'strict',
    aim: 'Design, run, and summarise scoping consultation with SCI commitments visible for Gateway 1 and SEA/HRA scoping embedded.',
    llmTaskId: 'plan_stage_help_scoping',
    seaHraFocus: 'Embedded SEA/HRA scoping: 5-block baseline grid, traffic-light completeness, and one-click scoping report generation.',
    dashboardNotes: [
      'Engagement dashboard with expected vs actual responses and spatial map',
      'LLM auto-categorisation of comments and baseline environmental issues',
      'SEA/HRA scoping grid with baseline completeness indicator and report generator',
    ],
    recommendedTools: ['FeedbackAnalysisTool', 'SCITool', 'EvidenceTool', 'PolicyDrafterTool', 'SEATool'],
    tasks: [
      'Plan audiences and methods aligned to the SCI.',
      'Draft and publish scoping consultation questions.',
      'Capture responses and summarise findings for Gateway 1.',
      'Populate SEA/HRA scoping baseline grid and generate draft scoping report.'
    ],
    coreTasks: [
      'Plan who to consult and how (aligned to SCI).',
      'Draft neutral scoping questions and publish.',
      'Summarise scoping consultation themes and issues.',
      'Complete SEA/HRA scoping baseline grid and export scoping report.'
    ],
    actionsRecommended: [
      { id: 'scoping_plan', label: 'Plan scoping consultation', shortExplainer: 'Audiences, methods, and timing aligned to SCI.', primaryToolId: 'FeedbackAnalysisTool', assistantPromptHint: 'Draft the scoping consultation plan and methods' },
      { id: 'scoping_questions', label: 'Draft scoping questions', shortExplainer: 'Open questions linked to issues/options.', primaryToolId: 'FeedbackAnalysisTool', assistantPromptHint: 'Draft neutral scoping consultation questions' },
      { id: 'scoping_summary', label: 'Summarise scoping responses', shortExplainer: 'Who/when/how, main issues, and implications for Gateway 1.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Summarise the scoping consultation findings' }
    ],
    stageTools: ['FeedbackAnalysisTool', 'SCITool', 'EvidenceTool', 'PolicyDrafterTool', 'SEATool'],
    aiTools: [
      { id: 'scoping_plan', name: 'Scoping Consultation Planner', description: 'Suggest audiences, methods, and web copy for scoping.', status: 'available', launchToolId: 'FeedbackAnalysisTool' },
      { id: 'scoping_questions', name: 'Scoping Question Designer', description: 'Write plain-language, unbiased scoping questions.', status: 'available', launchToolId: 'FeedbackAnalysisTool' },
      { id: 'scoping_summary', name: 'Scoping Summary Writer', description: 'Draft who/when/how, main issues, and implications.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Audiences/methods align to SCI', 'Questions are neutral and linked to issues/options', 'Themes and summary captured for Gateway 1 evidence', 'SEA/HRA scoping baseline grid completed with traffic-light completeness']
  },
  {
    id: 'GATEWAY_1',
    band: 'get-ready',
    label: 'Gateway 1',
    description: 'Readiness self-assessment across timetable, governance, engagement, evidence, SEA/HRA before the 30-month clock starts.',
    timingNote: 'Pre-30 month | end of readiness',
    sequence: 'strict',
    aim: 'Complete Gateway 1 self-assessment with evidence-backed RAG and a publishable summary that unlocks the 30-month clock.',
    llmTaskId: 'plan_stage_help_gateway1',
    seaHraFocus: 'Readiness dial includes SEA/HRA baseline + scoping status with quick fixes before the 30-month clock.',
    dashboardNotes: [
      'Large readiness score dial (0–100) with five categories',
      'Per-category RAG including SEA/HRA baseline readiness',
      'Auto-generated publishable summary with next fixes',
    ],
    recommendedTools: ['Gateway1Tool', 'EvidenceTool', 'SCITool', 'SEATool'],
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
      { id: 'g1_rag', label: 'Run readiness RAG', shortExplainer: 'Auto-score all five areas with gaps.', primaryToolId: 'Gateway1Tool', assistantPromptHint: 'Are we Gateway 1 ready? List gaps.' },
      { id: 'g1_summary', label: 'Generate Gateway 1 summary', shortExplainer: 'Publishable summary per area plus intro.', primaryToolId: 'Gateway1Tool', assistantPromptHint: 'Draft a short Gateway 1 self-assessment summary' },
      { id: 'g1_guidance', label: 'Review guidance alignment', shortExplainer: 'Compare answers to what Gateway 1 expects.', primaryToolId: 'Gateway1Tool', assistantPromptHint: 'What does Gateway 1 require and how do we align?' }
    ],
    stageTools: ['Gateway1Tool', 'EvidenceTool', 'SCITool', 'SEATool', 'PolicyDrafterTool'],
    aiTools: [
      { id: 'g1_rag', name: 'Readiness RAG Engine', description: 'Colour each readiness area with reasons and critical gaps.', status: 'available', launchToolId: 'Gateway1Tool' },
      { id: 'g1_summary', name: 'Gateway-1 Summary Generator', description: 'Produce a web-ready summary per readiness area with intro.', status: 'available', launchToolId: 'Gateway1Tool' },
      { id: 'g1_guidance', name: 'Guidance Explainer', description: 'Explain what Gateway 1 requires and how your answers map to it.', status: 'available', launchToolId: 'Gateway1Tool' }
    ],
    qaNotes: ['All five readiness areas assessed', 'SEA/HRA scoping status recorded', 'Engagement/SCI outline captured'],
    qaChecks: ['All readiness areas answered', 'SEA scoping status recorded', 'Engagement/SCI outline captured']
  },
  {
    id: 'G1_SUMMARY',
    band: 'get-ready',
    label: 'Publish Gateway 1 summary',
    description: 'Publish the Gateway 1 summary and start the 30-month clock.',
    timingNote: 'Marker: 30-month clock starts here',
    sequence: 'strict',
    aim: 'Publish the Gateway 1 summary, record the start date, and transition into plan-making.',
    llmTaskId: 'plan_stage_help_gateway1_summary',
    seaHraFocus: 'Lock SEA/HRA scoping/baseline status into the published summary as the 30-month clock starts.',
    dashboardNotes: [
      'Gateway 1 summary template with auto-fill from readiness areas',
      'Published summary captures SEA/HRA baseline + scoping status',
      'Clock start date recorded visibly',
    ],
    recommendedTools: ['Gateway1Tool', 'PolicyDrafterTool', 'SEATool'],
    tasks: [
      'Finalise Gateway 1 summary using the template.',
      'Publish the summary and record the publication date.',
      'Confirm start of the 30-month clock and communicate deadlines.'
    ],
    coreTasks: [
      'Publish Gateway 1 summary for public view.',
      'Record the publication date as the 30-month clock start.'
    ],
    actionsRecommended: [
      { id: 'g1_publish', label: 'Publish Gateway 1 summary', shortExplainer: 'Publishable summary per readiness area with date recorded.', primaryToolId: 'Gateway1Tool', assistantPromptHint: 'Publish the Gateway 1 summary and set the clock start date' }
    ],
    stageTools: ['Gateway1Tool', 'PolicyDrafterTool', 'SEATool'],
    aiTools: [
      { id: 'g1_publish', name: 'Gateway 1 Publication Helper', description: 'Generate and publish the Gateway 1 summary with start date.', status: 'available', launchToolId: 'Gateway1Tool' }
    ],
    qaNotes: ['Summary published and date recorded', '30-month clock start date communicated', 'SEA/HRA baseline + scoping status reflected in the published summary']
  },
  {
    id: 'BASELINING',
    band: 'plan-making',
    label: 'Baselining & Evidence',
    description: 'Evidence inventory, trends, constraints, and baseline narrative.',
    timingNote: 'Months 1–23',
    aim: 'Build a coherent evidence baseline and narrative that feeds vision and options.',
    llmTaskId: 'plan_stage_help_baselining',
    seaHraFocus: 'Running countdown with SEA/HRA early baseline, alternatives testing hook, and environmental database.',
    dashboardNotes: [
      '30-month countdown indicator',
      'Baseline environmental database + constraints map',
      'Alternatives testing / cumulative effects hooks surfaced early',
    ],
    recommendedTools: ['BaseliningTool', 'EvidenceTool', 'SiteAssessmentTool', 'VisionConceptsTool', 'SEATool'],
    tasks: [
      'Seed the evidence inventory with expected datasets by topic and fill gaps.',
      'Summarise trends/issues and constraints per topic with supporting sources.',
      'Draft SWOT/challenge map and a short baseline narrative.',
      'Capture SEA/HRA early baseline position and key environmental receptors.'
    ],
    coreTasks: [
      'Seed evidence inventory with expected datasets and fill gaps.',
      'Summarise trends/issues and constraints per topic.',
      'Draft SWOT/challenge map and baseline narrative.',
      'Record SEA/HRA early baseline and receptors with links to datasets.'
    ],
    actionsRecommended: [
      { id: 'base_datasets', label: 'Seed evidence inventory', shortExplainer: 'Auto-suggest datasets by topic with sources.', primaryToolId: 'BaseliningTool', assistantPromptHint: 'What datasets should be in our baseline?' },
      { id: 'base_trends', label: 'Generate trends & issues', shortExplainer: 'Summaries per topic using evidence notes.', primaryToolId: 'BaseliningTool', assistantPromptHint: 'Summarise housing, economy, transport trends' },
      { id: 'base_swot', label: 'Draft SWOT / challenges', shortExplainer: 'Constraints + opportunities into SWOT/challenges.', primaryToolId: 'BaseliningTool', assistantPromptHint: 'Create a SWOT for this plan area' },
      { id: 'base_narrative', label: 'Write baseline narrative', shortExplainer: 'Short narrative for plan/consultation.', primaryToolId: 'BaseliningTool', assistantPromptHint: 'Draft a 200-word baseline narrative' }
    ],
    stageTools: ['BaseliningTool', 'EvidenceTool', 'SiteAssessmentTool', 'VisionConceptsTool', 'PolicyDrafterTool', 'SEATool'],
    aiTools: [
      { id: 'base_datasets', name: 'Evidence Dataset Recommender', description: 'Suggest national/local datasets by topic to seed the inventory.', status: 'available', launchToolId: 'BaseliningTool' },
      { id: 'base_trends', name: 'Trend & Issues Synthesiser', description: 'Turn reports + officer notes into bullet trends/issues per topic.', status: 'available', launchToolId: 'BaseliningTool' },
      { id: 'base_swot', name: 'SWOT / Challenge Map Generator', description: 'Build SWOT/challenge lists grounded in constraints and context.', status: 'available', launchToolId: 'BaseliningTool' },
      { id: 'base_narrative', name: 'Baseline Narrative Writer', description: 'Draft a 1–2 page baseline narrative for plan and consultation use.', status: 'available', launchToolId: 'BaseliningTool' }
    ],
    qaNotes: ['Evidence inventory includes sources and gaps', 'Constraints layers logged for site filtering', 'Baseline narrative cites data sources', 'SEA/HRA early baseline and receptors captured']
  },
  {
    id: 'VISION_OUTCOMES',
    band: 'plan-making',
    label: 'Vision & Outcomes',
    description: 'Vision statement plus ≤10 measurable outcomes linked to policies/sites.',
    timingNote: 'Months 1–23',
    aim: 'Produce a distinctive vision and a disciplined, measurable outcome set.',
    llmTaskId: 'plan_stage_help_vision',
    seaHraFocus: 'Keep SEA/HRA lens on outcomes and risks; surface baseline threads in the vision builder.',
    dashboardNotes: [
      '3-panel canvas (vision, spatial options map, evidence synthesis)',
      'SEA/HRA prompts baked into outcomes and spatial options',
      'Word clouds + national alignment checks with environmental guardrails',
    ],
    recommendedTools: ['VisionConceptsTool', 'SmartOutcomesTool', 'PolicyDrafterTool', 'StrategyModelerTool', 'SEATool'],
    tasks: [
      'Draft candidate vision statements rooted in baseline and national policy.',
      'Distil up to 10 outcomes with indicators/targets and time horizons.',
      'Map outcomes to emerging policies and potential sites to expose gaps.',
      'Apply SEA/HRA lens to outcomes and strategy options.'
    ],
    coreTasks: [
      'Draft candidate vision statements grounded in baseline and policy.',
      'Distil up to 10 outcomes with indicators/targets and time horizons.',
      'Map outcomes to policies/sites to expose gaps.',
      'Check outcomes against SEA/HRA baseline and risks.'
    ],
    actionsRecommended: [
      { id: 'vision_assistant', label: 'Draft vision options', shortExplainer: 'Generate locally distinctive vision statements.', primaryToolId: 'VisionConceptsTool', assistantPromptHint: 'Draft a distinctive vision for this authority' },
      { id: 'outcome_metrics', label: 'Curate outcomes & metrics', shortExplainer: 'Keep ≤10 outcomes with indicators/targets.', primaryToolId: 'SmartOutcomesTool', assistantPromptHint: 'Suggest SMART outcomes with indicators and targets' },
      { id: 'outcome_linker', label: 'Link outcomes to policies/sites', shortExplainer: 'Map each outcome to supporting policies/allocations.', primaryToolId: 'SmartOutcomesTool', assistantPromptHint: 'Which policies, sites, and SEA objectives support each outcome?' }
    ],
    stageTools: ['VisionConceptsTool', 'SmartOutcomesTool', 'PolicyDrafterTool', 'StrategyModelerTool', 'EvidenceTool', 'SEATool'],
    aiTools: [
      { id: 'vision_assistant', name: 'Vision Drafting Assistant', description: 'Draft locally distinctive vision options.', status: 'available', launchToolId: 'VisionConceptsTool' },
      { id: 'outcome_metrics', name: 'Outcome Distiller & Metric Designer', description: 'Curate ≤10 outcomes with indicators and targets.', status: 'available', launchToolId: 'SmartOutcomesTool' },
      { id: 'outcome_linker', name: 'Outcome-to-Policy/Site Linker', description: 'Suggest policy/site links per outcome to spot gaps.', status: 'available', launchToolId: 'SmartOutcomesTool' }
    ],
    qaNotes: ['No more than 10 outcomes with measurable indicators', 'Vision references baseline evidence and national policy', 'Each outcome has at least one supporting policy/site', 'SEA/HRA baseline influences outcomes and risks']
  },
  {
    id: 'SITE_SELECTION',
    band: 'plan-making',
    label: 'Spatial Strategy & Sites',
    description: 'Long list → assessment → preferred allocations → decisions log.',
    timingNote: 'Months 1–23',
    aim: 'Work through the four-stage site process and record reasons for choices.',
    llmTaskId: 'plan_stage_help_sites',
    seaHraFocus: 'Spatial strategy environmental effects, site environmental scoring, mitigation builder, and cumulative effects analysis.',
    dashboardNotes: [
      'Interactive map with constraints, sites, flood/heritage/transport layers',
      'Click-and-compare strategy options with SEA objectives overlay',
      'Mitigation builder and cumulative effects visualisation',
    ],
    recommendedTools: ['SiteAssessmentTool', 'StrategyModelerTool', 'PolicyDrafterTool', 'SEATool'],
    tasks: [
      'Generate structured site profiles with constraints/context.',
      'Pre-fill RAG for suitability/availability/achievability with reasons.',
      'Estimate indicative capacity and record selection/rejection reasons.',
      'Run environmental scoring, mitigation builder, and cumulative effects analysis.'
    ],
    coreTasks: [
      'Generate structured site profiles with constraints/context.',
      'Pre-fill RAG for suitability/availability/achievability with reasons.',
      'Estimate indicative capacity and record selection/rejection reasons.',
      'Overlay SEA/HRA effects, mitigation, and cumulative impacts across options.'
    ],
    actionsRecommended: [
      { id: 'site_profile', label: 'Create site profiles', shortExplainer: 'Summarise constraints, access, and context for each site.', primaryToolId: 'SiteAssessmentTool', assistantPromptHint: 'Summarise constraints and context for our sites' },
      { id: 'site_rag', label: 'Run S/A/A RAG', shortExplainer: 'Auto-score suitability/availability/achievability.', primaryToolId: 'SiteAssessmentTool', assistantPromptHint: 'RAG score sites on suitability, availability, achievability' },
      { id: 'site_capacity', label: 'Estimate capacity', shortExplainer: 'Indicative dwellings/sqm using standards/typology.', primaryToolId: 'SiteAssessmentTool', assistantPromptHint: 'Estimate capacity for key sites with policy standards' },
      { id: 'site_decision', label: 'Draft selection/rejection reasons', shortExplainer: 'Log why sites were selected or rejected.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft reasons for selecting or rejecting candidate sites' }
    ],
    stageTools: ['SiteAssessmentTool', 'StrategyModelerTool', 'PolicyDrafterTool', 'EvidenceTool', 'SEATool'],
    aiTools: [
      { id: 'site_profile', name: 'Site Context Summariser', description: 'Create concise site profiles from geometry/constraints.', status: 'available', launchToolId: 'SiteAssessmentTool' },
      { id: 'site_rag', name: 'RAG Site Assessor', description: 'Auto-score S/A/A with rationale.', status: 'available', launchToolId: 'SiteAssessmentTool' },
      { id: 'site_capacity', name: 'Capacity Estimator', description: 'Estimate capacity with policy standards and typology.', status: 'available', launchToolId: 'SiteAssessmentTool' },
      { id: 'site_decision', name: 'Allocation Decision Justifier', description: 'Draft reasons for selection/rejection of candidate sites.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Reasonable alternatives recorded', 'Capacity assumptions documented', 'Decisions log captures reasons for selection/rejection', 'Environmental scoring/mitigation and cumulative effects captured for SEA/HRA']
  },
  {
    id: 'CONSULTATION_1',
    band: 'plan-making',
    label: 'Consult on proposed content',
    description: 'Consult on proposed plan content and evidence (6-week minimum).',
    timingNote: 'Months 23–24 | 6-week minimum',
    aim: 'Design and summarise the first statutory consultation so it is proportionate and evidenced.',
    llmTaskId: 'plan_stage_help_consult1',
    seaHraFocus: 'SEA scope & early baseline sense-check with a “Have we captured all environmental issues?” prompt.',
    dashboardNotes: [
      'Consultation control room (timer, engagement analytics, issues map)',
      'Comment clustering and sentiment distribution',
      'SEA/HRA scope/baseline completeness check inline with consultation themes',
    ],
    recommendedTools: ['FeedbackAnalysisTool', 'EvidenceTool', 'SEATool'],
    tasks: [
      'Plan who to consult and which methods match the issues.',
      'Draft neutral, open consultation questions tied to issues/options.',
      'Cluster early responses into themes and draft C1 summary.',
      'Run SEA/HRA baseline check: have we captured all environmental issues?'
    ],
    coreTasks: [
      'Plan who to consult and which methods match the issues.',
      'Draft neutral, open consultation questions tied to issues/options.',
      'Cluster early responses into themes and draft C1 summary.',
      'Capture SEA/HRA baseline issues raised and gaps.'
    ],
    actionsRecommended: [
      { id: 'c1_plan', label: 'Draft consultation plan', shortExplainer: 'Audiences, methods, and web copy.', primaryToolId: 'FeedbackAnalysisTool', assistantPromptHint: 'Design the Consultation 1 plan and methods' },
      { id: 'c1_questions', label: 'Generate consultation questions', shortExplainer: 'Open, unbiased questions aligned to issues.', primaryToolId: 'FeedbackAnalysisTool', assistantPromptHint: 'Draft neutral questions for Consultation 1' },
      { id: 'c1_cluster', label: 'Cluster early responses', shortExplainer: 'Turn reps into themes with example quotes.', primaryToolId: 'FeedbackAnalysisTool', assistantPromptHint: 'Cluster early responses into themes' },
      { id: 'c1_summary', label: 'Write C1 summary', shortExplainer: 'Who/when/how, main issues, and influence.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft the Consultation 1 summary' }
    ],
    stageTools: ['FeedbackAnalysisTool', 'EvidenceTool', 'PolicyDrafterTool', 'SEATool'],
    aiTools: [
      { id: 'c1_plan', name: 'Consultation Plan Generator', description: 'Suggest audiences, methods, and draft web copy.', status: 'available', launchToolId: 'FeedbackAnalysisTool' },
      { id: 'c1_questions', name: 'Consultation Question Designer', description: 'Write plain-language, unbiased questions for surveys/web forms.', status: 'available', launchToolId: 'FeedbackAnalysisTool' },
      { id: 'c1_cluster', name: 'Response Theme Clusterer', description: 'Cluster representations into themes with example quotes.', status: 'available', launchToolId: 'FeedbackAnalysisTool' },
      { id: 'c1_summary', name: 'Consultation Summary Writer (C1)', description: 'Draft who/when/how, main issues, and influence on plan.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Audiences/methods are justified', 'Questions align to issues/options', 'Themes and summary captured for Gateway 2 evidence', 'SEA/HRA baseline gaps and issues captured during consultation']
  },
  {
    id: 'GATEWAY_2',
    band: 'plan-making',
    label: 'Gateway 2',
    description: 'PINS advice / submission-ready check on emerging plan after proposed content consultation.',
    timingNote: 'Months 23–24 | 4–6 weeks expected',
    aim: 'Check pack completeness and surface soundness/legal risks early.',
    llmTaskId: 'plan_stage_help_gateway2',
    seaHraFocus: 'Environmental Report progress review, alternatives completeness check, and risks-to-soundness warnings.',
    dashboardNotes: [
      'Gateway assessor simulation with likely PINS comments',
      'Environmental Report progress panel with SEA/HRA gaps',
      'Mock regulation compliance and soundness risk heatmap',
    ],
    recommendedTools: ['PolicyDrafterTool', 'StrategyModelerTool', 'EvidenceTool', 'SEATool'],
    tasks: [
      'Run completeness check on the Gateway 2 pack with gaps flagged.',
      'Generate top soundness/legal risks with suggested mitigations.',
      'Draft matters to discuss with the assessor and a covering summary.',
      'Check Environmental Report progress and alternatives completeness.'
    ],
    coreTasks: [
      'Check pack completeness and flag gaps.',
      'Surface early soundness/legal risks with mitigation.',
      'Draft matters for discussion and covering summary.',
      'Review SEA/HRA Environmental Report progress and alternatives coverage.'
    ],
    actionsRecommended: [
      { id: 'g2_completeness', label: 'Check Gateway 2 pack', shortExplainer: 'Flag missing/weak components.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'What is missing from the Gateway 2 pack?' },
      { id: 'g2_risks', label: 'List soundness/legal risks', shortExplainer: 'Top risks with mitigation steps.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'List early soundness and legal risks and mitigations' },
      { id: 'g2_matters', label: 'Draft matters to discuss', shortExplainer: 'Issues/questions for assessor meeting.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft matters to discuss with the Gateway assessor' },
      { id: 'g2_summary', label: 'Write submission summary', shortExplainer: 'Concise covering note for Gateway 2.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft a short Gateway 2 submission summary' }
    ],
    stageTools: ['PolicyDrafterTool', 'StrategyModelerTool', 'EvidenceTool', 'SEATool'],
    aiTools: [
      { id: 'g2_completeness', name: 'Gateway 2 Pack Completeness Checker', description: 'Flag missing or weak components before assessor review.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g2_risks', name: 'Early Soundness Risk Snapshot', description: 'List top soundness/legal risks with plain-language mitigation.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g2_matters', name: 'Matters for Discussion Generator', description: 'Bullet questions/issues to raise with the assessor.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g2_summary', name: 'Gateway 2 Submission Summary Writer', description: 'Covering note for what is presented and feedback sought.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Pack completeness checked', 'Soundness/legal risks noted with mitigation', 'Matters for discussion prepared', 'Environmental Report progress and alternatives completeness reviewed']
  },
  {
    id: 'CONSULTATION_2',
    band: 'plan-making',
    label: 'Consult on proposed local plan',
    description: 'Consult on the proposed Local Plan (Regulation 18/19 equivalent).',
    timingNote: 'Months 24+ | ≥8 weeks',
    aim: 'Tag issues per policy/site, summarise objections, and draft the C2 summary.',
    llmTaskId: 'plan_stage_help_consult2',
    seaHraFocus: 'Full Environmental Report published; public + statutory SEA consultation mirrored in analytics.',
    dashboardNotes: [
      'Document viewer with change tracking and policy-on-map sync',
      'SEA/HRA consultation responses tracked alongside representations',
      'Conformity checker with SDS and statutory consultation status',
    ],
    recommendedTools: ['FeedbackAnalysisTool', 'PolicyDrafterTool', 'SEATool'],
    tasks: [
      'Tag each representation against policies/sites with sentiment.',
      'Summarise soundness/legal objections as main issues with counts.',
      'Draft the Consultation 2 summary with issues and intended changes.',
      'Track SEA/HRA consultation responses and Environmental Report publication status.'
    ],
    coreTasks: [
      'Tag each representation against policies/sites with sentiment.',
      'Summarise soundness/legal objections as main issues with counts.',
      'Draft the Consultation 2 summary with issues and intended changes.',
      'Capture SEA/HRA consultation feedback and any statutory issues.'
    ],
    actionsRecommended: [
      { id: 'c2_tagger', label: 'Tag reps to policies/sites', shortExplainer: 'Issues + sentiment per policy/site.', primaryToolId: 'FeedbackAnalysisTool', assistantPromptHint: 'Tag representations to policies and sites with sentiment' },
      { id: 'c2_soundness', label: 'Summarise objections', shortExplainer: 'Likely main issues with counts/examples.', primaryToolId: 'FeedbackAnalysisTool', assistantPromptHint: 'Summarise soundness objections and likely main issues' },
      { id: 'c2_summary', label: 'Draft C2 summary', shortExplainer: 'Who/when/how, issues, intended changes.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft the Consultation 2 summary' }
    ],
    stageTools: ['FeedbackAnalysisTool', 'PolicyDrafterTool', 'SEATool'],
    aiTools: [
      { id: 'c2_tagger', name: 'Policy/Site Issue Tagger', description: 'Map reps to policies/sites and sentiment.', status: 'available', launchToolId: 'FeedbackAnalysisTool' },
      { id: 'c2_soundness', name: 'Soundness Objection Summariser', description: 'List likely main issues with counts/examples.', status: 'available', launchToolId: 'FeedbackAnalysisTool' },
      { id: 'c2_summary', name: 'Consultation Summary Writer (C2)', description: 'Draft who/when/how, main issues, and intended changes.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Reps tagged to policies/sites', 'Main issues identified in inspector language', 'C2 summary drafted with initial responses', 'SEA/HRA consultation responses and ER publication recorded']
  },
  {
    id: 'GATEWAY_3',
    band: 'plan-making',
    label: 'Gateway 3',
    description: 'Prescribed requirements and examination readiness check.',
    timingNote: 'Around month 29 | 4–6 weeks expected',
    aim: 'Check legal/prescribed requirements and draft the three key statements.',
    llmTaskId: 'plan_stage_help_gateway3',
    seaHraFocus: 'SEA compliance check baked into Statement of Compliance alongside prescribed requirements.',
    dashboardNotes: [
      'Submission-ready checklist with SEA/HRA compliance ticks',
      'Statement of Compliance builder with SEA/HRA section prompts',
      'Soundness risk heatmap feeding mitigation actions',
    ],
    recommendedTools: ['PolicyDrafterTool', 'EvidenceTool', 'SEATool'],
    tasks: [
      'Run prescribed-requirements check with reasons for any fails/uncertainty.',
      'Draft Statement of Compliance and Statement of Soundness.',
      'Draft Examination Readiness Statement with practical arrangements.',
      'Check SEA/HRA compliance status and evidence coverage.'
    ],
    coreTasks: [
      'Check prescribed requirements with reasons for fails/uncertainty.',
      'Draft Statement of Compliance and Statement of Soundness.',
      'Draft Examination Readiness Statement with practical arrangements.',
      'Confirm SEA/HRA compliance story and sign-off.'
    ],
    actionsRecommended: [
      { id: 'g3_requirements', label: 'Run requirements check', shortExplainer: 'Requirement-by-requirement RAG with explanations.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Run prescribed requirements checklist and flag gaps' },
      { id: 'g3_compliance', label: 'Draft Statement of Compliance', shortExplainer: 'Narrative on compliance with regs/requirements.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft a Statement of Compliance' },
      { id: 'g3_soundness', label: 'Draft Statement of Soundness', shortExplainer: 'Tests of soundness with evidence references.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft a Statement of Soundness' },
      { id: 'g3_readiness', label: 'Draft Examination Readiness', shortExplainer: 'Practical readiness note (team, logistics).', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft an Examination Readiness Statement' }
    ],
    stageTools: ['PolicyDrafterTool', 'EvidenceTool', 'SEATool'],
    aiTools: [
      { id: 'g3_requirements', name: 'Prescribed Requirements Checker', description: 'Requirement-by-requirement RAG with explanations.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g3_compliance', name: 'Statement of Compliance Drafter', description: 'Narrative for compliance with regs and requirements.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g3_soundness', name: 'Statement of Soundness Drafter', description: 'Draft around tests of soundness using evidence, trajectory, sites.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'g3_readiness', name: 'Examination Readiness Statement Drafter', description: 'Short readiness statement covering logistics and maturity.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Requirements checklist complete', 'Statements drafted with references', 'Readiness covers logistics and data availability', 'SEA/HRA compliance status documented in Statement of Compliance']
  },
  {
    id: 'SUBMISSION_EXAM',
    band: 'plan-making',
    label: 'Examination',
    description: 'Submission, hearings preparation, and examination rehearsal.',
    timingNote: 'Months 30–31 (target 6 months)',
    aim: 'Validate the bundle and rehearse soundness/legal tests with inspector-style Q&A.',
    llmTaskId: 'plan_stage_help_submission',
    seaHraFocus: 'Inspector SEA questions tracker; modifications trigger SEA adjustments during examination.',
    dashboardNotes: [
      'Hearing schedule + MIQ organiser',
      'SEA/HRA question tracker with quick draft responses',
      'Modifications tracker linked to SEA adjustments and timeline updates',
    ],
    recommendedTools: ['PolicyDrafterTool', 'EvidenceTool', 'SEATool'],
    tasks: [
      'Validate the submission bundle against the expected set and versions.',
      'Run exam rehearsal tests and generate inspector-style questions.',
      'Flag lines of cross-examination for contentious policies/sites.',
      'Track SEA/HRA questions and required modifications.'
    ],
    coreTasks: [
      'Validate submission bundle against expected set and versions.',
      'Run exam rehearsal tests and generate inspector questions.',
      'Flag cross-examination lines for contentious policies/sites.',
      'Log SEA/HRA issues raised and adjust modifications accordingly.'
    ],
    actionsRecommended: [
      { id: 'sub_bundle', label: 'Validate submission bundle', shortExplainer: 'Check for missing/duplicated/outdated items.', primaryToolId: 'EvidenceTool', assistantPromptHint: 'Validate the submission bundle against expected items' },
      { id: 'sub_rehearsal', label: 'Run exam rehearsal', shortExplainer: 'Simulate inspector questions and highlight risks.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Simulate inspector questions for contentious policies/sites' }
    ],
    stageTools: ['PolicyDrafterTool', 'EvidenceTool', 'SEATool'],
    aiTools: [
      { id: 'sub_bundle', name: 'Submission Bundle Validator', description: 'Check for missing/duplicated/outdated items in the bundle.', status: 'available', launchToolId: 'EvidenceTool' },
      { id: 'sub_rehearsal', name: 'Exam Rehearsal Engine', description: 'Run tests, simulate inspector questions, highlight cross-exam lines.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Bundle validated with dates/versions', 'Rehearsal covers soundness/legal compliance', 'Contentious items have prep notes', 'SEA/HRA questions and adjustment triggers captured']
  },
  {
    id: 'ADOPTION',
    band: 'plan-making',
    label: 'Adoption',
    description: 'Adoption statement, policies map, and post-exam modifications.',
    timingNote: 'Month 30–31',
    aim: 'Complete adoption tasks, publish the policies map, and close out post-exam actions.',
    llmTaskId: 'plan_stage_help_adoption',
    seaHraFocus: 'SEA Post-Adoption Statement generator plus mitigation and monitoring plan.',
    dashboardNotes: [
      'Adoption status indicator with key outputs',
      'SEA Post-Adoption Statement and mitigation plan generator',
      'Policies map/policies update checklist',
    ],
    recommendedTools: ['EvidenceTool', 'PolicyDrafterTool', 'SEATool'],
    tasks: [
      'Complete adoption compliance checklist and map updates.',
      'Prepare adoption statement and policies map for publication.',
      'Capture any modifications agreed through examination.',
      'Generate SEA Post-Adoption Statement and mitigation/monitoring plan.'
    ],
    coreTasks: [
      'Complete adoption compliance checklist and map updates.',
      'Prepare adoption statement and policies map for publication.',
      'Generate SEA Post-Adoption Statement with mitigation/monitoring commitments.'
    ],
    actionsRecommended: [
      { id: 'adopt_compliance', label: 'Check adoption compliance', shortExplainer: 'Post-adoption checklist with RAG.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Run adoption compliance check' }
    ],
    stageTools: ['EvidenceTool', 'PolicyDrafterTool', 'SEATool'],
    aiTools: [
      { id: 'adopt_compliance', name: 'Adoption Compliance Check', description: 'Checklist that post-adoption tasks are complete.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Adoption resolution + modifications recorded', 'Policies map ready for publication', 'SEA Post-Adoption Statement and mitigation/monitoring plan prepared']
  },
  {
    id: 'MONITORING',
    band: 'plan-making',
    label: 'Monitoring & evaluation',
    description: 'Annual monitoring, indicators, and year-4 evaluation.',
    timingNote: 'Year 1 and year 4',
    aim: 'Capture monitoring indicators and prepare the year-4 evaluation path.',
    llmTaskId: 'plan_stage_help_monitoring',
    seaHraFocus: 'Indicators + annual monitoring with SEA/HRA measures; year-4 evaluation feeds next plan.',
    dashboardNotes: [
      'Monitoring dashboard (housing, delivery, flood, BNG, transport)',
      'SEA/HRA indicators and mitigation monitoring status',
      'Year-4 evaluation generator feeding next plan',
    ],
    recommendedTools: ['EvidenceTool', 'PolicyDrafterTool', 'SEATool'],
    tasks: [
      'Propose indicators, baselines, and sources per outcome.',
      'Draft annual monitoring narrative.',
      'Prepare the year-4 evaluation skeleton.',
      'Track SEA/HRA mitigation and monitoring indicators.'
    ],
    coreTasks: [
      'Propose indicators, baselines, and sources per outcome.',
      'Draft annual monitoring narrative and year-4 evaluation skeleton.',
      'Maintain SEA/HRA mitigation and monitoring status.'
    ],
    actionsRecommended: [
      { id: 'adopt_indicators', label: 'Suggest indicators/baselines', shortExplainer: 'Indicators, baselines, sources per outcome.', primaryToolId: 'EvidenceTool', assistantPromptHint: 'Suggest outcome indicators and baselines' },
      { id: 'adopt_monitoring', label: 'Draft monitoring narrative', shortExplainer: 'Annual monitoring text with performance highlights.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft annual monitoring narrative' },
      { id: 'adopt_eval', label: 'Prepare year-4 evaluation', shortExplainer: 'Keep/amend/delete flags and evaluation skeleton.', primaryToolId: 'PolicyDrafterTool', assistantPromptHint: 'Draft a year-4 evaluation outline' }
    ],
    stageTools: ['EvidenceTool', 'PolicyDrafterTool', 'SEATool'],
    aiTools: [
      { id: 'adopt_indicators', name: 'Outcome-Indicator Suggestion', description: 'Suggest indicators, baselines, sources per outcome.', status: 'available', launchToolId: 'EvidenceTool' },
      { id: 'adopt_monitoring', name: 'Annual Monitoring Narrative Writer', description: 'Draft monitoring text showing delivery/performance.', status: 'available', launchToolId: 'PolicyDrafterTool' },
      { id: 'adopt_eval', name: 'Year-4 Evaluation Assistant', description: 'Flag keep/amend/delete per policy/site with reasoning.', status: 'available', launchToolId: 'PolicyDrafterTool' }
    ],
    qaNotes: ['Monitoring indicators and sources agreed', 'Annual monitoring route set', 'Year-4 evaluation path noted', 'SEA/HRA mitigation and monitoring indicators tracked']
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
