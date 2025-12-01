import React, { useState, useEffect } from 'react';
import { DemoLanding } from './DemoLanding';
import { SpatialPlanDemo } from './spatial/SpatialPlanDemo';
import { DevManagementDemo } from './development/DevManagementDemo';
import { getCouncilData, getAllCouncils } from '../../data';
import { useLocation, useNavigate } from 'react-router-dom';

export function PlanningAssistantDemo() {
  const [selectedCouncil, setSelectedCouncil] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'spatial' | 'development' | null>(null);
  const [initialTool, setInitialTool] = useState<string | undefined>(undefined);
  const location = useLocation();
  const navigate = useNavigate();

  const updateSearchParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(location.search);
    updater(params);
    const searchString = params.toString();
    navigate(
      {
        pathname: location.pathname,
        search: searchString ? `?${searchString}` : ''
      },
      { replace: true }
    );
  };

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const tool = q.get('tool') || undefined;
    const council = q.get('c') || null;
    const mode = q.get('mode');
    if (council) setSelectedCouncil(council);

    if (tool) {
      // open spatial workspace and pass tool to it
      setSelectedMode('spatial');
      setInitialTool(tool);
      // if no council selected, pick the first available
      if (!selectedCouncil && !council) {
        const all = getAllCouncils();
        if (all && all.length) setSelectedCouncil(all[0].id);
      }
      return;
    }

    if (mode === 'spatial' || mode === 'development') {
      setSelectedMode(mode);
      return;
    }

    // If a council is provided without mode/tool, default to spatial workspace for that authority.
    if (council) {
      setSelectedMode('spatial');
    }
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
      updateSearchParams(params => {
        params.delete('mode');
        params.delete('tool');
      });
    } else if (selectedCouncil) {
      setSelectedCouncil(null);
      updateSearchParams(params => {
        params.delete('c');
        params.delete('mode');
        params.delete('tool');
      });
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
