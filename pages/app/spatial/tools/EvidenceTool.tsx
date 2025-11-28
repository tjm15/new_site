import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callGemini } from '../../../../utils/gemini';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Chip } from '../../shared/Chip';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import { StructuredMarkdown } from '../../../../components/StructuredMarkdown';

interface EvidenceToolProps {
  councilData: CouncilData;
  prompts: PromptFunctions;
  initialQuery?: string;
  initialTopics?: string[];
  initialCards?: { title: string; content: string; question?: string }[];
  autoRun?: boolean;
  selectedTopicsOverride?: string[];
  onToggleTopicOverride?: (id: string) => void;
  onSessionChange?: (session: { query: string; selectedTopics: string[]; cards: { title: string; content: string; question?: string }[] }) => void;
}

export const EvidenceTool: React.FC<EvidenceToolProps> = ({ councilData, prompts, initialQuery, initialTopics, initialCards, autoRun, selectedTopicsOverride, onToggleTopicOverride, onSessionChange }) => {
  const [query, setQuery] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [cards, setCards] = useState<{ title: string; content: string; question?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const hasInitialized = React.useRef(false);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const runPreset = async (title: string, question: string, topics: string[]) => {
    setLoading(true);
    try {
      const prompt = prompts.evidencePrompt(question, topics);
      const result = await callGemini(prompt);
      setCards(prev => [{ title, content: result || 'No response generated.', question }, ...prev]);
    } catch (error) {
      setCards(prev => [{ title, content: 'Error generating response. Please try again.', question }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Restore session cards if provided
    if (initialCards && initialCards.length > 0) {
      setCards(initialCards);
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

    // Otherwise run the default 3 auto-queries once
    const housingTopics = councilData.topics.filter(t => t.id.includes('housing')).map(t => t.id);
    const transportTopics = councilData.topics.filter(t => t.id.includes('transport')).map(t => t.id);
    const environmentTopics = councilData.topics.filter(t => t.id.includes('environment') || t.id.includes('climate')).map(t => t.id);

    runPreset('Housing Need & Delivery', 'Summarise housing pressures, delivery targets and affordability for this LPA.', housingTopics);
    runPreset('Spatial Distribution of Growth', 'Describe how growth is distributed across places and centres.', transportTopics);
    runPreset('Environmental Constraints', 'Outline key environmental constraints affecting development.', environmentTopics);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[color:var(--ink)] mb-2">
          Evidence & Context Query
        </h2>
        <p className="text-[color:var(--muted)]">
          Ask questions about local evidence, demographics, constraints, or any contextual data
        </p>
      </div>

      {/* Topic filters (hidden if override provided to rely on sidebar chips) */}
      {!selectedTopicsOverride && (
        <div>
          <label className="block text-sm font-medium text-[color:var(--ink)] mb-3">Filter by Topic (optional)</label>
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
        <button onClick={() => runPreset('Deepen Housing Analysis', 'Provide a deeper analysis of housing need, delivery pipeline, and affordability challenges.', councilData.topics.filter(t=>t.id.includes('housing')).map(t=>t.id))} className="px-4 py-2 rounded-lg bg-[color:var(--accent)] text-white">Deepen Housing Analysis</button>
        <button onClick={() => runPreset('Deepen Transport Analysis', 'Assess transport capacity, active travel priorities, and station-led intensification opportunities.', councilData.topics.filter(t=>t.id.includes('transport')).map(t=>t.id))} className="px-4 py-2 rounded-lg bg-[color:var(--panel)] border border-[color:var(--edge)] text-[color:var(--ink)]">Deepen Transport Analysis</button>
        <button onClick={() => runPreset('Deepen Environment Analysis', 'Analyse climate constraints, flood risk, and nature recovery opportunities.', councilData.topics.filter(t=>t.id.includes('environment')||t.id.includes('climate')).map(t=>t.id))} className="px-4 py-2 rounded-lg bg-[color:var(--panel)] border border-[color:var(--edge)] text-[color:var(--ink)]">Deepen Environment Analysis</button>
      </div>

      {/* Query input (optional) */}
      <details className="bg-[color:var(--surface)] border border-[color:var(--edge)] rounded-lg p-3">
        <summary className="text-sm font-medium text-[color:var(--ink)] cursor-pointer">Advanced: Ask a custom question</summary>
        <div className="mt-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., What are the key housing needs in the borough? What environmental constraints affect development?"
            rows={3}
            className="w-full px-4 py-3 bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg text-[color:var(--ink)] placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
          />
        </div>
      </details>

      {/* Submit button */}
      <button
        onClick={handleQuery}
        disabled={loading || !query.trim()}
        className="w-full md:w-auto px-6 py-3 bg-[color:var(--accent)] text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
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
            {cards.map((card, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-[color:var(--ink)] mb-2">🗺️ {card.title}</h3>
                {card.question && <p className="text-xs text-[color:var(--muted)] mb-3">Question used: {card.question}</p>}
                <StructuredMarkdown content={card.content} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
