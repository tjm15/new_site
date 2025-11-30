import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../shared/Button';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import { usePlan } from '../../../../contexts/PlanContext';
import type { CouncilData, IndicatorDifficulty, SmartIndicator, SmartOutcome, VisionOutcome } from '../../../../data/types';
import { callLLM } from '../../../../utils/llmClient';

type SmartOutcomesToolProps = {
  councilData: CouncilData;
  autoRun?: boolean;
};

const INDICATOR_TEMPLATES: Array<{ id: string; name: string; baseline?: string; target?: string; difficulty?: IndicatorDifficulty }> = [
  { id: 'affordable_units', name: 'Affordable housing units delivered', baseline: 'Current completions', target: 'X by 2031', difficulty: 'medium' },
  { id: 'green_jobs', name: 'Jobs in green tech / retrofit', baseline: 'Baseline employment', target: '+Y by 2031', difficulty: 'medium' },
  { id: 'active_travel', name: 'Modal share (%) for active travel', baseline: '32%', target: '42% by 2031', difficulty: 'easy' },
  { id: 'public_realm', name: 'Public realm quality score', baseline: 'Audit score', target: 'Up 20% by 2030', difficulty: 'hard' },
  { id: 'carbon', name: 'Operational carbon intensity (kgCO2/m2)', baseline: 'Baseline model', target: '-X% by 2030', difficulty: 'hard' },
];

const SEA_CATEGORIES: Array<{ id: string; label: string; icon: string }> = [
  { id: 'biodiversity', label: 'Biodiversity', icon: '🐦' },
  { id: 'water', label: 'Water', icon: '🌧️' },
  { id: 'climate', label: 'Climate', icon: '🔥' },
  { id: 'landscape', label: 'Landscape', icon: '🏞️' },
  { id: 'heritage', label: 'Heritage', icon: '🏛️' },
];

function truncate(text?: string, max = 240) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function parseJsonCandidate(raw?: string): any | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const candidates: string[] = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) candidates.push(trimmed.slice(firstBracket, lastBracket + 1));
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }
  return undefined;
}

function normalizeIndicator(ind: any, idx: number): SmartIndicator {
  const diffRaw = (ind?.difficulty || ind?.difficultyScore || '').toString().toLowerCase();
  const difficulty: IndicatorDifficulty | undefined = diffRaw === 'easy' || diffRaw === 'medium' || diffRaw === 'hard' ? (diffRaw as IndicatorDifficulty) : undefined;
  return {
    id: ind?.id || `indicator_${Date.now()}_${idx}`,
    name: ind?.name || ind?.title || ind?.metric || 'Indicator',
    baseline: ind?.baseline || ind?.current || '',
    target: ind?.target || ind?.goal || '',
    source: ind?.source || ind?.data_source || '',
    difficulty,
    frequency: ind?.frequency || ind?.monitoring_frequency || '',
  };
}

function computeCompletenessScore(outcome: SmartOutcome): number {
  const baseFields: Array<keyof SmartOutcome> = ['specific', 'measurable', 'achievable', 'relevant', 'timebound'];
  const filled = baseFields.reduce((acc, key) => acc + ((outcome[key] as string)?.trim().length > 4 ? 1 : 0), 0);
  const indicatorScore = outcome.indicators?.length ? 1 : 0;
  const monitoringScore = outcome.monitoringFrequency ? 1 : 0;
  const score = (filled + indicatorScore + monitoringScore) / (baseFields.length + 2);
  return Math.min(100, Math.round(score * 100));
}

function normalizeOutcome(raw: any, idx: number): SmartOutcome {
  const indicators = Array.isArray(raw?.indicators) ? raw.indicators.map((ind: any, i: number) => normalizeIndicator(ind, i)) : [];
  const smart: SmartOutcome = {
    id: raw?.id || raw?.outcome_id || `outcome_${Date.now()}_${idx}`,
    theme: raw?.theme || raw?.category || 'General',
    outcomeStatement: raw?.outcome_statement || raw?.outcomeStatement || raw?.text || `Outcome ${idx + 1}`,
    specific: raw?.specific || '',
    measurable: raw?.measurable || raw?.metric || '',
    achievable: raw?.achievable || raw?.feasible || '',
    relevant: raw?.relevant || raw?.why || '',
    timebound: raw?.timebound || raw?.timeframe || '',
    indicators,
    linkedPolicies: raw?.linkedPolicies || raw?.linked_policies || raw?.policies || [],
    linkedSites: raw?.linkedSites || raw?.linked_sites || raw?.sites || [],
    linkedSeaObjectives: raw?.linkedSeaObjectives || raw?.linked_sea_objectives || [],
    spatialLayers: raw?.spatialLayers || raw?.layers || [],
    monitoringFrequency: raw?.monitoringFrequency || raw?.frequency || '',
    risks: raw?.risks || raw?.red_flags || [],
    status: raw?.status,
    gatewayFlags: raw?.gatewayFlags || raw?.gateway_flags,
    checks: raw?.checks,
    notes: raw?.notes || '',
  };
  if (!smart.status) {
    const score = computeCompletenessScore(smart);
    smart.status = score >= 85 ? 'green' : score >= 65 ? 'amber' : 'red';
  }
  return smart;
}

function statusBadge(status?: string) {
  if (status === 'green') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'amber') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

function difficultyBadge(diff?: IndicatorDifficulty) {
  if (diff === 'easy') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (diff === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (diff === 'hard') return 'bg-rose-100 text-rose-800 border-rose-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

const SmartMeter = ({ score }: { score: number }) => {
  const safeScore = Math.max(0, Math.min(100, score || 0));
  const deg = (safeScore / 100) * 360;
  const tone = safeScore >= 85 ? '#16a34a' : safeScore >= 65 ? '#f59e0b' : '#dc2626';
  return (
    <div className="relative w-16 h-16">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(${tone} ${deg}deg, #E5E7EB ${deg}deg)` }}
      />
      <div className="absolute inset-[6px] rounded-full bg-[var(--color-panel)] border border-[var(--color-edge)] flex items-center justify-center text-sm font-semibold text-[var(--color-ink)]">
        {safeScore}%
      </div>
      <div className="absolute inset-0 rounded-full border border-[var(--color-edge)]" />
    </div>
  );
};

function FieldEditor({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        placeholder={placeholder}
      />
    </label>
  );
}

export const SmartOutcomesTool: React.FC<SmartOutcomesToolProps> = ({ councilData, autoRun }) => {
  const { activePlan, updatePlan } = usePlan();
  const [outcomes, setOutcomes] = useState<SmartOutcome[]>(activePlan?.smartOutcomes || []);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(activePlan?.smartOutcomes?.[0]?.id || null);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [report, setReport] = useState<string>('');
  const [validationSummary, setValidationSummary] = useState<string>('');
  const [showContext, setShowContext] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'smart' | 'indicators' | 'linkages' | 'risks'>('smart');

  useEffect(() => {
    if (activePlan?.smartOutcomes?.length) {
      const normalized = activePlan.smartOutcomes.map((o, idx) => normalizeOutcome(o, idx));
      setOutcomes(normalized);
      setSelectedOutcomeId(normalized[0].id);
    }
  }, [activePlan?.id, activePlan?.smartOutcomes?.length]);

  const groupedOutcomes = useMemo(() => {
    return outcomes.reduce<Record<string, SmartOutcome[]>>((acc, o) => {
      const key = o.theme || 'General';
      acc[key] = acc[key] || [];
      acc[key].push(o);
      return acc;
    }, {});
  }, [outcomes]);

  const miniSmartDots = (o: SmartOutcome) => {
    const baseFields: Array<keyof SmartOutcome> = ['specific', 'measurable', 'achievable', 'relevant', 'timebound'];
    const filled = baseFields.map(f => (o[f] as string)?.trim().length > 4);
    return filled.map(flag => (flag ? '+' : '-')).join('');
  };

  const contextText = useMemo(() => {
    const vision = (activePlan?.visionStatements || []).map(v => v.text).join(' | ') || 'No vision captured';
    const baselineNarrative = truncate(activePlan?.baselineNarrative, 450) || 'Baseline narrative not yet drafted';
    const trends = activePlan?.baselineTrends ? Object.entries(activePlan.baselineTrends).map(([k, v]) => `${k}: ${truncate(v, 120)}`).join(' | ') : '';
    const sea = activePlan?.seaHra ? [
      `SEA scoping: ${activePlan.seaHra.seaScopingStatus || 'unknown'}`,
      activePlan.seaHra.baselineGrid ? `Receptors: ${Object.keys(activePlan.seaHra.baselineGrid).join(', ')}` : '',
      activePlan.seaHra.keyRisks?.length ? `Risks: ${activePlan.seaHra.keyRisks.join('; ')}` : ''
    ].filter(Boolean).join(' | ') : 'SEA/HRA baseline not recorded';
    const constraints = (councilData.spatialData.constraints || []).slice(0, 6).map(c => c.label).join(', ');
    const sites = (activePlan?.sites || []).slice(0, 5).map(s => `${s.name || s.id}${s.capacityEstimate ? ` (${s.capacityEstimate} units)` : ''}`).join(' | ');
    const consultations = (activePlan?.consultationSummaries || []).map(c => `${c.stageId}: ${truncate(c.mainIssues?.join('; ') || '', 120)}`).join(' | ');
    return [
      `Authority: ${councilData.name}`,
      `Vision: ${vision}`,
      `Baseline: ${baselineNarrative}`,
      trends ? `Trends: ${trends}` : '',
      `SEA/HRA: ${sea}`,
      constraints ? `Constraints: ${constraints}` : '',
      sites ? `Sites/context: ${sites}` : '',
      consultations ? `Engagement themes: ${consultations}` : '',
    ].filter(Boolean).join('\n');
  }, [activePlan?.baselineNarrative, activePlan?.baselineTrends, activePlan?.consultationSummaries, activePlan?.sites, activePlan?.visionStatements, councilData.name, councilData.spatialData.constraints, activePlan?.seaHra]);

  const selectedOutcome = useMemo(() => outcomes.find(o => o.id === selectedOutcomeId) || null, [outcomes, selectedOutcomeId]);
  const overallScore = outcomes.length ? Math.round(outcomes.reduce((acc, o) => acc + computeCompletenessScore(o), 0) / outcomes.length) : 0;
  const engagementThemes = (activePlan.consultationSummaries || []).flatMap(c => c.mainIssues || []).filter(Boolean);
  const themeOptions = Array.from(new Set(['Housing', 'Economy', 'Transport', 'Environment', 'Place', 'Health', ...(outcomes.map(o => o.theme || 'General'))]));
  const complianceTone = overallScore >= 85 ? 'Green' : overallScore >= 65 ? 'Amber' : 'Red';

  const updateOutcome = useCallback((id: string, patch: Partial<SmartOutcome>) => {
    setOutcomes(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
  }, []);

  const generateSmartOutcomes = useCallback(async () => {
    if (!activePlan) return;
    setBusy('generate');
    setStatus('Generating SMART outcomes with AI...');
    setReport('');
    try {
      const prompt = [
        'You are building SMART outcomes for the Vision & Outcomes stage of a UK Local Plan (CULP).',
        'Propose 6-9 outcomes across themes (housing, economy, transport, environment/climate, health, place-making).',
        'Each outcome must include Specific, Measurable, Achievable, Relevant, and Time-bound statements with realistic indicators and targets. Include Year-1 monitoring hooks where useful.',
        'Keep outcomes spatially aware and linkable to SEA objectives and monitoring.',
        `Context:\n${contextText}`,
        'Return JSON array only with objects shaped as:',
        '{ "id": "outcome-1", "theme": "Transport", "outcome_statement": "Increase high-quality active travel use", "specific": "...", "measurable": "...", "achievable": "...", "relevant": "...", "timebound": "...", "indicators": [{ "id": "ind-1", "name": "Modal share for active travel", "baseline": "32%", "target": "42% by 2031", "source": "ONS/GLA", "difficulty": "medium", "frequency": "annual" }], "linked_policies": ["T1"], "linked_sites": [], "linked_sea_objectives": ["air_quality"], "spatial_layers": ["active_travel_network"], "monitoring_frequency": "annual", "risks": ["funding slippage"], "status": "amber" }',
      ].join('\n');
      const raw = await callLLM({ mode: 'json', prompt });
      const parsed = parseJsonCandidate(raw);
      if (Array.isArray(parsed)) {
        const normalized = parsed.map((o, idx) => normalizeOutcome(o, idx));
        setOutcomes(normalized);
        setSelectedOutcomeId(normalized[0]?.id || null);
        setStatus(`Generated ${normalized.length} SMART outcomes.`);
      } else {
        setStatus('AI did not return valid outcomes.');
      }
    } catch (e) {
      setStatus('Could not generate outcomes. Try again.');
    } finally {
      setBusy(null);
    }
  }, [activePlan, contextText]);

  useEffect(() => {
    if (autoRun && outcomes.length === 0 && !busy) {
      generateSmartOutcomes();
    }
  }, [autoRun, outcomes.length, busy, generateSmartOutcomes]);

  const enrichSelected = async () => {
    if (!selectedOutcome) return;
    setBusy(`enrich-${selectedOutcome.id}`);
    setStatus('Refining SMART fields and linkages...');
    try {
      const prompt = [
        'Improve this SMART outcome so it is fully monitorable and linked to policies/SEA.',
        `Context:\n${contextText}`,
        `Outcome JSON: ${JSON.stringify(selectedOutcome)}`,
        'Return JSON object only with optional keys: specific, measurable, achievable, relevant, timebound, indicators (array), linked_policies, linked_sites, linked_sea_objectives, spatial_layers, monitoring_frequency, risks, status, gateway_flags.',
      ].join('\n');
      const raw = await callLLM({ mode: 'json', prompt });
      const parsed = parseJsonCandidate(raw) || {};
      const updated = normalizeOutcome({ ...selectedOutcome, ...parsed }, outcomes.findIndex(o => o.id === selectedOutcome.id));
      updateOutcome(selectedOutcome.id, updated);
      setStatus('Outcome refined with AI.');
    } catch {
      setStatus('Could not refine outcome.');
    } finally {
      setBusy(null);
    }
  };

  const runValidation = async () => {
    if (!outcomes.length) return;
    setBusy('validate');
    setStatus('Running SMART/NPPF checks...');
    try {
      const prompt = [
        'Act as a PINS Gateway 2/3 reviewer.',
        'Score each SMART outcome for SMART completeness (0-100) and flag NPPF Tests of Soundness issues.',
        `Context:\n${contextText}`,
        `Outcomes: ${JSON.stringify(outcomes)}`,
        'Return JSON: { "reviews": [{ "id": "<id>", "smartScore": 0-100, "nppfWarnings": [string], "evidenceGaps": [string], "soundnessRisks": [string], "status": "green|amber|red" }], "summary": "short text" }',
      ].join('\n');
      const raw = await callLLM({ mode: 'json', prompt });
      const parsed = parseJsonCandidate(raw);
      if (parsed?.reviews && Array.isArray(parsed.reviews)) {
        setValidationSummary(parsed.summary || 'Validation complete.');
        setOutcomes(prev => prev.map(o => {
          const review = parsed.reviews.find((r: any) => r.id === o.id);
          if (!review) return o;
          return {
            ...o,
            status: review.status || o.status,
            checks: {
              smartScore: review.smartScore,
              nppfWarnings: review.nppfWarnings,
              evidenceGaps: review.evidenceGaps,
              soundnessRisks: review.soundnessRisks,
            }
          };
        }));
        setStatus('Validation complete.');
      } else {
        setStatus('Validation did not return structured data.');
      }
    } catch {
      setStatus('Validation failed.');
    } finally {
      setBusy(null);
    }
  };

  const suggestions = useMemo(() => {
    const list: Array<{ text: string; action: () => void }> = [];
    const current = outcomes.find(o => o.id === selectedOutcomeId);
    if (!current) return list;
    if (!current.measurable || !current.indicators?.length) {
      list.push({ text: 'This outcome is missing a measurable indicator.', action: () => setActiveTab('indicators') });
    }
    if (!current.spatialLayers?.length) {
      list.push({ text: 'Spatial footprint unclear - add layers or sites.', action: () => setActiveTab('linkages') });
    }
    if (!current.linkedSeaObjectives?.length) {
      list.push({ text: 'Add SEA objectives to keep environmental lens visible.', action: () => setActiveTab('linkages') });
    }
    if (!current.monitoringFrequency) {
      list.push({ text: 'Monitoring frequency missing - set annual/quarterly.', action: () => setActiveTab('linkages') });
    }
    if (!current.risks?.length) {
      list.push({ text: 'Add delivery/SEA risks to strengthen Gateway readiness.', action: () => setActiveTab('risks') });
    }
    if (!current.checks?.smartScore) {
      list.push({ text: 'Run SMART/NPPF compliance to surface gaps.', action: runValidation });
    }
    return list;
  }, [outcomes, selectedOutcomeId, runValidation]);

  const generateReport = async () => {
    if (!outcomes.length) return;
    setBusy('report');
    setStatus('Generating outcomes report...');
    try {
      const prompt = [
        'Create a concise SMART Outcomes Report for the Vision & Outcomes stage.',
        'Include: summary paragraph, list of outcomes with indicators/baselines/targets, SEA/HRA linkages, monitoring frequency/data sources, Year-1 monitoring plan, Year-4 evaluation baseline, and a short Gateway 2 extract.',
        'Return markdown only.',
        `Authority: ${councilData.name}`,
        `Context:\n${contextText}`,
        `Outcomes JSON: ${JSON.stringify(outcomes)}`,
      ].join('\n');
      const markdown = await callLLM({ mode: 'markdown', prompt });
      setReport(markdown || '');
      setStatus('Report ready.');
    } catch {
      setStatus('Could not generate report.');
    } finally {
      setBusy(null);
    }
  };

  const addOutcome = () => {
    const id = `outcome_${Date.now()}`;
    const blank: SmartOutcome = {
      id,
      theme: 'General',
      outcomeStatement: 'New SMART outcome',
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      timebound: '',
      indicators: [],
      linkedPolicies: [],
      linkedSites: [],
      linkedSeaObjectives: [],
      spatialLayers: [],
      monitoringFrequency: '',
      risks: [],
      status: 'amber',
    };
    setOutcomes(prev => [...prev, blank]);
    setSelectedOutcomeId(id);
  };

  const addIndicator = (outcomeId: string, template?: { name: string; baseline?: string; target?: string; difficulty?: IndicatorDifficulty }) => {
    const newInd = normalizeIndicator({
      name: template?.name || 'New indicator',
      baseline: template?.baseline,
      target: template?.target,
      difficulty: template?.difficulty || 'medium',
    }, Date.now());
    setOutcomes(prev => prev.map(o => (o.id === outcomeId ? { ...o, indicators: [...(o.indicators || []), newInd] } : o)));
  };

  const duplicateOutcome = (id: string) => {
    const found = outcomes.find(o => o.id === id);
    if (!found) return;
    const copy = { ...found, id: `outcome_${Date.now()}`, outcomeStatement: `${found.outcomeStatement} (copy)` };
    setOutcomes(prev => [...prev, copy]);
    setSelectedOutcomeId(copy.id);
  };

  const deleteOutcome = (id: string) => {
    const remaining = outcomes.filter(o => o.id !== id);
    setOutcomes(remaining);
    if (selectedOutcomeId === id) setSelectedOutcomeId(remaining[0]?.id || null);
  };

  const savePlan = () => {
    if (!activePlan) return;
    const visionFromSmart: VisionOutcome[] = outcomes.map(o => ({
      id: o.id,
      text: o.outcomeStatement,
      metric: o.measurable,
      linkedPolicies: o.linkedPolicies,
      linkedSites: o.linkedSites,
    }));
    const linkMap = outcomes.reduce<Record<string, { policyIds?: string[]; siteIds?: string[] }>>((acc, o) => {
      acc[o.id] = { policyIds: o.linkedPolicies || [], siteIds: o.linkedSites || [] };
      return acc;
    }, {});
    updatePlan(activePlan.id, {
      smartOutcomes: outcomes,
      visionStatements: visionFromSmart,
      outcomePolicyLinks: linkMap,
    });
    setStatus('Saved SMART outcomes to plan.');
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(outcomes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smart-outcomes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activePlan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan selected</div>
        <p className="text-sm text-[var(--color-muted)]">Create or open a plan to run the SMART Outcomes tool.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 flex flex-col gap-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-[var(--color-muted)] uppercase">Vision & Outcomes</div>
            <div className="text-xl font-semibold text-[var(--color-ink)]">SMART Tool</div>
            {status && <div className="text-xs text-[var(--color-muted)] mt-1">{status}</div>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={generateSmartOutcomes} disabled={busy === 'generate'} variant="primary">Generate outcomes</Button>
            <Button onClick={runValidation} disabled={busy === 'validate'} variant="outline">Run SMART/NPPF</Button>
            <Button onClick={savePlan} disabled={!outcomes.length} variant="secondary">Save to plan</Button>
            <div className="relative">
              <button className="px-3 py-2 border border-[var(--color-edge)] rounded-lg text-sm text-[var(--color-ink)] bg-[var(--color-surface)]" onClick={() => setShowMenu(v => !v)} aria-label="More actions">...</button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg shadow-lg z-20">
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-surface)]" onClick={() => { downloadJson(); setShowMenu(false); }}>Export JSON</button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-surface)]" onClick={() => { generateReport(); setShowMenu(false); }} disabled={!outcomes.length || busy === 'report'}>Export report</button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-surface)]" onClick={() => { addOutcome(); setShowMenu(false); }}>Add blank outcome</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-[var(--color-ink)] font-semibold">Overall SMART compliance: {overallScore}% ({complianceTone})</div>
          <div className="flex-1 h-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-full overflow-hidden">
            <div className={`h-full ${overallScore >= 85 ? 'bg-green-500' : overallScore >= 65 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${overallScore}%` }} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,320px)_1fr_minmax(240px,280px)] gap-4 items-start">
          <div className="w-full">
            {!showContext ? (
              <button className="text-sm text-[var(--color-accent)] hover:underline" onClick={() => setShowContext(true)}>Show context panel</button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[var(--color-ink)]">Context</div>
                  <button className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]" onClick={() => setShowContext(false)}>Hide</button>
                </div>
                <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-2">
                  <div className="text-xs uppercase text-[var(--color-muted)]">Vision</div>
                  <div className="text-sm text-[var(--color-ink)]">{(activePlan.visionStatements || []).map(v => v.text).join(' | ') || 'No vision drafted yet.'}</div>
                  <div className="text-xs uppercase text-[var(--color-muted)] mt-2">Engagement themes</div>
                  <div className="flex flex-wrap gap-1 text-xs text-[var(--color-ink)]">
                    {engagementThemes.length > 0 ? engagementThemes.slice(0, 6).map((t, i) => (
                      <span key={i} className="px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-full">{t}</span>
                    )) : <span className="text-[var(--color-muted)]">Not captured</span>}
                  </div>
                </div>
                <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-2">
                  <div className="text-xs uppercase text-[var(--color-muted)]">Constraints snapshot</div>
                  <div className="text-xs text-[var(--color-ink)]">{(councilData.spatialData.constraints || []).slice(0, 6).map(c => c.label).join(', ') || 'No constraints loaded.'}</div>
                  <div className="text-xs uppercase text-[var(--color-muted)] mt-2">SEA baseline</div>
                  <div className="flex gap-1">
                    {SEA_CATEGORIES.map(cat => {
                      const has = activePlan.seaHra?.baselineGrid && (activePlan.seaHra.baselineGrid as any)[cat.id];
                      const tone = has ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200';
                      return <span key={cat.id} className={`px-2 py-1 text-xs rounded-full border ${tone}`}>{cat.icon}</span>;
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="hidden lg:block" />
          <div className="hidden lg:block">
            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-2">
              <div className="text-sm font-semibold text-[var(--color-ink)]">LLM Assist</div>
              {suggestions.length === 0 && <div className="text-xs text-[var(--color-muted)]">All clear for now.</div>}
              {suggestions.slice(0, 4).map((s, i) => (
                <button key={i} className="w-full text-left text-xs px-2 py-2 border border-[var(--color-edge)] rounded-lg hover:border-[var(--color-accent)] bg-[var(--color-surface)]" onClick={s.action}>
                  {s.text}
                </button>
              ))}
              <button className="w-full text-left text-xs px-2 py-2 border border-[var(--color-edge)] rounded-lg hover:border-[var(--color-accent)] bg-[var(--color-surface)]" onClick={enrichSelected} disabled={!selectedOutcome || busy?.startsWith('enrich')}>
                Auto-fill selected outcome
              </button>
            </div>
          </div>
        </div>

        {busy === 'generate' && <LoadingSpinner />}
        {!outcomes.length && busy !== 'generate' && (
          <div className="text-sm text-[var(--color-muted)] border border-dashed border-[var(--color-edge)] rounded-lg p-4">
            Outcome Gallery empty. Click "Generate outcomes" to draft 6-9 SMART outcomes or use the menu to add one manually.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {outcomes.map(o => {
            const score = computeCompletenessScore(o);
            return (
              <div key={o.id} className={`border rounded-xl p-3 bg-[var(--color-panel)] shadow-sm hover:border-[var(--color-accent)] cursor-pointer transition ${selectedOutcomeId === o.id ? 'border-[var(--color-accent)]' : 'border-[var(--color-edge)]'}`} onClick={() => setSelectedOutcomeId(o.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-[var(--color-ink)] line-clamp-2">{o.outcomeStatement}</div>
                  <span className="text-[10px] px-2 py-1 rounded-full border bg-[var(--color-surface)] text-[var(--color-muted)]">{o.theme}</span>
                </div>
                <div className="text-xs text-[var(--color-muted)] mt-2">SMART score: {miniSmartDots(o)} ({Math.round(score / 20)}/5 complete)</div>
                <div className="flex flex-wrap gap-2 text-[10px] text-[var(--color-muted)] mt-2">
                  <span className="px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-full">Indicators: {o.indicators?.length || 0}</span>
                  <span className="px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-full">Policies: {o.linkedPolicies?.length || 0}</span>
                </div>
                <button className="mt-3 text-xs text-[var(--color-accent)] hover:underline">Open details</button>
              </div>
            );
          })}
        </div>
      </div>

      {selectedOutcome && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/25 px-4 py-8">
          <div className="w-full max-w-5xl bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl shadow-2xl p-4 overflow-y-auto max-h-[90vh]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <input
                  value={selectedOutcome.outcomeStatement}
                  onChange={(e) => updateOutcome(selectedOutcome.id, { outcomeStatement: e.target.value })}
                  className="w-full text-lg font-semibold text-[var(--color-ink)] bg-transparent border-b border-[var(--color-edge)] focus:outline-none"
                />
                <select
                  value={selectedOutcome.theme}
                  onChange={(e) => updateOutcome(selectedOutcome.id, { theme: e.target.value })}
                  className="mt-2 w-full text-sm border border-[var(--color-edge)] rounded-lg px-2 py-1 bg-[var(--color-surface)] text-[var(--color-ink)]"
                >
                  {themeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <button className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]" onClick={() => duplicateOutcome(selectedOutcome.id)}>Duplicate</button>
                <button className="text-xs text-red-600 hover:underline" onClick={() => deleteOutcome(selectedOutcome.id)}>Delete</button>
                <button className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]" onClick={() => setSelectedOutcomeId(null)}>Close</button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {(['smart', 'indicators', 'linkages', 'risks'] as const).map(tab => (
                <button
                  key={tab}
                  className={`text-xs px-3 py-2 rounded-lg border ${activeTab === tab ? 'border-[var(--color-accent)] text-[var(--color-ink)] bg-[var(--color-surface)]' : 'border-[var(--color-edge)] text-[var(--color-muted)]'}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'smart' && 'SMART'}
                  {tab === 'indicators' && 'Indicators'}
                  {tab === 'linkages' && 'Linkages'}
                  {tab === 'risks' && 'Risks'}
                </button>
              ))}
            </div>

            {activeTab === 'smart' && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {(['specific', 'measurable', 'achievable', 'relevant', 'timebound'] as const).map(key => (
                  <div key={key} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase text-[var(--color-muted)]">{key}</div>
                      <span className="text-[10px] px-2 py-1 rounded-full border bg-white text-[var(--color-muted)]">{(selectedOutcome as any)[key] ? 'AI filled' : 'Fill now'}</span>
                    </div>
                    <div className="text-xs text-[var(--color-muted)] mt-1">AI suggestion: {(selectedOutcome as any)[key] || 'Click auto-fill'}</div>
                    <textarea
                      value={(selectedOutcome as any)[key] || ''}
                      onChange={(e) => updateOutcome(selectedOutcome.id, { [key]: e.target.value } as any)}
                      rows={3}
                      className="mt-2 w-full bg-white border border-[var(--color-edge)] rounded-lg px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'indicators' && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {INDICATOR_TEMPLATES.map(t => (
                    <button key={t.id} className="px-3 py-1.5 text-xs border border-[var(--color-edge)] rounded-full bg-[var(--color-surface)] hover:border-[var(--color-accent)]" onClick={() => addIndicator(selectedOutcome.id, t)}>
                      {t.name}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {(selectedOutcome.indicators || []).map(ind => (
                    <div key={ind.id} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-panel)]">
                      <input
                        value={ind.name}
                        onChange={(e) => setOutcomes(prev => prev.map(o => o.id === selectedOutcome.id ? { ...o, indicators: (o.indicators || []).map(i => i.id === ind.id ? { ...i, name: e.target.value } : i) } : o))}
                        className="w-full text-sm font-semibold text-[var(--color-ink)] bg-transparent border-b border-[var(--color-edge)]"
                      />
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                        <input value={ind.baseline || ''} onChange={(e) => setOutcomes(prev => prev.map(o => o.id === selectedOutcome.id ? { ...o, indicators: (o.indicators || []).map(i => i.id === ind.id ? { ...i, baseline: e.target.value } : i) } : o))} className="px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" placeholder="Baseline" />
                        <input value={ind.target || ''} onChange={(e) => setOutcomes(prev => prev.map(o => o.id === selectedOutcome.id ? { ...o, indicators: (o.indicators || []).map(i => i.id === ind.id ? { ...i, target: e.target.value } : i) } : o))} className="px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]" placeholder="Target" />
                        <input value={ind.source || ''} onChange={(e) => setOutcomes(prev => prev.map(o => o.id === selectedOutcome.id ? { ...o, indicators: (o.indicators || []).map(i => i.id === ind.id ? { ...i, source: e.target.value } : i) } : o))} className="px-2 py-1 rounded border border-[var(--color-edge)] bg-[var(--color-surface)] col-span-2" placeholder="Data source / frequency" />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`text-[10px] px-2 py-1 rounded-full border ${difficultyBadge(ind.difficulty)}`}>{ind.difficulty || 'set difficulty'}</span>
                        <button className="text-[11px] text-[var(--color-muted)] hover:text-[var(--color-ink)]" onClick={() => setOutcomes(prev => prev.map(o => o.id === selectedOutcome.id ? { ...o, indicators: (o.indicators || []).filter(i => i.id !== ind.id) } : o))}>Remove</button>
                      </div>
                    </div>
                  ))}
                  <button className="text-xs text-[var(--color-accent)] hover:underline" onClick={() => addIndicator(selectedOutcome.id)}>+ Add indicator</button>
                </div>
              </div>
            )}

            {activeTab === 'linkages' && (
              <div className="mt-3 space-y-3">
                <div>
                  <div className="text-xs uppercase text-[var(--color-muted)]">Linked policies</div>
                  <select
                    multiple
                    className="w-full border border-[var(--color-edge)] rounded-lg p-2 text-sm bg-[var(--color-surface)]"
                    value={selectedOutcome.linkedPolicies || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                      updateOutcome(selectedOutcome.id, { linkedPolicies: selected });
                    }}
                  >
                    {councilData.policies.slice(0, 12).map(p => (
                      <option key={p.reference} value={p.reference}>{p.reference} {p.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-xs uppercase text-[var(--color-muted)] mb-1">SEA objectives</div>
                  <div className="flex flex-wrap gap-2">
                    {SEA_CATEGORIES.map(cat => {
                      const active = (selectedOutcome.linkedSeaObjectives || []).includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          className={`px-2 py-1 text-sm rounded-full border ${active ? 'border-[var(--color-accent)] bg-[var(--color-surface)]' : 'border-[var(--color-edge)] bg-[var(--color-panel)]'}`}
                          onClick={() => {
                            const next = new Set(selectedOutcome.linkedSeaObjectives || []);
                            if (active) next.delete(cat.id); else next.add(cat.id);
                            updateOutcome(selectedOutcome.id, { linkedSeaObjectives: Array.from(next) });
                          }}
                          title={cat.label}
                        >
                          {cat.icon}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-[var(--color-muted)]">Spatial footprint</div>
                  <input
                    value={(selectedOutcome.spatialLayers || []).join(', ')}
                    onChange={(e) => updateOutcome(selectedOutcome.id, { spatialLayers: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg text-sm"
                    placeholder="Add layers, wards, or sites affected"
                  />
                  <div className="text-[10px] text-[var(--color-muted)] mt-1">Use commas to list spatial layers/areas.</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs uppercase text-[var(--color-muted)]">Monitoring frequency</div>
                    <input
                      value={selectedOutcome.monitoringFrequency || ''}
                      onChange={(e) => updateOutcome(selectedOutcome.id, { monitoringFrequency: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg text-sm"
                      placeholder="Annual / quarterly"
                    />
                  </div>
                  <div>
                    <div className="text-xs uppercase text-[var(--color-muted)]">Linked sites</div>
                    <input
                      value={(selectedOutcome.linkedSites || []).join(', ')}
                      onChange={(e) => updateOutcome(selectedOutcome.id, { linkedSites: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg text-sm"
                      placeholder="Site ids"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'risks' && (
              <div className="mt-3 space-y-3">
                <div className="text-xs text-[var(--color-muted)]">Surface delivery and SEA/HRA risks with quick RAG.</div>
                <div className="space-y-2">
                  {(selectedOutcome.risks || []).map((r, idx) => (
                    <div key={idx} className="border border-[var(--color-edge)] rounded-lg p-2 bg-[var(--color-surface)] flex items-center gap-2">
                      <select className="text-xs border border-[var(--color-edge)] rounded px-2 py-1 bg-white" defaultValue="amber">
                        <option value="red">Red</option>
                        <option value="amber">Amber</option>
                        <option value="green">Green</option>
                      </select>
                      <input
                        value={r}
                        onChange={(e) => updateOutcome(selectedOutcome.id, { risks: (selectedOutcome.risks || []).map((item, i) => i === idx ? e.target.value : item) })}
                        className="flex-1 text-sm text-[var(--color-ink)] bg-transparent border-b border-[var(--color-edge)]"
                      />
                      <button className="text-[10px] text-[var(--color-muted)] hover:text-[var(--color-ink)]" onClick={() => updateOutcome(selectedOutcome.id, { risks: (selectedOutcome.risks || []).filter((_, i) => i !== idx) })}>Remove</button>
                    </div>
                  ))}
                  <button className="text-xs text-[var(--color-accent)] hover:underline" onClick={() => updateOutcome(selectedOutcome.id, { risks: [...(selectedOutcome.risks || []), 'New risk'] })}>+ Add risk</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {report && (
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-[var(--color-ink)]">Generated Outcomes Report</div>
            <button className="text-xs text-[var(--color-accent)] hover:underline" onClick={() => setReport('')}>Clear</button>
          </div>
          <MarkdownContent content={report} />
        </div>
      )}
    </div>
  );
};
