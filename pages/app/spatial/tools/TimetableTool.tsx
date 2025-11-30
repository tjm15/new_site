import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CouncilData, Plan, PlanStageId } from '../../../../data/types';
import { STAGES } from '../../../../data/stageMeta';
import { usePlan } from '../../../../contexts/PlanContext';
import { suggestTimetable } from '../../../../utils/llmTasks';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

type StageDateMap = Record<PlanStageId, string | undefined>;

const MS_IN_DAY = 1000 * 60 * 60 * 24;

function formatInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function safeParse(date?: string) {
  if (!date) return undefined;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function prettyDate(date?: string) {
  const parsed = safeParse(date);
  if (!parsed) return 'Unset';
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const TimetableTool: React.FC<{ councilData: CouncilData; autoRun?: boolean; plan?: Plan }> = ({ councilData, autoRun, plan }) => {
  const { activePlan, updatePlan } = usePlan();
  const workingPlan = plan && plan.councilId === councilData.id ? plan : (activePlan?.councilId === councilData.id ? activePlan : undefined);
  const stageOrder = useMemo(() => STAGES.map(s => ({ id: s.id as PlanStageId, label: s.label, description: s.description, band: s.band })), []);
  const planMakingStages = useMemo(() => stageOrder.filter(s => s.band === 'plan-making'), [stageOrder]);
  const [noticeDate, setNoticeDate] = useState('');
  const [stageDates, setStageDates] = useState<StageDateMap>({} as StageDateMap);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const autoRanRef = useRef(false);

  // Seed from the active plan (timetable milestones or stage target dates)
  useEffect(() => {
    if (!workingPlan) return;
    const next: StageDateMap = {} as StageDateMap;
    const fromTimetable = workingPlan.timetable?.milestones || [];
    stageOrder.forEach(stage => {
      const match = fromTimetable.find(m => m.stageId === stage.id);
      if (match?.date) next[stage.id] = match.date;
    });
    (workingPlan.stages || []).forEach(stage => {
      const sid = stage.id as PlanStageId;
      if (!next[sid] && stage.targetDate) next[sid] = stage.targetDate;
    });
    setStageDates(next);
    setNoticeDate(workingPlan.timetable?.noticeToCommenceDate || '');
  }, [workingPlan?.id, stageOrder]);

  // Auto-draft if opened fresh and requested
  useEffect(() => {
    if (!autoRun || !workingPlan || autoRanRef.current) return;
    const hasExisting = noticeDate || Object.values(stageDates).some(Boolean);
    if (hasExisting || loadingDraft) return;
    autoRanRef.current = true;
    handleDraft();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, workingPlan?.id]);

  const clockStartDate = useMemo(() => {
    return safeParse(stageDates['G1_SUMMARY']) || safeParse(stageDates['GATEWAY_1']) || undefined;
  }, [stageDates]);

  const startDate = useMemo(() => {
    const clockStart = clockStartDate;
    if (clockStart) return clockStart;
    let earliest: Date | undefined;
    planMakingStages.forEach(stage => {
      const d = safeParse(stageDates[stage.id]);
      if (d && (!earliest || d < earliest)) earliest = d;
    });
    return earliest || safeParse(noticeDate);
  }, [clockStartDate, noticeDate, stageDates, planMakingStages]);

  const endDate = useMemo(() => {
    let latest: Date | undefined;
    planMakingStages.forEach(stage => {
      const d = safeParse(stageDates[stage.id]);
      if (d && (!latest || d > latest)) latest = d;
    });
    if (latest) return latest;
    const base = startDate || new Date();
    return addMonths(base, 30);
  }, [stageDates, planMakingStages, startDate]);

  const rangeMs = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return endDate.getTime() - startDate.getTime();
  }, [startDate, endDate]);

  const monthsSpan = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.round((endDate.getTime() - startDate.getTime()) / (MS_IN_DAY * 30));
  }, [startDate, endDate]);

  const timelineSegments = useMemo(() => {
    if (!startDate || !endDate || rangeMs <= 0) return [];
    return planMakingStages.map((stage, idx) => {
      const finish = safeParse(stageDates[stage.id]);
      if (!finish) return null;
      const prevId = idx === 0 ? undefined : planMakingStages[idx - 1].id;
      const startForStage = prevId ? safeParse(stageDates[prevId]) || startDate : startDate;
      const leftPct = clamp(((startForStage.getTime() - startDate.getTime()) / rangeMs) * 100, 0, 100);
      const rightPct = clamp(((finish.getTime() - startDate.getTime()) / rangeMs) * 100, leftPct, 100);
      return {
        id: stage.id,
        label: stage.label,
        startPct: leftPct,
        widthPct: Math.max(rightPct - leftPct, 1),
        date: finish
      };
    }).filter(Boolean) as Array<{ id: PlanStageId; label: string; startPct: number; widthPct: number; date: Date }>;
  }, [stageDates, planMakingStages, startDate, endDate, rangeMs]);

  const handleDraft = async () => {
    if (!workingPlan) return;
    setLoadingDraft(true);
    setStatus(null);
    try {
      const suggestion = await suggestTimetable(workingPlan.area || councilData.name, councilData.name);
      const next: StageDateMap = { ...stageDates };
      const milestones = Array.isArray(suggestion?.milestones) ? suggestion.milestones : [];
      milestones.forEach(m => {
        if (m.stageId && m.date) next[m.stageId as PlanStageId] = m.date;
      });
      setStageDates(next);
      if (suggestion?.noticeToCommenceDate) setNoticeDate(suggestion.noticeToCommenceDate);
      setStatus('Drafted a 30-month timetable using AI.');
    } catch (e) {
      setStatus('Could not auto-draft right now. Adjust manually.');
    } finally {
      setLoadingDraft(false);
    }
  };

  const handleSpread = () => {
    const base = clockStartDate || startDate || new Date();
    const step = Math.max(Math.floor(30 / Math.max(planMakingStages.length - 1, 1)), 1);
    const next: StageDateMap = { ...stageDates };
    planMakingStages.forEach((stage, idx) => {
      const d = addMonths(base, step * idx);
      next[stage.id] = formatInputDate(d);
    });
    setStageDates(next);
    setStatus('Spread milestones evenly across 30 months from the start.');
  };

  const handleSave = () => {
    if (!workingPlan) return;
    setSaving(true);
    const milestones = stageOrder
      .map(stage => (stageDates[stage.id] ? { stageId: stage.id, date: stageDates[stage.id]! } : null))
      .filter(Boolean) as Array<{ stageId: PlanStageId; date: string }>;
    const updatedStages = (workingPlan.stages || []).map(stage => {
      const matched = stageDates[stage.id as PlanStageId];
      if (matched) return { ...stage, targetDate: matched };
      return stage;
    });
    updatePlan(workingPlan.id, {
      timetable: { noticeToCommenceDate: noticeDate || workingPlan.timetable?.noticeToCommenceDate, milestones },
      stages: updatedStages
    } as any);
    setStatus('Timetable saved to this plan.');
    setSaving(false);
  };

  const spanLabel = monthsSpan > 0 ? `${monthsSpan} months` : 'Add dates';
  const spanNote = monthsSpan === 0 ? 'Set notice and milestones to calculate span' : monthsSpan > 30 ? 'Over 30 months — tighten' : 'Aligned to 30-month expectation';

  if (!workingPlan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-2">No plan selected</div>
        <p className="text-[var(--color-muted)] text-sm">Create or open a plan to start drafting a timetable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <div className="text-sm text-[var(--color-muted)]">Preparation stage</div>
        <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Timetable Drafting</h2>
        <p className="text-[var(--color-muted)]">Draft a 30-month timetable with AI suggestions, visualise milestones, and save target dates to the plan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-xl p-3">
          <div className="text-xs text-[var(--color-muted)]">Notice to Commence</div>
          <input
            type="date"
            value={noticeDate}
            onChange={(e) => setNoticeDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-[var(--color-edge)] rounded text-[var(--color-ink)] bg-[var(--color-panel)]"
          />
          <div className="text-[11px] text-[var(--color-muted)] mt-1">Current: {prettyDate(noticeDate)}</div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-xl p-3">
          <div className="text-xs text-[var(--color-muted)]">Span</div>
          <div className="text-lg font-semibold text-[var(--color-ink)]">{spanLabel}</div>
          <div className={`text-xs mt-1 ${monthsSpan > 30 ? 'text-red-600' : 'text-[var(--color-muted)]'}`}>
            {spanNote}
          </div>
        </div>
        <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-xl p-3">
          <div className="text-xs text-[var(--color-muted)]">End point</div>
          <div className="text-lg font-semibold text-[var(--color-ink)]">{prettyDate(endDate ? formatInputDate(endDate) : '')}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm shadow hover:shadow-md disabled:opacity-50"
          onClick={handleDraft}
          disabled={loadingDraft}
        >
          {loadingDraft ? 'Drafting…' : 'Draft with AI'}
        </button>
        <button
          className="px-4 py-2 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg text-sm hover:border-[var(--color-accent)]"
          onClick={handleSpread}
        >
          Spread across 30 months
        </button>
        <button
          className="px-4 py-2 bg-[var(--color-ink)] text-white rounded-lg text-sm shadow hover:shadow-md disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save timetable to plan'}
        </button>
        {status && <span className="text-sm text-[var(--color-muted)]">{status}</span>}
      </div>

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">Visual timeline</div>
            <p className="text-xs text-[var(--color-muted)]">Bars show each stage ending by its milestone date.</p>
          </div>
          <div className="text-xs text-[var(--color-muted)]">
            {startDate ? prettyDate(formatInputDate(startDate)) : 'Start unset'} → {endDate ? prettyDate(formatInputDate(endDate)) : 'End unset'}
          </div>
        </div>
        {!timelineSegments.length && loadingDraft && <LoadingSpinner />}
        {!timelineSegments.length && !loadingDraft && (
          <div className="text-sm text-[var(--color-muted)]">Add dates to see the graphical timeline.</div>
        )}
        {timelineSegments.length > 0 && (
          <div className="relative h-48 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg overflow-hidden">
            <div className="absolute left-4 right-4 top-1/2 h-px bg-[var(--color-edge)]" />
            {[0, 25, 50, 75, 100].map(mark => (
              <div key={mark} className="absolute top-3 bottom-3" style={{ left: `${mark}%` }}>
                <div className="h-full border-l border-dashed border-[var(--color-edge)]" />
                <div className="absolute -bottom-6 -translate-x-1/2 text-[10px] text-[var(--color-muted)]">{mark}%</div>
              </div>
            ))}
            {timelineSegments.map(seg => (
              <div
                key={seg.id}
                className="absolute top-10"
                style={{ left: `${seg.startPct}%`, width: `${seg.widthPct}%` }}
              >
                <div className="h-16 rounded-lg bg-gradient-to-r from-[var(--color-brand)]/70 to-[var(--color-accent)]/70 border border-[var(--color-edge)] shadow-sm flex flex-col justify-center px-3">
                  <div className="text-xs font-semibold text-[var(--color-ink)]">{seg.label}</div>
                  <div className="text-[11px] text-[var(--color-muted)]">{prettyDate(formatInputDate(seg.date))}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">Milestones by stage</div>
            <p className="text-xs text-[var(--color-muted)]">Set target dates; saving will update the plan timetable and stage targets.</p>
          </div>
          <div className="text-xs text-[var(--color-muted)]">Authority: {councilData.name}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stageOrder.map((stage, idx) => {
            const value = stageDates[stage.id] || '';
            const prev = idx > 0 ? safeParse(stageDates[stageOrder[idx - 1].id]) : undefined;
            const current = safeParse(value);
            const spacingDays = prev && current ? Math.round((current.getTime() - prev.getTime()) / MS_IN_DAY) : undefined;
            return (
              <div key={stage.id} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[var(--color-ink)]">{stage.label}</div>
                    <p className="text-xs text-[var(--color-muted)]">{stage.description}</p>
                  </div>
                  {spacingDays !== undefined && (
                    <span className="text-[11px] text-[var(--color-muted)]">{Math.max(Math.round(spacingDays / 30), 1)} mo gap</span>
                  )}
                </div>
                <input
                  type="date"
                  value={value}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setStageDates(prevDates => ({ ...prevDates, [stage.id]: nextVal || undefined }));
                  }}
                  className="mt-2 w-full px-3 py-2 border border-[var(--color-edge)] rounded text-[var(--color-ink)] bg-[var(--color-panel)]"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
