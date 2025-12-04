import React from 'react';
import { CAPABILITY_SUITES, type CapabilitySuite } from '../../data/capabilitySuites';

const Badge = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-[var(--color-panel)] px-2.5 py-1 text-[0.7rem] text-[var(--color-muted)] border border-[var(--color-edge)]">
    {children}
  </span>
);

export function PillarsContent() {
  return (
    <div className="space-y-6">
      {CAPABILITY_SUITES.map((suite: CapabilitySuite) => {
        const Icon = suite.icon;
        return (
        <div key={suite.id} className="rounded-2xl border border-[var(--color-edge)] bg-[var(--color-panel)] p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-9 w-9 rounded-xl bg-[var(--color-surface)] flex items-center justify-center">
              <Icon className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">{suite.name}</h3>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">{suite.tagline}</p>
            </div>
          </div>

          <p className="mt-3 text-sm text-[var(--color-muted)]">{suite.description}</p>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold tracking-wide text-[var(--color-ink)]">What this enables</p>
            <ul className="space-y-1">
              {suite.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>Works with shared evidence base</Badge>
            <Badge>Explainable reasoning</Badge>
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold tracking-wide text-[var(--color-muted)]">Especially useful for</p>
            <p className="mt-1 text-xs text-[var(--color-ink)]">{suite.idealFor}</p>
          </div>
        </div>
        );
      })}
    </div>
  );
}
