import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData, VisionOutcome } from '../../../../data/types';
import { usePlan } from '../../../../contexts/PlanContext';
import { runLLMTask } from '../../../../utils/llmTasks';
import { callLLMStream } from '../../../../utils/llmClient';
import { PromptFunctions } from '../../../../prompts';
import { callGeminiImage } from '../../../../utils/gemini';
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
  const [outcomes, setOutcomes] = useState<VisionOutcome[]>([]);
  const { activePlan, updatePlan } = usePlan();
  const [links, setLinks] = useState<Record<string, { policies: string[]; sites: string[] }>>({});
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
      let acc = ''
      for await (const chunk of callLLMStream(prompt)) {
        acc += chunk
        setVisionText(acc)
      }
      setVisionText(acc || 'No vision generated.')
      // Highlights
      let hacc = ''
      for await (const chunk of callLLMStream(`Summarise concept highlights as 5 concise bullets for: ${areaDescription}`)) {
        hacc += chunk
        setHighlightsText(hacc)
      }
      setHighlightsText(hacc || '')
      // Ask AI to propose measurable outcomes and cap to 10
      try {
        const raw = await runLLMTask('vision_suggest', {
          authorityName: councilData.name,
          areaDescription
        });
        const refined = await runLLMTask('vision_refine', {
          rawOutcomes: Array.isArray(raw) ? raw : [String(raw || '')],
          maxOutcomes: 10
        });
        const parsed: VisionOutcome[] = Array.isArray(refined) ? refined : [];
        setOutcomes(parsed.slice(0, 10));
        if (activePlan && activePlan.councilId === councilData.id) {
          updatePlan(activePlan.id, { visionStatements: parsed.slice(0, 10) });
        }
      } catch (e) {
        // Non-blocking
        console.warn('Outcome suggestion failed', e);
      }
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
          let acc = ''
          for await (const chunk of callLLMStream(prompt)) {
            acc += chunk
            setVisionText(acc)
          }
          setVisionText(acc || '')
          let hacc = ''
          for await (const chunk of callLLMStream(`Summarise concept highlights as 5 concise bullets for: ${txt}`)) {
            hacc += chunk
            setHighlightsText(hacc)
          }
          setHighlightsText(hacc || '')
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
        let acc = ''
        for await (const chunk of callLLMStream(prompt)) {
          acc += chunk
          setVisionText(acc)
        }
        setVisionText(acc || '')
        let hacc = ''
        for await (const chunk of callLLMStream(`Summarise concept highlights as 5 concise bullets for: ${demo}`)) {
          hacc += chunk
          setHighlightsText(hacc)
        }
        setHighlightsText(hacc || '')
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

        {/* Outcomes list */}
        {outcomes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">🎯 Proposed Outcomes (max 10)</h3>
            <ul className="space-y-2">
              {outcomes.slice(0, 10).map((o) => (
                <li key={o.id} className="text-sm space-y-2">
                  <div>
                    <span className="font-medium text-[var(--color-ink)]">{o.text}</span>
                    {o.metric && (
                      <span className="ml-2 text-[var(--color-muted)]">Metric: {o.metric}</span>
                    )}
                  </div>
                  {/* Simple linkers to policies/sites */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-[var(--color-muted)] mb-1">Link Policies</div>
                      <select multiple className="w-full border border-[var(--color-edge)] rounded p-2 text-sm"
                        value={links[o.id]?.policies || []}
                        onChange={(e)=>{
                          const selected = Array.from(e.target.selectedOptions).map(opt=>opt.value)
                          const next = { ...(links[o.id]||{ policies: [], sites: [] }), policies: selected }
                          setLinks(prev=>({ ...prev, [o.id]: next }))
                          if (activePlan && activePlan.councilId === councilData.id) {
                            const updated = activePlan.visionStatements.map(v=> v.id===o.id ? { ...v, linkedPolicies: selected } : v)
                            updatePlan(activePlan.id, { visionStatements: updated })
                          }
                        }}
                      >
                        {councilData.policies.slice(0,10).map(p=> (
                          <option key={p.reference} value={p.reference}>{p.reference} {p.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--color-muted)] mb-1">Link Sites</div>
                      <select multiple className="w-full border border-[var(--color-edge)] rounded p-2 text-sm"
                        value={links[o.id]?.sites || []}
                        onChange={(e)=>{
                          const selected = Array.from(e.target.selectedOptions).map(opt=>opt.value)
                          const next = { ...(links[o.id]||{ policies: [], sites: [] }), sites: selected }
                          setLinks(prev=>({ ...prev, [o.id]: next }))
                          if (activePlan && activePlan.councilId === councilData.id) {
                            const updated = activePlan.visionStatements.map(v=> v.id===o.id ? { ...v, linkedSites: selected } : v)
                            updatePlan(activePlan.id, { visionStatements: updated })
                          }
                        }}
                      >
                        {activePlan?.sites?.length ? activePlan.sites.map(s=> (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        )) : councilData.spatialData.allocations.slice(0,10).map(s=> (
                          <option key={s.id} value={s.id}>{s.name||s.id}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
