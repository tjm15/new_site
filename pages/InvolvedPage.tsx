import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

type Track = {
  title: string;
  subtitle: string;
  body: string[];
  cta: { label: string; href: string };
};

const TRACKS: Track[] = [
  {
    title: 'Co-architect the engine',
    subtitle: 'For systems thinkers, AI engineers, and civic technologists.',
    body: [
      'Design the reasoning architecture, retrieval stack, spatial tools, and explainability layers.',
      'Work on the deep structure of how a civic AI assistant should think, not just features on top.',
      'Focus areas: reasoning pipelines and judgement traces; spatial + textual retrieval; Dashboard Diffusion and interactive explainability; performance and deployment patterns.',
    ],
    cta: { label: 'Express interest as a co-architect →', href: 'mailto:hello@theplannersassistant.uk?subject=Co-architect%20the%20engine' },
  },
  {
    title: 'Ground it in real planning',
    subtitle: 'For planners, plan-makers, DM officers, and local government teams.',
    body: [
      'Trial the Assistant on real or synthetic cases to see where it helps and where it fails.',
      'Focus areas: plan-making workflows, site allocations, DM casework, monitoring and evaluation, and what explainability needs to show.',
    ],
    cta: { label: 'Discuss a council or planning partnership →', href: 'mailto:hello@theplannersassistant.uk?subject=Planning%20partnership' },
  },
  {
    title: 'Research and theory',
    subtitle: 'For academics and students working on planning, AI, governance, or urban systems.',
    body: [
      'Use the system as a live case study or experimental testbed.',
      'Focus areas: digital discretion and explainable judgement; AI for institutional capacity; spatial reasoning and design codes; evaluation, bias, and governance questions.',
    ],
    cta: { label: 'Explore research collaboration →', href: 'mailto:hello@theplannersassistant.uk?subject=Research%20collaboration' },
  },
  {
    title: 'Critical testing and governance',
    subtitle: 'For people who care about safety, accountability, and ethics.',
    body: [
      'Stress-test assumptions, probe limits of explainability, and help design safeguards that work in the public sector.',
      'Focus areas: failure modes and bias; where “reasonable” becomes political; guardrails and governance structures; public notes on risks and limitations.',
    ],
    cta: { label: 'Offer to act as a critical friend →', href: 'mailto:hello@theplannersassistant.uk?subject=Critical%20friend' },
  },
];

export function InvolvedPage() {
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
          <p className="text-xs font-semibold tracking-[0.2em] text-[#329c85] uppercase">Get involved</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-[#1b1f23]">
            Join the experiment in state-capacity AI.
          </h1>
          <p className="text-lg leading-relaxed text-[#4b5563]">
            The Planner’s Assistant is an open, long-term attempt to build explainable AI for planning and public decision-making.
            It is not a startup or a finished product. It is a research engine that needs planners, engineers, and institutions
            willing to explore what this could become.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              to="/app"
              className="inline-flex items-center rounded-full bg-[#f5c315] px-4 py-2 text-sm font-semibold text-[#2a3a60] shadow-sm transition hover:bg-[#ffdc4a]"
            >
              I’m a planner / public body →
            </Link>
            <Link
              to="/research"
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#329c85] shadow-sm ring-1 ring-[#329c85]/30 hover:bg-[#f0fdf4]"
            >
              I’m a researcher / engineer →
            </Link>
          </div>
        </section>

        {/* Participation modes */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-[#1b1f23]">Participation modes</h2>
            <p className="text-[#4b5563]">Four tracks, depending on where you can add the most value.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {TRACKS.map((track) => (
              <div key={track.title} className="h-full rounded-2xl bg-[var(--color-panel)] p-6 shadow-sm ring-1 ring-[var(--color-edge)] flex flex-col gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-[#1b1f23]">{track.title}</h3>
                  <p className="text-sm text-[#6b7280]">{track.subtitle}</p>
                </div>
                <ul className="space-y-2 text-sm text-[#4b5563]">
                  {track.body.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={track.cta.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#329c85] underline-offset-2 hover:underline"
                >
                  {track.cta.label}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* What we need most right now */}
        <section className="space-y-3 max-w-4xl">
          <h2 className="text-2xl font-semibold text-[#1b1f23]">What we need most right now</h2>
          <ul className="space-y-2 text-[#4b5563]">
            {[
              'Planning officers willing to walk through real or anonymised cases.',
              'Councils exploring digital local plans and monitoring frameworks.',
              'Researchers looking for a concrete system to study.',
              'Systems engineers comfortable with open, explainable AI work.',
            ].map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-[#4b5563]">If that sounds like you, you are exactly who this page is for.</p>
        </section>

        {/* How collaboration works */}
        <section className="space-y-3 max-w-4xl">
          <h2 className="text-2xl font-semibold text-[#1b1f23]">How collaboration works</h2>
          <ul className="space-y-2 text-sm text-[#4b5563]">
            {[
              'Open by default. Code, prompts, and architecture are kept as open as possible for inspection, critique, and extension.',
              'Shared credit. Where work feeds into publications, talks, or public outputs, collaborators are credited directly.',
              'Real constraints. The project is independent and unfunded; timelines are realistic and honesty about limits is expected on all sides.',
              'Civic first. Commercial opportunities are considered only where they strengthen, rather than dilute, the public-interest mission.',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#329c85]" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Final call */}
        <section className="rounded-2xl bg-[var(--color-panel)] p-6 shadow-sm ring-1 ring-[var(--color-edge)] space-y-3">
          <p className="text-base leading-relaxed text-[var(--color-muted)]">
            If you would like to help shape an AI system that treats planning and governance as serious public work, not a market
            niche, you are warmly invited to get in touch.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:hello@theplannersassistant.uk?subject=Get%20Involved"
              className="inline-flex items-center gap-2 rounded-full bg-[#f5c315] px-4 py-2 text-sm font-semibold text-[#2a3a60] shadow-sm transition hover:bg-[#ffdc4a]"
            >
              Email / contact →
            </a>
            <Link
              to="/research"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-panel)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] shadow-sm ring-1 ring-[var(--color-accent)]/30 hover:bg-[var(--color-surface)]"
            >
              View the research agenda →
            </Link>
            <a
              href="https://github.com/the-planners-assistant"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-panel)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] shadow-sm ring-1 ring-[var(--color-edge)] hover:bg-[var(--color-surface)]"
            >
              Visit the GitHub repository →
            </a>
          </div>
        </section>
      </div>
    </motion.main>
  );
}
