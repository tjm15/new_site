import * as React from 'react';
import { usePlan } from '../../contexts/PlanContext';
import { getCouncilData } from '../../data';
import { Gateway1Tool } from './spatial/tools/Gateway1Tool';

export default function Gateway1Page() {
  const { activePlan } = usePlan();
  const councilData = activePlan ? getCouncilData(activePlan.councilId) : null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Gateway1Tool councilData={councilData || undefined} plan={activePlan || undefined} />
    </div>
  );
}
