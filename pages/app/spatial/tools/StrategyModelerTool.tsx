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
  const [metrics, setMetrics] = useState<{ totalSites: number; totalCapacity: number } | null>(null);

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
        // Simple metrics based on includedSites (fallback to all allocations)
        const included = strategy.includedSites?.length ? strategy.includedSites : councilData.spatialData.allocations.map(a=>a.id);
        const totalSites = included.length;
        const totalCapacity = councilData.spatialData.allocations
          .filter(a => included.includes(a.id))
          .reduce((sum, a) => {
            const n = parseInt(a.capacity.replace(/[^0-9]/g, '')) || 0;
            return sum + n;
          }, 0);
        setMetrics({ totalSites, totalCapacity });
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
          <div className="flex flex-col gap-3">
            {councilData.strategies?.map((strategy) => (
              <div key={strategy.id} className={`p-4 rounded-lg border ${selectedStrategy===strategy.id?'border-[color:var(--accent)] bg-[color:var(--accent)]/10':'border-[color:var(--edge)] bg-[color:var(--panel)]'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[color:var(--ink)]">{strategy.label}</div>
                    <div className="text-sm text-[color:var(--muted)]">{strategy.desc}</div>
                  </div>
                  <button onClick={() => analyzeStrategy(strategy.id)} className="px-3 py-1.5 rounded bg-[color:var(--panel)] border border-[color:var(--edge)] text-[color:var(--ink)] text-sm">Select</button>
                </div>
              </div>
            ))}
          </div>
          {metrics && (
            <div className="mt-3 bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg p-3 text-sm">
              <div className="font-semibold text-[color:var(--ink)] mb-1">Summary metrics</div>
              <div className="flex gap-4">
                <div><span className="text-[color:var(--muted)]">Sites:</span> {metrics.totalSites}</div>
                <div><span className="text-[color:var(--muted)]">Capacity:</span> {metrics.totalCapacity}</div>
              </div>
            </div>
          )}
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
            <h3 className="text-lg font-semibold text-[color:var(--ink)] mb-1">Strategy Narrative</h3>
            {selectedStrategy && (
              <p className="text-xs text-[color:var(--muted)] mb-3">Current strategy: {councilData.strategies?.find(s=>s.id===selectedStrategy)?.label}</p>
            )}
            <MarkdownContent content={analysis} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
