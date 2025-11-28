import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callGemini } from '../../../../utils/gemini';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Chip } from '../../shared/Chip';
import { MarkdownContent } from '../../../../components/MarkdownContent';

interface EvidenceToolProps {
  councilData: CouncilData;
  prompts: PromptFunctions;
}

export const EvidenceTool: React.FC<EvidenceToolProps> = ({ councilData, prompts }) => {
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
    // Only run auto-queries once on initial mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const housingTopics = councilData.topics.filter(t => t.id.includes('housing')).map(t => t.id);
    const transportTopics = councilData.topics.filter(t => t.id.includes('transport')).map(t => t.id);
    const environmentTopics = councilData.topics.filter(t => t.id.includes('environment') || t.id.includes('climate')).map(t => t.id);

    runPreset('Housing Need & Delivery', 'Summarise housing pressures, delivery targets and affordability for this LPA.', housingTopics);
    runPreset('Spatial Distribution of Growth', 'Describe how growth is distributed across places and centres.', transportTopics);
    runPreset('Environmental Constraints', 'Outline key environmental constraints affecting development.', environmentTopics);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* Topic filters */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--ink)] mb-3">
          Filter by Topic (optional)
        </label>
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

      {/* Preset deepen actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => runPreset('Deepen Housing Analysis', 'Provide a deeper analysis of housing need, delivery pipeline, and affordability challenges.', councilData.topics.filter(t=>t.id.includes('housing')).map(t=>t.id))} className="px-4 py-2 rounded-lg bg-[color:var(--accent)] text-white">Deepen Housing Analysis</button>
        <button onClick={() => runPreset('Deepen Transport Analysis', 'Assess transport capacity, active travel priorities, and station-led intensification opportunities.', councilData.topics.filter(t=>t.id.includes('transport')).map(t=>t.id))} className="px-4 py-2 rounded-lg bg-[color:var(--panel)] border border-[color:var(--edge)] text-[color:var(--ink)]">Deepen Transport Analysis</button>
        <button onClick={() => runPreset('Deepen Environment Analysis', 'Analyse climate constraints, flood risk, and nature recovery opportunities.', councilData.topics.filter(t=>t.id.includes('environment')||t.id.includes('climate')).map(t=>t.id))} className="px-4 py-2 rounded-lg bg-[color:var(--panel)] border border-[color:var(--edge)] text-[color:var(--ink)]">Deepen Environment Analysis</button>
      </div>

      {/* Query input (optional) */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--ink)] mb-2">Custom question (optional)</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., What are the key housing needs in the borough? What environmental constraints affect development?"
          rows={4}
          className="w-full px-4 py-3 bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg text-[color:var(--ink)] placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
        />
      </div>

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
                <h3 className="text-lg font-semibold text-[color:var(--ink)] mb-2">{card.title}</h3>
                {card.question && <p className="text-xs text-[color:var(--muted)] mb-3">Question used: {card.question}</p>}
                <MarkdownContent content={card.content} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
