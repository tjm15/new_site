import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CouncilData, Plan, ReadinessAssessment } from '../../../../data/types';
import { usePlan } from '../../../../contexts/PlanContext';
import { assessGateway1, runLLMTask } from '../../../../utils/llmTasks';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

type Question = { id: string; label: string; type: 'text' | 'yesno' | 'select'; options?: string[] };

const AREAS: Array<{
  id: string;
  label: string;
  description: string;
  questions: Question[];
}> = [
  {
    id: 'timetable',
    label: 'Timetable & project management',
    description: 'Expect a credible 30-month timetable, clear milestones, and a realistic delivery plan with resourcing.',
    questions: [
      { id: 'hasDraftTimetable', label: 'Do you have a draft 30-month timetable?', type: 'yesno' },
      { id: 'criticalMilestones', label: 'List any uncertain milestones (e.g., SEA scoping, Reg 18).', type: 'text' },
      { id: 'projectManager', label: 'Named plan/project manager?', type: 'text' },
    ],
  },
  {
    id: 'governance',
    label: 'Governance & decision-making',
    description: 'Who decides, how, and when: governance route to Cabinet/Mayor, project board, TOR, decision schedule.',
    questions: [
      { id: 'decisionMaker', label: 'Who is the political decision-maker?', type: 'text' },
      { id: 'hasBoard', label: 'Is there a formal project board?', type: 'yesno' },
      { id: 'boardFrequency', label: 'How often will the board meet?', type: 'select', options: ['Monthly', '6-weekly', 'Quarterly'] },
    ],
  },
  {
    id: 'engagement',
    label: 'Consultation & engagement strategy',
    description: 'Early engagement plan, key stakeholders, hard-to-reach, and proposed methods with timeline.',
    questions: [
      { id: 'hasStrategy', label: 'Do you have a written engagement strategy?', type: 'yesno' },
      { id: 'keyStakeholders', label: 'List key stakeholders already identified.', type: 'text' },
    ],
  },
  {
    id: 'evidence',
    label: 'Anticipated plan content & evidence',
    description: 'Baseline evidence audit, planned commissions, and how this informs plan content/outcomes.',
    questions: [
      { id: 'evidenceAudit', label: 'Have you completed an evidence audit/gap analysis?', type: 'yesno' },
      { id: 'plannedCommissions', label: 'What evidence will be commissioned next?', type: 'text' },
    ],
  },
  {
    id: 'sea',
    label: 'SEA/HRA baseline and scoping',
    description: 'Status of Strategic Environmental Assessment and Habitats Regulations Assessment baselines and scoping.',
    questions: [
      { id: 'seaScoping', label: 'Has SEA scoping been drafted or consulted?', type: 'select', options: ['Not started', 'Drafted', 'Consulted'] },
      { id: 'hraBaseline', label: 'Summarise HRA baseline status.', type: 'text' },
    ],
  },
];

type AreaAnswers = Record<string, Record<string, any>>;

const emptyForm = (): AreaAnswers => {
  const init: AreaAnswers = {};
  AREAS.forEach(a => { init[a.id] = {}; });
  return init;
};

const statusClasses = (s: string | undefined) => {
  switch ((s || '').toLowerCase()) {
    case 'green':
    case 'g':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'amber':
    case 'a':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'red':
    case 'r':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-[var(--color-surface)] border border-[var(--color-edge)] text-[var(--color-ink)]';
  }
};

export const Gateway1Tool: React.FC<{
  councilData?: CouncilData;
  plan?: Plan;
  autoRun?: boolean;
}> = ({ councilData, plan, autoRun }) => {
  const { activePlan, updatePlan } = usePlan();
  const workingPlan = useMemo(() => {
    if (plan && (!councilData || plan.councilId === councilData.id)) return plan;
    if (activePlan && (!councilData || activePlan.councilId === councilData.id)) return activePlan;
    return undefined;
  }, [plan, activePlan, councilData?.id]);

  const [form, setForm] = useState<AreaAnswers>(() => emptyForm());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const autoRanRef = useRef(false);

  useEffect(() => {
    if (!workingPlan) return;
    setForm(prev => {
      const next = emptyForm();
      AREAS.forEach(area => { next[area.id] = { ...(prev[area.id] || {}) }; });
      const sea = workingPlan.seaHra || {};
      next.sea = { ...next.sea, seaScoping: sea.seaScopingStatus || '', hraBaseline: sea.hraBaselineSummary || '' };
      const sci = workingPlan.sci || {};
      next.engagement = { ...next.engagement, hasStrategy: sci.hasStrategy === true ? 'Yes' : (sci.hasStrategy === false ? 'No' : ''), keyStakeholders: (sci.keyStakeholders || []).join(', ') };
      return next;
    });
    setNotes(prev => ({
      ...prev,
      sea: workingPlan.seaHra?.seaScopingNotes || '',
      engagement: workingPlan.sci?.timelineNote || '',
    }));
  }, [workingPlan?.id]);

  useEffect(() => {
    if (!autoRun || autoRanRef.current || running) return;
    if (!workingPlan || workingPlan.readinessAssessment) return;
    autoRanRef.current = true;
    runAssessment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, workingPlan?.id, workingPlan?.readinessAssessment, running]);

  if (!workingPlan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan selected</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to run the Gateway 1 readiness tool.</p>
      </div>
    );
  }

  const readiness = workingPlan.readinessAssessment;

  const runAssessment = async () => {
    setRunning(true);
    setStatus(null);
    try {
      const payload = {
        authorityName: workingPlan.area,
        planId: workingPlan.id,
        timetableInfo: workingPlan.timetable,
        answers: { ...form, notes },
      };
      const assessment = await assessGateway1(payload);
      const assessed: ReadinessAssessment = {
        areas: assessment.areas || [],
        overallStatus: assessment.overallStatus,
        overallComment: assessment.overallComment,
        assessedAt: new Date().toISOString(),
      };
      updatePlan(workingPlan.id, { readinessAssessment: assessed });
      const summary = await runLLMTask('gateway1_summary', {
        authorityName: workingPlan.area,
        gatewayStatus: assessed.overallStatus,
        readinessAssessment: assessed,
        timetable: workingPlan.timetable,
        planOverview: { title: workingPlan.title, area: workingPlan.area },
      });
      updatePlan(workingPlan.id, { gateway1SummaryText: typeof summary === 'string' ? summary : JSON.stringify(summary) });
      setStatus('Gateway 1 RAG and summary updated.');
    } catch (e) {
      setStatus('Gateway 1 assessment failed. Try again.');
    } finally {
      setRunning(false);
    }
  };

  const generateSummary = async () => {
    if (!workingPlan.readinessAssessment) return;
    setRunning(true);
    setStatus(null);
    try {
      const s = await runLLMTask('gateway1_summary', {
        authorityName: workingPlan.area,
        gatewayStatus: workingPlan.readinessAssessment.overallStatus,
        readinessAssessment: workingPlan.readinessAssessment,
        timetable: workingPlan.timetable,
        planOverview: { title: workingPlan.title, area: workingPlan.area },
      });
      updatePlan(workingPlan.id, { gateway1SummaryText: typeof s === 'string' ? s : JSON.stringify(s) });
      setStatus('Summary regenerated.');
    } catch (e) {
      setStatus('Could not regenerate the summary right now.');
    } finally {
      setRunning(false);
    }
  };

  const publish = () => {
    const publishDate = new Date().toISOString();
    const milestones = Array.isArray(workingPlan.timetable?.milestones) ? [...workingPlan.timetable.milestones] : [];
    if (!milestones.find(m => m.stageId === 'GATEWAY_1')) milestones.push({ stageId: 'GATEWAY_1', date: publishDate });
    if (!milestones.find(m => m.stageId === 'G1_SUMMARY')) milestones.push({ stageId: 'G1_SUMMARY', date: publishDate });
    updatePlan(workingPlan.id, {
      planStage: 'BASELINING',
      gateway1PublishedAt: publishDate,
      timetable: { ...workingPlan.timetable, milestones }
    } as any);
    setStatus('Gateway 1 published and stage advanced to Baselining.');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-[var(--color-muted)]">Gateway 1</div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Readiness self-assessment</h2>
          <p className="text-sm text-[var(--color-muted)]">Capture answers, run the readiness RAG with AI, and publish the summary.</p>
        </div>
        {readiness?.overallStatus && (
          <span className={`px-3 py-1 text-xs rounded-full ${statusClasses(readiness.overallStatus)}`}>Overall {readiness.overallStatus.toUpperCase()}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button className="px-3 py-2 bg-[var(--color-accent)] text-white rounded text-sm disabled:opacity-50" onClick={runAssessment} disabled={running}>
          {running ? 'Assessing…' : 'Run readiness RAG'}
        </button>
        <button className="px-3 py-2 bg-[var(--color-ink)] text-white rounded text-sm disabled:opacity-50" onClick={generateSummary} disabled={running || !readiness}>
          {running ? 'Working…' : 'Regenerate summary'}
        </button>
        <button className="px-3 py-2 bg-green-600 text-white rounded text-sm disabled:opacity-50" onClick={publish} disabled={!(workingPlan.readinessAssessment && workingPlan.gateway1SummaryText)}>
          Publish Gateway 1
        </button>
        {status && <span className="text-sm text-[var(--color-muted)]">{status}</span>}
        {running && <LoadingSpinner />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {AREAS.map(area => (
          <div key={area.id} className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
            <div className="font-semibold text-[var(--color-ink)]">{area.label}</div>
            <p className="text-sm text-[var(--color-muted)] mb-3">{area.description}</p>
            <div className="space-y-3">
              {area.questions.map(q => (
                <div key={q.id} className="space-y-1">
                  <label className="text-sm text-[var(--color-ink)]">{q.label}</label>
                  {q.type === 'text' && (
                    <input
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded"
                      value={form[area.id][q.id] || ''}
                      onChange={e => setForm(prev => ({ ...prev, [area.id]: { ...prev[area.id], [q.id]: e.target.value } }))}
                    />
                  )}
                  {q.type === 'yesno' && (
                    <select
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded"
                      value={form[area.id][q.id] || ''}
                      onChange={e => setForm(prev => ({ ...prev, [area.id]: { ...prev[area.id], [q.id]: e.target.value } }))}
                    >
                      <option value="">Select…</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  )}
                  {q.type === 'select' && (
                    <select
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded"
                      value={form[area.id][q.id] || ''}
                      onChange={e => setForm(prev => ({ ...prev, [area.id]: { ...prev[area.id], [q.id]: e.target.value } }))}
                    >
                      <option value="">Select…</option>
                      {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                </div>
              ))}
              <div>
                <label className="text-sm text-[var(--color-ink)]">Other notes</label>
                <textarea
                  className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded"
                  rows={3}
                  value={notes[area.id] || ''}
                  onChange={e => setNotes(prev => ({ ...prev, [area.id]: e.target.value }))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {readiness && (
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-[var(--color-ink)]">Readiness results</div>
            {readiness.overallStatus && <span className={`px-2 py-1 text-xs rounded ${statusClasses(readiness.overallStatus)}`}>Overall: {readiness.overallStatus.toUpperCase()}</span>}
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-muted)]">
                  <th className="py-2 pr-3">Area</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Summary</th>
                  <th className="py-2 pr-3">Critical gaps</th>
                </tr>
              </thead>
              <tbody>
                {readiness.areas.map((a, idx) => (
                  <tr key={idx} className="border-t border-[var(--color-edge)]">
                    <td className="py-2 pr-3">{a.id}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-1 text-xs rounded ${statusClasses(a.rag)}`}>{(a.rag || '').toUpperCase()}</span>
                    </td>
                    <td className="py-2 pr-3">{a.summary}</td>
                    <td className="py-2 pr-3">{(a.actions || []).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-[var(--color-ink)]">Gateway 1 summary (publishable)</div>
          <button className="text-sm text-[var(--color-accent)]" onClick={generateSummary} disabled={!readiness || running}>Regenerate with AI</button>
        </div>
        <div className="text-sm whitespace-pre-wrap text-[var(--color-ink)] min-h-[80px]">
          {workingPlan.gateway1SummaryText || 'No summary yet. Run RAG then generate summary.'}
        </div>
      </div>

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded p-3">
        <button className="text-sm text-[var(--color-accent)]" onClick={() => setShowDebug(s => !s)}>{showDebug ? 'Hide' : 'Show'} raw inputs</button>
        {showDebug && (
          <div className="mt-3 grid gap-3">
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify({ form, notes }, null, 2)}</pre>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(readiness, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
