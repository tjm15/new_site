import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlanningApplication } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callGemini } from '../../../../utils/gemini';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Button } from '../../shared/Button';
import { MarkdownContent } from '../../../../components/MarkdownContent';

interface ReasoningStageProps {
  application: PlanningApplication;
  contextAnalysis: string;
  prompts: PromptFunctions;
  onComplete: (reasoningChain: ReasoningPoint[]) => void;
  onBack: () => void;
}

interface ReasoningPoint {
  id: string;
  category: string;
  text: string;
  compliance: 'complies' | 'neutral' | 'conflicts';
  editable: boolean;
}

export const ReasoningStage: React.FC<ReasoningStageProps> = ({
  application,
  contextAnalysis,
  prompts,
  onComplete,
  onBack
}) => {
  const [reasoningChain, setReasoningChain] = useState<ReasoningPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const generateReasoning = async () => {
    setLoading(true);
    try {
      const prompt = prompts.reasoningPrompt(application, contextAnalysis);
      const result = await callGemini(prompt);
      
      // Parse the response into reasoning points
      const points = parseReasoningPoints(result || '');
      setReasoningChain(points);
    } catch (error) {
      console.error('Error generating reasoning:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseReasoningPoints = (response: string): ReasoningPoint[] => {
    const lines = response.split('\n').filter(l => l.trim());
    const points: ReasoningPoint[] = [];
    
    lines.forEach((line, idx) => {
      if (line.match(/^\d+\./)) {
        const text = line.replace(/^\d+\./, '').trim();
        const compliance = line.toLowerCase().includes('complies') || line.toLowerCase().includes('acceptable')
          ? 'complies'
          : line.toLowerCase().includes('conflict') || line.toLowerCase().includes('harmful')
          ? 'conflicts'
          : 'neutral';
        
        const category = 
          text.toLowerCase().includes('principle') ? 'Principle'
          : text.toLowerCase().includes('design') ? 'Design & Amenity'
          : text.toLowerCase().includes('transport') ? 'Transport'
          : text.toLowerCase().includes('environment') ? 'Environment'
          : text.toLowerCase().includes('heritage') ? 'Heritage'
          : 'Assessment';
        
        points.push({
          id: `point-${idx}`,
          category,
          text,
          compliance,
          editable: false
        });
      }
    });

    return points.length > 0 ? points : [
      {
        id: 'point-1',
        category: 'Principle',
        text: 'Development principle assessed against local plan policies',
        compliance: 'neutral',
        editable: false
      }
    ];
  };

  const updatePoint = (id: string, newText: string) => {
    setReasoningChain(prev =>
      prev.map(p => p.id === id ? { ...p, text: newText } : p)
    );
  };

  const toggleCompliance = (id: string) => {
    setReasoningChain(prev =>
      prev.map(p => {
        if (p.id === id) {
          const next = p.compliance === 'complies' ? 'neutral' : p.compliance === 'neutral' ? 'conflicts' : 'complies';
          return { ...p, compliance: next };
        }
        return p;
      })
    );
  };

  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case 'complies': return 'bg-green-100 text-green-800 border-green-300';
      case 'conflicts': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getComplianceIcon = (compliance: string) => {
    switch (compliance) {
      case 'complies': return '✓';
      case 'conflicts': return '✗';
      default: return '○';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
        <button onClick={onBack} className="text-[color:var(--accent)] hover:underline">
          ← Back
        </button>
        <span>•</span>
        <span>Step 3 of 4: Reasoning Chain</span>
      </div>

      {/* Application summary */}
      <div className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-4">
        <h3 className="font-semibold text-[color:var(--ink)] mb-1">
          {application.reference}
        </h3>
        <p className="text-sm text-[color:var(--muted)]">{application.description}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--ink)]">
              Planning Assessment Reasoning
            </h3>
            <p className="text-sm text-[color:var(--muted)]">
              AI-generated reasoning chain with policy compliance assessment
            </p>
          </div>
          {!loading && reasoningChain.length === 0 && (
            <Button onClick={generateReasoning} variant="primary">
              Generate Reasoning
            </Button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {!loading && reasoningChain.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {reasoningChain.map((point, idx) => (
              <motion.div
                key={point.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-[color:var(--accent)]">
                        {idx + 1}. {point.category}
                      </span>
                    </div>
                    {editingId === point.id ? (
                      <textarea
                        value={point.text}
                        onChange={(e) => updatePoint(point.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        className="w-full px-3 py-2 bg-[color:var(--surface)] border border-[color:var(--edge)] rounded text-sm text-[color:var(--ink)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                        rows={3}
                        autoFocus
                      />
                    ) : (
                      <p
                        onClick={() => setEditingId(point.id)}
                        className="text-sm text-[color:var(--muted)] cursor-pointer hover:text-[color:var(--ink)] transition-colors"
                      >
                        {point.text}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleCompliance(point.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${getComplianceColor(point.compliance)}`}
                  >
                    {getComplianceIcon(point.compliance)} {point.compliance}
                  </button>
                </div>
              </motion.div>
            ))}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => onComplete(reasoningChain)}
                variant="primary"
                className="flex-1"
              >
                Generate Officer Report →
              </Button>
              <Button
                onClick={generateReasoning}
                variant="outline"
              >
                Regenerate
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
