import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callLLM } from '../../../../utils/llmClient';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { SpatialMap } from '../shared/SpatialMap';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import type { GeoLayerSet } from '../../../../data/geojsonLayers';
import { usePlan } from '../../../../contexts/PlanContext';

interface StrategyModelerToolProps {
  councilData: CouncilData;
  prompts: PromptFunctions;
  initialStrategyId?: string | null;
  initialAnalysis?: string;
  initialMetrics?: { totalSites: number; totalCapacity: number } | null;
  autoRun?: boolean;
  onSessionChange?: (session: { selectedStrategy: string | null; analysis: string; metrics: { totalSites: number; totalCapacity: number } | null }) => void;
  geoLayers?: GeoLayerSet | null;
}

export const StrategyModelerTool: React.FC<StrategyModelerToolProps> = ({ councilData, prompts, initialStrategyId, initialAnalysis, initialMetrics, autoRun, onSessionChange, geoLayers }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<{ totalSites: number; totalCapacity: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const hasAutoRun = useRef(false);
  const { activePlan, updatePlan } = usePlan();
  const planMatchesCouncil = !!(activePlan && activePlan.councilId === councilData.id);
  const preferredStrategy = planMatchesCouncil ? activePlan?.preferredOptions?.strategy : undefined;

  // Auto-analyze first or provided strategy on mount
  useEffect(() => {
    if (hasAutoRun.current) return;
    if (initialAnalysis) setAnalysis(initialAnalysis);
    if (initialMetrics) setMetrics(initialMetrics);
    if (initialStrategyId) setSelectedStrategy(initialStrategyId);

    const preferredId = preferredStrategy?.id;
    const first = councilData.strategies && councilData.strategies.length > 0 ? councilData.strategies[0].id : null;
    const initial = (autoRun && (initialStrategyId || preferredId)) ? (initialStrategyId || preferredId) : (preferredId || first);
    if (initial && !initialAnalysis) {
      hasAutoRun.current = true;
      analyzeStrategy(initial);
      return;
    }
    hasAutoRun.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredStrategy?.id]);

  useEffect(() => {
    if (!planMatchesCouncil) return;
    const saved = activePlan?.preferredOptions?.strategy;
    if (!saved) return;
    if (!selectedStrategy && saved.id) setSelectedStrategy(saved.id);
    if (!analysis && saved.analysis) setAnalysis(saved.analysis);
    if (!metrics && saved.metrics) setMetrics(saved.metrics);
  }, [planMatchesCouncil, activePlan?.preferredOptions?.strategy, selectedStrategy, analysis, metrics, activePlan?.id]);

  useEffect(() => {
    if (onSessionChange) {
      onSessionChange({ selectedStrategy, analysis, metrics });
    }
  }, [selectedStrategy, analysis, metrics, onSessionChange]);

  const analyzeStrategy = async (strategyId: string) => {
    setSaveStatus(null);
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
        const full = await callLLM(prompt);
        setAnalysis(full || 'No analysis generated.')
      }
    } catch (error) {
      setAnalysis('Error analyzing strategy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferred = () => {
    if (!planMatchesCouncil || !activePlan || !selectedStrategy) return;
    const meta = councilData.strategies?.find(s => s.id === selectedStrategy);
    updatePlan(activePlan.id, {
      preferredOptions: {
        ...(activePlan.preferredOptions || {}),
        strategy: {
          id: selectedStrategy,
          label: meta?.label,
          analysis: analysis || undefined,
          metrics: metrics || null
        }
      }
    });
    setSaveStatus('Preferred strategy saved to plan.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">
          Strategy Modeler
        </h2>
        <p className="text-[var(--color-muted)]">
          Explore and analyze spatial strategies with AI-powered insights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">
            Select a Strategy
          </h3>
          <div className="flex flex-col gap-3">
            {councilData.strategies?.map((strategy) => (
              <div key={strategy.id} className={`p-4 rounded-lg border ${selectedStrategy===strategy.id?'border-[var(--color-accent)] bg-[var(--color-accent)]/10':'border-[var(--color-edge)] bg-[var(--color-panel)]'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--color-ink)]">{strategy.label}</div>
                    <div className="text-sm text-[var(--color-muted)]">{strategy.desc}</div>
                  </div>
                  <button onClick={() => analyzeStrategy(strategy.id)} className="px-3 py-1.5 rounded bg-[var(--color-panel)] border border-[var(--color-edge)] text-[var(--color-ink)] text-sm">Select</button>
                </div>
              </div>
            ))}
          </div>
          {metrics && (
            <div className="mt-3 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-3 text-sm">
              <div className="font-semibold text-[var(--color-ink)] mb-1">📊 Summary metrics</div>
              <div className="flex gap-4">
                <div className="px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-edge)]">📍 Sites: {metrics.totalSites}</div>
                <div className="px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-edge)]">🏗️ Capacity: {metrics.totalCapacity}</div>
              </div>
            </div>
          )}
        </div>

        {/* Spatial visualization */}
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">
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
            geojsonLayers={geoLayers || undefined}
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
            className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-1">Strategy Narrative</h3>
            {planMatchesCouncil && selectedStrategy && (
              <div className="flex items-center justify-between text-sm mb-3">
                <div className="text-[var(--color-muted)]">
                  {preferredStrategy?.id === selectedStrategy ? 'Saved as preferred option in this plan.' : 'Save this strategy as the preferred option for the plan.'}
                </div>
                <button
                  onClick={handleSavePreferred}
                  className="px-3 py-1.5 rounded bg-[var(--color-panel)] border border-[var(--color-edge)] text-[var(--color-ink)] text-xs hover:border-[var(--color-accent)]"
                >
                  {preferredStrategy?.id === selectedStrategy ? 'Saved' : 'Save to plan'}
                </button>
              </div>
            )}
            {saveStatus && <div className="text-xs text-green-700 mb-2">{saveStatus}</div>}
            {selectedStrategy && (
              <p className="text-xs text-[var(--color-muted)] mb-3">Current strategy: {councilData.strategies?.find(s=>s.id===selectedStrategy)?.label}</p>
            )}
            <MarkdownContent content={analysis} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
