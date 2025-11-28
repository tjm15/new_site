import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData } from '../../../data/types';
import { getPrompts } from '../../../prompts';
import { EvidenceTool } from './tools/EvidenceTool';
import { VisionConceptsTool } from './tools/VisionConceptsTool';
import { PolicyDrafterTool } from './tools/PolicyDrafterTool';
import { StrategyModelerTool } from './tools/StrategyModelerTool';
import { SiteAssessmentTool } from './tools/SiteAssessmentTool';
import { FeedbackAnalysisTool } from './tools/FeedbackAnalysisTool';

interface SpatialPlanDemoProps {
  councilData: CouncilData;
  onBack: () => void;
}

type ToolId = 'evidence' | 'vision' | 'policy' | 'strategy' | 'sites' | 'feedback';

interface Tool {
  id: ToolId;
  label: string;
  icon: string;
  description: string;
}

const TOOLS: Tool[] = [
  {
    id: 'evidence',
    label: 'Evidence & Context',
    icon: '📊',
    description: 'Query evidence base and planning context'
  },
  {
    id: 'vision',
    label: 'Vision & Concepts',
    icon: '🎨',
    description: 'Generate vision statements and visualizations'
  },
  {
    id: 'policy',
    label: 'Policy Drafter',
    icon: '📝',
    description: 'Draft policy wording for topics'
  },
  {
    id: 'strategy',
    label: 'Strategy Modeler',
    icon: '🗺️',
    description: 'Analyze spatial development strategies'
  },
  {
    id: 'sites',
    label: 'Site Assessment',
    icon: '📍',
    description: 'Appraise development site allocations'
  },
  {
    id: 'feedback',
    label: 'Feedback Analysis',
    icon: '💬',
    description: 'Analyze consultation responses'
  }
];

export const SpatialPlanDemo: React.FC<SpatialPlanDemoProps> = ({ councilData, onBack }) => {
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const prompts = getPrompts(councilData.id, 'spatial');

  const renderTool = () => {
    switch (selectedTool) {
      case 'evidence':
        return <EvidenceTool councilData={councilData} prompts={prompts} />;
      case 'vision':
        return <VisionConceptsTool councilData={councilData} prompts={prompts} />;
      case 'policy':
        return <PolicyDrafterTool councilData={councilData} prompts={prompts} />;
      case 'strategy':
        return <StrategyModelerTool councilData={councilData} prompts={prompts} />;
      case 'sites':
        return <SiteAssessmentTool councilData={councilData} prompts={prompts} />;
      case 'feedback':
        return <FeedbackAnalysisTool prompts={prompts} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--surface)]">
      {/* Header */}
      <div className="bg-[color:var(--panel)] border-b border-[color:var(--edge)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-[color:var(--accent)] hover:underline text-sm"
              >
                ← Back to Selection
              </button>
              <div className="h-6 w-px bg-[color:var(--edge)]" />
              <div>
                <h1 className="text-xl font-bold text-[color:var(--ink)]">
                  {councilData.name} - Spatial Plan Intelligence
                </h1>
                <p className="text-sm text-[color:var(--muted)]">
                  {councilData.planContext.title}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {!selectedTool ? (
            <motion.div
              key="tool-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-[color:var(--ink)] mb-2">
                  Select a Tool
                </h2>
                <p className="text-[color:var(--muted)]">
                  Choose from 6 AI-powered tools to assist with spatial plan development
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TOOLS.map((tool) => (
                  <motion.button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    whileHover={{ y: -5 }}
                    className="text-left bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-6 hover:border-[color:var(--accent)] transition-all hover:shadow-lg"
                  >
                    <div className="text-4xl mb-3">{tool.icon}</div>
                    <h3 className="text-lg font-semibold text-[color:var(--ink)] mb-2">
                      {tool.label}
                    </h3>
                    <p className="text-sm text-[color:var(--muted)]">
                      {tool.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`tool-${selectedTool}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button
                onClick={() => setSelectedTool(null)}
                className="mb-6 text-[color:var(--accent)] hover:underline text-sm"
              >
                ← Back to Tools
              </button>
              {renderTool()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
