import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function FoundationsPage() {
  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="bg-transparent text-[var(--color-ink)]"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20 pt-14">
        {/* Section 1 — Hero */}
        <section className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">About</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-[var(--color-ink)]">
            A shared environment for planning — built around evidence, place, and public reasoning.
          </h1>
          <p className="text-lg leading-relaxed text-[var(--color-muted)]">
            The Planner’s Assistant is a shared reasoning environment for spatial planning. It brings policies, evidence,
            spatial data, design cues, and professional judgement into one coherent workspace, so that plan-making,
            casework, and monitoring all draw from the same transparent and explainable engine. It strengthens
            professional judgement rather than replacing it, helping planners work faster, more clearly, and with greater
            confidence in the decisions they make.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/app"
              className="inline-flex items-center rounded-full bg-[#f5c315] px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-[#ffdc4a]"
            >
              Launch demo →
            </Link>
            <Link
              to="/architecture"
              className="text-sm font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline"
            >
              Explore the reasoning engine →
            </Link>
          </div>
        </section>

        {/* Section 2 — What it is / What it isn’t */}
        <section className="mt-14 space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--color-ink)]">What it is — and what it isn’t</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-[var(--color-panel)] p-6 shadow-sm ring-1 ring-[var(--color-edge)]">
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-accent)]">What it is</p>
              <ul className="mt-3 space-y-2 text-[var(--color-muted)]">
                {[
                  'A shared evidence model for planning',
                  'A reasoning engine designed around public judgement',
                  'A workspace for plan-making, casework, and monitoring',
                  'A system that explains itself, step by step',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-[var(--color-panel)] p-6 shadow-sm ring-1 ring-[var(--color-edge)]">
              <p className="text-sm font-semibold uppercase tracking-wide text-red-700">What it isn’t</p>
              <ul className="mt-3 space-y-2 text-[var(--color-muted)]">
                {[
                  'Not automation or officer replacement',
                  'Not a black-box scoring tool',
                  'Not a dashboard with AI sprinkled on top',
                  'Not a fixed template — it adapts to task and context',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--color-edge)]" aria-hidden="true" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 — Why planning needs this */}
        <section className="mt-14 space-y-3 max-w-3xl">
          <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Why planning needs a shared reasoning environment</h2>
          <p className="text-base leading-relaxed text-[var(--color-muted)]">
            Planning depends on reasoning — weighing evidence, interpreting policy, and understanding the character of
            place.
          </p>
          <p className="text-base leading-relaxed text-[var(--color-muted)]">
            But the systems that support this reasoning are fragmented. Evidence lives in separate databases, policies in
            unread PDFs, and professional judgement in documents that no one revisits.
          </p>
          <p className="text-base leading-relaxed text-[var(--color-muted)]">
            The result is a system where strategy, casework, and monitoring drift apart; where explanations are difficult
            to trace; and where intelligence accumulates in silos rather than strengthening the whole planning service.
          </p>
        </section>

        {/* Section 4 — How it addresses this */}
        <section className="mt-14 space-y-3 max-w-3xl">
          <h2 className="text-2xl font-semibold text-[var(--color-ink)]">How the Assistant changes this</h2>
          <p className="text-base leading-relaxed text-[var(--color-muted)]">
            The Planner’s Assistant rebuilds the planning environment around a single, shared engine.
          </p>
          <p className="text-base leading-relaxed text-[var(--color-muted)]">
            Policies, spatial data, consultation input, and site information can be queried, compared, tested, and
            explained in one place.
          </p>
          <p className="text-base leading-relaxed text-[var(--color-muted)]">
            This creates a continuous chain between:
          </p>
          <ul className="ml-2 space-y-1 text-[#4b5563]">
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              <span className="text-sm"><strong className="text-[var(--color-ink)]">spatial strategy</strong> (how places evolve),</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              <span className="text-sm"><strong className="text-[var(--color-ink)]">casework reasoning</strong> (how proposals are assessed),</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
              <span className="text-sm"><strong className="text-[var(--color-ink)]">and monitoring</strong> (how delivery is understood).</span>
            </li>
          </ul>
          <p className="text-base leading-relaxed text-[var(--color-muted)]">
            Instead of treating each part of the system as separate, the Assistant lets them learn from one another —
            making decisions faster, clearer, and more defensible.
          </p>
          <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-full bg-[var(--color-panel)] px-3 py-1 text-[0.75rem] font-semibold text-[var(--color-ink)] ring-1 ring-[var(--color-edge)]">
            Evidence → Context → Patterns → Options → Tests → Judgement → Explanation
          </div>
        </section>

        {/* Section 5 — Design philosophy */}
        <section className="mt-14 space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Design philosophy</h2>
          <p className="max-w-3xl text-base leading-relaxed text-[var(--color-muted)]">
            The Assistant is built on principles that reflect how planners actually work — and the values of public reasoning.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Transparency by default',
                body: 'Every source, policy reference, and reasoning step is recorded and explainable. Decisions can be revisited with full evidence trails.',
              },
              {
                title: 'Open and adaptable',
                body: 'Open-source, modular, and easy to integrate. It strengthens the planning ecosystem rather than fragmenting it.',
              },
              {
                title: 'Designed for real workloads',
                body: 'Centred on how planners read, map, draft, check, and review. Reduces friction and saves time in everyday practice.',
              },
              {
                title: 'Balancing speed with care',
                body: 'Automation is useful only when it deepens understanding. Outputs remain accountable: traceable, interrogable, and grounded in policy and place.',
              },
            ].map((pillar) => (
              <div key={pillar.title} className="rounded-2xl bg-[var(--color-panel)] p-5 shadow-sm ring-1 ring-[var(--color-edge)]">
                <h3 className="text-lg font-semibold text-[var(--color-ink)]">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{pillar.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6 — Closing CTA */}
        <section className="mt-14 rounded-2xl bg-[var(--color-panel)] p-6 shadow-sm ring-1 ring-[var(--color-edge)]">
          <p className="text-base leading-relaxed text-[var(--color-muted)]">
            The Planner’s Assistant is not a product. It is an emerging piece of civic infrastructure — designed to help
            planners, officers, and the public see planning decisions as part of a coherent whole.
          </p>
          <p className="mt-2 text-base leading-relaxed text-[var(--color-muted)]">
            Explore the demo or the reasoning architecture to see how the engine works in practice.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to="/app"
              className="inline-flex items-center rounded-full bg-[#f5c315] px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-[#ffdc4a]"
            >
              Launch demo →
            </Link>
            <Link to="/architecture" className="text-sm font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline">
              Explore reasoning architecture →
            </Link>
            <Link to="/research" className="text-sm font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline">
              Read the research agenda →
            </Link>
          </div>
        </section>
      </div>
    </motion.main>
  );
}
