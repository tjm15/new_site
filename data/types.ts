// Type definitions for council data and planning applications

export interface Topic {
  id: string;
  label: string;
  color: string;
}

export interface Policy {
  reference: string;
  title: string;
  section: string;
  topics: string[];
  summary: string;
  text: string;
}

export interface PlanContext {
  title: string;
  authority: string;
  status: string;
  summary: string;
  keyIssues: string[];
}

export interface Centre {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface Constraint {
  id: string;
  label: string;
  type: string;
  path: string;
  color: string;
}

export interface Allocation {
  id: string;
  policyRef: string;
  name: string;
  description?: string;
  category: string;
  capacity: string;
  area?: string;
  proposedUse?: string;
  timeframe?: string;
  path: string;
  center: { x: number; y: number };
  labelX?: number;
  labelY?: number;
  strategies?: string[];
}

export interface Strategy {
  id: string;
  label: string;
  desc: string;
  includedSites?: string[];
}

export interface SpatialData {
  boroughOutline: string;
  centres: Centre[];
  constraints: Constraint[];
  allocations: Allocation[];
  strategies: Strategy[];
}

export interface ApplicationDocument {
  type: string;
  title: string;
  content: string;
}

export interface ConsultationResponse {
  respondent: string;
  type: 'support' | 'object' | 'comment';
  summary: string;
  fullText: string;
}

export interface PlanningApplication {
  id: string;
  reference: string;
  address: string;
  applicationType: string;
  description: string;
  applicant: string;
  documents: ApplicationDocument[];
  siteBoundary?: string;
  keyConstraints?: string[];
  applicablePolicies?: string[];
  consultationResponses?: ConsultationResponse[];
}

export interface CouncilData {
  id: string;
  name: string;
  description: string;
  planContext: PlanContext;
  topics: Topic[];
  policies: Policy[];
  spatialData: SpatialData;
  applications: PlanningApplication[];
  strategies?: Strategy[];
}

// New Local Plan system types
export type PlanSystemType = 'legacy' | 'new'

export type PlanStageId =
  | 'TIMETABLE'
  | 'NOTICE'
  | 'SCOPING'
  | 'GATEWAY_1'
  | 'G1_SUMMARY'
  | 'BASELINING'
  | 'VISION_OUTCOMES'
  | 'SITE_SELECTION'
  | 'CONSULTATION_1'
  | 'GATEWAY_2'
  | 'CONSULTATION_2'
  | 'GATEWAY_3'
  | 'SUBMISSION_EXAM'
  | 'ADOPTION'
  | 'MONITORING'

export interface PlanStage {
  id: PlanStageId
  title: string
  band?: 'get-ready' | 'plan-making'
  targetDate?: string // ISO date
  status?: 'not-started' | 'active' | 'completed'
}

export interface PlanTimetable {
  noticeToCommenceDate?: string // ISO date
  milestones: Array<{
    stageId: PlanStageId
    date: string // ISO date
  }>
}

export type IndicatorDifficulty = 'easy' | 'medium' | 'hard'

export interface SmartIndicator {
  id: string
  name: string
  baseline?: string
  target?: string
  source?: string
  difficulty?: IndicatorDifficulty
  frequency?: string
}

export interface SmartOutcomeCheck {
  smartScore?: number
  nppfWarnings?: string[]
  evidenceGaps?: string[]
  soundnessRisks?: string[]
}

export interface SmartOutcome {
  id: string
  theme: string
  outcomeStatement: string
  specific: string
  measurable: string
  achievable: string
  relevant: string
  timebound: string
  indicators: SmartIndicator[]
  linkedPolicies?: string[]
  linkedSites?: string[]
  linkedSeaObjectives?: string[]
  spatialLayers?: string[]
  monitoringFrequency?: string
  risks?: string[]
  status?: 'red' | 'amber' | 'green'
  gatewayFlags?: { ready?: boolean; warnings?: string[] }
  checks?: SmartOutcomeCheck
  notes?: string
}

export interface VisionOutcome {
  id: string
  text: string
  metric?: string
  linkedPolicies?: string[]
  linkedSites?: string[]
}

export interface SiteCandidate {
  id: string
  name: string
  location?: string
  suitability?: 'R' | 'A' | 'G'
  availability?: 'R' | 'A' | 'G'
  achievability?: 'R' | 'A' | 'G'
  notes?: string
  capacityEstimate?: number
}

export interface ReadinessAreaResult {
  id: string
  rag: 'red' | 'amber' | 'green'
  summary?: string
  actions?: string[]
}

export interface ReadinessAssessment {
  areas: ReadinessAreaResult[]
  assessedAt?: string
  overallStatus?: 'red' | 'amber' | 'green'
  overallComment?: string
}

export type EvidenceStatus = 'planned' | 'in_progress' | 'complete' | 'not_applicable'

export interface EvidenceItem {
  id: string
  topic: string
  title: string
  source?: string
  status?: EvidenceStatus
  category?: string
  year?: string
  coverage?: 'borough' | 'partial' | 'site'
  core?: boolean
  seaHraRelevant?: boolean
  why?: string
  limitations?: string
  notes?: string
}

export interface RepresentationTag {
  id: string
  policyId?: string
  siteId?: string
  issue?: string
  sentiment?: 'support' | 'object' | 'comment'
}

export interface ConsultationSummary {
  stageId: 'SCOPING' | 'CONSULTATION_1' | 'CONSULTATION_2'
  who: string
  when: string
  how: string
  mainIssues: string[]
  intendedChanges?: string
}

export type PlanPreferredOptions = {
  strategy?: { id: string; label?: string; analysis?: string; metrics?: { totalSites: number; totalCapacity: number } | null }
  policy?: { topicId?: string; topicLabel?: string; brief?: string; draft: string }
  site?: { id: string; name?: string; rationale?: string; appraisal?: string }
  evidence?: { id: string; title: string; content: string; question?: string; topics?: string[]; reasoning?: string }
}

export interface Plan {
  id: string
  title: string
  area: string
  councilId?: CouncilId
  systemType: PlanSystemType
  stages: PlanStage[]
  timetable: PlanTimetable
  visionStatements: VisionOutcome[]
  sites: SiteCandidate[]
  // Deprecated: use planStage
  currentStage?: PlanStageId
  // Primary workflow field
  planStage?: PlanStageId
  // Draft spatial strategy chapter
  strategyDraft?: { reportMarkdown?: string; warningsMarkdown?: string }
  // Consultation pack assembly
  consultationPack?: {
    sections?: Array<{ id: string; title: string; content?: string; include?: boolean; status?: 'draft' | 'edited' | 'reviewed' | 'locked'; questions?: string[] }>
    warningsMarkdown?: string
    summaryMarkdown?: string
    easyReadMarkdown?: string
    lastGeneratedAt?: string
    tone?: string
    readingLevel?: string
  }
  // User-picked preferred options from tools
  preferredOptions?: PlanPreferredOptions
  gateway1SummaryText?: string
  readinessAssessment?: ReadinessAssessment
  gateway1PublishedAt?: string
  // Evidence / baselining
  evidenceInventory?: EvidenceItem[]
  baselineTrends?: Record<string, string> // topic -> markdown summary
  swot?: { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] }
  baselineNarrative?: string
  // SMART outcomes (Vision & Outcomes stage)
  smartOutcomes?: SmartOutcome[]
  // Outcomes linkage
  outcomePolicyLinks?: Record<string, { policyIds?: string[]; siteIds?: string[] }>
  // Site decisions
  siteDecisions?: Array<{ siteId: string; decision: 'selected' | 'rejected'; rationale: string }>
  // Consultations
  consultationSummaries?: ConsultationSummary[]
  representationTags?: RepresentationTag[]
  // Gateway 2/3
  gateway2Checklist?: string
  gateway2Risks?: string
  gateway2Summary?: string
  requirementsCheck?: string
  statementCompliance?: string
  statementSoundness?: string
  examReadinessNote?: string
  // Preparation / notice
  prepNoticeText?: string
  prepRiskAssessment?: {
    areas: Array<{ id: string; rag: 'red' | 'amber' | 'green'; summary?: string; actions?: string[] }>
    overallStatus?: 'red' | 'amber' | 'green'
    overallComment?: string
    assessedAt?: string
  }
  // Submission / exam
  submissionBundle?: Array<{ id: string; title: string; status?: 'present' | 'missing' | 'outdated' }>
  examRehearsalNotes?: string
  // Adoption / monitoring
  adoptionChecklist?: string
  monitoringIndicators?: Array<{ id: string; name: string; baseline?: string; source?: string; target?: string }>
  annualMonitoringNarratives?: string[]
  year4Evaluation?: string
  // SEA / HRA baseline and scoping data
  seaHra?: {
    seaScopingStatus?: 'Not started' | 'Drafted' | 'Consulted'
    seaScopingNotes?: string
    hraBaselineSummary?: string
    baselineGrid?: {
      biodiversity?: string
      water?: string
      climate?: string
      landscape?: string
      heritage?: string
    }
    baselineCompleteness?: 'red' | 'amber' | 'green'
    readinessScore?: number
    readinessNotes?: string
    mitigationIdeas?: string[]
    cumulativeEffects?: string
    consultationStatus?: 'not_started' | 'live' | 'complete'
    consultationNotes?: string
    reportDraft?: string
    environmentalDatabase?: string[]
    keyRisks?: string[]
  }
  // Statement of community involvement / engagement capture
  sci?: {
    hasStrategy?: boolean
    keyStakeholders?: string[]
    methods?: string[]
    timelineNote?: string
  }
  // Expanded digital-first SCI
  sciFull?: {
    commitments?: string[]
    audiences?: Array<{ group: string; channels?: string[]; methods?: string[]; barriers?: string[] }>
    methods?: { digital?: string[]; inPerson?: string[] }
    planCycle?: {
      create?: { earlyEngagement?: string[]; drafting?: string[]; finalPlan?: string[] }
      examine?: string[]
      adopt?: string[]
      update?: { minor?: string[]; material?: string[]; continuous?: string[] }
    }
    developmentManagement?: { publicity?: string[]; commenting?: string[]; transparency?: string[] }
    dataStandards?: { data?: string[]; accessibility?: string[]; transparency?: string[] }
    review?: { frequency?: string; triggers?: string[]; consultation?: string }
    narrative?: string
  }
  // AI suggestions
  aiSuggestedStageId?: PlanStageId
  aiSuggestedStageReason?: string
}
