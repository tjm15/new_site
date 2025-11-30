import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CouncilData, Plan } from '../../../../data/types';
import { usePlan } from '../../../../contexts/PlanContext';
import { callLLM } from '../../../../utils/llmClient';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

type RiskArea = { id: string; rag: 'red' | 'amber' | 'green'; summary?: string; actions?: string[] };

const AREA_LABELS: Record<string, string> = {
  governance: 'Governance',
  resources: 'Resources',
  timetable: 'Timetable realism',
  scope: 'Scope / focus',
  risks: 'Headline risks',
};

function extractJson(raw: string): any | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  const candidates: string[] = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) candidates.push(fenced[1].trim());
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first !== -1 && last > first) candidates.push(trimmed.slice(first, last + 1));
  for (const c of candidates) {
    try {
      return JSON.parse(c);
    } catch {
      continue;
    }
  }
  return undefined;
}

export const PrepRiskTool: React.FC<{
  councilData: CouncilData;
  autoRun?: boolean;
  prefill?: Record<string, any>;
  initialGovernance?: string;
  initialResources?: string;
  initialScope?: string;
  initialRisks?: string;
  initialPidDone?: string;
  plan?: Plan;
}> = ({ councilData, autoRun, prefill, initialGovernance, initialResources, initialScope, initialRisks, initialPidDone, plan }) => {
  const { activePlan, updatePlan } = usePlan();
  const workingPlan = plan && plan.councilId === councilData.id ? plan : (activePlan?.councilId === councilData.id ? activePlan : undefined);
  const [pidDone, setPidDone] = useState('yes');
  const [governance, setGovernance] = useState('Project board agreed; decision route via Cabinet.');
  const [resources, setResources] = useState('Core team of 4 FTE; procurement for transport commission in flight.');
  const [headlineRisks, setHeadlineRisks] = useState('Transport modelling delay; staff turnover risk; political sign-off timing.');
  const [scope, setScope] = useState('Full Local Plan under new system, 30-month timetable.');
  const [result, setResult] = useState<{ areas: RiskArea[]; overallStatus?: 'red' | 'amber' | 'green'; overallComment?: string }>({ areas: [] });
  const [rawOutput, setRawOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const autoRanRef = useRef(false);

  const heuristicAreas = useMemo(() => {
    const mk = (id: RiskArea['id'], text: string) => {
      const len = (text || '').trim().length;
      const rag: RiskArea['rag'] = len > 120 ? 'green' : len > 40 ? 'amber' : 'red';
      const summary = len ? text.slice(0, 180) : `No ${AREA_LABELS[id] || id} summary provided.`;
      return { id, rag, summary, actions: [] as string[] };
    };
    return {
      governance: mk('governance', governance),
      resources: mk('resources', resources),
      timetable: mk('timetable', (workingPlan?.timetable?.milestones || []).map(m => `${m.stageId}:${m.date}`).join(', ')),
      scope: mk('scope', scope),
      risks: mk('risks', headlineRisks),
    };
  }, [governance, resources, scope, headlineRisks, workingPlan?.timetable?.milestones]);

  useEffect(() => {
    if (!workingPlan) return;
    if (workingPlan.prepRiskAssessment) {
      setResult(workingPlan.prepRiskAssessment);
      setStatus('Loaded previous assessment.');
    }
  }, [workingPlan?.id]);

  useEffect(() => {
    const pg = prefill?.governance || initialGovernance;
    const pr = prefill?.resources || initialResources;
    const ps = prefill?.scope || initialScope;
    const rk = prefill?.headlineRisks || prefill?.risks || initialRisks;
    const pid = prefill?.pidDone || initialPidDone;
    if (pg && governance === 'Project board agreed; decision route via Cabinet.') setGovernance(pg);
    if (pr && resources === 'Core team of 4 FTE; procurement for transport commission in flight.') setResources(pr);
    if (ps && scope === 'Full Local Plan under new system, 30-month timetable.') setScope(ps);
    if (rk && headlineRisks === 'Transport modelling delay; staff turnover risk; political sign-off timing.') setHeadlineRisks(rk);
    if (pid && pidDone === 'yes') setPidDone(pid);
  }, [prefill, initialGovernance, initialResources, initialScope, initialRisks, initialPidDone, governance, resources, scope, headlineRisks, pidDone]);

  useEffect(() => {
    if (autoRun && !loading && (!result.areas || result.areas.length === 0) && !autoRanRef.current) {
      autoRanRef.current = true;
      runAssessment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const runAssessment = async () => {
    if (!workingPlan) return;
    setLoading(true);
    setStatus(null);
    setRawOutput('');
    const payload = {
      authority: councilData.name,
      planTitle: workingPlan.title,
      planStage: workingPlan.planStage,
      pidDone,
      governance,
      resources,
      scope,
      headlineRisks,
      timetable: workingPlan.timetable,
    };
    const prompt = [
      'You are assessing preparation readiness for this Local Plan. Return JSON ONLY with shape:',
      '{ "areas": [{ "id": "governance|resources|timetable|scope|risks", "rag": "red|amber|green", "summary": "1-2 sentences", "actions": ["..."] }], "overallStatus": "red|amber|green", "overallComment": "optional short text" }',
      'You MUST return exactly 5 areas with ids: governance, resources, timetable, scope, risks. No extra fields, no unrelated timelines.',
      'Score realistically; prefer amber/green if inputs are strong. Summaries must be short and grounded in the provided inputs.',
      `Plan context: ${JSON.stringify(payload, null, 2)}`
    ].join('\n');
    try {
      const raw = await callLLM({ prompt, mode: 'json' });
      setRawOutput(raw || '');
      const parsed = extractJson(raw || '') || raw;
      const expectedIds: Array<RiskArea['id']> = ['governance', 'resources', 'timetable', 'scope', 'risks'];
      const areasRaw = Array.isArray((parsed as any)?.areas) ? (parsed as any).areas : (Array.isArray(parsed) ? parsed : []);
      const mapped: RiskArea[] = [];
      areasRaw.forEach((a: any) => {
        const id = expectedIds.includes(a?.id) ? a.id : undefined;
        if (!id) return;
        mapped.push({
          id,
          rag: (a?.rag === 'red' || a?.rag === 'amber' || a?.rag === 'green') ? a.rag : 'amber',
          summary: a?.summary || a?.reason || '',
          actions: Array.isArray(a?.actions) ? a.actions : [],
        });
      });
      const ensureAreas: RiskArea[] = expectedIds.map(id => {
        const found = mapped.find(m => m.id === id);
        if (found) {
          return {
            ...found,
            summary: found.summary || heuristicAreas[id]?.summary || `No ${AREA_LABELS[id] || id} summary provided.`,
            rag: found.rag || heuristicAreas[id]?.rag || 'amber'
          };
        }
        return heuristicAreas[id] || { id, rag: 'amber', summary: `No ${AREA_LABELS[id] || id} summary provided.`, actions: [] };
      });
      const overallStatus = (parsed as any)?.overallStatus || ensureAreas.find(a => a.rag)?.rag || 'amber';
      setResult({ areas: ensureAreas, overallStatus, overallComment: (parsed as any)?.overallComment });
      setStatus('Assessed with AI.');
    } catch (e) {
      setStatus('Could not run assessment right now.');
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!workingPlan) return;
    updatePlan(workingPlan.id, {
      prepRiskAssessment: {
        ...result,
        assessedAt: new Date().toISOString(),
      }
    } as any);
    setStatus('Saved to plan.');
  };

  const badge = (rag?: string) => {
    const base = 'px-2 py-1 text-[11px] rounded-full border';
    if (rag === 'green') return `${base} bg-green-100 text-green-800 border-green-200`;
    if (rag === 'amber') return `${base} bg-amber-100 text-amber-800 border-amber-200`;
    if (rag === 'red') return `${base} bg-red-100 text-red-800 border-red-200`;
    return `${base} bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-edge)]`;
  };

  if (!workingPlan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan selected</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to run a prep risk assessment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-[var(--color-muted)]">Preparation stage</div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Preparation Risk Assessor</h2>
          <p className="text-sm text-[var(--color-muted)]">RAG governance, resources, timetable realism, and headline risks before Gateway 1.</p>
        </div>
        {status && <span className="text-xs text-[var(--color-muted)]">{status}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        <div className="space-y-3 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
          <div>
            <label className="text-xs text-[var(--color-muted)]">PID drafted?</label>
            <select
              value={pidDone}
              onChange={(e) => setPidDone(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-[var(--color-edge)] rounded bg-[var(--color-surface)] text-[var(--color-ink)]"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="partial">In progress</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)]">Governance route</label>
            <textarea
              value={governance}
              onChange={(e) => setGovernance(e.target.value)}
              rows={2}
              className="w-full mt-1 px-3 py-2 border border-[var(--color-edge)] rounded bg-[var(--color-surface)] text-[var(--color-ink)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)]">Resources</label>
            <textarea
              value={resources}
              onChange={(e) => setResources(e.target.value)}
              rows={2}
              className="w-full mt-1 px-3 py-2 border border-[var(--color-edge)] rounded bg-[var(--color-surface)] text-[var(--color-ink)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)]">Scope / focus</label>
            <textarea
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              rows={2}
              className="w-full mt-1 px-3 py-2 border border-[var(--color-edge)] rounded bg-[var(--color-surface)] text-[var(--color-ink)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)]">Headline risks</label>
            <textarea
              value={headlineRisks}
              onChange={(e) => setHeadlineRisks(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-[var(--color-edge)] rounded bg-[var(--color-surface)] text-[var(--color-ink)]"
            />
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded shadow disabled:opacity-50"
              onClick={runAssessment}
              disabled={loading}
            >
              {loading ? 'Assessing…' : 'Run RAG'}
            </button>
            <button
              className="px-4 py-2 bg-[var(--color-ink)] text-white rounded shadow disabled:opacity-50"
              onClick={save}
              disabled={!result.areas || result.areas.length === 0}
            >
              Save to plan
            </button>
          </div>
        </div>

        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 min-h-[260px]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)]">RAG results</div>
              <div className="text-xs text-[var(--color-muted)]">Authority: {councilData.name}</div>
            </div>
            <span className={badge(result.overallStatus)}>{(result.overallStatus || 'n/a').toUpperCase()}</span>
          </div>
          {loading && <LoadingSpinner />}
          {!loading && result.areas && result.areas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.areas.map((area, idx) => (
                <div key={idx} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                    <div className="font-semibold text-[var(--color-ink)]">{AREA_LABELS[area.id] || area.id}</div>
                    <div className="text-xs text-[var(--color-muted)] whitespace-pre-wrap">{area.summary || 'No summary provided.'}</div>
                  </div>
                  <span className={badge(area.rag)}>{(area.rag || 'n/a').toUpperCase()}</span>
                </div>
                {area.actions && area.actions.length > 0 && (
                  <ul className="mt-2 list-disc ml-4 text-xs text-[var(--color-ink)] space-y-1">
                      {area.actions.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !loading && <div className="text-sm text-[var(--color-muted)]">Run the assessment to see results.</div>
          )}
          {!loading && rawOutput && result.areas.length === 0 && (
            <div className="mt-2 text-xs text-[var(--color-muted)] whitespace-pre-wrap border-t border-[var(--color-edge)] pt-2">Raw output: {rawOutput}</div>
          )}
        </div>
      </div>
    </div>
  );
};
