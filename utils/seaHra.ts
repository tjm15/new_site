import type { Plan } from '../data/types'

export type SeaHraSummary = {
  statusLine: string
  baseline: string
  hra: string
  consultation: string
  risks: string
  mitigation: string
  cumulative: string
  environmentalDatabase: string
}

export function summarizeSeaHra(plan?: Plan): SeaHraSummary {
  const sea = plan?.seaHra || {}
  const statusLine = [
    sea.seaScopingStatus ? `SEA scoping: ${sea.seaScopingStatus}` : null,
    sea.baselineCompleteness ? `Baseline: ${sea.baselineCompleteness.toUpperCase()}` : null,
    sea.readinessScore ? `Readiness: ${Math.round(sea.readinessScore)}%` : null,
  ].filter(Boolean).join(' • ') || 'SEA/HRA status not recorded'

  const baseline = buildBaseline(sea.baselineGrid)
  const hra = sea.hraBaselineSummary || 'HRA baseline not captured yet.'
  const consultation = sea.consultationStatus
    ? `Consultation: ${sea.consultationStatus.replace('_', ' ')}${sea.consultationNotes ? ` — ${sea.consultationNotes}` : ''}`
    : 'Consultation not logged.'
  const risks = (sea.keyRisks || []).length ? sea.keyRisks.join('; ') : 'No risks noted.'
  const mitigation = (sea.mitigationIdeas || []).length ? sea.mitigationIdeas.join('; ') : 'No mitigation captured.'
  const cumulative = sea.cumulativeEffects || 'Cumulative / in-combination effects not recorded.'
  const environmentalDatabase = (sea.environmentalDatabase || []).length
    ? sea.environmentalDatabase.join('; ')
    : 'No datasets listed.'

  return { statusLine, baseline, hra, consultation, risks, mitigation, cumulative, environmentalDatabase }
}

function buildBaseline(grid?: Record<string, string | undefined>): string {
  if (!grid) return 'Baseline grid not populated.'
  const entries = Object.entries(grid).filter(([, v]) => v && v.trim().length)
  if (!entries.length) return 'Baseline grid not populated.'
  return entries.map(([k, v]) => `${labelFor(k)}: ${v}`).join(' | ')
}

function labelFor(key: string) {
  switch (key) {
    case 'biodiversity': return 'Biodiversity'
    case 'water': return 'Water'
    case 'climate': return 'Climate'
    case 'landscape': return 'Landscape'
    case 'heritage': return 'Heritage'
    default: return key
  }
}
