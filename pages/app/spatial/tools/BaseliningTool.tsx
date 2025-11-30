import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CouncilData, EvidenceItem } from '../../../../data/types';
import { usePlan } from '../../../../contexts/PlanContext';
import { callLLM } from '../../../../utils/llmClient';
import { MarkdownContent } from '../../../../components/MarkdownContent';

type BaseliningProps = {
  councilData: CouncilData;
  autoRun?: boolean;
  prefill?: Record<string, any>;
  onPromptChipsChange?: (chips: string[]) => void;
};

type StudioId = 'datasets' | 'trends' | 'swot' | 'narrative';
type SwotQuadrant = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
type SwotCard = { id: string; quadrant: SwotQuadrant; title: string; detail?: string; evidenceTags?: string[] };
type TrendDetail = { explanation?: string; comparison?: string; gaps?: string };

const THEMES = [
  { id: 'housing', label: 'Housing', icon: '🏠', keywords: ['housing', 'afford'] },
  { id: 'economy', label: 'Economy & employment', icon: '💼', keywords: ['economy', 'employment', 'jobs', 'industry', 'business'] },
  { id: 'transport', label: 'Transport & accessibility', icon: '🚉', keywords: ['transport', 'travel', 'access', 'traffic', 'highway'] },
  { id: 'environment', label: 'Environment & climate', icon: '🌿', keywords: ['environment', 'climate', 'flood', 'air', 'carbon', 'biodiversity'] },
  { id: 'infrastructure', label: 'Infrastructure', icon: '🛠️', keywords: ['infrastructure', 'utilities', 'digital', 'energy', 'water'] },
  { id: 'design', label: 'Design & place', icon: '🏗️', keywords: ['design', 'place', 'urban', 'townscape'] },
  { id: 'demography', label: 'Demography & health', icon: '🩺', keywords: ['health', 'demography', 'population', 'equality', 'equalities'] },
];

const BASELINE_OUTLINE = [
  { id: 'overview', label: 'Overview' },
  { id: 'housing', label: 'Housing' },
  { id: 'economy', label: 'Economy & Employment' },
  { id: 'transport', label: 'Transport & Accessibility' },
  { id: 'environment', label: 'Environment & Climate' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'sea', label: 'SEA/HRA' },
  { id: 'equalities', label: 'Equality & Health' },
];

const BASELINE_THEME_IDS = THEMES.slice(0, 6).map(t => t.id);

function matchTheme(topic: string): string {
  const t = (topic || '').toLowerCase();
  const match = THEMES.find(theme => theme.id === t || theme.keywords.some(k => t.includes(k)));
  return match?.id || 'general';
}

function normalizeDataset(item: EvidenceItem, idx: number): EvidenceItem {
  const topic = item.topic || 'general';
  return {
    ...item,
    id: item.id || `ev_${idx}`,
    topic,
    category: item.category || matchTheme(topic),
    status: item.status || 'planned',
  };
}

function parseJsonCandidate(raw?: string): any {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const candidates: string[] = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1]);
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  try {
    return JSON.parse(candidates[0]);
  } catch {}
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }
  return undefined;
}

function parseDatasetSuggestions(raw: string): EvidenceItem[] {
  const parsed = parseJsonCandidate(raw);
  if (Array.isArray(parsed)) {
    return parsed.map((d, idx) => normalizeDataset({
      id: d.id || `ds_${Date.now()}_${idx}`,
      topic: d.topic || d.theme || 'baseline',
      title: d.title || d.name || 'Dataset',
      source: d.source,
      status: d.status || 'planned',
      year: d.year,
      coverage: d.coverage,
      core: Boolean(d.core),
      seaHraRelevant: Boolean(d.seaHraRelevant),
      notes: d.notes || d.reason,
    }, idx));
  }
  // Fallback: parse markdown bullets
  return raw.split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map((line, idx) => {
      const clean = line.replace(/^-+\s*/, '');
      const yearMatch = clean.match(/(20\d{2}|19\d{2})/);
      return normalizeDataset({
        id: `ds_${Date.now()}_${idx}`,
        topic: 'baseline',
        title: clean.slice(0, 140),
        source: clean.includes('http') ? 'link' : 'AI suggested',
        status: 'planned',
        year: yearMatch ? yearMatch[1] : undefined,
      }, idx);
    });
}

function parseTrendSummaries(raw: string): Record<string, string> {
  const parsed = parseJsonCandidate(raw);
  if (parsed && typeof parsed === 'object') {
    return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, val]) => {
      if (typeof val === 'string') acc[key.toLowerCase()] = val;
      return acc;
    }, {});
  }
  const lines = raw.split('\n').filter(l => l.trim());
  const summaries: Record<string, string> = {};
  let current: string | null = null;
  lines.forEach(line => {
    const heading = line.match(/^#+\s*(.+)/);
    if (heading) {
      current = heading[1].toLowerCase();
      return;
    }
    const bullet = line.match(/^-+\s*(.+)/);
    if (bullet && current) {
      summaries[current] = (summaries[current] || '') + `${bullet[1]}\n`;
    }
  });
  return summaries;
}

function parseSwotInput(swotInput: any, trends: Record<string, string>): SwotCard[] {
  const cards: SwotCard[] = [];
  const push = (quadrant: SwotQuadrant, text: string) => {
    if (!text.trim()) return;
    const [title, ...rest] = text.split(/[-–—]/);
    cards.push({ id: `${quadrant}_${cards.length}_${Date.now()}`, quadrant, title: title.trim(), detail: rest.join(' - ').trim() || undefined });
  };
  if (!swotInput) return cards;
  if (typeof swotInput === 'string') {
    const sections = swotInput.split(/(?:^|\n)(?:\*\*|##?)?\s*(Strengths|Weaknesses|Opportunities|Threats)[:\s]*/i).filter(Boolean);
    let current: SwotQuadrant | null = null;
    sections.forEach(section => {
      const key = section.toLowerCase();
      if (['strengths', 'weaknesses', 'opportunities', 'threats'].includes(key)) {
        current = key as SwotQuadrant;
        return;
      }
      if (current) {
        section.split('\n').forEach(line => {
          const bullet = line.match(/^-+\s*(.+)/);
          if (bullet) push(current as SwotQuadrant, bullet[1]);
        });
      }
    });
  } else if (typeof swotInput === 'object') {
    (['strengths', 'weaknesses', 'opportunities', 'threats'] as SwotQuadrant[]).forEach(quadrant => {
      const list = (swotInput as any)[quadrant];
      if (Array.isArray(list)) list.forEach((text: string) => push(quadrant, text));
    });
  }
  // Lightweight evidence tagging using trend keywords
  return cards.map(card => {
    const tags = Object.keys(trends || {}).filter(t => card.title.toLowerCase().includes(t.toLowerCase()));
    return { ...card, evidenceTags: tags };
  });
}

function buildNarrativeSections(text?: string | null): Record<string, string> {
  const base = BASELINE_OUTLINE.reduce<Record<string, string>>((acc, section) => {
    acc[section.id] = '';
    return acc;
  }, {});
  if (!text) return base;
  const regex = /(#+)\s*([^\n]+)\n([\s\S]*?)(?=^#+\s|\s*$)/gim;
  let match;
  let any = false;
  while ((match = regex.exec(text)) !== null) {
    const heading = match[2].toLowerCase();
    const body = match[3].trim();
    const section = BASELINE_OUTLINE.find(s => heading.includes(s.id) || heading.includes(s.label.toLowerCase()));
    if (section) {
      base[section.id] = body;
      any = true;
    }
  }
  if (!any) base.overview = text;
  return base;
}

function combineNarrativeSections(sections: Record<string, string>): string {
  return BASELINE_OUTLINE.map(section => {
    const body = sections[section.id] || '';
    if (!body.trim()) return '';
    return `## ${section.label}\n${body.trim()}`;
  }).filter(Boolean).join('\n\n');
}

function statusBadgeTone(status: string) {
  if (status === 'ready' || status === 'ok') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'progress' || status === 'warn') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

function formatTimeAgo(ts?: number) {
  if (!ts) return 'Unknown';
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'moments ago';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const BaseliningTool: React.FC<BaseliningProps> = ({ councilData, autoRun, prefill, onPromptChipsChange }) => {
  const { activePlan, updatePlan } = usePlan();
  const [topics, setTopics] = useState(prefill?.topics || 'housing, economy, transport, environment, infrastructure, design');
  const [focusNotes, setFocusNotes] = useState(prefill?.focusNotes || 'Focus on baseline gaps, SEA/HRA relevance, and recency.');
  const [activeStudio, setActiveStudio] = useState<StudioId>('datasets');
  const [datasetItems, setDatasetItems] = useState<EvidenceItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [datasetModalId, setDatasetModalId] = useState<string | null>(null);
  const [datasetTheme, setDatasetTheme] = useState<string>('all');
  const [seaFilter, setSeaFilter] = useState(false);
  const [trendSummaries, setTrendSummaries] = useState<Record<string, string>>({});
  const [trendDetails, setTrendDetails] = useState<Record<string, TrendDetail>>({});
  const [activeTrendTheme, setActiveTrendTheme] = useState<string>('housing');
  const [swotCards, setSwotCards] = useState<SwotCard[]>([]);
  const [narrativeSections, setNarrativeSections] = useState<Record<string, string>>(buildNarrativeSections());
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [lastTouched, setLastTouched] = useState<number>(Date.now());
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const autoRanRef = useRef(false);

  useEffect(() => {
    if (!activePlan) return;
    setDatasetItems((activePlan.evidenceInventory || []).map(normalizeDataset));
    setTrendSummaries(activePlan.baselineTrends || {});
    const parsedSwot = parseSwotInput(activePlan.swot || (activePlan as any).swotText, activePlan.baselineTrends || {});
    setSwotCards(parsedSwot);
    setNarrativeSections(buildNarrativeSections(activePlan.baselineNarrative));
    setLastTouched(Date.now());
  }, [activePlan?.id]);

  useEffect(() => {
    if (!prefill) return;
    if (prefill.topics && typeof prefill.topics === 'string') setTopics(prefill.topics);
    if (prefill.focusNotes && typeof prefill.focusNotes === 'string') setFocusNotes(prefill.focusNotes);
  }, [prefill]);

  useEffect(() => {
    if (autoRun && !autoRanRef.current) {
      autoRanRef.current = true;
      generateDatasetSuggestions();
      generateTrends();
      generateSwot();
      generateNarrative();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const basePromptContext = useMemo(() => {
    if (!activePlan) return '';
    return [
      `Authority: ${councilData.name}`,
      `Plan: ${activePlan.title} (${activePlan.area})`,
      `Stage: Baselining & Evidence`,
      `Topics: ${topics}`,
      `Focus: ${focusNotes}`,
      `Evidence count: ${(activePlan.evidenceInventory || []).length}`,
      `SEA/HRA baseline: ${activePlan.seaHra?.baselineCompleteness || 'unknown'}`,
    ].join('\n');
  }, [activePlan, councilData.name, focusNotes, topics]);

  const coveragePerTheme = useMemo(() => {
    return BASELINE_THEME_IDS.map(themeId => {
      const hasCore = datasetItems.some(d => matchTheme(d.topic) === themeId && (d.core || d.status === 'complete' || d.status === 'in_progress'));
      const hasAny = datasetItems.some(d => matchTheme(d.topic) === themeId);
      return { themeId, status: hasCore ? 'ok' : hasAny ? 'warn' : 'fail' as 'ok' | 'warn' | 'fail' };
    });
  }, [datasetItems]);

  const coverageScore = useMemo(() => {
    const ok = coveragePerTheme.filter(t => t.status === 'ok').length;
    return Math.round((ok / BASELINE_THEME_IDS.length) * 100);
  }, [coveragePerTheme]);

  const seaBadge = useMemo(() => {
    const seaNarrative = (narrativeSections.sea || '').trim().length > 20;
    const seaDatasets = datasetItems.filter(d => d.seaHraRelevant || matchTheme(d.topic) === 'environment');
    if (seaNarrative && seaDatasets.length) return { label: 'Baseline draft ready', tone: 'ready' };
    if (seaDatasets.length) return { label: 'Receptors loaded', tone: 'progress' };
    return { label: 'Not started', tone: 'warn' };
  }, [datasetItems, narrativeSections.sea]);

  const selectedDataset = datasetItems.find(d => d.id === selectedDatasetId);
  const modalDataset = datasetItems.find(d => d.id === datasetModalId) || selectedDataset;

  const filteredDatasets = datasetItems.filter(item => {
    if (seaFilter && !(item.seaHraRelevant || matchTheme(item.topic) === 'environment')) return false;
    if (datasetTheme !== 'all' && matchTheme(item.topic) !== datasetTheme) return false;
    return true;
  });

  const studioPromptHints: Record<StudioId, string[]> = useMemo(() => ({
    datasets: [
      'What baseline datasets are missing for transport?',
      'Which evidence is out of date for this plan?',
      'Suggest SEA/HRA-relevant datasets we should add.',
    ],
    trends: [
      'Explain the housing trend using our datasets.',
      'Compare transport indicators to London benchmarks.',
      'List data gaps for environment trends.',
    ],
    swot: [
      'Generate new SWOT points from current evidence.',
      'Which threats are linked to SEA/HRA?',
      'Show evidence backing our strengths.',
    ],
    narrative: [
      'Draft the environment baseline section with citations.',
      'Check if equalities/health coverage is missing.',
      'Which datasets should be cited in housing narrative?',
    ],
  }), []);

  const updateDataset = (id: string, patch: Partial<EvidenceItem>) => {
    setDatasetItems(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
    setLastTouched(Date.now());
  };

  const generateDatasetSuggestions = async () => {
    if (!activePlan) return;
    setLoading(s => ({ ...s, datasets: true }));
    setStatus(null);
    try {
      const prompt = [
        'Return JSON array of dataset suggestions for Local Plan baselining.',
        'Fields per item: id, title, topic, source, status, year, coverage ("borough"|"partial"|"site"), core (boolean), seaHraRelevant (boolean), notes.',
        'Keep topics across housing, economy, transport, environment, infrastructure, design.',
        basePromptContext,
      ].join('\n');
      const raw = await callLLM({ prompt, mode: 'json' });
      const suggestions = parseDatasetSuggestions(raw);
      setDatasetItems(prev => [...prev, ...suggestions]);
      setStatus('Dataset suggestions added');
      setActiveStudio('datasets');
    } catch {
      setStatus('Could not generate datasets.');
    } finally {
      setLoading(s => ({ ...s, datasets: false }));
      setLastTouched(Date.now());
    }
  };

  const generateTrends = async () => {
    if (!activePlan) return;
    setLoading(s => ({ ...s, trends: true }));
    setStatus(null);
    try {
      const prompt = [
        'Summarise trends/issues per theme (housing, economy, transport, environment, infrastructure, design).',
        'Return JSON object where keys are themes and values are concise markdown bullets.',
        'Ground in evidence inventory and focus notes.',
        `Evidence inventory: ${JSON.stringify(datasetItems)}`,
        basePromptContext,
      ].join('\n');
      const raw = await callLLM({ prompt, mode: 'json' });
      const parsed = parseJsonCandidate(raw);
      const summaries = typeof parsed === 'object' && parsed ? parsed : parseTrendSummaries(raw);
      setTrendSummaries(summaries);
      setStatus('Trends drafted.');
      const firstWithData = Object.keys(summaries)[0];
      if (firstWithData) setActiveTrendTheme(firstWithData);
      setActiveStudio('trends');
    } catch {
      setStatus('Could not generate trends.');
    } finally {
      setLoading(s => ({ ...s, trends: false }));
      setLastTouched(Date.now());
    }
  };

  const generateSwot = async () => {
    setLoading(s => ({ ...s, swot: true }));
    setStatus(null);
    try {
      const prompt = [
        'Create SWOT cards with quadrant, title, detail, and evidence tags.',
        'Return JSON array.',
        `Evidence: ${JSON.stringify(datasetItems)}`,
        `Trends: ${JSON.stringify(trendSummaries)}`,
        basePromptContext,
      ].join('\n');
      const raw = await callLLM({ prompt, mode: 'json' });
      const parsed = parseJsonCandidate(raw);
      if (Array.isArray(parsed)) {
        const cards: SwotCard[] = parsed.map((c: any, idx: number) => ({
          id: c.id || `sw_${Date.now()}_${idx}`,
          quadrant: (c.quadrant || c.section || 'strengths').toLowerCase() as SwotQuadrant,
          title: c.title || c.text || 'Untitled',
          detail: c.detail || c.reason,
          evidenceTags: c.evidenceTags || c.tags || [],
        }));
        setSwotCards(prev => [...prev, ...cards]);
      } else {
        const cards = parseSwotInput(raw, trendSummaries);
        setSwotCards(prev => [...prev, ...cards]);
      }
      setStatus('SWOT drafted.');
      setActiveStudio('swot');
    } catch {
      setStatus('Could not generate SWOT.');
    } finally {
      setLoading(s => ({ ...s, swot: false }));
      setLastTouched(Date.now());
    }
  };

  const generateNarrative = async (sectionId?: string) => {
    if (!activePlan) return;
    const targetSection = sectionId || activeSection;
    setLoading(s => ({ ...s, [`narrative_${targetSection}`]: true }));
    setStatus(null);
    try {
      const prompt = [
        'Draft a short baseline narrative section using only approved evidence and trends.',
        `Section: ${targetSection}`,
        `Existing text: ${(narrativeSections[targetSection] || '').slice(0, 800)}`,
        `Evidence inventory: ${JSON.stringify(datasetItems)}`,
        `Trends: ${JSON.stringify(trendSummaries)}`,
        `SWOT: ${JSON.stringify(swotCards)}`,
        'Return concise markdown (150-220 words) with short sentences. Include citation tokens like [EV1] using dataset ids when useful.',
        basePromptContext,
      ].join('\n');
      const text = await callLLM({ prompt, mode: 'markdown' });
      setNarrativeSections(prev => ({ ...prev, [targetSection]: text || prev[targetSection] }));
      setStatus('Narrative drafted.');
      setActiveStudio('narrative');
    } catch {
      setStatus('Could not generate narrative.');
    } finally {
      setLoading(s => ({ ...s, [`narrative_${targetSection}`]: false }));
      setLastTouched(Date.now());
    }
  };

  const savePlan = () => {
    if (!activePlan) return;
    const swotPayload = swotCards.reduce<Record<SwotQuadrant, string[]>>((acc, card) => {
      const arr = acc[card.quadrant] || [];
      arr.push(card.detail ? `${card.title} — ${card.detail}` : card.title);
      acc[card.quadrant] = arr;
      return acc;
    }, { strengths: [], weaknesses: [], opportunities: [], threats: [] } as Record<SwotQuadrant, string[]>);
    const narrativeText = combineNarrativeSections(narrativeSections);
    updatePlan(activePlan.id, {
      evidenceInventory: datasetItems,
      baselineTrends: trendSummaries,
      swot: swotPayload,
      baselineNarrative: narrativeText,
    });
    setStatus('Saved outputs to plan.');
    setLastTouched(Date.now());
  };

  useEffect(() => {
    if (onPromptChipsChange) {
      onPromptChipsChange(studioPromptHints[activeStudio] || []);
    }
  }, [activeStudio, onPromptChipsChange, studioPromptHints]);

  if (!activePlan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan selected</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to draft baselining outputs.</p>
      </div>
    );
  }

  const tileMeta: Array<{ id: StudioId; title: string; hint: string; badge: string; tone: 'ready' | 'progress' | 'warn' }> = [
    {
      id: 'datasets',
      title: 'Dataset Studio',
      hint: `${datasetItems.filter(d => d.core).length || 0} core / ${BASELINE_THEME_IDS.length} themes`,
      badge: datasetItems.length ? 'In progress' : 'Not started',
      tone: datasetItems.length ? 'progress' : 'warn',
    },
    {
      id: 'trends',
      title: 'Trends Studio',
      hint: `${Object.keys(trendSummaries || {}).length} themes summarised`,
      badge: Object.keys(trendSummaries || {}).length ? 'In progress' : 'Not started',
      tone: Object.keys(trendSummaries || {}).length ? 'progress' : 'warn',
    },
    {
      id: 'swot',
      title: 'SWOT Studio',
      hint: `${swotCards.length} cards`,
      badge: swotCards.length ? 'In progress' : 'Not started',
      tone: swotCards.length ? 'progress' : 'warn',
    },
    {
      id: 'narrative',
      title: 'Narrative Studio',
      hint: `${Object.values(narrativeSections).filter(Boolean).length} sections drafted`,
      badge: Object.values(narrativeSections).some(Boolean) ? 'In progress' : 'Not started',
      tone: Object.values(narrativeSections).some(Boolean) ? 'progress' : 'warn',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-[var(--color-muted)]">Baselining & Evidence</div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Baselining Studio</h2>
          <p className="text-sm text-[var(--color-muted)]">Stage-driven workspace for datasets, trends, SWOT, narrative, and SEA/HRA checks.</p>
        </div>
        {status && <span className="text-xs text-[var(--color-muted)]">{status}</span>}
      </div>

      <div className="sticky top-0 z-10 space-y-2 bg-[var(--color-surface)] pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border-4 border-[var(--color-edge)] flex items-center justify-center relative">
              <div className="absolute inset-1 rounded-full bg-[var(--color-surface)]" />
              <div className="relative text-lg font-semibold text-[var(--color-ink)]">{coverageScore}%</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)]">Evidence coverage</div>
              <p className="text-xs text-[var(--color-muted)]">Core datasets across housing, economy, transport, environment, infrastructure, design.</p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-1">
            <div className="text-sm font-semibold text-[var(--color-ink)]">SEA/HRA status</div>
            <span className={`px-3 py-1 text-xs rounded-full border ${statusBadgeTone(seaBadge.tone)}`}>
              {seaBadge.label}
            </span>
            <p className="text-xs text-[var(--color-muted)]">Badge driven by SEA/HRA-tagged datasets + SEA/HRA narrative section.</p>
          </div>
          <div className="flex flex-col justify-center gap-1">
            <div className="text-sm font-semibold text-[var(--color-ink)]">Last updated</div>
            <div className="text-xs text-[var(--color-muted)]">Local workspace · {formatTimeAgo(lastTouched)}</div>
            <div className="text-xs text-[var(--color-muted)]">Plan: {activePlan.title}</div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end items-center">
            <button onClick={generateDatasetSuggestions} className="px-3 py-2 rounded-lg bg-[var(--color-panel)] border border-[var(--color-edge)] text-sm disabled:opacity-50" disabled={loading.datasets}>
              {loading.datasets ? 'Adding datasets…' : 'Add dataset suggestions'}
            </button>
            <button onClick={generateTrends} className="px-3 py-2 rounded-lg bg-[var(--color-panel)] border border-[var(--color-edge)] text-sm disabled:opacity-50" disabled={loading.trends}>
              {loading.trends ? 'Running…' : 'Run trend extraction'}
            </button>
            <button onClick={generateSwot} className="px-3 py-2 rounded-lg bg-[var(--color-panel)] border border-[var(--color-edge)] text-sm disabled:opacity-50" disabled={loading.swot}>
              {loading.swot ? 'Generating…' : 'Generate SWOT suggestions'}
            </button>
            <button onClick={() => generateNarrative()} className="px-3 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm disabled:opacity-50" disabled={loading[`narrative_${activeSection}`]}>
              {loading[`narrative_${activeSection}`] ? 'Drafting…' : 'Draft baseline narrative'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tileMeta.map(tile => (
              <button
                key={tile.id}
                onClick={() => setActiveStudio(tile.id)}
                className={`text-left bg-[var(--color-panel)] border ${activeStudio === tile.id ? 'border-[var(--color-accent)] shadow-lg' : 'border-[var(--color-edge)]'} rounded-xl p-3 hover:shadow-md transition`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="font-semibold text-[var(--color-ink)]">{tile.title}</div>
                  <span className={`px-2 py-1 text-[11px] rounded-full border ${statusBadgeTone(tile.tone)}`}>{tile.badge}</span>
                </div>
                <div className="text-sm text-[var(--color-muted)]">{tile.hint}</div>
              </button>
            ))}
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-4">
            {activeStudio === 'datasets' && (
              <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-4">
                <div className="space-y-3">
                  <button
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-edge)] text-sm"
                    onClick={() => setFiltersOpen(f => !f)}
                  >
                    <span>Filters & options</span>
                    <span className="text-[11px] text-[var(--color-muted)]">{filtersOpen ? 'Hide' : 'Show'}</span>
                  </button>
                  {filtersOpen && (
                    <div className="space-y-3">
                      <div>
                        <div className="font-semibold text-[var(--color-ink)] mb-2">Theme</div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={`px-3 py-1.5 rounded-full text-xs border ${datasetTheme === 'all' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface)] border-[var(--color-edge)]'}`}
                            onClick={() => setDatasetTheme('all')}
                          >
                            All
                          </button>
                          {THEMES.filter(t => BASELINE_THEME_IDS.includes(t.id)).map(theme => (
                            <button
                              key={theme.id}
                              className={`px-3 py-1.5 rounded-full text-xs border ${datasetTheme === theme.id ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface)] border-[var(--color-edge)]'}`}
                              onClick={() => setDatasetTheme(theme.id)}
                            >
                              {theme.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input id="seaFilter" type="checkbox" className="accent-[var(--color-accent)]" checked={seaFilter} onChange={(e) => setSeaFilter(e.target.checked)} />
                        <label htmlFor="seaFilter" className="text-sm text-[var(--color-ink)]">SEA/HRA-relevant only</label>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs text-[var(--color-muted)]">Prompt focus</div>
                        <textarea
                          value={focusNotes}
                          onChange={(e) => setFocusNotes(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm"
                        />
                      </div>
                      <button
                        onClick={savePlan}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-brand)] text-[var(--color-ink)] font-semibold"
                      >
                        Save outputs to plan
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredDatasets.length === 0 && (
                      <div className="col-span-full text-sm text-[var(--color-muted)]">No datasets yet. Use quick actions to seed suggestions.</div>
                    )}
                    {filteredDatasets.map(item => (
                      <div
                        key={item.id}
                        onClick={() => { setSelectedDatasetId(item.id); setDatasetModalId(item.id); }}
                        className={`cursor-pointer border rounded-lg p-3 ${selectedDatasetId === item.id ? 'border-[var(--color-accent)] shadow-md' : 'border-[var(--color-edge)] bg-[var(--color-surface)]'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-[var(--color-ink)]">{item.title}</div>
                            <div className="text-[11px] text-[var(--color-muted)]">{item.source || 'Source tbc'}</div>
                          </div>
                          <span className={`px-2 py-1 text-[11px] rounded-full border ${statusBadgeTone(item.core ? 'ready' : item.status === 'planned' ? 'warn' : 'progress')}`}>
                            {item.core ? 'Core' : item.status || 'Planned'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--color-muted)]">
                          <span className="px-2 py-1 rounded-full bg-[var(--color-panel)] border border-[var(--color-edge)]">{item.coverage || 'coverage tbc'}</span>
                          {item.seaHraRelevant && <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">SEA/HRA</span>}
                        </div>
                        <div className="mt-3 h-1.5 rounded-full bg-[var(--color-edge)]">
                          <div className="h-1.5 rounded-full bg-[var(--color-accent)]" style={{ width: `${30 + ((item.title?.length || 10) % 60)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                    {modalDataset && (
                      <div
                        className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
                        onClick={() => setDatasetModalId(null)}
                      >
                        <div
                          className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-xl shadow-2xl w-[min(900px,94vw)] max-h-[88vh] overflow-auto p-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-[var(--color-ink)] text-lg">{modalDataset.title}</div>
                              <div className="text-xs text-[var(--color-muted)]">{modalDataset.source || 'Source tbc'}</div>
                            </div>
                            <button className="text-xs text-[var(--color-muted)]" onClick={() => setDatasetModalId(null)}>Close</button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <div className="rounded-lg border border-[var(--color-edge)] bg-gradient-to-br from-[var(--color-panel)] to-[var(--color-surface)] h-32 flex items-center justify-center text-[var(--color-muted)] text-sm">
                              Map/preview placeholder
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 rounded-full bg-[var(--color-panel)] border border-[var(--color-edge)] text-[11px]">{modalDataset.coverage || 'coverage tbc'}</span>
                                <span className="px-2 py-1 rounded-full bg-[var(--color-panel)] border border-[var(--color-edge)] text-[11px]">{modalDataset.year || 'year tbc'}</span>
                                {modalDataset.seaHraRelevant && <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[11px]">SEA/HRA</span>}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  className={`px-2 py-1 text-xs rounded-full border ${statusBadgeTone(modalDataset.core ? 'ready' : 'progress')}`}
                                  onClick={() => updateDataset(modalDataset.id, { core: !modalDataset.core })}
                                >
                                  {modalDataset.core ? 'Core evidence' : 'Mark core'}
                                </button>
                                <button
                                  className={`px-2 py-1 text-xs rounded-full border ${modalDataset.seaHraRelevant ? 'bg-amber-100 text-amber-800 border-amber-200' : 'border-[var(--color-edge)]'}`}
                                  onClick={() => updateDataset(modalDataset.id, { seaHraRelevant: !modalDataset.seaHraRelevant })}
                                >
                                  SEA/HRA
                                </button>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-[var(--color-ink)]">Why this matters</div>
                                <div className="text-sm text-[var(--color-muted)]">{modalDataset.why || 'Generate to explain importance.'}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-[var(--color-ink)]">Key limitations</div>
                                <div className="text-sm text-[var(--color-muted)]">{modalDataset.limitations || 'Not captured yet.'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <button
                              className="px-3 py-2 rounded bg-[var(--color-panel)] border border-[var(--color-edge)] text-sm"
                              onClick={async () => {
                                setLoading(s => ({ ...s, [`ds_${modalDataset.id}`]: true }));
                                try {
                                  const prompt = [
                                    'Explain why this dataset matters for the Local Plan baseline and list key limitations.',
                                    `Dataset: ${JSON.stringify(modalDataset)}`,
                                    basePromptContext,
                                    'Return JSON { "why": "...", "limitations": "..." }',
                                  ].join('\n');
                                  const raw = await callLLM({ prompt, mode: 'json' });
                                  const parsed = parseJsonCandidate(raw);
                                  updateDataset(modalDataset.id, { why: parsed?.why, limitations: parsed?.limitations });
                                } catch {
                                  // ignore
                                } finally {
                                  setLoading(s => ({ ...s, [`ds_${modalDataset.id}`]: false }));
                                }
                              }}
                              disabled={loading[`ds_${modalDataset.id}`]}
                            >
                              {loading[`ds_${modalDataset.id}`] ? 'Generating…' : 'Generate insight'}
                            </button>
                            <button
                              className="px-3 py-2 rounded bg-[var(--color-accent)] text-white text-sm"
                              onClick={() => {
                                setActiveStudio('trends');
                                setActiveTrendTheme(matchTheme(modalDataset.topic));
                                setDatasetModalId(null);
                              }}
                            >
                              Use in trends analysis
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {activeStudio === 'trends' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  {THEMES.filter(t => BASELINE_THEME_IDS.includes(t.id)).map(theme => {
                    const summary = trendSummaries[theme.id] || '';
                    const status = summary ? 'ready' : 'warn';
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setActiveTrendTheme(theme.id)}
                        className={`w-full sm:w-auto px-4 py-3 rounded-lg border text-left ${activeTrendTheme === theme.id ? 'border-[var(--color-accent)] shadow-md' : 'border-[var(--color-edge)] bg-[var(--color-surface)]'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold text-[var(--color-ink)]">{theme.icon} {theme.label}</div>
                          <span className={`px-2 py-1 text-[11px] rounded-full border ${statusBadgeTone(status)}`}>{summary ? 'Trend ready' : 'No data'}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[var(--color-edge)] overflow-hidden">
                          <div className="h-1.5 rounded-full bg-[var(--color-accent)]" style={{ width: `${summary ? 70 : 20}%` }} />
                        </div>
                        <div className="text-xs text-[var(--color-muted)] mt-1 line-clamp-2">{summary || 'Awaiting data'}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
                  <div className="border border-[var(--color-edge)] rounded-lg p-4 bg-[var(--color-surface)]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-[var(--color-ink)]">Trend explorer</div>
                        <div className="text-xs text-[var(--color-muted)]">{THEMES.find(t => t.id === activeTrendTheme)?.label}</div>
                      </div>
                      <button
                        className="px-3 py-2 rounded bg-[var(--color-panel)] border border-[var(--color-edge)] text-sm"
                        onClick={() => generateTrends()}
                        disabled={loading.trends}
                      >
                        {loading.trends ? 'Refreshing…' : 'Refresh from data'}
                      </button>
                    </div>
                    <div className="h-48 rounded bg-gradient-to-r from-[var(--color-panel)] to-[var(--color-surface)] border border-[var(--color-edge)] flex items-center justify-center text-[var(--color-muted)]">
                      Chart placeholder (time series/comparator)
                    </div>
                    <div className="mt-3">
                      {trendSummaries[activeTrendTheme] ? (
                        <MarkdownContent content={trendSummaries[activeTrendTheme]} />
                      ) : (
                        <div className="text-sm text-[var(--color-muted)]">No trend summary yet. Generate above or add data.</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-panel)]">
                      <div className="font-semibold text-[var(--color-ink)] mb-2">Analysis tools</div>
                      <div className="space-y-2">
                        <button
                          className="w-full px-3 py-2 rounded bg-[var(--color-surface)] border border-[var(--color-edge)] text-sm"
                          onClick={async () => {
                            setLoading(s => ({ ...s, trendExplain: true }));
                            try {
                              const prompt = [
                                `Explain the ${activeTrendTheme} trend using available datasets.`,
                                `Trend: ${trendSummaries[activeTrendTheme] || 'none'}`,
                                `Evidence: ${JSON.stringify(datasetItems.filter(d => matchTheme(d.topic) === activeTrendTheme))}`,
                                basePromptContext,
                                'Return short markdown bullets.',
                              ].join('\n');
                              const text = await callLLM({ prompt, mode: 'markdown' });
                              setTrendDetails(prev => ({ ...prev, [activeTrendTheme]: { ...(prev[activeTrendTheme] || {}), explanation: text || 'No output' } }));
                            } finally {
                              setLoading(s => ({ ...s, trendExplain: false }));
                            }
                          }}
                          disabled={loading.trendExplain}
                        >
                          {loading.trendExplain ? 'Explaining…' : 'Explain this trend'}
                        </button>
                        <button
                          className="w-full px-3 py-2 rounded bg-[var(--color-surface)] border border-[var(--color-edge)] text-sm"
                          onClick={async () => {
                            setLoading(s => ({ ...s, trendCompare: true }));
                            try {
                              const prompt = [
                                `Compare ${activeTrendTheme} to London and national benchmarks.`,
                                `Trend: ${trendSummaries[activeTrendTheme] || 'none'}`,
                                basePromptContext,
                              ].join('\n');
                              const text = await callLLM({ prompt, mode: 'markdown' });
                              setTrendDetails(prev => ({ ...prev, [activeTrendTheme]: { ...(prev[activeTrendTheme] || {}), comparison: text || 'No output' } }));
                            } finally {
                              setLoading(s => ({ ...s, trendCompare: false }));
                            }
                          }}
                          disabled={loading.trendCompare}
                        >
                          {loading.trendCompare ? 'Comparing…' : 'Compare to London / national'}
                        </button>
                        <button
                          className="w-full px-3 py-2 rounded bg-[var(--color-surface)] border border-[var(--color-edge)] text-sm"
                          onClick={async () => {
                            setLoading(s => ({ ...s, trendGaps: true }));
                            try {
                              const prompt = [
                                `List data gaps for ${activeTrendTheme} and suggest fixes.`,
                                `Current datasets: ${JSON.stringify(datasetItems.filter(d => matchTheme(d.topic) === activeTrendTheme))}`,
                                basePromptContext,
                              ].join('\n');
                              const text = await callLLM({ prompt, mode: 'markdown' });
                              setTrendDetails(prev => ({ ...prev, [activeTrendTheme]: { ...(prev[activeTrendTheme] || {}), gaps: text || 'No output' } }));
                            } finally {
                              setLoading(s => ({ ...s, trendGaps: false }));
                            }
                          }}
                          disabled={loading.trendGaps}
                        >
                          {loading.trendGaps ? 'Checking…' : 'List data gaps'}
                        </button>
                      </div>
                    </div>
                    <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                      <div className="font-semibold text-[var(--color-ink)] mb-2">Trend notes</div>
                      {['explanation', 'comparison', 'gaps'].map(key => {
                        const text = (trendDetails[activeTrendTheme] as any)?.[key];
                        if (!text) return null;
                        return (
                          <div key={key} className="mb-2">
                            <div className="text-xs font-semibold text-[var(--color-muted)] capitalize">{key}</div>
                            <MarkdownContent content={text} />
                          </div>
                        );
                      })}
                      {!trendDetails[activeTrendTheme] && (
                        <div className="text-xs text-[var(--color-muted)]">Run an action to populate notes.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStudio === 'swot' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--color-ink)]">SWOT Studio</div>
                    <div className="text-xs text-[var(--color-muted)]">Short cards with evidence tags, drag between quadrants.</div>
                  </div>
                  <button
                    className="px-3 py-2 rounded bg-[var(--color-panel)] border border-[var(--color-edge)] text-sm"
                    onClick={generateSwot}
                    disabled={loading.swot}
                  >
                    {loading.swot ? 'Generating…' : 'Generate from evidence'}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(['strengths', 'weaknesses', 'opportunities', 'threats'] as SwotQuadrant[]).map(quadrant => (
                    <div key={quadrant} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-[var(--color-ink)] capitalize">{quadrant}</div>
                        <span className="text-xs text-[var(--color-muted)]">{swotCards.filter(c => c.quadrant === quadrant).length} cards</span>
                      </div>
                      <div className="space-y-2">
                        {swotCards.filter(c => c.quadrant === quadrant).map(card => (
                          <div key={card.id} className="border border-[var(--color-edge)] rounded p-2 bg-[var(--color-panel)]">
                            <input
                              className="w-full text-sm font-semibold bg-transparent text-[var(--color-ink)]"
                              value={card.title}
                              onChange={(e) => setSwotCards(prev => prev.map(c => c.id === card.id ? { ...c, title: e.target.value } : c))}
                            />
                            <textarea
                              className="w-full mt-1 text-xs bg-transparent text-[var(--color-muted)]"
                              value={card.detail || ''}
                              onChange={(e) => setSwotCards(prev => prev.map(c => c.id === card.id ? { ...c, detail: e.target.value } : c))}
                              placeholder="Add 1–2 sentences"
                            />
                            {card.evidenceTags && card.evidenceTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {card.evidenceTags.map(tag => (
                                  <span key={tag} className="px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-edge)] text-[11px] text-[var(--color-muted)]">{tag}</span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <label className="text-xs text-[var(--color-muted)]">Move to</label>
                              <select
                                className="text-xs border border-[var(--color-edge)] rounded px-2 py-1 bg-[var(--color-surface)]"
                                value={card.quadrant}
                                onChange={(e) => setSwotCards(prev => prev.map(c => c.id === card.id ? { ...c, quadrant: e.target.value as SwotQuadrant } : c))}
                              >
                                <option value="strengths">Strengths</option>
                                <option value="weaknesses">Weaknesses</option>
                                <option value="opportunities">Opportunities</option>
                                <option value="threats">Threats</option>
                              </select>
                              <button
                                className="ml-auto text-xs text-[var(--color-accent)]"
                                onClick={() => setSwotCards(prev => prev.filter(c => c.id !== card.id))}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                        {swotCards.filter(c => c.quadrant === quadrant).length === 0 && (
                          <div className="text-xs text-[var(--color-muted)]">No cards yet.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeStudio === 'narrative' && (
              <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-4">
                <div className="space-y-2">
                  <div className="font-semibold text-[var(--color-ink)]">Outline</div>
                  <div className="flex flex-col gap-2">
                    {BASELINE_OUTLINE.map(section => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`text-left px-3 py-2 rounded border ${activeSection === section.id ? 'border-[var(--color-accent)] bg-[var(--color-panel)]' : 'border-[var(--color-edge)] bg-[var(--color-surface)]'}`}
                      >
                        <div className="font-semibold text-sm text-[var(--color-ink)]">{section.label}</div>
                        <div className="text-[11px] text-[var(--color-muted)]">{(narrativeSections[section.id] || '').slice(0, 40) || 'Empty'}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    className="w-full px-3 py-2 rounded bg-[var(--color-panel)] border border-[var(--color-edge)] text-sm"
                    onClick={() => generateNarrative(activeSection)}
                    disabled={loading[`narrative_${activeSection}`]}
                  >
                    {loading[`narrative_${activeSection}`] ? 'Drafting…' : 'Rewrite from evidence'}
                  </button>
                  <button
                    className="w-full px-3 py-2 rounded bg-[var(--color-accent)] text-white text-sm"
                    onClick={savePlan}
                  >
                    Save outputs to plan
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[var(--color-ink)]">{BASELINE_OUTLINE.find(s => s.id === activeSection)?.label}</div>
                        <div className="text-xs text-[var(--color-muted)]">Generate draft from evidence; keep concise.</div>
                      </div>
                      <button
                        className="px-3 py-2 rounded bg-[var(--color-panel)] border border-[var(--color-edge)] text-sm"
                        onClick={() => generateNarrative(activeSection)}
                        disabled={loading[`narrative_${activeSection}`]}
                      >
                        {loading[`narrative_${activeSection}`] ? 'Drafting…' : 'Generate draft'}
                      </button>
                    </div>
                    <textarea
                      value={narrativeSections[activeSection] || ''}
                      onChange={(e) => setNarrativeSections(prev => ({ ...prev, [activeSection]: e.target.value }))}
                      rows={12}
                      className="w-full mt-3 px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-panel)] text-sm"
                    />
                  </div>
                  <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-panel)]">
                    <div className="font-semibold text-[var(--color-ink)] mb-2">Evidence sidebar</div>
                    <div className="text-xs text-[var(--color-muted)] mb-2">Click to insert citation token</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {datasetItems.slice(0, 12).map(item => (
                        <button
                          key={item.id}
                          className="px-2 py-1 rounded-full text-[11px] bg-[var(--color-surface)] border border-[var(--color-edge)]"
                          onClick={() => setNarrativeSections(prev => ({ ...prev, [activeSection]: `${(prev[activeSection] || '').trim()} [${item.id}] ` }))}
                        >
                          {item.title.slice(0, 22)}
                        </button>
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-[var(--color-ink)] mb-1">Related trends</div>
                    <div className="space-y-1">
                      {Object.entries(trendSummaries).map(([theme, text]) => (
                        <div key={theme} className="border border-[var(--color-edge)] rounded px-2 py-1 bg-[var(--color-surface)] text-xs">
                          <span className="font-semibold">{theme}:</span> {text.slice(0, 120)}…
                        </div>
                      ))}
                      {Object.keys(trendSummaries).length === 0 && (
                        <div className="text-xs text-[var(--color-muted)]">Generate trends to link evidence.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};
