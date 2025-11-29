import React from 'react';
import { usePlan } from '../contexts/PlanContext';
import { PlanTimeline } from './PlanTimeline';

interface PlanningWorkspaceLayoutProps {
  context: React.ReactNode;
  workspace: React.ReactNode;
  councilId?: string;
}

export function PlanningWorkspaceLayout({ context, workspace, councilId }: PlanningWorkspaceLayoutProps) {
  const { activePlan, getActiveForCouncil } = usePlan();
  const scopedPlan = councilId ? getActiveForCouncil(councilId) : activePlan;
  return (
    <div className="flex gap-6">
      <aside className="w-[280px] shrink-0">
        {scopedPlan && <PlanTimeline plan={scopedPlan} />}
        <div className="mt-4">
          {context}
        </div>
      </aside>
      <section className="flex-1 min-w-0">
        {workspace}
      </section>
    </div>
  );
}
