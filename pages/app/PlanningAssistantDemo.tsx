import React, { useState, useEffect } from 'react';
import { DemoLanding } from './DemoLanding';
import { SpatialPlanDemo } from './spatial/SpatialPlanDemo';
import { DevManagementDemo } from './development/DevManagementDemo';
import { getCouncilData, getAllCouncils } from '../../data';
import { useLocation } from 'react-router-dom';

export function PlanningAssistantDemo() {
  const [selectedCouncil, setSelectedCouncil] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'spatial' | 'development' | null>(null);
  const [initialTool, setInitialTool] = useState<string | undefined>(undefined);
  const location = useLocation();

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const tool = q.get('tool') || undefined;
    const council = q.get('c') || null;
    if (tool) {
      // open spatial workspace and pass tool to it
      setSelectedMode('spatial');
      setInitialTool(tool);
      // if no council selected, pick the first available
      if (!selectedCouncil) {
        const all = getAllCouncils();
        if (all && all.length) setSelectedCouncil(all[0].id);
      }
    }
    if (council) setSelectedCouncil(council);
  }, [location.search, selectedCouncil]);

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
    return <SpatialPlanDemo councilData={councilData} onBack={handleBack} initialTool={initialTool} />;
  }

  if (selectedMode === 'development') {
    return <DevManagementDemo councilData={councilData} onBack={handleBack} />;
  }

  return null;
}
