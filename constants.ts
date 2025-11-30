
import type { PlanStageId } from './data/types'
import { STAGES } from './data/stageMeta'

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
export const NEW_SYSTEM_STAGES: { id: PlanStageId; title: string; band: 'get-ready' | 'plan-making'; timingNote?: string }[] =
  STAGES.map(({ id, label, band, timingNote }) => ({ id, title: label, band, timingNote }))
