import React from 'react';
import { motion } from 'framer-motion';
import { ArchitectureContent } from './content/ArchitectureContent';

export function ArchitecturePage() {
  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="bg-transparent text-[var(--color-ink)]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20 pt-14 space-y-10">
        <section className="space-y-4 max-w-4xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">Reasoning architecture</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-[var(--color-ink)]">
            One civic reasoning spine, expressed across planning.
          </h1>
          <p className="text-lg leading-relaxed text-[var(--color-muted)]">
            The Planner’s Assistant runs on a layered cognitive stack. Evidence flows up from the Senses, through
            Orchestration, into Applications, anchored by Governance. Explore each component below to see how the system
            stays explainable, auditable, and connected.
          </p>
        </section>

        <ArchitectureContent />
      </div>
    </motion.main>
  );
}
