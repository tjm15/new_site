import type { CouncilData } from './types';
import { PLAN_CONTEXT as CAMDEN_PLAN, TOPICS as CAMDEN_TOPICS, POLICIES as CAMDEN_POLICIES } from './camdenPlanData';
import { BOROUGH_OUTLINE as CAMDEN_OUTLINE, CENTRES as CAMDEN_CENTRES, CONSTRAINTS as CAMDEN_CONSTRAINTS, ALLOCATIONS as CAMDEN_ALLOCATIONS, STRATEGIES as CAMDEN_STRATEGIES } from './camdenSpatialMock';
import { CAMDEN_APPLICATIONS } from './camdenApplications';

import { PLAN_CONTEXT as CORNWALL_PLAN, TOPICS as CORNWALL_TOPICS, POLICIES as CORNWALL_POLICIES } from './cornwallPlanData';
import { BOROUGH_OUTLINE as CORNWALL_OUTLINE, CENTRES as CORNWALL_CENTRES, CONSTRAINTS as CORNWALL_CONSTRAINTS, ALLOCATIONS as CORNWALL_ALLOCATIONS, STRATEGIES as CORNWALL_STRATEGIES } from './cornwallSpatialMock';
import { CORNWALL_APPLICATIONS } from './cornwallApplications';

import { PLAN_CONTEXT as MANCHESTER_PLAN, TOPICS as MANCHESTER_TOPICS, POLICIES as MANCHESTER_POLICIES } from './manchesterPlanData';
import { BOROUGH_OUTLINE as MANCHESTER_OUTLINE, CENTRES as MANCHESTER_CENTRES, CONSTRAINTS as MANCHESTER_CONSTRAINTS, ALLOCATIONS as MANCHESTER_ALLOCATIONS, STRATEGIES as MANCHESTER_STRATEGIES } from './manchesterSpatialMock';
import { MANCHESTER_APPLICATIONS } from './manchesterApplications';

const councils: Record<string, CouncilData> = {
  camden: {
    id: 'camden',
    name: 'Camden',
    description: 'London Borough - Urban intensification focusing on Euston, King\'s Cross & Kentish Town',
    planContext: CAMDEN_PLAN,
    topics: CAMDEN_TOPICS,
    policies: CAMDEN_POLICIES,
    spatialData: {
      boroughOutline: CAMDEN_OUTLINE,
      centres: CAMDEN_CENTRES,
      constraints: CAMDEN_CONSTRAINTS,
      allocations: CAMDEN_ALLOCATIONS,
      strategies: CAMDEN_STRATEGIES
    },
    strategies: CAMDEN_STRATEGIES,
    applications: CAMDEN_APPLICATIONS
  },
  cornwall: {
    id: 'cornwall',
    name: 'Cornwall',
    description: 'Unitary Authority - Dispersed growth across 52,500 homes with eco-communities',
    planContext: CORNWALL_PLAN,
    topics: CORNWALL_TOPICS,
    policies: CORNWALL_POLICIES,
    spatialData: {
      boroughOutline: CORNWALL_OUTLINE,
      centres: CORNWALL_CENTRES,
      constraints: CORNWALL_CONSTRAINTS,
      allocations: CORNWALL_ALLOCATIONS,
      strategies: CORNWALL_STRATEGIES
    },
    strategies: CORNWALL_STRATEGIES,
    applications: CORNWALL_APPLICATIONS
  },
  manchester: {
    id: 'manchester',
    name: 'Manchester',
    description: 'Metropolitan District - Core Growth Area driving 60,000+ homes & global connectivity',
    planContext: MANCHESTER_PLAN,
    topics: MANCHESTER_TOPICS,
    policies: MANCHESTER_POLICIES,
    spatialData: {
      boroughOutline: MANCHESTER_OUTLINE,
      centres: MANCHESTER_CENTRES,
      constraints: MANCHESTER_CONSTRAINTS,
      allocations: MANCHESTER_ALLOCATIONS,
      strategies: MANCHESTER_STRATEGIES
    },
    strategies: MANCHESTER_STRATEGIES,
    applications: MANCHESTER_APPLICATIONS
  }
};

export function getCouncilData(councilId: string): CouncilData | null {
  return councils[councilId] || null;
}

export function getAllCouncils(): CouncilData[] {
  return Object.values(councils);
}

export { councils };
