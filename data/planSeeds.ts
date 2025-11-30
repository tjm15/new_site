import type { Plan } from './types'
import { NEW_SYSTEM_STAGES } from '../constants'

const baseStages = NEW_SYSTEM_STAGES.map(s => ({ id: s.id, title: s.title, band: s.band }))

export const PLAN_SEEDS: Record<string, Plan> = {
  camden: {
    id: 'camden_seed_plan',
    title: 'Camden Local Plan (Demo)',
    area: 'London Borough of Camden',
    councilId: 'camden',
    systemType: 'new',
    stages: baseStages,
    timetable: { milestones: [{ stageId: 'GATEWAY_1', date: '2025-02-01' }] },
    planStage: 'TIMETABLE',
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
    },
    seaHra: {
      seaScopingStatus: 'Drafted',
      seaScopingNotes: 'Draft scoping matrix prepared; statutory bodies to be engaged in the next 4 weeks.',
      hraBaselineSummary: 'European sites screened: Hampstead Heath ponds (downstream air/water pathways), Regent’s Canal corridor. No direct land-take but in-combination AQ impacts possible.',
      baselineGrid: {
        biodiversity: 'SAC/SINC clusters around Hampstead Heath; urban greening deficit in south-central wards.',
        water: 'Flood Zone 2/3 along Regent’s Canal; surface water hotspots near Euston.',
        climate: 'High urban heat island; borough-wide net zero target by 2030.',
        landscape: 'Conservation areas across Bloomsbury/Holborn; townscape sensitivity near listed terraces.',
        heritage: 'Dense heritage assets; setting impacts for major allocations near stations.'
      },
      baselineCompleteness: 'amber',
      consultationStatus: 'not_started',
      mitigationIdeas: [
        'Require whole-life carbon assessments for major schemes.',
        'Urban greening factor and SuDS retrofit around canal corridor.',
        'Travel demand management for station-led growth.'
      ],
      keyRisks: [
        'Air quality exceedances near AQMAs and stations.',
        'Townscape/heritage harm from tall buildings if unmanaged.',
        'Surface water flood risk around Euston growth area.'
      ],
      cumulativeEffects: 'Euston/KX intensification plus HS2 works could stack transport/air quality pressures; in-combination with adjacent borough plans.',
      environmentalDatabase: ['MAGIC constraints layers', 'EA flood zones + Risk of Flooding from Surface Water', 'ONS emissions/air quality', 'GLA UHI mapping', 'Local heritage/conservation polygons'],
      readinessScore: 52,
      readinessNotes: 'Baseline grid mostly filled; scoping consultation outstanding.',
      reportDraft: ''
    },
    consultationSummaries: [
      { stageId: 'SCOPING', who: 'Residents drop-in (n=38)', when: 'Jan 2024', how: 'Town hall + online form', mainIssues: ['Height fears near stations', 'Support for car-free if bins/servicing are clear', 'Ask for youth space'] },
      { stageId: 'CONSULTATION_1', who: 'Statutory bodies', when: 'Mar 2024', how: 'Portal submissions', mainIssues: ['SEA scoping misses cumulative rail impacts', 'Viability of 50% affordable questioned', 'Heritage massing sensitivity not shown'], intendedChanges: 'Add cumulative rail/SEA note, publish massing testing, include viability appendix headline.' },
      { stageId: 'CONSULTATION_1', who: 'Anonymous online form', when: 'Mar 2024', how: 'Free text box', mainIssues: ['“Too tall, too late, but also please build quickly”', 'Mentions pigeons + bins repeatedly', 'Contradictory: wants housing but no lights at night'], intendedChanges: 'Flag as incoherent; extract any actionable item (lighting/bins) separately.' }
    ]
  },
  cornwall: {
    id: 'cornwall_seed_plan',
    title: 'Cornwall Local Plan (Demo)',
    area: 'Cornwall',
    councilId: 'cornwall',
    systemType: 'new',
    stages: baseStages,
    timetable: { milestones: [{ stageId: 'GATEWAY_1', date: '2025-04-01' }] },
    planStage: 'TIMETABLE',
    visionStatements: [{ id: 'v1', text: 'Disperse growth sustainably with eco-communities and resilient towns.' }],
    sites: [],
    evidenceInventory: [
      { id: 'evc1', topic: 'housing', title: 'HNA update', status: 'planned' },
      { id: 'evc2', topic: 'environment', title: 'Coastal flood modelling', status: 'in_progress' }
    ],
    baselineNarrative: 'Cornwall balances dispersed growth, tourism, and coastal environmental constraints. Housing affordability and transport connectivity are key challenges.',
    swot: {},
    baselineTrends: {},
    seaHra: {
      seaScopingStatus: 'Drafted',
      seaScopingNotes: 'Draft SEA scope focuses on coastal squeeze, water quality, tourism impacts; pending Natural England feedback.',
      hraBaselineSummary: 'European sites: Fal & Helford SAC, Plymouth Sound & Estuaries SAC/SPA, Penhale Dunes SAC, Bodmin Moor. Recreational pressure and water quality pathways identified.',
      baselineGrid: {
        biodiversity: 'Extensive SAC/SPA along coasts; BNG opportunities via habitat creation inland.',
        water: 'Phosphate/nitrate pressures in river catchments; coastal flood and coastal squeeze along north coast.',
        climate: 'Coastal storm resilience and overheating risk in towns; net zero ambition with dispersed settlement pattern.',
        landscape: 'AONB coverage along coasts; valued landscapes inland around moors.',
        heritage: 'World Heritage Mining landscapes; conservation areas in key towns.'
      },
      baselineCompleteness: 'amber',
      consultationStatus: 'live',
      consultationNotes: 'Early scoping dialogue underway with EA and Natural England.',
      mitigationIdeas: [
        'Phosphate mitigation for growth in sensitive catchments.',
        'Coastal change management areas with roll-back policies.',
        'Active travel + bus priority to cut coastal town congestion.'
      ],
      keyRisks: [
        'In-combination recreational pressure on dunes and coastal SACs.',
        'Water quality deterioration without mitigation funding.',
        'Coastal squeeze where defences are held or improved.'
      ],
      cumulativeEffects: 'Tourism peaks + housing growth near estuaries could combine on water quality; multiple coastal settlements expanding simultaneously.',
      environmentalDatabase: ['MAGIC coastal designations', 'EA coastal erosion and flood mapping', 'Catchment phosphate models', 'AONB/WHL boundaries', 'OS MasterMap coast/shoreline'],
      readinessScore: 58,
      readinessNotes: 'Baseline strong; need formal scoping consultation write-up.',
      reportDraft: ''
    },
    consultationSummaries: [
      { stageId: 'SCOPING', who: 'Parish hall session (n=22)', when: 'Feb 2024', how: 'In-person workshop', mainIssues: ['Fear of “village becoming town”', 'Ask for safe crossings and play space', 'Mixed feelings about tourism vs housing'], intendedChanges: 'Design play + crossing in concept; add calm construction commitments.' },
      { stageId: 'CONSULTATION_1', who: 'Statutory consultees', when: 'Apr 2024', how: 'Email/portal', mainIssues: ['SANG boundary clarity', 'Bus frequency funding detail weak', 'Dark skies compliance for lighting'], intendedChanges: 'Update plans with SANG phasing, bus S106 schedule, dark sky lighting spec.' },
      { stageId: 'CONSULTATION_1', who: 'Postcard drop (illegible)', when: 'Apr 2024', how: 'Paper card', mainIssues: ['Bats? Buses? “City people” complaint', 'Concern about cows losing field', 'Contradictory: wants jobs but no traffic'], intendedChanges: 'Log as incoherent; highlight bats/traffic/cows as possible signals.' }
    ]
  },
  manchester: {
    id: 'manchester_seed_plan',
    title: 'Manchester Local Plan (Demo)',
    area: 'Manchester',
    councilId: 'manchester',
    systemType: 'new',
    stages: baseStages,
    timetable: { milestones: [{ stageId: 'GATEWAY_1', date: '2025-03-01' }] },
    planStage: 'TIMETABLE',
    visionStatements: [{ id: 'v1', text: 'High-growth, zero-carbon neighbourhoods with inclusive economy.' }],
    sites: [],
    evidenceInventory: [],
    baselineNarrative: 'Manchester drives regional growth with a focus on zero-carbon development and transport connectivity.',
    swot: {},
    baselineTrends: {},
    seaHra: {
      seaScopingStatus: 'Not started',
      seaScopingNotes: 'Needs rapid scoping of air quality and flood interactions with growth corridors; align with GMCA evidence.',
      hraBaselineSummary: 'European sites largely outside city; in-combination air quality pathways to Manchester Mosses SAC via traffic growth.',
      baselineGrid: {
        biodiversity: 'River valleys and nature recovery network links; limited designated sites in-city.',
        water: 'Surface water flood pockets; fluvial risk along Irk/Medlock/Irwell.',
        climate: 'Net zero 2038 target; UHI and overheating risk in dense centres.',
        landscape: 'Tall building zones vs heritage townscape in central areas.',
        heritage: 'Conservation areas and listed mills; canals as heritage/green corridors.'
      },
      baselineCompleteness: 'red',
      consultationStatus: 'not_started',
      mitigationIdeas: ['AQ mitigation via mode shift and EV infra', 'Green/blue corridors through growth areas', 'Surface water SuDS standards for major schemes'],
      keyRisks: ['Air quality in-combination effects on Manchester Mosses SAC', 'Surface water flood risk in regeneration zones', 'Townscape/heritage impacts from tall buildings'],
      cumulativeEffects: 'Growth corridors plus city centre towers may stack AQ and drainage pressures; coordinate with GM spatial framework evidence.',
      environmentalDatabase: ['GMCA evidence base links', 'EA flood risk and RoFSW', 'AQMA/air quality modelling', 'Heritage and tall-building zones', 'Nature recovery network layers'],
      readinessScore: 30,
      readinessNotes: 'Baseline grid partially filled; start scoping consultation and SEA checklist.',
      reportDraft: ''
    },
    consultationSummaries: [
      { stageId: 'SCOPING', who: 'Design review + residents (n=30)', when: 'Jan 2024', how: 'Hybrid workshop', mainIssues: ['Wind/cold canyon fears', 'Desire for youth/creative space at ground floor', 'Car-free welcomed if deliveries managed'], intendedChanges: 'Test wind mitigation, commit to youth/creative ground floor use, publish servicing plan.' },
      { stageId: 'CONSULTATION_1', who: 'Civic groups + TfGM', when: 'Mar 2024', how: 'Portal + roundtable', mainIssues: ['Question 22-storey height vs heritage context', 'Cycle parking ratios liked but detail missing', 'Ask for Bee Network contributions to be ring-fenced'], intendedChanges: 'Add heritage massing rationale, show cycle layouts, specify Bee Network spend locations.' },
      { stageId: 'CONSULTATION_1', who: 'Anonymous stream', when: 'Mar 2024', how: 'Online box', mainIssues: ['Mentions “microbrewery smell ok, but no more vents”', 'Says dogs need space and bins already overflow', 'Random note about wind + drones'], intendedChanges: 'Surface as noisy/contradictory feedback; extract dog space/bins as potential actions.' }
    ]
  }
}
