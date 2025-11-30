import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptFunctions } from '../../../../prompts';
import { callLLM } from '../../../../utils/llmClient';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Button } from '../../shared/Button';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import { CONSULTATION_SAMPLES } from '../../../../data/consultationSamples';
import { usePlan } from '../../../../contexts/PlanContext';

interface FeedbackAnalysisToolProps {
  prompts: PromptFunctions;
  councilId?: string;
  initialText?: string;
  initialThemes?: Theme[];
  autoRun?: boolean;
  onSessionChange?: (session: { consultationText: string; themes: Theme[]; summary?: string }) => void;
}

interface Theme {
  title: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  count: number;
  summary: string;
}

export const FeedbackAnalysisTool: React.FC<FeedbackAnalysisToolProps> = ({ prompts, councilId, initialText, initialThemes, autoRun, onSessionChange }) => {
  const { activePlan, updatePlan } = usePlan();
  const [consultationText, setConsultationText] = useState('');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [narrativeSummary, setNarrativeSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (initialThemes && initialThemes.length) setThemes(initialThemes);
    if (autoRun && (initialText || '').trim()) {
      setConsultationText(initialText as string);
      return;
    }
    // Pre-fill with a long, unstructured dump to show summarising large free text, scoped by council if available
    const sample = (councilId && CONSULTATION_SAMPLES[councilId]) || Object.values(CONSULTATION_SAMPLES)[0];
    setConsultationText(sample);
  }, [councilId]);
  useEffect(() => {
    if (onSessionChange) onSessionChange({ consultationText, themes, summary: narrativeSummary });
  }, [consultationText, themes, narrativeSummary, onSessionChange]);

  const analyzeFeedback = async () => {
    if (!consultationText.trim()) return;

    setLoading(true);
    const prompt = prompts.feedbackPrompt(consultationText);
    try {
      const full = await callLLM(prompt);
      const parsedThemes = parseThemesFromResponse(full || '')
      setThemes(parsedThemes)
    } catch (error) {
      setThemes([])
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    // Optionally auto-run on mount or when initial text set
    if (consultationText && (autoRun || initialText)) {
      analyzeFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultationText]);

  const parseThemesFromResponse = (response: string): Theme[] => {
    // Simple parsing logic - in production this would be more robust
    const lines = response.split('\n').filter(l => l.trim());
    const themes: Theme[] = [];
    
    let currentTheme: Partial<Theme> = {};
    
    lines.forEach(line => {
      if (line.match(/^Theme \d+:/i) || line.match(/^\d+\./)) {
        if (currentTheme.title) {
          themes.push({
            title: currentTheme.title,
            sentiment: currentTheme.sentiment || 'neutral',
            count: currentTheme.count || 1,
            summary: currentTheme.summary || ''
          });
        }
        currentTheme = { title: line.replace(/^(Theme \d+:|^\d+\.)/, '').trim() };
      } else if (line.toLowerCase().includes('sentiment:')) {
        const sentiment = line.toLowerCase().includes('positive') ? 'positive' 
          : line.toLowerCase().includes('negative') ? 'negative' 
          : 'neutral';
        currentTheme.sentiment = sentiment;
      } else if (line.toLowerCase().includes('mentions:') || line.toLowerCase().includes('count:')) {
        const count = parseInt(line.match(/\d+/)?.[0] || '1');
        currentTheme.count = count;
      } else if (line.trim() && !line.match(/^(Summary|Analysis):/i)) {
        currentTheme.summary = (currentTheme.summary || '') + ' ' + line.trim();
      }
    });
    
    if (currentTheme.title) {
      themes.push({
        title: currentTheme.title,
        sentiment: currentTheme.sentiment || 'neutral',
        count: currentTheme.count || 1,
        summary: currentTheme.summary || ''
      });
    }
    
    return themes.length > 0 ? themes : [
      {
        title: 'Analysis Summary',
        sentiment: 'neutral',
        count: 1,
        summary: response
      }
    ];
  };

  const generateNarrativeSummary = async () => {
    if (!consultationText.trim() && themes.length === 0) return;
    setSummaryLoading(true);
    try {
      const themeText = themes.length ? themes.map(t => `- ${t.title} (${t.sentiment}, ~${t.count}): ${t.summary}`).join('\n') : 'No themes parsed yet.'
      const prompt = `You are drafting a concise narrative summary of consultation feedback for a Local Plan.

Source feedback (raw):
${consultationText || 'No raw text provided.'}

Parsed themes (if any):
${themeText}

Task: Write a short, balanced markdown summary (150-250 words) covering who responded, main issues, positives/concerns, and any contradictions. Keep neutral tone and note evidence gaps.`
      const result = await callLLM({ mode: 'markdown', prompt })
      setNarrativeSummary(result || 'No summary generated.')
    } catch (e) {
      setNarrativeSummary('Could not generate a summary right now.')
    } finally {
      setSummaryLoading(false)
    }
  }

  const saveSummaryToPlan = () => {
    if (!activePlan || !narrativeSummary.trim()) return;
    setSaving(true);
    const targetStage = activePlan.planStage === 'CONSULTATION_2' ? 'CONSULTATION_2' : 'CONSULTATION_1';
    const existing = activePlan.consultationSummaries || [];
    const mainIssues = themes.length
      ? themes.map(t => `${t.title} (${t.sentiment}, ~${t.count}): ${t.summary}`)
      : [narrativeSummary];
    const newTags = themes.length
      ? themes.map((t, idx) => ({ id: `rep_${Date.now()}_${idx}`, issue: t.title, sentiment: t.sentiment }))
      : [];
    const nextSummary = {
      stageId: targetStage,
      who: 'Draft summary',
      when: new Date().toISOString(),
      how: 'FeedbackAnalysisTool',
      mainIssues,
      intendedChanges: narrativeSummary
    } as any;

    const filtered = existing.filter(c => !(c.stageId === targetStage && c.how === 'FeedbackAnalysisTool'));
    const repTags = activePlan.representationTags || [];
    updatePlan(activePlan.id, {
      consultationSummaries: [...filtered, nextSummary],
      representationTags: newTags.length ? [...repTags, ...newTags] : repTags
    });
    setSaveStatus('Saved to plan');
    setTimeout(() => setSaveStatus(null), 2000);
    setSaving(false);
  }

  const getSentimentColor = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return 'bg-green-50 text-green-700 border-green-400';
      case 'negative': return 'bg-red-50 text-red-700 border-red-400';
      default: return 'bg-orange-50 text-orange-700 border-orange-400';
    }
  };

  const getSentimentIcon = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return '✓';
      case 'negative': return '✗';
      default: return '○';
    }
  };

  const getSentimentBorderAccent = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return 'border-l-4 border-l-green-500';
      case 'negative': return 'border-l-4 border-l-red-500';
      default: return 'border-l-4 border-l-orange-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">
          Consultation Feedback Analysis
        </h2>
        <p className="text-[var(--color-muted)]">
          Paste consultation responses to identify key themes and sentiments
        </p>
      </div>

      {/* Primary action */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={analyzeFeedback} disabled={loading || !consultationText.trim()} variant="primary">
          {loading ? 'Analyzing...' : 'Analyze feedback'}
        </Button>
        <Button onClick={generateNarrativeSummary} disabled={(summaryLoading || loading) || (!consultationText.trim() && themes.length === 0)} variant="secondary">
          {summaryLoading ? 'Summarizing…' : 'Generate narrative summary'}
        </Button>
        <Button onClick={saveSummaryToPlan} disabled={saving || !narrativeSummary.trim() || !activePlan} variant="secondary">
          {saving ? 'Saving…' : 'Save to plan'}
        </Button>
        {saveStatus && <span className="text-xs text-[var(--color-muted)]">{saveStatus}</span>}
        <button className="text-sm text-[var(--color-accent)] hover:underline" onClick={() => { setThemes([]); setConsultationText(''); setNarrativeSummary(''); }}>Paste your own instead</button>
      </div>

      {/* Input (optional) */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">
          Consultation Responses (optional)
        </label>
        <textarea
          value={consultationText}
          onChange={(e) => setConsultationText(e.target.value)}
          placeholder="Paste consultation feedback, survey responses, or public comments here..."
          rows={10}
          className="w-full px-4 py-3 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg text-[var(--color-ink)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] font-mono text-sm"
        />
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

        {!loading && themes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">
              Key Themes Identified
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {themes.map((theme, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6 ${getSentimentBorderAccent(theme.sentiment)}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h4 className="text-lg font-semibold text-[var(--color-ink)] flex-1">
                      {theme.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getSentimentColor(theme.sentiment)}`}>
                        {getSentimentIcon(theme.sentiment)} {theme.sentiment.toUpperCase()}
                      </span>
                      {theme.count > 1 && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-surface)] text-[var(--color-muted)] border-2 border-[var(--color-edge)]">
                          {theme.count} mentions
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-[var(--color-muted)]">
                    <MarkdownContent content={theme.summary} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Narrative summary */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">Narrative summary</h3>
          {summaryLoading && <span className="text-xs text-[var(--color-muted)]">Generating…</span>}
        </div>
        {narrativeSummary ? (
          <div className="prose prose-sm max-w-none text-[var(--color-ink)]">
            <MarkdownContent content={narrativeSummary} />
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)]">Generate to produce a short, balanced Consultation 1/2 narrative.</p>
        )}
      </div>
    </div>
  );
};
