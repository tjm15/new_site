import React from 'react';
import { Page } from '../components/Page';

export function DocsPage() {
  return (
    <Page title="Docs">
      <div className="max-w-3xl space-y-5">
        <p className="text-[var(--color-muted)]">
          Documentation is being assembled. You’ll soon find setup guides, API references, and deployment patterns for running the Planner’s Assistant in your own environment.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--color-edge)] bg-[var(--color-panel)] p-4">
            <h3 className="text-[var(--color-ink)] font-semibold">Coming soon</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Installation steps, environment requirements, and architecture walkthroughs.</p>
          </div>
          <div className="rounded-xl border border-[var(--color-edge)] bg-[var(--color-panel)] p-4">
            <h3 className="text-[var(--color-ink)] font-semibold">How to contribute</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Drafting contribution guides and issue templates to make collaborating straightforward.</p>
          </div>
        </div>
      </div>
    </Page>
  );
}
