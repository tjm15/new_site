
// Role-based theme tokens (easier to tune than brand colors directly)
export const theme = {
  surface: "#F7F8FB", // page background (very light neutral)
  panel:   "#FFFFFF", // cards & panels
  edge:    "#D9DCE8", // borders/dividers
  ink:     "#27324A", // headings (deep slate/navy)
  muted:   "#5B6475", // body text
  accent:  "#329c85", // soft teal for highlights/focus
  brand:   "#f5c315", // yellow reserved for tiny accents only
};

// New Local Plan stages for the 30-month system
export const NEW_SYSTEM_STAGES: { id: import('./data/types').PlanStageId; title: string }[] = [
  { id: 'PREP', title: 'Preparation (Notice Period)' },
  { id: 'GATEWAY_1', title: 'Gateway 1: Readiness' },
  { id: 'BASELINING', title: 'Baselining & Evidence' },
  { id: 'CONSULTATION_1', title: 'Consultation 1' },
  { id: 'GATEWAY_2', title: 'Gateway 2: Submission Ready' },
  { id: 'CONSULTATION_2', title: 'Consultation 2' },
  { id: 'GATEWAY_3', title: 'Gateway 3: Examination' },
  { id: 'SUBMISSION', title: 'Submission' },
  { id: 'ADOPTION', title: 'Adoption' }
]
