import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callLLM } from '../../../../utils/llmClient';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Chip } from '../../shared/Chip';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import { usePlan } from '../../../../contexts/PlanContext';

interface EvidenceToolProps {
  councilData: CouncilData;
  prompts: PromptFunctions;
  initialQuery?: string;
  initialTopics?: string[];
  initialCards?: { id?: string; title: string; content: string; question?: string; reasoning?: string }[];
  autoRun?: boolean;
  selectedTopicsOverride?: string[];
  onToggleTopicOverride?: (id: string) => void;
  onSessionChange?: (session: { query: string; selectedTopics: string[]; cards: { title: string; content: string; question?: string; reasoning?: string }[] }) => void;
}

type EvidenceCard = { id: string; title: string; content: string; question?: string; reasoning?: string };

export const EvidenceTool: React.FC<EvidenceToolProps> = ({ councilData, prompts, initialQuery, initialTopics, initialCards, autoRun, selectedTopicsOverride, onToggleTopicOverride, onSessionChange }) => {
  const [query, setQuery] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [cards, setCards] = useState<EvidenceCard[]>([]);
  const [loading, setLoading] = useState(false);
  const hasInitialized = React.useRef(false);
  const [showReasoning, setShowReasoning] = useState<Record<string, boolean>>({});
  const nextId = React.useRef(0);
  const { activePlan, updatePlan } = usePlan();
  const planMatchesCouncil = !!(activePlan && activePlan.councilId === councilData.id);
  const preferredEvidence = planMatchesCouncil ? activePlan?.preferredOptions?.evidence : undefined;

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const runPreset = async (title: string, question: string, topics: string[]) => {
    const cardId = `card_${Date.now()}_${nextId.current++}`;
    setLoading(true);
    const prompt = prompts.evidencePrompt(question, topics);
    // Add a placeholder card we will update as chunks arrive
    setCards(prev => [{ id: cardId, title, content: 'Generating...', question }, ...prev]);
    try {
      const full = await callLLM(prompt);
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, content: full || 'Generating...', reasoning: '' } : c));
    } catch (error) {
      setCards(prev => [{ id: cardId, title, content: 'Error generating response. Please try again.', question }, ...prev.filter(c => c.id !== cardId)])
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Restore session cards if provided
    if (initialCards && initialCards.length > 0) {
      setCards(initialCards.map((c, idx) => ({ id: c.id || `init_${idx}_${Date.now()}`, ...c })));
    }
    if (selectedTopicsOverride && !onToggleTopicOverride) {
      setSelectedTopics(selectedTopicsOverride);
    } else if (initialTopics && initialTopics.length) {
      setSelectedTopics(initialTopics);
    }

    // If we were given an initial query from autopick, run that first
    if (autoRun && (initialQuery || '').trim()) {
      setQuery(initialQuery || '');
      runPreset('Custom Analysis', initialQuery!, initialTopics || []);
      return;
    }

    // If we restored cards, skip default auto queries
    if (initialCards && initialCards.length > 0) return;

    // Only auto-run defaults when explicitly requested to avoid excessive LLM calls.
    if (autoRun) {
      const housingTopics = councilData.topics.filter(t => t.id.includes('housing')).map(t => t.id);
      const transportTopics = councilData.topics.filter(t => t.id.includes('transport')).map(t => t.id);
      const environmentTopics = councilData.topics.filter(t => t.id.includes('environment') || t.id.includes('climate')).map(t => t.id);

      runPreset('Housing Need & Delivery', 'Summarise housing pressures, delivery targets and affordability for this LPA.', housingTopics);
      runPreset('Spatial Distribution of Growth', 'Describe how growth is distributed across places and centres.', transportTopics);
      runPreset('Environmental Constraints', 'Outline key environmental constraints affecting development.', environmentTopics);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!planMatchesCouncil) return;
    if (!preferredEvidence) return;
    setCards(prev => {
      if (prev.some(c => c.id === preferredEvidence.id)) return prev;
      const newCard: EvidenceCard = {
        id: preferredEvidence.id || `preferred_${Date.now()}`,
        title: preferredEvidence.title,
        content: preferredEvidence.content,
        question: preferredEvidence.question,
        reasoning: preferredEvidence.reasoning,
      };
      return [newCard, ...prev];
    });
    if (!query && preferredEvidence.question) setQuery(preferredEvidence.question);
    if (!selectedTopicsOverride && selectedTopics.length === 0 && preferredEvidence.topics?.length) {
      setSelectedTopics(preferredEvidence.topics);
    }
  }, [planMatchesCouncil, preferredEvidence, query, selectedTopics.length, selectedTopicsOverride]);

  // Emit session changes upward for persistence
  useEffect(() => {
    if (onSessionChange) {
      onSessionChange({ query, selectedTopics: selectedTopicsOverride || selectedTopics, cards });
    }
  }, [query, selectedTopics, cards, selectedTopicsOverride, onSessionChange]);

  const handleQuery = async () => {
    if (!query.trim()) return;
    await runPreset('Custom Analysis', query, selectedTopics);
  };

  const handleSavePreferred = (card: EvidenceCard) => {
    if (!planMatchesCouncil || !activePlan) return;
    const topics = selectedTopicsOverride || selectedTopics;
    updatePlan(activePlan.id, {
      preferredOptions: {
        ...(activePlan.preferredOptions || {}),
        evidence: {
          id: card.id,
          title: card.title,
          content: card.content,
          question: card.question,
          topics,
          reasoning: card.reasoning,
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">
          Evidence & Context Query
        </h2>
        <p className="text-[var(--color-muted)]">
          Ask questions about local evidence, demographics, constraints, or any contextual data
        </p>
      </div>

      {/* Topic filters (hidden if override provided to rely on sidebar chips) */}
      {!selectedTopicsOverride && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-ink)] mb-3">Filter by Topic (optional)</label>
          <div className="flex flex-wrap gap-2">
            {councilData.topics.map((topic) => (
              <div key={topic.id}>
                <Chip
                  label={topic.label}
                  active={selectedTopics.includes(topic.id)}
                  onClick={() => toggleTopic(topic.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset deepen actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => runPreset('Deepen Housing Analysis', 'Provide a deeper analysis of housing need, delivery pipeline, and affordability challenges.', councilData.topics.filter(t=>t.id.includes('housing')).map(t=>t.id))} className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white">Deepen Housing Analysis</button>
        <button onClick={() => runPreset('Deepen Transport Analysis', 'Assess transport capacity, active travel priorities, and station-led intensification opportunities.', councilData.topics.filter(t=>t.id.includes('transport')).map(t=>t.id))} className="px-4 py-2 rounded-lg bg-[var(--color-panel)] border border-[var(--color-edge)] text-[var(--color-ink)]">Deepen Transport Analysis</button>
        <button onClick={() => runPreset('Deepen Environment Analysis', 'Analyse climate constraints, flood risk, and nature recovery opportunities.', councilData.topics.filter(t=>t.id.includes('environment')||t.id.includes('climate')).map(t=>t.id))} className="px-4 py-2 rounded-lg bg-[var(--color-panel)] border border-[var(--color-edge)] text-[var(--color-ink)]">Deepen Environment Analysis</button>
      </div>

      {/* Query input (optional) */}
      <details className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg p-3">
        <summary className="text-sm font-medium text-[var(--color-ink)] cursor-pointer">Advanced: Ask a custom question</summary>
        <div className="mt-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., What are the key housing needs in the borough? What environmental constraints affect development?"
            rows={3}
            className="w-full px-4 py-3 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg text-[var(--color-ink)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
      </details>

      {/* Submit button */}
      <button
        onClick={handleQuery}
        disabled={loading || !query.trim()}
        className="w-full md:w-auto px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {loading ? 'Analyzing...' : 'Query Evidence Base'}
      </button>

      {/* Cards */}
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
        {!loading && cards.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {cards.map((card) => (
              <motion.div key={card.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2">🗺️ {card.title}</h3>
                  {planMatchesCouncil && (
                    <button
                      className="text-xs px-3 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-panel)] text-[var(--color-ink)] hover:border-[var(--color-accent)]"
                      onClick={() => handleSavePreferred(card)}
                    >
                      {preferredEvidence?.id === card.id ? 'Saved' : 'Save to plan'}
                    </button>
                  )}
                </div>
                {card.question && <p className="text-xs text-[var(--color-muted)] mb-3">Question used: {card.question}</p>}
                <MarkdownContent content={card.content} />
                {card.reasoning && card.reasoning.trim() && (
                  <div className="mt-3">
                    <button
                      className="text-xs text-[var(--color-accent)] hover:underline"
                      onClick={() => setShowReasoning(prev => ({ ...prev, [card.id]: !prev[card.id] }))}
                    >
                      {showReasoning[card.id] ? 'Hide reasoning' : 'Show reasoning'}
                    </button>
                    {showReasoning[card.id] && (
                      <div className="mt-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-muted)] whitespace-pre-wrap">
                        {(card.reasoning || '').replace(/\s*\n\s*/g, ' ')}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
