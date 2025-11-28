import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CouncilData, PlanningApplication } from '../../../data/types';
import { getPrompts } from '../../../prompts';
import { IntakeStage } from './stages/IntakeStage';
import { ContextStage } from './stages/ContextStage';
import { ReasoningStage } from './stages/ReasoningStage';
import { ReportStage } from './stages/ReportStage';

interface DevManagementDemoProps {
  councilData: CouncilData;
  onBack: () => void;
}

type Stage = 'select' | 'intake' | 'context' | 'reasoning' | 'report';

export const DevManagementDemo: React.FC<DevManagementDemoProps> = ({ councilData, onBack }) => {
  const [currentStage, setCurrentStage] = useState<Stage>('select');
  const [selectedApplication, setSelectedApplication] = useState<PlanningApplication | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [contextAnalysis, setContextAnalysis] = useState('');
  const [reasoningChain, setReasoningChain] = useState<any[]>([]);

  const prompts = getPrompts(councilData.id, 'development');

  const handleSelectApplication = (app: PlanningApplication) => {
    setSelectedApplication(app);
    setCurrentStage('intake');
    setExtractedData(null);
    setContextAnalysis('');
    setReasoningChain([]);
  };

  const handleNewApplication = () => {
    setCurrentStage('select');
    setSelectedApplication(null);
    setExtractedData(null);
    setContextAnalysis('');
    setReasoningChain([]);
  };

  const renderStage = () => {
    if (!selectedApplication) return null;

    switch (currentStage) {
      case 'intake':
        return (
          <IntakeStage
            application={selectedApplication}
            prompts={prompts}
            onComplete={(data) => {
              setExtractedData(data);
              setCurrentStage('context');
            }}
          />
        );
      case 'context':
        return (
          <ContextStage
            application={selectedApplication}
            councilData={councilData}
            extractedData={extractedData}
            prompts={prompts}
            onComplete={(analysis) => {
              setContextAnalysis(analysis);
              setCurrentStage('reasoning');
            }}
            onBack={() => setCurrentStage('intake')}
          />
        );
      case 'reasoning':
        return (
          <ReasoningStage
            application={selectedApplication}
            contextAnalysis={contextAnalysis}
            prompts={prompts}
            onComplete={(chain) => {
              setReasoningChain(chain);
              setCurrentStage('report');
            }}
            onBack={() => setCurrentStage('context')}
          />
        );
      case 'report':
        return (
          <ReportStage
            application={selectedApplication}
            extractedData={extractedData}
            contextAnalysis={contextAnalysis}
            reasoningChain={reasoningChain}
            prompts={prompts}
            onBack={() => setCurrentStage('reasoning')}
            onNewApplication={handleNewApplication}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <div className="bg-[var(--color-panel)] border-b border-[var(--color-edge)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={currentStage === 'select' ? onBack : handleNewApplication}
                className="text-[var(--color-accent)] hover:underline text-sm"
              >
                ← {currentStage === 'select' ? 'Back to Selection' : 'Back to Applications'}
              </button>
              <div className="h-6 w-px bg-[var(--color-edge)]" />
              <div>
                <h1 className="text-xl font-bold text-[var(--color-ink)]">
                  {councilData.name} - Development Management Intelligence
                </h1>
                <p className="text-sm text-[var(--color-muted)]">
                  AI-assisted planning application assessment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {currentStage === 'select' ? (
            <motion.div
              key="application-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">
                  Select a Planning Application
                </h2>
                <p className="text-[var(--color-muted)]">
                  Choose from {councilData.applications.length} sample applications to process through the AI workflow
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {councilData.applications.map((app) => (
                  <motion.button
                    key={app.id}
                    onClick={() => handleSelectApplication(app)}
                    whileHover={{ x: 4 }}
                    className="text-left bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6 hover:border-[var(--color-accent)] transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                            {app.reference}
                          </h3>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-edge)]">
                            {app.applicationType}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-muted)] mb-2">{app.address}</p>
                        <p className="text-sm text-[var(--color-ink)] mb-3">{app.description}</p>
                        <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
                          <span>Applicant: {app.applicant}</span>
                          <span>•</span>
                          <span>{app.documents.length} documents</span>
                        </div>
                      </div>
                      <div className="text-[var(--color-accent)] text-2xl">→</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`stage-${currentStage}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderStage()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
