import React, { useState } from 'react';
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
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const prompt = prompts.evidencePrompt(query, selectedTopics);
      const result = await callGemini(prompt);
      setResponse(result || 'No response generated.');
    } catch (error) {
      setResponse('Error generating response. Please try again.');
    } finally {
      setLoading(false);
    }
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

      {/* Query input */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--ink)] mb-2">
          Your Question
        </label>
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

      {/* Response */}
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

        {!loading && response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-[color:var(--ink)] mb-4">
              Evidence Summary
            </h3>
            <MarkdownContent content={response} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
