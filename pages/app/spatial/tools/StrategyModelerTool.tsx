import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callGemini } from '../../../../utils/gemini';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { SpatialMap } from '../shared/SpatialMap';
import { MarkdownContent } from '../../../../components/MarkdownContent';

interface StrategyModelerToolProps {
  councilData: CouncilData;
  prompts: PromptFunctions;
}

export const StrategyModelerTool: React.FC<StrategyModelerToolProps> = ({ councilData, prompts }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-analyze first strategy on mount
  useEffect(() => {
    if (councilData.strategies && councilData.strategies.length > 0) {
      analyzeStrategy(councilData.strategies[0].id);
    }
  }, []);

  const analyzeStrategy = async (strategyId: string) => {
    setSelectedStrategy(strategyId);
    setLoading(true);

    try {
      const strategy = councilData.strategies?.find(s => s.id === strategyId);
      if (strategy) {
        const prompt = prompts.strategyPrompt(strategy.label, strategy.desc);
        const result = await callGemini(prompt);
        setAnalysis(result || 'No analysis generated.');
      }
    } catch (error) {
      setAnalysis('Error analyzing strategy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[color:var(--ink)] mb-2">
          Strategy Modeler
        </h2>
        <p className="text-[color:var(--muted)]">
          Explore and analyze spatial strategies with AI-powered insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[color:var(--ink)]">
            Select a Strategy
          </h3>
          <div className="space-y-3">
            {councilData.strategies?.map((strategy) => (
              <motion.button
                key={strategy.id}
                onClick={() => analyzeStrategy(strategy.id)}
                whileHover={{ x: 4 }}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedStrategy === strategy.id
                    ? 'bg-[color:var(--accent)]/10 border-[color:var(--accent)]'
                    : 'bg-[color:var(--panel)] border-[color:var(--edge)] hover:border-[color:var(--accent)]/50'
                }`}
              >
                <h4 className="font-semibold text-[color:var(--ink)] mb-1">
                  {strategy.label}
                </h4>
                <p className="text-sm text-[color:var(--muted)]">
                  {strategy.desc}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Spatial visualization */}
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--ink)] mb-4">
            Spatial Context
          </h3>
          <SpatialMap
            boroughOutline={councilData.spatialData.boroughOutline}
            constraints={councilData.spatialData.constraints.map(c => c.path)}
            centres={councilData.spatialData.centres.map(c => c.label)}
            allocations={councilData.spatialData.allocations}
            showConstraints={true}
            showCentres={true}
            showAllocations={true}
          />
        </div>
      </div>

      {/* Analysis output */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center py-12"
          >
            <LoadingSpinner />
          </motion.div>
        )}

        {!loading && analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-[color:var(--ink)] mb-4">
              Strategy Analysis
            </h3>
            <MarkdownContent content={analysis} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
