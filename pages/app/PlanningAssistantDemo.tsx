import React, { useState } from 'react';
import { DemoLanding } from './DemoLanding';
import { SpatialPlanDemo } from './spatial/SpatialPlanDemo';
import { DevManagementDemo } from './development/DevManagementDemo';
import { getCouncilData } from '../../data';

export function PlanningAssistantDemo() {
  const [selectedCouncil, setSelectedCouncil] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'spatial' | 'development' | null>(null);

  const handleSelectCouncil = (councilId: string) => {
    setSelectedCouncil(councilId);
  };

  const handleSelectMode = (mode: 'spatial' | 'development') => {
    setSelectedMode(mode);
  };

  const handleBack = () => {
    if (selectedMode) {
      setSelectedMode(null);
    } else if (selectedCouncil) {
      setSelectedCouncil(null);
    }
  };

  // Get council data when selected
  const councilData = selectedCouncil ? getCouncilData(selectedCouncil) : null;

  // Show landing page if no mode selected
  if (!selectedMode) {
    return (
      <DemoLanding
        selectedCouncil={selectedCouncil}
        onSelectCouncil={handleSelectCouncil}
        onSelectMode={handleSelectMode}
        onBack={handleBack}
      />
    );
  }

  // Show spatial or development mode
  if (!councilData) return null;

  if (selectedMode === 'spatial') {
    return <SpatialPlanDemo councilData={councilData} onBack={handleBack} />;
  }

  if (selectedMode === 'development') {
    return <DevManagementDemo councilData={councilData} onBack={handleBack} />;
  }

  return null;
}
