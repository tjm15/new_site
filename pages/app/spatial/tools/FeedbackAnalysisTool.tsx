import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptFunctions } from '../../../../prompts';
import { callGemini } from '../../../../utils/gemini';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Button } from '../../shared/Button';
import { MarkdownContent } from '../../../../components/MarkdownContent';

interface FeedbackAnalysisToolProps {
  prompts: PromptFunctions;
  initialText?: string;
  initialThemes?: Theme[];
  autoRun?: boolean;
  onSessionChange?: (session: { consultationText: string; themes: Theme[] }) => void;
}

interface Theme {
  title: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  count: number;
  summary: string;
}

export const FeedbackAnalysisTool: React.FC<FeedbackAnalysisToolProps> = ({ prompts, initialText, initialThemes, autoRun, onSessionChange }) => {
  const [consultationText, setConsultationText] = useState('');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialThemes && initialThemes.length) setThemes(initialThemes);
    if (autoRun && (initialText || '').trim()) {
      setConsultationText(initialText as string);
      return;
    }
    // Pre-fill with sample block (lightweight demo text)
    const sample = `Theme 1: Affordable housing\nSentiment: positive\nMentions: 24\nA strong desire to see genuinely affordable homes delivered in town centre sites, with support for higher density near transit.\n\nTheme 2: Tall buildings\nSentiment: negative\nMentions: 18\nConcerns about height and massing in certain locations, preference for mid-rise typologies with good design and sunlight.\n\nTheme 3: Active travel\nSentiment: positive\nMentions: 30\nSupport for safer cycling and walking routes, street improvements, and car-free development policies.`;
    setConsultationText(sample);
  }, []);
  useEffect(() => {
    if (onSessionChange) onSessionChange({ consultationText, themes });
  }, [consultationText, themes, onSessionChange]);

  const analyzeFeedback = async () => {
    if (!consultationText.trim()) return;

    setLoading(true);
    try {
      const prompt = prompts.feedbackPrompt(consultationText);
      const result = await callGemini(prompt);
      
      // Parse the result to extract themes
      // For demo purposes, we'll parse a structured response
      // In production, this would be more sophisticated
      const parsedThemes = parseThemesFromResponse(result || '');
      setThemes(parsedThemes);
    } catch (error) {
      setThemes([]);
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-bold text-[color:var(--ink)] mb-2">
          Consultation Feedback Analysis
        </h2>
        <p className="text-[color:var(--muted)]">
          Paste consultation responses to identify key themes and sentiments
        </p>
      </div>

      {/* Primary action */}
      <div className="flex items-center gap-3">
        <Button onClick={analyzeFeedback} disabled={loading || !consultationText.trim()} variant="primary">
          {loading ? 'Analyzing...' : 'Analyze sample feedback'}
        </Button>
        <button className="text-sm text-[color:var(--accent)] hover:underline" onClick={() => { setThemes([]); setConsultationText(''); }}>Paste your own instead</button>
      </div>

      {/* Input (optional) */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--ink)] mb-2">
          Consultation Responses (optional)
        </label>
        <textarea
          value={consultationText}
          onChange={(e) => setConsultationText(e.target.value)}
          placeholder="Paste consultation feedback, survey responses, or public comments here..."
          rows={10}
          className="w-full px-4 py-3 bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg text-[color:var(--ink)] placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] font-mono text-sm"
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
            <h3 className="text-lg font-semibold text-[color:var(--ink)]">
              Key Themes Identified
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {themes.map((theme, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-6 ${getSentimentBorderAccent(theme.sentiment)}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h4 className="text-lg font-semibold text-[color:var(--ink)] flex-1">
                      {theme.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getSentimentColor(theme.sentiment)}`}>
                        {getSentimentIcon(theme.sentiment)} {theme.sentiment.toUpperCase()}
                      </span>
                      {theme.count > 1 && (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[color:var(--surface)] text-[color:var(--muted)] border-2 border-[color:var(--edge)]">
                          {theme.count} mentions
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-[color:var(--muted)]">
                    <MarkdownContent content={theme.summary} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
