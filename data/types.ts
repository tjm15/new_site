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
