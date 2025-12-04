import type { LucideIcon } from 'lucide-react';
import { Activity, FileSearch, Map } from 'lucide-react';

export type CapabilitySuite = {
  id: string;
  name: string;
  icon: LucideIcon;
  tagline: string;
  description: string; // <= 100 words
  highlights: string[]; // max 5, <= 120 chars each
  idealFor: string;
};

export const CAPABILITY_SUITES: CapabilitySuite[] = [
  {
    id: 'spatial-plan',
    name: 'Spatial Plan Intelligence',
    icon: Map,
    tagline: 'Evidence-led, option-rich plan-making for positive planning.',
    description:
      'Evidence-led, option-rich plan-making grounded in transparent reasoning. Enables planners to explore futures, compare growth patterns, surface constraints, and translate findings into clear, defensible policy language.',
    highlights: [
      'Query and visualise a shared evidence base.',
      'Surface spatial patterns, constraints, and opportunities.',
      'Compare alternative growth strategies.',
      'Draft and stress-test policy wording.',
      'Produce consistent, explainable spatial reasoning.',
    ],
    idealFor:
      'Local plan teams, strategic planners, and anyone working on growth strategies, site allocations, and policy drafting.',
  },
  {
    id: 'development-management',
    name: 'Development Management Intelligence',
    icon: FileSearch,
    tagline: 'Consistent, explainable reasoning for everyday casework.',
    description:
      'Structured, explainable support for everyday casework. Unifies drawings, statements, policy text, and precedent into a single workspace that generates consistent and transparent officer-style reasoning.',
    highlights: [
      'Organise all application material in one place.',
      'Highlight relevant policies and constraints.',
      'Turn dispersed considerations into structured reasoning.',
      'Generate officer-style reports with citations and options.',
      'Produce an auditable decision trail case-by-case.',
    ],
    idealFor:
      'Case officers, team leaders, and DM managers who need to balance speed, consistency, and explainability.',
  },
  {
    id: 'monitoring-delivery',
    name: 'Monitoring & Delivery Intelligence',
    icon: Activity,
    tagline: 'Closing the loop between plans, decisions, and real-world outcomes.',
    description:
      'Closing the loop between plans, decisions, and outcomes. Feeds real-world data back into strategy and policy so monitoring stays transparent, reproducible, and moves beyond static PDFs.',
    highlights: [
      'Define indicators tied to policies and sites.',
      'Visualise performance and risk through dashboards.',
      'Compare outcomes with plan intent.',
      'Support mid-plan evaluations with explainable analysis.',
      'Feed monitoring insights back into plan-making.',
    ],
    idealFor:
      'Policy teams, monitoring officers, research units, and partnerships working on delivery, evaluation, and plan review.',
  },
];
