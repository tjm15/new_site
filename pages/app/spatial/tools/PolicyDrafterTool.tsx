import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callGemini } from '../../../../utils/gemini';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Button } from '../../shared/Button';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import { StructuredMarkdown } from '../../../../components/StructuredMarkdown';

interface PolicyDrafterToolProps {
  councilData: CouncilData;
  prompts: PromptFunctions;
  initialTopic?: string;
  initialBrief?: string;
  initialDraftPolicy?: string;
  initialVariants?: string[];
  autoRun?: boolean;
  onSessionChange?: (session: { selectedTopic: string; policyBrief: string; draftPolicy: string; variants: string[] }) => void;
}

export const PolicyDrafterTool: React.FC<PolicyDrafterToolProps> = ({ councilData, prompts, initialTopic, initialBrief, initialDraftPolicy, initialVariants, autoRun, onSessionChange }) => {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [policyBrief, setPolicyBrief] = useState('');
  const [draftPolicy, setDraftPolicy] = useState('');
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<string[]>([]);

  useEffect(() => {
    // Restore session if provided
    if (initialDraftPolicy) setDraftPolicy(initialDraftPolicy);
    if (initialVariants && initialVariants.length) setVariants(initialVariants);
    if (initialBrief) setPolicyBrief(initialBrief);

    // If initial props provided via autopick, run that first
    if (autoRun && (initialTopic || initialBrief)) {
      const topic = initialTopic || councilData.topics[0]?.id || '';
      setSelectedTopic(topic);
      generatePolicyFromTopic(topic, initialBrief || '');
      return;
    }
    // If restoring a previous draft, skip auto generation
    if (initialDraftPolicy) {
      setSelectedTopic(initialTopic || councilData.topics[0]?.id || '');
      return;
    }
    // Preselect first topic and auto-draft on load
    const first = councilData.topics[0]?.id;
    if (first) {
      setSelectedTopic(first);
      generatePolicyFromTopic(first);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (onSessionChange) {
      onSessionChange({ selectedTopic, policyBrief, draftPolicy, variants });
    }
  }, [selectedTopic, policyBrief, draftPolicy, variants, onSessionChange]);

  const generatePolicyFromTopic = async (topicId: string, brief: string = '') => {
    setLoading(true);
    try {
      const prompt = prompts.policyDraftPrompt(topicId, brief);
      const result = await callGemini(prompt);
      setDraftPolicy(result || 'No policy draft generated.');
      setVariants([
        'Provide a stricter compliance variant with measurable thresholds.',
        'Provide a more flexible design-led variant with guidance.',
        'Provide a concise summary variant suitable for a policy box.'
      ]);
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

      {/* One-click topics list */}
      <div>
        <div className="text-sm font-medium text-[color:var(--ink)] mb-2">Draft from a topic</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {councilData.topics.slice(0,5).map((topic) => (
            <div key={topic.id} className="flex items-center justify-between bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg p-3">
              <div className="text-[color:var(--ink)] font-semibold">{topic.label}</div>
              <button onClick={() => { setSelectedTopic(topic.id); generatePolicyFromTopic(topic.id); }} className="px-3 py-1.5 rounded bg-[color:var(--accent)] text-white text-sm">Draft policy</button>
            </div>
          ))}
        </div>
      </div>

      {/* Policy brief input (optional) */}
      <details className="bg-[color:var(--surface)] border border-[color:var(--edge)] rounded-lg p-3">
        <summary className="block text-sm font-medium text-[color:var(--ink)] cursor-pointer">Advanced: Add custom instructions (optional)</summary>
        <div className="mt-3">
          <textarea
            value={policyBrief}
            onChange={(e) => setPolicyBrief(e.target.value)}
            placeholder="Describe what the policy should achieve, key requirements, thresholds, or specific considerations..."
            rows={4}
            className="w-full px-4 py-3 bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg text-[color:var(--ink)] placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
          />
        </div>
      </details>

      {/* Generate button */}
      <Button onClick={() => generatePolicyFromTopic(selectedTopic, policyBrief)} disabled={loading || !selectedTopic} variant="primary">
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
              <h3 className="text-lg font-semibold text-[color:var(--ink)]">📄 Draft Policy</h3>
              <button
                onClick={() => navigator.clipboard.writeText(draftPolicy)}
                className="text-sm text-[color:var(--accent)] hover:underline"
              >
                Copy to Clipboard
              </button>
            </div>
            <div className="bg-[color:var(--surface)] p-4 rounded-lg">
              <StructuredMarkdown content={draftPolicy} />
            </div>
            {variants.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {variants.map((v, idx) => (
                  <button key={idx} onClick={() => generatePolicyFromTopic(selectedTopic, v)} className="px-3 py-1.5 rounded bg-[color:var(--panel)] border border-[color:var(--edge)] text-[color:var(--ink)] text-xs">Alternative phrasing {idx+1}</button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
