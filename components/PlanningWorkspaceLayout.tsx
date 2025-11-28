import React from 'react';

interface PlanningWorkspaceLayoutProps {
  context: React.ReactNode;
  workspace: React.ReactNode;
}

export function PlanningWorkspaceLayout({ context, workspace }: PlanningWorkspaceLayoutProps) {
  return (
    <div className="flex gap-6">
      <aside className="w-[280px] shrink-0">
        {context}
      </aside>
      <section className="flex-1 min-w-0">
        {workspace}
      </section>
    </div>
  );
}
