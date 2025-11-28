import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callGemini, callGeminiImage } from '../../../../utils/gemini';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Button } from '../../shared/Button';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import { StructuredMarkdown } from '../../../../components/StructuredMarkdown';

interface VisionConceptsToolProps {
  councilData: CouncilData;
  prompts: PromptFunctions;
  initialArea?: string;
  initialVisionText?: string;
  initialHighlightsText?: string;
  initialConceptImage?: string;
  autoRun?: boolean;
  onSessionChange?: (session: { areaDescription: string; visionText: string; highlightsText: string; conceptImage: string }) => void;
}

export const VisionConceptsTool: React.FC<VisionConceptsToolProps> = ({ councilData, prompts, initialArea, initialVisionText, initialHighlightsText, initialConceptImage, autoRun, onSessionChange }) => {
  const [areaDescription, setAreaDescription] = useState('');
  const [visionText, setVisionText] = useState('');
  const [highlightsText, setHighlightsText] = useState('');
  const [conceptImage, setConceptImage] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const presetAreas = [
    `${councilData.name} station-led intensification corridor`,
    `${councilData.name} high street renewal zone`,
    `${councilData.name} mixed-use warehouse quarter`
  ];

  const generateVision = async () => {
    if (!areaDescription.trim()) return;

    setLoadingText(true);
    try {
      const prompt = prompts.visionPrompt(areaDescription);
      const result = await callGemini(prompt);
      setVisionText(result || 'No vision generated.');
      const highlights = await callGemini(`Summarise concept highlights as 5 concise bullets for: ${areaDescription}`);
      setHighlightsText(highlights || '');
    } catch (error) {
      setVisionText('Error generating vision. Please try again.');
    } finally {
      setLoadingText(false);
    }
  };

  const generateConcept = async () => {
    if (!areaDescription.trim()) return;

    setLoadingImage(true);
    try {
      const prompt = prompts.conceptPrompt(areaDescription);
      const result = await callGeminiImage(prompt);
      setConceptImage(result || '');
    } catch (error) {
      console.error('Error generating concept image:', error);
    } finally {
      setLoadingImage(false);
    }
  };

  useEffect(() => {
    // Restore session if provided
    if (initialVisionText) setVisionText(initialVisionText);
    if (initialHighlightsText) setHighlightsText(initialHighlightsText);
    if (initialConceptImage) setConceptImage(initialConceptImage);

    // If autopick provided an area, use it and run
    if (autoRun && (initialArea || '').trim()) {
      const txt = initialArea as string;
      setAreaDescription(txt);
      (async () => {
        setLoadingText(true);
        try {
          const prompt = prompts.visionPrompt(txt);
          const result = await callGemini(prompt);
          setVisionText(result || '');
          const highlights = await callGemini(`Summarise concept highlights as 5 concise bullets for: ${txt}`);
          setHighlightsText(highlights || '');
        } finally {
          setLoadingText(false);
        }
      })();
      return;
    }
    // If restoring previous vision text, skip auto demo generation
    if (initialVisionText) return;
    // Prefill demo area and auto-generate on load
    const demo = `${councilData.name} growth corridor`;
    setAreaDescription(demo);
    (async () => {
      setLoadingText(true);
      try {
        const prompt = prompts.visionPrompt(demo);
        const result = await callGemini(prompt);
        setVisionText(result || '');
        const highlights = await callGemini(`Summarise concept highlights as 5 concise bullets for: ${demo}`);
        setHighlightsText(highlights || '');
      } finally {
        setLoadingText(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (onSessionChange) {
      onSessionChange({ areaDescription, visionText, highlightsText, conceptImage });
    }
  }, [areaDescription, visionText, highlightsText, conceptImage, onSessionChange]);

  const runPresetArea = async (text: string) => {
    setAreaDescription(text);
    await generateVision();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">
          Vision & Concepts Generator
        </h2>
        <p className="text-[var(--color-muted)]">
          Generate vision statements and visual concepts for development areas
        </p>
      </div>

      {/* Preset concept buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => runPresetArea(presetAreas[0])} variant="primary">Station-led intensification</Button>
        <Button onClick={() => runPresetArea(presetAreas[1])} variant="secondary">High street renewal</Button>
        <Button onClick={() => runPresetArea(presetAreas[2])} variant="secondary">Mixed-use warehouse quarter</Button>
      </div>

      {/* Area description input (optional) */}
      <details className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg p-3">
        <summary className="block text-sm font-medium text-[var(--color-ink)] cursor-pointer">Advanced: Describe a custom area (optional)</summary>
        <div className="mt-3">
          <textarea
            value={areaDescription}
            onChange={(e) => setAreaDescription(e.target.value)}
            placeholder="e.g., A former industrial site along the canal, 5 hectares, opportunity for mixed-use regeneration with improved public realm"
            rows={3}
            className="w-full px-4 py-3 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg text-[var(--color-ink)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
        </div>
      </details>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={generateVision}
          disabled={loadingText || !areaDescription.trim()}
          variant="primary"
        >
          {loadingText ? 'Generating...' : 'Generate Vision Statement'}
        </Button>
        <Button
          onClick={generateConcept}
          disabled={loadingImage || !areaDescription.trim()}
          variant="secondary"
        >
          {loadingImage ? 'Generating...' : 'Generate Visual Concept'}
        </Button>
      </div>

      {/* Vision text output */}
      <AnimatePresence mode="wait">
        {loadingText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center py-12"
          >
            <LoadingSpinner />
          </motion.div>
        )}

        {!loadingText && visionText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">🎯 Vision Statement</h3>
            <StructuredMarkdown content={visionText} />
          </motion.div>
        )}
        {!loadingText && highlightsText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">✨ Concept Highlights</h3>
            <StructuredMarkdown content={highlightsText} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Concept image output */}
      <AnimatePresence mode="wait">
        {loadingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl"
          >
            <LoadingSpinner />
            <p className="mt-4 text-sm text-[var(--color-muted)]">Generating visual concept...</p>
          </motion.div>
        )}

        {!loadingImage && conceptImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">🖼️ Visual Concept</h3>
            <img
              src={conceptImage}
              alt="Generated concept"
              className="w-full rounded-lg shadow-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
