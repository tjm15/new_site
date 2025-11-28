import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callGemini } from '../../../../utils/gemini';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Button } from '../../shared/Button';
import { MarkdownContent } from '../../../../components/MarkdownContent';

interface PolicyDrafterToolProps {
  councilData: CouncilData;
  prompts: PromptFunctions;
}

export const PolicyDrafterTool: React.FC<PolicyDrafterToolProps> = ({ councilData, prompts }) => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [policyBrief, setPolicyBrief] = useState('');
  const [draftPolicy, setDraftPolicy] = useState('');
  const [loading, setLoading] = useState(false);

  const generatePolicy = async () => {
    if (!selectedTopic || !policyBrief.trim()) return;

    setLoading(true);
    try {
      const prompt = prompts.policyDraftPrompt(selectedTopic, policyBrief);
      const result = await callGemini(prompt);
      setDraftPolicy(result || 'No policy draft generated.');
    } catch (error) {
      setDraftPolicy('Error generating policy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[color:var(--ink)] mb-2">
          Policy Drafter
        </h2>
        <p className="text-[color:var(--muted)]">
          Generate draft policy wording based on topic and requirements
        </p>
      </div>

      {/* Topic selection */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--ink)] mb-2">
          Policy Topic
        </label>
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="w-full px-4 py-3 bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg text-[color:var(--ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
        >
          <option value="">Select a topic...</option>
          {councilData.topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.label}
            </option>
          ))}
        </select>
      </div>

      {/* Policy brief input */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--ink)] mb-2">
          Policy Brief
        </label>
        <textarea
          value={policyBrief}
          onChange={(e) => setPolicyBrief(e.target.value)}
          placeholder="Describe what the policy should achieve, key requirements, thresholds, or specific considerations..."
          rows={6}
          className="w-full px-4 py-3 bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg text-[color:var(--ink)] placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
        />
      </div>

      {/* Generate button */}
      <Button
        onClick={generatePolicy}
        disabled={loading || !selectedTopic || !policyBrief.trim()}
        variant="primary"
      >
        {loading ? 'Generating...' : 'Generate Policy Draft'}
      </Button>

      {/* Policy draft output */}
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

        {!loading && draftPolicy && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[color:var(--ink)]">
                Draft Policy
              </h3>
              <button
                onClick={() => navigator.clipboard.writeText(draftPolicy)}
                className="text-sm text-[color:var(--accent)] hover:underline"
              >
                Copy to Clipboard
              </button>
            </div>
            <div className="bg-[color:var(--surface)] p-4 rounded-lg">
              <MarkdownContent content={draftPolicy} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
