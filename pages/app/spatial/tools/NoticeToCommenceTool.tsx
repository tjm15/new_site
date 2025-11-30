import React, { useEffect, useRef, useState } from 'react';
import { CouncilData, Plan } from '../../../../data/types';
import { usePlan } from '../../../../contexts/PlanContext';
import { callLLM } from '../../../../utils/llmClient';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

type Props = {
  councilData: CouncilData;
  autoRun?: boolean;
  initialPublicationDate?: string;
  initialTimetableUrl?: string;
  initialDraft?: string;
  initialInstructions?: string;
  prefill?: Record<string, any>;
  plan?: Plan;
};

export const NoticeToCommenceTool: React.FC<Props> = ({
  councilData,
  autoRun,
  initialPublicationDate,
  initialTimetableUrl,
  initialDraft,
  initialInstructions,
  prefill,
  plan
}) => {
  const { activePlan, updatePlan } = usePlan();
  const workingPlan = plan && plan.councilId === councilData.id ? plan : (activePlan?.councilId === councilData.id ? activePlan : undefined);
  const [publicationDate, setPublicationDate] = useState('');
  const [timetableUrl, setTimetableUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const autoRanRef = useRef(false);

  useEffect(() => {
    if (!workingPlan) return;
    if (workingPlan.timetable?.noticeToCommenceDate) setPublicationDate(workingPlan.timetable.noticeToCommenceDate);
    if (workingPlan.prepNoticeText) setDraft(workingPlan.prepNoticeText);
  }, [workingPlan?.id]);

  useEffect(() => {
    const mappedDate = prefill?.noticeDate || prefill?.publicationDate || prefill?.noticeToCommenceDate || initialPublicationDate;
    const mappedUrl = prefill?.timetableUrl || prefill?.noticeUrl || prefill?.publicUrl || initialTimetableUrl;
    const mappedDraft = prefill?.draft || prefill?.text || prefill?.noticeText || initialDraft;
    const mappedInstr = prefill?.instructions || prefill?.tone || initialInstructions;
    if (mappedDate && !publicationDate) setPublicationDate(mappedDate);
    if (mappedUrl && !timetableUrl) setTimetableUrl(mappedUrl);
    if (mappedInstr && !instructions) setInstructions(mappedInstr);
    if (mappedDraft && !draft) setDraft(mappedDraft);
  }, [prefill, initialPublicationDate, initialTimetableUrl, initialDraft, initialInstructions, publicationDate, timetableUrl, instructions, draft]);

  useEffect(() => {
    if (autoRun && !draft && !loading && !autoRanRef.current) {
      autoRanRef.current = true;
      generateNotice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const generateNotice = async () => {
    if (!workingPlan) return;
    setLoading(true);
    setStatus(null);
    const prompt = [
      `Draft a Notice to Commence a new Local Plan for ${councilData.name}.`,
      `Include: what plan is starting, the area covered, when preparation commences (${publicationDate || 'TBC'}), and where the timetable will be published (${timetableUrl || 'council website'}).`,
      `Keep it concise, plain-English, and suitable for web publication. Reference the 30-month timetable expectation and invite early engagement interest.`,
      instructions ? `Special instructions: ${instructions}` : null,
    ].filter(Boolean).join('\n');
    try {
      const text = await callLLM({ prompt, mode: 'markdown' });
      setDraft(text || '');
      setStatus('Draft generated.');
    } catch {
      setStatus('Could not generate a notice right now.');
    } finally {
      setLoading(false);
    }
  };

  const saveToPlan = () => {
    if (!workingPlan) {
      setStatus('No active plan for this authority.');
      return;
    }
    const noticeDate = publicationDate || workingPlan.timetable?.noticeToCommenceDate;
    updatePlan(workingPlan.id, {
      prepNoticeText: draft,
      timetable: {
        ...(workingPlan.timetable || { milestones: [] }),
        noticeToCommenceDate: noticeDate,
      },
    } as any);
    setStatus('Saved to plan.');
  };

  if (!workingPlan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan selected</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to draft the Notice to Commence.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-[var(--color-muted)]">Preparation stage</div>
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Notice to Commence Drafter</h2>
          <p className="text-sm text-[var(--color-muted)]">Draft a compliant notice ready for web publication with timetable link.</p>
        </div>
        {status && <span className="text-xs text-[var(--color-muted)]">{status}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        <div className="space-y-3 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
          <div>
            <label className="text-xs text-[var(--color-muted)]">Publication / commencement date</label>
            <input
              type="date"
              value={publicationDate}
              onChange={(e) => setPublicationDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-[var(--color-edge)] rounded bg-[var(--color-surface)] text-[var(--color-ink)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)]">Timetable URL (public page)</label>
            <input
              type="url"
              value={timetableUrl}
              onChange={(e) => setTimetableUrl(e.target.value)}
              placeholder="https://example.gov.uk/local-plan/timetable"
              className="w-full mt-1 px-3 py-2 border border-[var(--color-edge)] rounded bg-[var(--color-surface)] text-[var(--color-ink)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)]">Optional extra instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-[var(--color-edge)] rounded bg-[var(--color-surface)] text-[var(--color-ink)]"
              placeholder="Tone, audience, or required inclusions..."
            />
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded shadow disabled:opacity-50"
              onClick={generateNotice}
              disabled={loading}
            >
              {loading ? 'Drafting…' : 'Draft notice'}
            </button>
            <button
              className="px-4 py-2 bg-[var(--color-ink)] text-white rounded shadow disabled:opacity-50"
              onClick={saveToPlan}
              disabled={!draft}
            >
              Save to plan
            </button>
          </div>
        </div>

        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 min-h-[240px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)]">Draft notice</div>
              <div className="text-xs text-[var(--color-muted)]">Authority: {councilData.name}</div>
            </div>
            {draft && (
              <button
                className="text-xs text-[var(--color-accent)]"
                onClick={() => navigator.clipboard.writeText(draft)}
              >
                Copy
              </button>
            )}
          </div>
          {loading && <LoadingSpinner />}
          {!loading && draft && <MarkdownContent content={draft} />}
          {!loading && !draft && (
            <div className="text-sm text-[var(--color-muted)]">Generate a draft to preview it here.</div>
          )}
        </div>
      </div>
    </div>
  );
};
