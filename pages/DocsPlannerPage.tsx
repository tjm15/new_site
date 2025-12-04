import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export function DocsPlannerPage() {
  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="bg-[#f5f6fb] text-slate-900"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20 pt-14 space-y-12">
        {/* Hero */}
        <section className="space-y-4 max-w-4xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#329c85] uppercase">Documentation · Planner’s guide</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-[#1b1f23]">
            How to use the Planner’s Assistant safely and effectively.
          </h1>
          <p className="text-lg leading-relaxed text-[#4b5563]">
            This guide explains what the Assistant can and cannot do today, how it reasons about policy and material considerations,
            and how to question its outputs. It is written for planners, plan-making teams, and officers who want decision support
            that stays transparent and accountable.
          </p>
        </section>

        {/* What it is for */}
        <section className="space-y-3 max-w-4xl">
          <h2 className="text-2xl font-semibold text-[#1b1f23]">What it is for</h2>
          <ul className="space-y-2 text-sm text-[#4b5563]">
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
              <span>Supporting plan-making, development management, and monitoring with a single shared evidence model.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
              <span>Explaining every recommendation with citations and traceable reasoning — not replacing professional judgement.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
              <span>Keeping strategy, casework, and monitoring in dialogue so insights carry across the planning system.</span>
            </li>
          </ul>
        </section>

        {/* How it thinks */}
        <section className="space-y-3 max-w-4xl">
          <h2 className="text-2xl font-semibold text-[#1b1f23]">How it thinks</h2>
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white px-3 py-2 text-[0.8rem] font-semibold text-[#2a3a60] ring-1 ring-slate-200">
            Evidence → Context → Patterns → Options → Tests → Judgement → Explanation
          </div>
          <p className="text-sm text-[#4b5563]">
            Each step leaves a trace. Evidence comes from policies, spatial layers, consultation input, and documents. Constraints are
            synthesised, options are compared, tests are applied, and the reasoning is written out so you can challenge or edit it.
          </p>
        </section>

        {/* What to expect today */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[#1b1f23]">What you can expect today</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <CapabilityCard
              title="Spatial strategy"
              bullets={[
                'Explains constraint/opportunity profiles for sites and options.',
                'Drafts policy wording with citations to evidence.',
                'Surfaces “reasonable alternatives” with comparative notes.',
              ]}
            />
            <CapabilityCard
              title="Development management"
              bullets={[
                'Frames material considerations with policy and spatial context.',
                'Suggests conditions and flags residual harms.',
                'Drafts officer-style narratives you can edit and own.',
              ]}
            />
            <CapabilityCard
              title="Monitoring & delivery"
              bullets={[
                'Tracks divergence between plan intent and delivery.',
                'Generates monitoring notes grounded in live evidence.',
                'Highlights where strategy and casework should respond.',
              ]}
            />
          </div>
        </section>

        {/* What it is not */}
        <section className="space-y-3 max-w-4xl">
          <h2 className="text-2xl font-semibold text-[#1b1f23]">What it isn’t</h2>
          <ul className="space-y-2 text-sm text-[#4b5563]">
            {[
              'Not a decision-maker or officer replacement.',
              'Not a black-box score; every output should be inspectable.',
              'Not a fixed template — it adapts to the task and evidence available.',
              'Not immune to gaps: if evidence is missing or unclear, it should be challenged.',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#cbd5e1]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Using outputs safely */}
        <section className="space-y-3 max-w-4xl">
          <h2 className="text-2xl font-semibold text-[#1b1f23]">How to use outputs safely</h2>
          <ul className="space-y-2 text-sm text-[#4b5563]">
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
              <span>Check the citations: each paragraph should link back to policy atoms, spatial layers, or documents.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
              <span>Use map and constraint views to confirm what the model considered relevant.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
              <span>Edit narratives: your edits stay recorded, and overrides are part of the audit trail.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
              <span>If something looks wrong, flag it: missing evidence, misread policy, or an unreasonable test.</span>
            </li>
          </ul>
        </section>

        {/* Quick start */}
        <section className="space-y-3 max-w-4xl">
          <h2 className="text-2xl font-semibold text-[#1b1f23]">Quick start</h2>
          <ol className="space-y-2 text-sm text-[#4b5563] list-decimal list-inside">
            <li>Open the demo and choose a mode: Spatial, Casework, or Monitoring.</li>
            <li>Pick a sample site or case; inspect the evidence and constraints it loads.</li>
            <li>Step through the reasoning chain; read the explanation and citations.</li>
            <li>Edit the draft outputs; note where the model helped or fell short.</li>
            <li>Save or export traces if you need to review with colleagues.</li>
          </ol>
          <Link
            to="/app"
            className="inline-flex items-center rounded-full bg-[#f5c315] px-4 py-2 text-sm font-semibold text-[#2a3a60] shadow-sm transition hover:bg-[#ffdc4a]"
          >
            Open the demo →
          </Link>
        </section>

        {/* Final note */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-3 max-w-4xl">
          <p className="text-base leading-relaxed text-[#4b5563]">
            The Assistant is a support system. It should make planning work faster, clearer, and more defensible — never less
            accountable. If you have concerns or want to trial it on real cases, we’d like to hear from you.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:hello@theplannersassistant.uk?subject=Planner%27s%20guide%20feedback"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#329c85] shadow-sm ring-1 ring-[#329c85]/30 hover:bg-[#f0fdf4]"
            >
              Send feedback →
            </a>
            <Link
              to="/involved"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1b1f23] shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Partner with us →
            </Link>
          </div>
        </section>
      </div>
    </motion.main>
  );
}

type CapabilityCardProps = {
  title: string;
  bullets: string[];
};

function CapabilityCard({ title, bullets }: CapabilityCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 h-full">
      <h3 className="text-lg font-semibold text-[#1b1f23] mb-3">{title}</h3>
      <ul className="space-y-2 text-sm text-[#4b5563]">
        {bullets.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
