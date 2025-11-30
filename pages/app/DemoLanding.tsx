import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModuleCard } from '../../components/ModuleCard';
import { ArrowLeft } from 'lucide-react';
import { usePlan } from '../../contexts/PlanContext';
import { suggestTimetable } from '../../utils/llmTasks';

interface DemoLandingProps {
  selectedCouncil: string | null;
  onSelectCouncil: (councilId: string) => void;
  onSelectMode: (mode: 'spatial' | 'development') => void;
  onBack: () => void;
}

const councils = [
  {
    id: 'camden',
    name: 'Camden',
    description: 'London Borough - Urban intensification focusing on Euston, King\'s Cross & Kentish Town'
  },
  {
    id: 'cornwall',
    name: 'Cornwall',
    description: 'Unitary Authority - Dispersed growth across 52,500 homes with eco-communities'
  },
  {
    id: 'manchester',
    name: 'Manchester',
    description: 'Metropolitan District - Core Growth Area driving 60,000+ homes & global connectivity'
  }
];

const modes = [
  {
    id: 'spatial',
    title: 'Spatial Plan Intelligence',
    icon: '🧭',
    description: 'Tools for plan-making, strategy, and foresight',
    features: [
      'Evidence Base - Query plans, explore data, layer indicators',
      'Vision & Concepts - Generate spatial visions and scenario maps',
      'Policy Drafter - Draft and validate planning policy',
      'Strategy Modeler - Compare growth strategies and impacts',
      'Site Assessment - Rapid constraint analysis and appraisals',
      'Feedback Analysis - Analyse consultation responses'
    ]
  },
  {
    id: 'development',
    title: 'Development Management Intelligence',
    icon: '🏗️',
    description: 'Workflow-based assessment from application to decision',
    features: [
      'Application Intake - Organise documents and extract key data',
      'Context & Policy Analysis - Map constraints and policy framework',
      'Reasoning Workspace - Structured professional judgement',
      'Report & Recommendation - Generate officer reports with citations'
    ]
  }
];

export function DemoLanding({ selectedCouncil, onSelectCouncil, onSelectMode, onBack }: DemoLandingProps) {
  const [stage, setStage] = useState<'council' | 'mode'>(selectedCouncil ? 'mode' : 'council');
  const { activePlan, getActiveForCouncil, setActiveForCouncil, createPlan, updatePlan } = usePlan();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('New Local Plan');
  const [area, setArea] = useState('');
  const [councilIdInput, setCouncilIdInput] = useState<string>(selectedCouncil || '');

  const handleCouncilSelect = (councilId: string) => {
    onSelectCouncil(councilId);
    setStage('mode');
  };

  const handleBack = () => {
    if (stage === 'mode' && selectedCouncil) {
      setStage('council');
      onBack();
    }
  };

  const selectedCouncilData = councils.find(c => c.id === selectedCouncil);

  return (
    <div className="h-screen bg-[var(--color-surface)] flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex-1 overflow-auto">
        {/* Breadcrumb */}
        <div className="mb-8">
          {stage === 'council' && (
            <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-ink)]">
              Select Council
            </h2>
          )}
          {stage === 'mode' && selectedCouncilData && (
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-[var(--color-edge)] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--color-ink)]" />
              </button>
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--color-ink)]">
                {selectedCouncilData.name} → Select Mode
              </h2>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {stage === 'council' && (
            <motion.div
              key="council-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {councils.map(council => (
                <div key={council.id}>
                  <ModuleCard
                    title={council.name}
                    desc={council.description}
                    onClick={() => handleCouncilSelect(council.id)}
                    ctaLabel={null}
                  />
                </div>
              ))}
              {/* Removed old Create New Plan panel; creation now lives inside Spatial workspace */}
            </motion.div>
          )}

          {stage === 'mode' && selectedCouncilData && (
            <motion.div
              key="mode-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {modes.map(mode => (
                <motion.div
                  key={mode.id}
                  whileHover={{ y: -5 }}
                  className="bg-[var(--color-panel)] rounded-2xl border border-[var(--color-edge)] shadow-lg p-8 cursor-pointer transition-shadow hover:shadow-xl"
                  onClick={() => onSelectMode(mode.id as 'spatial' | 'development')}
                >
                  <div className="text-5xl mb-4">{mode.icon}</div>
                  <h3 className="text-2xl font-semibold text-[var(--color-ink)] mb-2">
                    {mode.title}
                  </h3>
                  <p className="text-[var(--color-muted)] mb-6">
                    {mode.description}
                  </p>
                  <ul className="space-y-3">
                    {mode.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-brand)] flex-shrink-0" />
                        <span className="text-sm text-[var(--color-muted)]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 text-[var(--color-accent)] font-semibold text-sm">
                    Launch →
                  </div>
                </motion.div>
              ))}
              {/* Active plan display handled in spatial workspace header */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
