import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Activity,
  Radar,
  Route,
  Scale,
  ClipboardCheck,
  FileText,
  FileBarChart,
  Map,
  AlertCircle,
  Layers,
  PenTool,
  TrendingUp,
  Search,
  ArrowRight,
  Zap,
  BookOpen,
} from 'lucide-react';

import { EngineDiagram } from '../components/EngineDiagram';
import { FlowStepper, FlowStepId } from '../components/FlowStepper';

type BranchId = 'spatial' | 'dm' | 'monitoring';

const ACCENT_MAP: Record<BranchId, string> = {
  spatial: '#329c85',
  dm: '#f5c315',
  monitoring: '#3b5bdb',
};

const BRANCHES = [
  { id: 'spatial', label: 'Spatial Strategy', description: 'Plan-making & Allocations' },
  { id: 'dm', label: 'Development Management', description: 'Casework & Decisions' },
  { id: 'monitoring', label: 'Monitoring & Delivery', description: 'Feedback Loops' },
];

const TOOLS_MAP: Record<
  BranchId,
  Record<
    FlowStepId,
    {
      title: string;
      description: string;
      icon: any;
      context: string;
      relatedCapabilities?: string[];
    }
  >
> = {
  spatial: {
    evidence: {
      title: 'Unified Baselining',
      description:
        'Planning evidence is often trapped in static PDF topic papers. The engine ingests live geospatial layers, census data, and housing needs assessments into a single, queryable baseline—allowing planners to spot constraints and opportunities instantly.',
      icon: Database,
      context: 'Powered by Evidence & Baselining Tool',
      relatedCapabilities: ['Geospatial Query', 'Demographic Trend Analysis', 'Constraint Stacking'],
    },
    context: {
      title: 'Risk & Readiness Triage',
      description:
        'Before a plan commences, the engine assesses the critical path: governance structures, resourcing levels, and political decision gates. It acts as a “Gateway 1” diagnostic to ensure the plan is deliverable before the 30-month clock starts.',
      icon: Activity,
      context: 'Powered by Prep Risk & Timetable Tool',
      relatedCapabilities: ['Governance Audit', 'Resource Modeling', 'Critical Path Analysis'],
    },
    patterns: {
      title: 'Visioning & Theme Extraction',
      description:
        'Visioning is often abstract. The engine grounds it in data by clustering thousands of consultation responses into dominant themes. It then generates visual concept models (densities, typologies) to test how the vision lands physically, allowing members to debate concrete “what-if” futures rather than abstract goals.',
      icon: Radar,
      context: 'Powered by Feedback Analysis & Vision Tool',
      relatedCapabilities: ['Sentiment Clustering', 'Typology Scanner', 'Concept Generation'],
    },
    options: {
      title: 'Strategic Modeling & Alternatives',
      description:
        'The core of the strategy. Instead of one static map, the engine models multiple growth scenarios (e.g., “Transport Hubs” vs “Dispersed Growth”). It quantifies the trade-offs of each option—measuring housing yield, infrastructure load, and green belt impact—forming the robust evidence trail needed for “Reasonable Alternatives”.',
      icon: Route,
      context: 'Powered by Strategy Modeler',
      relatedCapabilities: ['Scenario Builder', 'Capacity Tester', 'Infrastructure Loading'],
    },
    tests: {
      title: 'Continuous Sustainability',
      description:
        'Sustainability Appraisal (SA/SEA) often happens too late to shape design. The engine runs continuous environmental checks against emerging site allocations, flagging risks to biodiversity or air quality while the strategy is still fluid.',
      icon: Scale,
      context: 'Powered by SEA/HRA Tool',
      relatedCapabilities: ['SEA Scoring', 'HRA Screening', 'Carbon Impact Check'],
    },
    judgement: {
      title: 'Pre-Submission Inspection',
      description:
        'The “AI Inspector” simulates a PINS examination before submission. It stress-tests the draft plan against NPPF soundness tests, highlighting evidence gaps or policy conflicts that could cause the plan to fail.',
      icon: ClipboardCheck,
      context: 'Powered by Gateway 3 Inspector',
      relatedCapabilities: ['Soundness Test', 'Legal Compliance Check', 'Evidence Gap Detection'],
    },
    explanation: {
      title: 'Policy Drafting & Justification',
      description:
        'Drafting robust policy is time-consuming. The engine translates spatial decisions and evidence directly into NPPF-compliant policy wording, ensuring every clause is traceable back to the specific evidence that justifies it.',
      icon: FileText,
      context: 'Powered by Policy Drafter',
      relatedCapabilities: ['Clause Generation', 'Justification Trace', 'NPPF Alignment'],
    },
  },
  dm: {
    evidence: {
      title: 'Intake & Auto-Extraction',
      description:
        'Validation is a bottleneck. The engine reads incoming application documents (DAS, Transport Statements, Forms) and automatically extracts key metrics like unit mix, tenure split, and height, populating the case file instantly.',
      icon: FileBarChart,
      context: 'Powered by Application Intake',
      relatedCapabilities: ['PDF Parsing', 'Metric Extraction', 'Validation Check'],
    },
    context: {
      title: 'Context Analyzer',
      description:
        'Every site has a story. The engine instantly compiles a “site history” including prior refusals, appeal precedents, and active constraints (TPOs, flood zones), giving the case officer immediate situational awareness.',
      icon: Map,
      context: 'Powered by Context Analyzer',
    },
    patterns: {
      title: 'Material Consideration Triage',
      description:
        'The engine scans the proposal against local and national policy to identify the key material considerations. It flags high-risk conflicts early—such as heritage harm or flood risk—so specialist consultees can be engaged immediately.',
      icon: AlertCircle,
      context: 'Powered by Risk Triage',
    },
    options: {
      title: 'Negotiation Workspace',
      description:
        'As schemes are amended during the application process, the engine tracks changes against the original concerns. It helps officers verify if the requested amendments (e.g., “reduce height by 2m”) have actually been delivered.',
      icon: Layers,
      context: 'Powered by Negotiation Workspace',
    },
    tests: {
      title: 'Condition Drafter',
      description:
        'Weak conditions lead to enforcement issues. The engine suggests precise, enforceable conditions linked directly to the technical harms identified, ensuring mitigation is robust and lawful.',
      icon: PenTool,
      context: 'Powered by Condition Drafter',
    },
    judgement: {
      title: 'Planning Balance',
      description:
        'The core of the job. The engine provides a structured workspace for weighing public benefits against harms. It ensures the “Golden Thread” of reasoning is visible and that the recommendation is defensible at appeal.',
      icon: Scale,
      context: 'Powered by Planning Balance',
    },
    explanation: {
      title: 'Report Generation',
      description:
        'Writing the committee report takes days. The engine automates the drafting of standard sections (site description, policy framework) and structures the assessment argument, citing every piece of evidence used.',
      icon: FileText,
      context: 'Powered by Report Generator',
    },
  },
  monitoring: {
    evidence: {
      title: 'Live Data Connectors',
      description:
        'AMRs are often 18 months out of date. The engine connects directly to completions, appeals, and S106 systems to keep the evidence base live, creating a real-time feedback loop between “plan” and “reality”.',
      icon: Activity,
      context: 'Powered by Monitoring Connectors',
    },
    context: {
      title: 'Adoption Baseline',
      description:
        'To measure change, you need a fixed point. The engine locks the policies map and key metrics at the point of adoption, creating a secure baseline against which all future divergence is measured.',
      icon: Database,
      context: 'Powered by Adoption Tool',
    },
    patterns: {
      title: 'Trend Detection',
      description:
        'Is the plan working? The engine monitors divergence in key metrics—housing delivery, employment floorspace, appeal overturns—and flags trends that suggest a policy is failing or becoming obsolete.',
      icon: TrendingUp,
      context: 'Powered by Trend Analysis',
    },
    options: {
      title: 'Intervention Triggers',
      description:
        'Don’t wait for a failed plan review. The engine suggests specific interventions (e.g., “Trigger Action Plan”) when environmental or delivery thresholds are breached, allowing for agile plan maintenance.',
      icon: Route,
      context: 'Powered by Trigger Engine',
    },
    tests: {
      title: '5-Year Supply Check',
      description:
        'Housing supply is dynamic. The engine runs continuous automated testing of deliverable sites against the trajectory and NPPF buffers, providing an always-on “5 Year Land Supply” status.',
      icon: ClipboardCheck,
      context: 'Powered by Supply Checker',
    },
    judgement: {
      title: 'Year-4 Evaluation',
      description:
        'The formal review decision. Based on the accumulated data, should we Keep, Amend, or Delete policies? The engine structures this evaluation to seed the evidence base for the next Local Plan.',
      icon: Scale,
      context: 'Powered by Year-4 Evaluation Tool',
    },
    explanation: {
      title: 'AMR Automation',
      description:
        'The engine drafts the Annual Monitoring Report narrative automatically from the live data feeds, transforming a statutory burden into a useful strategic health-check.',
      icon: FileText,
      context: 'Powered by Monitoring Builder',
    },
  },
};

export function PillarsPage() {
  const [activeBranch, setActiveBranch] = useState<BranchId>('spatial');
  const [activeStep, setActiveStep] = useState<FlowStepId>('evidence');

  const activeAccent = ACCENT_MAP[activeBranch];
  const currentTool = TOOLS_MAP[activeBranch][activeStep];

  return (
    <main className="min-h-screen bg-transparent text-[var(--color-ink)] font-sans pb-20">
      <motion.section
        className="mx-auto w-full max-w-6xl px-6 pt-16 pb-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[var(--color-accent)] uppercase">System Capabilities</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-[var(--color-ink)] mb-6">
          Three intelligences.
          <br />
          One civic reasoning engine.
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]">
          The Planner&apos;s Assistant expresses a single reasoning spine in three ways: spatial strategy, casework, and monitoring.
          <span className="font-medium text-[var(--color-ink)]"> Interact with the model below</span> to understand the rationale behind each capability.
        </p>
      </motion.section>

      <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 pb-8">
        <div className="flex flex-col shadow-xl rounded-2xl">
          <div className="z-20 relative bg-[var(--color-panel)] rounded-t-2xl">
             <EngineDiagram activeBranch={activeBranch} onChange={setActiveBranch} accentMap={ACCENT_MAP} />
          </div>
          <div className="z-10 relative -mt-1">
            <div className="bg-[var(--color-panel)] rounded-b-2xl border border-t-0 border-[var(--color-edge)] p-1 pt-4 shadow-sm relative">
              <FlowStepper activeStep={activeStep} onStepChange={setActiveStep} accentColor={activeAccent} />
            </div>
          </div>

          <div className="bg-[var(--color-panel)]/80 p-8 rounded-b-2xl border-t border-[var(--color-edge)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeBranch}-${activeStep}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col md:flex-row gap-8 items-start"
              >
                <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: activeAccent }}>
                    {React.createElement(currentTool.icon, { size: 32, color: '#0b0f14' })}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">{activeStep} Phase</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--color-edge)]" />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: activeAccent }}>
                      {activeBranch === 'dm' ? 'Development Management' : activeBranch === 'spatial' ? 'Spatial Strategy' : 'Monitoring & Delivery'}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-[var(--color-ink)] mb-3">{currentTool.title}</h3>
                  <p className="text-lg text-[var(--color-muted)] leading-relaxed max-w-3xl">{currentTool.description}</p>

                  <div className="mt-6 pt-6 border-t border-[var(--color-edge)] flex items-center gap-2 text-sm font-medium text-[var(--color-muted)]">
                    <Search size={16} />
                    <span>Technology: {currentTool.context}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16 mt-12 border-t border-slate-200 pt-12">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Next Steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/app" className="group relative p-6 bg-[var(--color-panel)] rounded-xl border border-[var(--color-edge)] shadow-sm hover:shadow-md hover:border-[var(--color-accent)] transition-all">
            <div className="text-[var(--color-accent)] mb-3">
              <Activity size={24} />
            </div>
            <h4 className="font-bold text-[var(--color-ink)] mb-1 group-hover:text-[var(--color-accent)] transition-colors">Try the Demo</h4>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">Explore all three intelligences in the live sandbox.</p>
          </Link>

          <Link to="/architecture" className="group relative p-6 bg-[var(--color-panel)] rounded-xl border border-[var(--color-edge)] shadow-sm hover:shadow-md hover:border-[#f5c315] transition-all">
            <div className="text-[#f5c315] mb-3">
              <Layers size={24} />
            </div>
            <h4 className="font-bold text-[var(--color-ink)] mb-1 group-hover:text-[#f5c315] transition-colors">The Architecture</h4>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">Deep dive into the reasoning engine&apos;s technical design.</p>
          </Link>

          <Link to="/foundations" className="group relative p-6 bg-[var(--color-panel)] rounded-xl border border-[var(--color-edge)] shadow-sm hover:shadow-md hover:border-[#3b5bdb] transition-all">
            <div className="text-[#3b5bdb] mb-3">
              <BookOpen size={24} />
            </div>
            <h4 className="font-bold text-[var(--color-ink)] mb-1 group-hover:text-[#3b5bdb] transition-colors">Research Agenda</h4>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">Read the foundational papers behind the system.</p>
          </Link>

          <Link to="/involved" className="group relative p-6 bg-slate-900 rounded-xl border border-slate-900 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
            <div className="text-white mb-3">
              <ArrowRight size={24} />
            </div>
            <h4 className="font-bold text-white mb-1">Join the Mission</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Partner with us to pilot the system.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
