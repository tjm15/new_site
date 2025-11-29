import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlanningApplication, CouncilData } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callLLMStream } from '../../../../utils/llmClient';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Button } from '../../shared/Button';
import { MarkdownContent } from '../../../../components/MarkdownContent';

interface ContextStageProps {
  application: PlanningApplication;
  councilData: CouncilData;
  extractedData: any;
  prompts: PromptFunctions;
  onComplete: (contextAnalysis: string) => void;
  onBack: () => void;
}

export const ContextStage: React.FC<ContextStageProps> = ({
  application,
  councilData,
  extractedData,
  prompts,
  onComplete,
  onBack
}) => {
  const [contextAnalysis, setContextAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const generateContext = async () => {
    setLoading(true);
    try {
      const prompt = prompts.contextPrompt(application);
      let acc = ''
      try {
        for await (const chunk of callLLMStream(prompt)) {
          acc += chunk
          setContextAnalysis(acc)
        }
      } catch (e) {
        console.error('Context generation stream failed', e)
      }
      setContextAnalysis(acc || 'No context analysis generated.')
    } catch (error) {
      setContextAnalysis('Error generating context. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const relevantPolicies = councilData.policies.filter(p =>
    extractedData.applicablePolicies?.some((ap: string) =>
      p.reference.includes(ap) || ap.includes(p.reference)
    )
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <button onClick={onBack} className="text-[var(--color-accent)] hover:underline">
          ← Back
        </button>
        <span>•</span>
        <span>Step 2 of 4: Context Analysis</span>
      </div>

      {/* Application summary */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
        <h3 className="font-semibold text-[var(--color-ink)] mb-1">
          {application.reference}
        </h3>
        <p className="text-sm text-[var(--color-muted)]">{application.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Constraints & Policies */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">
            Planning Context
          </h3>

          {/* Extracted constraints */}
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
            <h4 className="font-semibold text-[var(--color-ink)] mb-3">Site Constraints</h4>
            <ul className="space-y-2">
              {extractedData.keyConstraints?.map((constraint: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-[var(--color-muted)]">{constraint}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Relevant policies */}
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
            <h4 className="font-semibold text-[var(--color-ink)] mb-3">Relevant Policies</h4>
            <div className="space-y-3">
              {relevantPolicies.map((policy) => (
                <div key={policy.reference} className="border-l-2 border-[var(--color-accent)] pl-3">
                  <div className="font-medium text-sm text-[var(--color-ink)]">
                    {policy.reference}
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">{policy.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Simple constraint map placeholder */}
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
            <h4 className="font-semibold text-[var(--color-ink)] mb-3">Site Context</h4>
            <div className="aspect-video bg-[var(--color-surface)] rounded flex items-center justify-center text-[var(--color-muted)] text-sm">
              [Site location map would appear here]
            </div>
          </div>
        </div>

        {/* AI Context Analysis */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">
              AI Context Analysis
            </h3>
            {!loading && !contextAnalysis && (
              <Button onClick={generateContext} variant="primary">
                Generate Analysis
              </Button>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {!loading && contextAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-6 max-h-[500px] overflow-y-auto">
                <MarkdownContent content={contextAnalysis} />
              </div>

              <Button
                onClick={() => onComplete(contextAnalysis)}
                variant="primary"
                className="w-full"
              >
                Continue to Reasoning Chain →
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
