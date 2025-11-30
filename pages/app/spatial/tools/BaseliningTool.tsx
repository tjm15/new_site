import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CouncilData } from '../../../../data/types';
import { usePlan } from '../../../../contexts/PlanContext';
import { callLLM } from '../../../../utils/llmClient';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

type BaseliningProps = {
  councilData: CouncilData;
  autoRun?: boolean;
  prefill?: Record<string, any>;
};

export const BaseliningTool: React.FC<BaseliningProps> = ({ councilData, autoRun, prefill }) => {
  const { activePlan, updatePlan } = usePlan();
  const [topics, setTopics] = useState('housing, economy, transport, environment, infrastructure');
  const [focusNotes, setFocusNotes] = useState('Focus on baseline gaps and priority datasets.');
  const [datasets, setDatasets] = useState('');
  const [trends, setTrends] = useState('');
  const [swot, setSwot] = useState('');
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading] = useState<{ datasets?: boolean; trends?: boolean; swot?: boolean; narrative?: boolean }>({});
  const [status, setStatus] = useState<string | null>(null);
  const autoRanRef = useRef(false);

  const planCtx = useMemo(() => {
    if (!activePlan) return '';
    const ctx = {
      title: activePlan.title,
      area: activePlan.area,
      timetable: activePlan.timetable,
      evidenceInventory: activePlan.evidenceInventory,
      baselineNarrative: activePlan.baselineNarrative,
      swot: activePlan.swot,
      baselineTrends: activePlan.baselineTrends,
    };
    return JSON.stringify(ctx, null, 2);
  }, [activePlan]);

  useEffect(() => {
    if (!prefill) return;
    if (prefill.topics && typeof prefill.topics === 'string') setTopics(prefill.topics);
    if (prefill.focusNotes && typeof prefill.focusNotes === 'string') setFocusNotes(prefill.focusNotes);
  }, [prefill]);

  useEffect(() => {
    if (autoRun && !autoRanRef.current) {
      autoRanRef.current = true;
      generateDatasets();
      generateTrends();
      generateSwot();
      generateNarrative();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const baseInput = () => [
    `Authority: ${councilData.name}`,
    `Plan: ${activePlan?.title || 'Local Plan'} (${activePlan?.area || councilData.name})`,
    `Topics: ${topics}`,
    `Notes: ${focusNotes}`,
    `Context: ${planCtx}`,
  ].join('\n');

  const generateDatasets = async () => {
    setLoading(s => ({ ...s, datasets: true }));
    setStatus(null);
    try {
      const prompt = [
        'Suggest datasets by topic for the Local Plan baseline. Provide source suggestions.',
        'Return markdown bullets grouped by topic.',
        baseInput(),
      ].join('\n');
      const text = await callLLM({ prompt, mode: 'markdown' });
      setDatasets(text || '');
      setStatus('Datasets drafted.');
    } catch {
      setStatus('Could not generate datasets.');
    } finally {
      setLoading(s => ({ ...s, datasets: false }));
    }
  };

  const generateTrends = async () => {
    setLoading(s => ({ ...s, trends: true }));
    setStatus(null);
    try {
      const prompt = [
        'Summarise trends/issues per topic based on baseline context.',
        'Return concise bullets per topic.',
        baseInput(),
      ].join('\n');
      const text = await callLLM({ prompt, mode: 'markdown' });
      setTrends(text || '');
      setStatus('Trends drafted.');
    } catch {
      setStatus('Could not generate trends.');
    } finally {
      setLoading(s => ({ ...s, trends: false }));
    }
  };

  const generateSwot = async () => {
    setLoading(s => ({ ...s, swot: true }));
    setStatus(null);
    try {
      const prompt = [
        'Create a SWOT / key challenges list grounded in constraints and opportunities.',
        'Return markdown with four sections.',
        baseInput(),
      ].join('\n');
      const text = await callLLM({ prompt, mode: 'markdown' });
      setSwot(text || '');
      setStatus('SWOT drafted.');
    } catch {
      setStatus('Could not generate SWOT.');
    } finally {
      setLoading(s => ({ ...s, swot: false }));
    }
  };

  const generateNarrative = async () => {
    setLoading(s => ({ ...s, narrative: true }));
    setStatus(null);
    try {
      const prompt = [
        'Draft a short baseline narrative (200-300 words) for this authority.',
        'Ground it in evidence and constraints; concise, professional tone.',
        baseInput(),
      ].join('\n');
      const text = await callLLM({ prompt, mode: 'markdown' });
      setNarrative(text || '');
      setStatus('Narrative drafted.');
    } catch {
      setStatus('Could not generate narrative.');
    } finally {
      setLoading(s => ({ ...s, narrative: false }));
    }
  };

  const savePlan = () => {
    if (!activePlan) return;
    const updated: any = {};
    if (trends) updated.baselineTrends = { ...(activePlan?.baselineTrends || {}), summary: trends };
    if (swot) updated.swot = { ...(activePlan?.swot || {}), text: swot };
    if (narrative) updated.baselineNarrative = narrative;
    // naive append dataset text as notes in evidence inventory
    if (datasets) {
      const lines = datasets.split('\n').filter(l => l.trim().startsWith('-'));
      const newItems = lines.map((line, idx) => ({
        id: `auto_ev_${Date.now()}_${idx}`,
        topic: 'baseline',
        title: line.replace(/^-+\s*/, '').slice(0, 180),
        source: 'AI suggested'
      }));
      updated.evidenceInventory = [...(activePlan?.evidenceInventory || []), ...newItems];
    }
    updatePlan(activePlan.id, updated);
    setStatus('Saved to plan.');
  };

  if (!activePlan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan selected</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to draft baselining outputs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-[var(--color-muted)]">Baselining stage</div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Baselining Studio</h2>
          <p className="text-sm text-[var(--color-muted)]">Generate datasets, trends, SWOT, and narrative with plan-aware autofill.</p>
        </div>
        {status && <span className="text-xs text-[var(--color-muted)]">{status}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        <div className="space-y-3 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
          <div>
            <label className="text-xs text-[var(--color-muted)]">Topics</label>
            <input
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-[var(--color-edge)] rounded bg-[var(--color-surface)] text-[var(--color-ink)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)]">Focus notes</label>
            <textarea
              value={focusNotes}
              onChange={(e) => setFocusNotes(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-[var(--color-edge)] rounded bg-[var(--color-surface)] text-[var(--color-ink)]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-2 bg-[var(--color-accent)] text-white rounded shadow disabled:opacity-50" onClick={generateDatasets} disabled={loading.datasets}>
              {loading.datasets ? 'Drafting…' : 'Suggest datasets'}
            </button>
            <button className="px-3 py-2 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded" onClick={generateTrends} disabled={loading.trends}>
              {loading.trends ? 'Generating…' : 'Generate trends'}
            </button>
            <button className="px-3 py-2 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded" onClick={generateSwot} disabled={loading.swot}>
              {loading.swot ? 'Generating…' : 'Generate SWOT'}
            </button>
            <button className="px-3 py-2 bg-[var(--color-ink)] text-white rounded shadow disabled:opacity-50" onClick={generateNarrative} disabled={loading.narrative}>
              {loading.narrative ? 'Drafting…' : 'Draft narrative'}
            </button>
          </div>
          <button className="px-3 py-2 bg-[var(--color-brand)] rounded text-[var(--color-ink)]" onClick={savePlan}>
            Save outputs to plan
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-[var(--color-ink)]">Dataset suggestions</div>
              {datasets && <button className="text-xs text-[var(--color-accent)]" onClick={() => navigator.clipboard.writeText(datasets)}>Copy</button>}
            </div>
            {loading.datasets ? <LoadingSpinner /> : datasets ? <MarkdownContent content={datasets} /> : <div className="text-sm text-[var(--color-muted)]">Generate to view suggestions.</div>}
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-[var(--color-ink)]">Trends & issues</div>
              {trends && <button className="text-xs text-[var(--color-accent)]" onClick={() => navigator.clipboard.writeText(trends)}>Copy</button>}
            </div>
            {loading.trends ? <LoadingSpinner /> : trends ? <MarkdownContent content={trends} /> : <div className="text-sm text-[var(--color-muted)]">Generate to view trends.</div>}
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-[var(--color-ink)]">SWOT / challenges</div>
              {swot && <button className="text-xs text-[var(--color-accent)]" onClick={() => navigator.clipboard.writeText(swot)}>Copy</button>}
            </div>
            {loading.swot ? <LoadingSpinner /> : swot ? <MarkdownContent content={swot} /> : <div className="text-sm text-[var(--color-muted)]">Generate to view SWOT.</div>}
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-[var(--color-ink)]">Baseline narrative</div>
              {narrative && <button className="text-xs text-[var(--color-accent)]" onClick={() => navigator.clipboard.writeText(narrative)}>Copy</button>}
            </div>
            {loading.narrative ? <LoadingSpinner /> : narrative ? <MarkdownContent content={narrative} /> : <div className="text-sm text-[var(--color-muted)]">Generate to view narrative.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
