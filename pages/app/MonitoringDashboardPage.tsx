import React, { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllCouncils, getCouncilData } from '../../data';
import { usePlan } from '../../contexts/PlanContext';
import { STAGES } from '../../data/stageMeta';

type StatusTone = 'green' | 'amber' | 'red' | 'info';

const statusClass = (tone: StatusTone) => {
  switch (tone) {
    case 'green':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'amber':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'red':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const toolRouteMap: Record<string, string> = {
  EvidenceTool: 'evidence',
  PolicyDrafterTool: 'policy',
  SEATool: 'sea',
  ReportDrafterTool: 'report',
  AdoptionTool: 'adoption',
  MonitoringBuilderTool: 'monitoring',
  Year4EvaluationTool: 'year4',
};

export default function MonitoringDashboardPage() {
  const councils = getAllCouncils();
  const monitoringStage = useMemo(() => STAGES.find(s => s.id === 'MONITORING'), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCouncilId = searchParams.get('c') || councils[0]?.id;
  const councilData = selectedCouncilId ? getCouncilData(selectedCouncilId) : null;
  const { getActiveForCouncil, setActiveForCouncil } = usePlan();
  const plan = selectedCouncilId ? getActiveForCouncil(selectedCouncilId) : undefined;

  useEffect(() => {
    if (!searchParams.get('c') && councils[0]) {
      setSearchParams({ c: councils[0].id }, { replace: true });
    }
  }, [councils, searchParams, setSearchParams]);

  useEffect(() => {
    if (selectedCouncilId && plan) {
      setActiveForCouncil(selectedCouncilId, plan.id);
    }
  }, [selectedCouncilId, plan, setActiveForCouncil]);

  if (!selectedCouncilId || !councilData) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-muted)]">
        No council data found.
      </div>
    );
  }

  const planTitle = plan?.title || `${councilData.name} Local Plan`;
  const amrStatus: StatusTone = plan?.monitoringWorkspace?.annualReports?.length ? 'green' : 'amber';
  const evaluationStatus: StatusTone = plan?.evaluationWorkspace?.evaluationGrid?.length ? 'green' : 'amber';

  const indicatorSignals = useMemo(() => {
    const registry = plan?.monitoringWorkspace?.indicatorRegistry;
    if (registry?.length) {
      return registry.map((indicator, idx) => ({
        id: indicator.id || `indicator-${idx}`,
        title: indicator.name,
        value: indicator.target ? `Target ${indicator.target}` : 'Indicator captured',
        status: (['green', 'amber', 'info'] as StatusTone[])[idx % 3],
        detail: indicator.source
          ? `Source: ${indicator.source}`
          : indicator.baseline
          ? `Baseline: ${indicator.baseline}`
          : 'Source/baseline to be set',
      }));
    }
    return [
      {
        id: 'housing',
        title: 'Housing delivery vs requirement',
        value: '92% delivered',
        status: 'amber' as StatusTone,
        detail: 'Shortfall emerging in years 3–4; land supply check scheduled.',
      },
      {
        id: 'appeals',
        title: 'Appeal overturns (policy references)',
        value: '6% overturn rate',
        status: 'green' as StatusTone,
        detail: 'Below 10% risk threshold; monitor town centre policies for drift.',
      },
      {
        id: 'bnq',
        title: 'Net gain & mitigation',
        value: '+14% above baseline',
        status: 'green' as StatusTone,
        detail: 'Mitigation land secured for two allocations; delivery tracking live.',
      },
      {
        id: 'flood',
        title: 'Flood risk consents',
        value: '3 this quarter',
        status: 'amber' as StatusTone,
        detail: 'Check conditions discharged before occupation; flag if delays persist.',
      },
    ];
  }, [plan]);

  const flow = [
    {
      title: 'Observe & ingest',
      stage: 'Live',
      summary: 'DM decisions, completions, obligations, SEA/HRA signals stream into monitoring tables.',
      chips: ['DM decisions', 'Completions', 'SEA/HRA indicators'],
      tone: 'info' as StatusTone,
    },
    {
      title: 'Monitoring dashboard',
      stage: 'Continuous',
      summary: 'Policy/site KPIs with spatial traces, “early stress” flags, and trend break detectors.',
      chips: ['Policy KPIs', 'Spatial traces', 'Stress alerts'],
      tone: 'info' as StatusTone,
    },
    {
      title: 'Annual Monitoring Report',
      stage: 'Yearly',
      summary: 'National KPIs, delivery vs requirement, SEA monitoring, and risks to soundness.',
      chips: ['AMR draft', 'KPI trends', 'Soundness risks'],
      tone: amrStatus,
    },
    {
      title: 'Year 4 evaluation',
      stage: 'Cycle reset',
      summary: 'Carry-forward/amend/drop recommendations plus evidence asks for the next plan.',
      chips: ['Keep/amend/drop', 'Evidence asks', 'SEA/HRA effects'],
      tone: evaluationStatus,
    },
    {
      title: 'Next-plan initialisation',
      stage: 'Trigger-ready',
      summary: 'Gateway 1 starter pack seeded from monitoring outputs; new workspace spins up.',
      chips: ['Gateway 1 pack', 'Vision seed', 'SEA baseline refresh'],
      tone: 'info' as StatusTone,
    },
  ];

  const monitoringTasks = monitoringStage?.tasks || [];
  const recommended = monitoringStage?.actionsRecommended || [];

  const buildToolLink = (toolId?: string) => {
    if (!toolId) return null;
    const mapped = toolRouteMap[toolId];
    if (!mapped) return null;
    const params = new URLSearchParams();
    params.set('tool', mapped);
    params.set('c', selectedCouncilId);
    return `/app?${params.toString()}`;
  };

  const cycleCards = [
    {
      title: 'Annual Monitoring cadence',
      status: amrStatus,
      detail:
        'Draft AMR, KPI trends, and implications for plan soundness. Include SEA/HRA monitoring text.',
      cta: buildToolLink('MonitoringBuilderTool'),
    },
    {
      title: 'Year 4 evaluation',
      status: evaluationStatus,
      detail:
        'Keep/amend/drop with evidence, sites to refresh, and new constraints to seed the next plan.',
      cta: buildToolLink('Year4EvaluationTool'),
    },
    {
      title: 'Trigger engine',
      status: 'info' as StatusTone,
      detail:
        'Housing land supply, strategy drift, appeal patterns, environmental thresholds. Raises “Review recommended” alerts.',
      cta: buildToolLink('MonitoringBuilderTool'),
    },
  ];

  const dataConnectors = [
    {
      title: 'Development Management feed',
      points: ['Approvals/refusals + conditions', 'Appeals + material considerations', 'Built-out completions'],
    },
    {
      title: 'Policy & site performance',
      points: ['Outcome indicators per policy', 'Site delivery trajectory vs allocation', 'Spatial distribution vs strategy'],
    },
    {
      title: 'SEA/HRA monitoring',
      points: ['Mitigation delivery status', 'Significant effects + thresholds', 'Environmental indicators (water, climate, biodiversity)'],
    },
  ];

  const backToAppLink = useMemo(() => {
    if (!selectedCouncilId) return '/app';
    const params = new URLSearchParams();
    params.set('c', selectedCouncilId);
    params.set('mode', 'spatial');
    return `/app?${params.toString()}`;
  }, [selectedCouncilId]);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="bg-[var(--color-panel)] border-b border-[var(--color-edge)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to={backToAppLink} className="text-[var(--color-accent)] hover:underline text-sm">
              ← Back to app
            </Link>
            <div className="h-6 w-px bg-[var(--color-edge)]" />
            <div>
              <div className="text-xs text-[var(--color-muted)] uppercase">Monitoring workspace</div>
              <div className="text-xl font-semibold text-[var(--color-ink)]">{planTitle}</div>
              <p className="text-sm text-[var(--color-muted)]">
                Continuous monitoring, annual reporting, triggers, and next-plan hand-off.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="council-select" className="text-xs text-[var(--color-muted)]">
              Council
            </label>
            <select
              id="council-select"
              value={selectedCouncilId}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                next.set('c', e.target.value);
                setSearchParams(next, { replace: true });
              }}
              className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg px-3 py-2 text-sm text-[var(--color-ink)]"
            >
              {councils.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-xs text-[var(--color-muted)] uppercase">Closed-loop planning</div>
                <h2 className="text-2xl font-semibold text-[var(--color-ink)] mt-1">
                  Monitoring Dashboard for {councilData.name}
                </h2>
                <p className="text-sm text-[var(--color-muted)] mt-1">
                  Fuses DM signals, plan KPIs, SEA/HRA monitoring, annual reporting, and early triggers into one flow.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-3 py-1 rounded-full border ${statusClass(amrStatus)}`}>
                  Annual monitoring {amrStatus === 'green' ? 'ready' : 'in progress'}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full border ${statusClass(evaluationStatus)}`}>
                  Year 4 evaluation {evaluationStatus === 'green' ? 'captured' : 'to scope'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              {flow.map((item) => (
                <div
                  key={item.title}
                  className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-xl p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{item.stage}</span>
                    <span className={`text-[10px] px-2 py-1 rounded-full border ${statusClass(item.tone)}`}>
                      {item.tone === 'info' ? 'planned' : item.tone}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-[var(--color-ink)]">{item.title}</div>
                  <p className="text-sm text-[var(--color-muted)]">{item.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.chips.map((chip) => (
                      <span
                        key={chip}
                        className="px-2 py-1 text-[11px] rounded-full bg-[var(--color-panel)] border border-[var(--color-edge)] text-[var(--color-muted)]"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-xs text-[var(--color-muted)] uppercase">Live signals</div>
                  <h3 className="text-xl font-semibold text-[var(--color-ink)]">Priority indicators</h3>
                </div>
                <Link
                  to={buildToolLink('EvidenceTool') || '#'}
                  className="text-sm text-[var(--color-accent)] hover:underline"
                >
                  Open evidence base →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {indicatorSignals.map((signal) => (
                  <div
                    key={signal.id}
                    className="border border-[var(--color-edge)] rounded-xl p-4 bg-[var(--color-surface)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-[var(--color-ink)]">{signal.title}</div>
                      <span className={`text-[10px] px-2 py-1 rounded-full border ${statusClass(signal.status)}`}>
                        {signal.status}
                      </span>
                    </div>
                    <div className="text-2xl font-semibold text-[var(--color-ink)] mt-1">{signal.value}</div>
                    <p className="text-sm text-[var(--color-muted)] mt-1 leading-relaxed">{signal.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-[var(--color-muted)] uppercase">Annual rhythm</div>
                  <h3 className="text-lg font-semibold text-[var(--color-ink)]">Monitoring cycle</h3>
                </div>
                <Link
                  to={buildToolLink('PolicyDrafterTool') || '#'}
                  className="text-sm text-[var(--color-accent)] hover:underline"
                >
                  Draft AMR →
                </Link>
              </div>
              <div className="space-y-3">
                {cycleCards.map((card) => (
                  <div
                    key={card.title}
                    className="border border-[var(--color-edge)] rounded-xl p-3 bg-[var(--color-surface)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-[var(--color-ink)]">{card.title}</div>
                      <span className={`text-[10px] px-2 py-1 rounded-full border ${statusClass(card.status)}`}>
                        {card.status}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-muted)] mt-1">{card.detail}</p>
                    {card.cta ? (
                      <Link to={card.cta} className="text-[var(--color-accent)] text-xs font-semibold mt-2 inline-block">
                        Open workspace →
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <div className="text-xs text-[var(--color-muted)] uppercase">Monitoring workbench</div>
                <h3 className="text-xl font-semibold text-[var(--color-ink)]">Tasks and quick actions</h3>
              </div>
              <div className="text-xs text-[var(--color-muted)]">
                Pulled from monitoring stage guidance; tuned to CULP + SEA/HRA monitoring.
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4">
              <div className="space-y-2">
                {monitoringTasks.map((task) => (
                  <div key={task} className="border border-[var(--color-edge)] rounded-xl p-3 bg-[var(--color-surface)]">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" />
                      <span className="text-sm text-[var(--color-ink)]">{task}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {recommended.map((action) => {
                  const link = buildToolLink(action.primaryToolId);
                  return (
                    <div
                      key={action.id}
                      className="border border-[var(--color-edge)] rounded-xl p-3 bg-[var(--color-surface)] flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[var(--color-ink)]">{action.label}</div>
                        <p className="text-sm text-[var(--color-muted)]">{action.shortExplainer}</p>
                      </div>
                      {link ? (
                        <Link
                          to={link}
                          className="text-xs text-[var(--color-accent)] font-semibold px-3 py-1 rounded-full border border-[var(--color-edge)] hover:border-[var(--color-accent)]"
                        >
                          Open →
                        </Link>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }}>
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-[var(--color-muted)] uppercase">Data connectors</div>
                <h3 className="text-xl font-semibold text-[var(--color-ink)]">Feeds powering monitoring</h3>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-edge)] text-[var(--color-muted)]">
                DM ↔ Monitoring ↔ Next plan
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dataConnectors.map((connector) => (
                <div key={connector.title} className="border border-[var(--color-edge)] rounded-xl p-4 bg-[var(--color-surface)] space-y-2">
                  <div className="text-sm font-semibold text-[var(--color-ink)]">{connector.title}</div>
                  <ul className="space-y-1">
                    {connector.points.map((point) => (
                      <li key={point} className="text-sm text-[var(--color-muted)] flex gap-2">
                        <span className="text-[var(--color-brand)]">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
