import type { Plan } from './types'
import { NEW_SYSTEM_STAGES } from '../constants'

const baseStages = NEW_SYSTEM_STAGES.map(s => ({ id: s.id, title: s.title }))

export const PLAN_SEEDS: Record<string, Plan> = {
  camden: {
    id: 'camden_seed_plan',
    title: 'Camden Local Plan (Demo)',
    area: 'London Borough of Camden',
    councilId: 'camden',
    systemType: 'new',
    stages: baseStages,
    timetable: { milestones: [{ stageId: 'GATEWAY_1', date: '2025-02-01' }] },
    planStage: 'PREP',
    visionStatements: [
      { id: 'v1', text: 'Deliver inclusive growth with net zero development.', metric: 'Annual emissions trajectory' },
      { id: 'v2', text: 'Prioritise affordable housing and active travel.' }
    ],
    sites: [
      { id: 'site_regis_road', name: 'Regis Road', suitability: 'A', availability: 'A', achievability: 'G', capacityEstimate: 1800 },
      { id: 'site_murphys_yard', name: "Murphy's Yard", suitability: 'G', availability: 'A', achievability: 'A', capacityEstimate: 1200 }
    ],
    evidenceInventory: [
      { id: 'ev1', topic: 'housing', title: 'Housing Needs Assessment', source: 'GLA model', status: 'in_progress' },
      { id: 'ev2', topic: 'transport', title: 'Transport Capacity Study', source: 'TfL/borough', status: 'planned' },
      { id: 'ev3', topic: 'environment', title: 'Flood Risk Assessment', source: 'EA datasets', status: 'complete' }
    ],
    baselineNarrative: 'Camden faces strong housing demand, affordability pressures, and ambitions for net zero. Growth is focused around Euston, Kings Cross, and town centre intensification, with constraints from heritage and flood risk.',
    swot: {
      strengths: ['Excellent rail connectivity (Euston/Kings Cross)', 'Diverse economy and knowledge quarter'],
      weaknesses: ['High land values and affordability gap'],
      opportunities: ['Station-led regeneration', 'Active travel network'],
      threats: ['Viability pressures', 'Flood risk along canals']
    },
    baselineTrends: {
      housing: 'High demand, rising rents, affordability challenges.',
      economy: 'Knowledge economy growth; strong creative sectors.',
      transport: 'High public transport mode share; scope for more cycling.',
      environment: 'Flood risk along waterways; air quality hotspots.'
    },
    readinessAssessment: {
      areas: [
        { id: 'timetable', rag: 'amber', summary: 'Draft timetable exists, dependencies need confirmation.' },
        { id: 'governance', rag: 'green', summary: 'Project board and decision route agreed.' },
        { id: 'engagement', rag: 'amber', summary: 'Stakeholder list drafted; SCI to be finalised.' },
        { id: 'evidence', rag: 'amber', summary: 'Core audits done; transport commission pending.' },
        { id: 'sea', rag: 'red', summary: 'SEA scoping not yet consulted.' }
      ],
      overallStatus: 'amber'
    }
  },
  cornwall: {
    id: 'cornwall_seed_plan',
    title: 'Cornwall Local Plan (Demo)',
    area: 'Cornwall',
    councilId: 'cornwall',
    systemType: 'new',
    stages: baseStages,
    timetable: { milestones: [{ stageId: 'GATEWAY_1', date: '2025-04-01' }] },
    planStage: 'PREP',
    visionStatements: [{ id: 'v1', text: 'Disperse growth sustainably with eco-communities and resilient towns.' }],
    sites: [],
    evidenceInventory: [
      { id: 'evc1', topic: 'housing', title: 'HNA update', status: 'planned' },
      { id: 'evc2', topic: 'environment', title: 'Coastal flood modelling', status: 'in_progress' }
    ],
    baselineNarrative: 'Cornwall balances dispersed growth, tourism, and coastal environmental constraints. Housing affordability and transport connectivity are key challenges.',
    swot: {},
    baselineTrends: {}
  },
  manchester: {
    id: 'manchester_seed_plan',
    title: 'Manchester Local Plan (Demo)',
    area: 'Manchester',
    councilId: 'manchester',
    systemType: 'new',
    stages: baseStages,
    timetable: { milestones: [{ stageId: 'GATEWAY_1', date: '2025-03-01' }] },
    planStage: 'PREP',
    visionStatements: [{ id: 'v1', text: 'High-growth, zero-carbon neighbourhoods with inclusive economy.' }],
    sites: [],
    evidenceInventory: [],
    baselineNarrative: 'Manchester drives regional growth with a focus on zero-carbon development and transport connectivity.',
    swot: {},
    baselineTrends: {}
  }
}
