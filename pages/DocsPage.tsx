import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CONCEPTS = [
  { title: 'Shared Evidence Base', body: 'How spatial, textual, and precedent data are stored and linked.' },
  { title: 'Constraint Synthesiser', body: 'How evidence becomes structured signals.' },
  { title: 'Reasoning Engine', body: 'How policies and considerations are weighed and combined.' },
  { title: 'Judgement Traces', body: 'How the engine explains itself.' },
  { title: 'Spatial Tools', body: 'Maps, constraints, design codes, and visual checks.' },
  { title: 'Monitoring & Delivery', body: 'How outcomes feed back into planning.' },
];

export function DocsPage() {
  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="bg-transparent text-[var(--color-ink)]"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20 pt-14 space-y-12">
        {/* Hero */}
        <section className="space-y-4 max-w-4xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#329c85] uppercase">Documentation</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-[#1b1f23]">
            The lab notebook for the Planner’s Assistant.
          </h1>
          <p className="text-lg leading-relaxed text-[#4b5563]">
            This is the reference for how the Assistant is structured, how its reasoning works, and how to run or extend it. It is
            written for planners, engineers, and researchers who want to look under the hood.
          </p>
        </section>

        {/* Three ways in */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[#1b1f23]">Three ways in</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <DocCard
              title="Planner’s guide"
              lead="For planners and public servants"
              body={[
                'What “intelligence” means in each mode.',
                'How evidence, constraints, and judgement traces are linked.',
                'Reading, challenging, and editing AI-generated reports.',
              ]}
              cta="Open the planner’s guide →"
              href="/docs/planner"
            />
            <DocCard
              title="System architecture & APIs"
              lead="For engineers and implementers"
              body={[
                'Storage, retrieval, reasoning pipelines, and integration points.',
                'Database schema and evidence model; constraint synthesiser; orchestration; report generation.',
                'REST API and local demo configuration.',
              ]}
              cta="Explore the architecture docs →"
              href="/architecture"
            />
            <DocCard
              title="Reasoning model & research agenda"
              lead="For researchers and theorists"
              body={[
                'How the system encodes planning judgement and “reasonableness”.',
                'Material considerations as reasoning units; digital discretion and envelopes of reasonableness.',
                'Dashboard Diffusion and performative explainability; open research questions.',
              ]}
              cta="Read the reasoning and research docs →"
              href="/research"
            />
          </div>
        </section>

        {/* Concept map */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#1b1f23]">Concept map</h2>
              <p className="text-sm text-[#4b5563]">A lightweight index of the main ideas and components.</p>
            </div>
            <Link to="/architecture" className="text-sm font-semibold text-[#329c85] underline-offset-2 hover:underline">
              Browse all concepts →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {CONCEPTS.map((concept) => (
              <div key={concept.title} className="rounded-2xl bg-[var(--color-panel)] p-4 shadow-sm ring-1 ring-[var(--color-edge)]">
                <h3 className="text-base font-semibold text-[#1b1f23]">{concept.title}</h3>
                <p className="mt-1 text-sm text-[#4b5563]">{concept.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Running the system */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[#1b1f23]">Running the system</h2>
          <p className="text-base leading-relaxed text-[#4b5563] max-w-3xl">
            Short, practical orientation for people who want to try the Assistant.
          </p>
          <ul className="space-y-2 text-sm text-[#4b5563]">
            {[
              'Requirements and local setup.',
              'Seeding the database with example plans and cases.',
              'Using the demo interface.',
              'Known limitations and current safeguards.',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link to="/app" className="inline-flex items-center text-sm font-semibold text-[#329c85] underline-offset-2 hover:underline">
            Open the setup guide →
          </Link>
        </section>

        {/* Open by design */}
        <section className="space-y-3 max-w-4xl">
          <h2 className="text-2xl font-semibold text-[#1b1f23]">Open by design</h2>
          <p className="text-base leading-relaxed text-[#4b5563]">
            The documentation is part of the governance surface of the project. It is intended to make the system legible to anyone
            affected by planning decisions, not just technologists.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/the-planners-assistant"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-[var(--color-panel)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] shadow-sm ring-1 ring-[var(--color-edge)] hover:bg-[var(--color-surface)]"
            >
              Visit the GitHub repository →
            </a>
            <Link
              to="/architecture"
              className="inline-flex items-center rounded-full bg-[var(--color-panel)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] shadow-sm ring-1 ring-[var(--color-accent)]/30 hover:bg-[var(--color-surface)]"
            >
              Explore the architecture docs →
            </Link>
            <Link
              to="/research"
              className="inline-flex items-center rounded-full bg-[var(--color-panel)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] shadow-sm ring-1 ring-[var(--color-accent)]/30 hover:bg-[var(--color-surface)]"
            >
              Track changes and releases →
            </Link>
          </div>
        </section>
      </div>
    </motion.main>
  );
}

type DocCardProps = {
  title: string;
  lead: string;
  body: string[];
  cta: string;
  href: string;
};

function DocCard({ title, lead, body, cta, href }: DocCardProps) {
  return (
    <div className="rounded-2xl bg-[var(--color-panel)] p-6 shadow-sm ring-1 ring-[var(--color-edge)] h-full flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">{lead}</p>
        <h3 className="mt-1 text-lg font-semibold text-[#1b1f23]">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm text-[#4b5563] flex-1">
        {body.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Link to={href} className="text-sm font-semibold text-[#329c85] underline-offset-2 hover:underline">
        {cta}
      </Link>
    </div>
  );
}
