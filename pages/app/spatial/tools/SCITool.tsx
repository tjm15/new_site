import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CouncilData } from '../../../../data/types';
import { usePlan } from '../../../../contexts/PlanContext';
import { callLLM } from '../../../../utils/llmClient';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import { LoadingSpinner } from '../../shared/LoadingSpinner';

function normalizeList(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => String(v)).filter(Boolean);
  if (typeof value === 'string') return value.split(/[,;]\s*|\n+/).map(v => v.trim()).filter(Boolean);
  return [String(value)].filter(Boolean);
}

const tagSpan = (text: string, key?: string) => (
  <span key={key || text} className="px-2 py-1 rounded-full text-xs border bg-[var(--color-surface)] border-[var(--color-edge)] text-[var(--color-ink)]">
    {text}
  </span>
);

type Audience = { group: string; channels?: string[]; methods?: string[]; barriers?: string[] };
type PlanCycle = {
  create?: { earlyEngagement?: string[]; drafting?: string[]; finalPlan?: string[] };
  examine?: string[];
  adopt?: string[];
  update?: { minor?: string[]; material?: string[]; continuous?: string[] };
};
type SCIStructured = {
  commitments?: string[];
  audiences?: Audience[];
  methods?: { digital?: string[]; inPerson?: string[] };
  planCycle?: PlanCycle;
  developmentManagement?: { publicity?: string[]; commenting?: string[]; transparency?: string[] };
  dataStandards?: { data?: string[]; accessibility?: string[]; transparency?: string[] };
  review?: { frequency?: string; triggers?: string[]; consultation?: string };
  narrative?: string;
};

interface SCIToolProps {
  councilData: CouncilData;
  autoRun?: boolean;
  onSaved?: () => void;
  initialData?: Record<string, any>;
}

const defaultSpec: SCIStructured = {
  commitments: ['Transparency and openness', 'Accessibility (WCAG AA)', 'Early and meaningful engagement'],
  audiences: [
    { group: 'Local residents', methods: ['Email alerts', 'Online forms'], barriers: ['Digital access'] },
    { group: 'Statutory consultees', methods: ['Formal letters', 'Meetings'] },
  ],
  methods: {
    digital: ['Plan website', 'Interactive maps for commenting', 'Structured online response forms', 'Email alerts', 'Webinars'],
    inPerson: ['Drop-ins', 'Public exhibitions', 'Workshops'],
  },
  planCycle: {
    create: {
      earlyEngagement: ['Explain evidence themes', 'Invite community priorities', 'Notify consultees early'],
      drafting: ['Structured policy/site forms', 'Maps for commenting', 'Publish minimum consultation period'],
      finalPlan: ['Publish change log', 'Explain how comments shaped plan', 'Prep submission to Inspector'],
    },
    examine: ['Publish examination library', 'Notify participants', 'Provide MIQs and hearing schedule'],
    adopt: ['Publish adoption statement', 'Notify participants', 'Provide accessible plan versions'],
    update: {
      minor: ['Publicise updates', 'Collect comments', 'Log updates and rationale'],
      material: ['Consult before submission', 'Explain changes and evidence', 'Show how to engage with examination'],
      continuous: ['Accept update requests any time', 'Log and triage suggestions', 'Reply to submitters'],
    },
  },
  developmentManagement: {
    publicity: ['Site notices', 'Neighbour notifications', 'Online register', 'Press notices for major/EIA/LB'],
    commenting: ['Minimum periods', 'How comments are published', 'Re-consultation triggers'],
    transparency: ['Decision notice publication', 'Summaries of objections/support'],
  },
  dataStandards: {
    data: ['Document metadata (title, version, date, owner)', 'Machine-readable formats', 'GeoJSON for spatial policies'],
    accessibility: ['WCAG AA', 'Alternative formats', 'Plain-English summaries'],
    transparency: ['Engagement logs', 'How comments influence decisions', 'Confidentiality handling'],
  },
  review: { frequency: 'Review every 3 years or on system change', triggers: ['Legislation change', 'Platform overhaul'], consultation: 'Consult public on SCI changes' },
  narrative: '',
};

export const SCITool: React.FC<SCIToolProps> = ({ councilData, autoRun = false, onSaved, initialData }) => {
  const { activePlan, updatePlan } = usePlan();
  const [spec, setSpec] = useState<SCIStructured>(defaultSpec);
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const autoRanRef = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [exportText, setExportText] = useState('');
  const [showExport, setShowExport] = useState(false);

  const planCtx = useMemo(() => {
    if (activePlan && activePlan.councilId === councilData.id) {
      return {
        title: activePlan.title,
        area: activePlan.area,
        stage: activePlan.planStage,
        timetable: activePlan.timetable,
        councilId: activePlan.councilId,
        authorityName: councilData.name
      };
    }
    return {
      title: `Local Plan for ${councilData.name}`,
      area: councilData.description || councilData.name,
      stage: 'TIMETABLE',
      councilId: councilData.id,
      authorityName: councilData.name
    };
  }, [activePlan, councilData]);

  useEffect(() => {
    if (!activePlan || activePlan.councilId !== councilData.id) {
      setSpec(defaultSpec);
      setCustomNote('');
      autoRanRef.current = false;
      return;
    }
    autoRanRef.current = false;
    setCustomNote('');
    if (activePlan.sciFull) {
      setSpec({ ...defaultSpec, ...activePlan.sciFull });
    } else {
      setSpec(defaultSpec);
      if (initialData) {
        setSpec(prev => ({ ...prev, ...(initialData as any) }));
      }
    }
  }, [activePlan?.id, activePlan?.councilId, councilData.id, initialData]);

  useEffect(() => {
    if (
      autoRun &&
      activePlan?.id &&
      activePlan.councilId === councilData.id &&
      (!activePlan?.sciFull || !activePlan.sciFull.commitments) &&
      !autoRanRef.current
    ) {
      autoRanRef.current = true;
      generateWithAI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, activePlan?.id, activePlan?.councilId, councilData.id]);

  const generateWithAI = async () => {
    if (!activePlan || loading) return;
    setLoading(true);
    setStatus('Drafting SCI with AI…');
    const prompt = [
      'Create a structured, digital-first SCI for the Create + Update Local Plans system (CULP).',
      'Return JSON ONLY with keys: commitments[], audiences[{group,channels?,methods?,barriers?}], methods{digital[],inPerson[]}, planCycle{create:{earlyEngagement[],drafting[],finalPlan[]}, examine[], adopt[], update:{minor[],material[],continuous[]}}, developmentManagement{publicity[],commenting[],transparency[]}, dataStandards{data[],accessibility[],transparency[]}, review{frequency,triggers[],consultation}, narrative (short summary).',
      'Focus on engagement across Create/Examine/Adopt/Update plus DM standards. Keep bullets concise and specific.',
      `Plan context (stay strictly on this authority): ${JSON.stringify(planCtx)}`,
      customNote ? `Custom emphasis: ${customNote}` : null,
    ].filter(Boolean).join('\n');
    try {
      const text = await callLLM({ prompt, mode: 'json' });
      const parsed = JSON.parse(text);
      setSpec(parsed);
      setStatus('SCI drafted.');
    } catch (e) {
      setStatus('Could not draft SCI right now.');
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!activePlan || activePlan.councilId !== councilData.id) return;
    setSaving(true);
    try {
      updatePlan(activePlan.id, {
        sciFull: spec,
        sci: {
          hasStrategy: true,
          keyStakeholders: (spec.audiences || []).map(a => a.group).filter(Boolean),
          methods: [...(spec.methods?.digital || []), ...(spec.methods?.inPerson || [])],
          timelineNote: spec.review?.frequency || '',
        }
      } as any);
      if (onSaved) onSaved();
      setStatus('Saved to plan.');
    } finally {
      setSaving(false);
    }
  };

  const exportProse = async () => {
    if (!activePlan || activePlan.councilId !== councilData.id) return;
    setExporting(true);
    setShowExport(true);
    setStatus('Exporting SCI…');
    const prompt = [
      `Write a comprehensive prose Statement of Community Involvement for ${councilData.name} under the Create + Update Local Plans system (CULP).`,
      'Use the structured SCI data provided; do not invent another authority.',
      'Sections: Overarching commitments; Audience groups with methods; Digital and in-person engagement methods; Create/Examine/Adopt/Update engagement; Development management standards; Data/accessibility/transparency; Review/updates.',
      'Tone: clear, professional, digital-first, concise but complete.',
      `SCI data:\n${JSON.stringify(spec, null, 2)}`
    ].join('\n');
    try {
      const text = await callLLM({ prompt, mode: 'markdown' });
      setExportText(text || 'No export text generated.');
      setStatus('Export ready.');
    } catch (e) {
      setExportText('Could not generate export right now.');
      setStatus('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const renderPlanCycle = (title: string, items?: string[]) => (
    <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
      <div className="font-semibold text-[var(--color-ink)] mb-1">{title}</div>
      {items && items.length ? (
        <ul className="list-disc ml-4 text-sm text-[var(--color-ink)] space-y-1">
          {items.map((i, idx) => <li key={idx}>{i}</li>)}
        </ul>
      ) : <div className="text-xs text-[var(--color-muted)]">No items defined.</div>}
    </div>
  );

  if (!activePlan) {
    return (
      <div className="p-4 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg">
        <div className="font-semibold text-[var(--color-ink)] mb-1">No plan selected</div>
        <p className="text-sm text-[var(--color-muted)]">Open or create a plan to design the SCI.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--color-muted)]">Engagement / SCI</div>
            <h2 className="text-xl font-semibold text-[var(--color-ink)]">SCI Designer (CULP, digital-first)</h2>
            <p className="text-sm text-[var(--color-muted)]">Build the machine-readable SCI covering Create → Examine → Adopt → Update plus DM standards.</p>
          </div>
          {status && <span className="text-xs text-[var(--color-muted)]">{status}</span>}
        </div>

        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
          <div className="flex flex-wrap gap-2">
            <button
              className="px-3 py-2 bg-[#f5c315] text-[var(--color-ink)] rounded shadow transition-transform hover:scale-[1.02] disabled:opacity-50"
              onClick={generateWithAI}
              disabled={loading}
            >
              {loading ? 'Drafting…' : 'Draft with AI'}
            </button>
            <button
              className="px-3 py-2 bg-[var(--color-accent)] text-white rounded shadow transition-transform hover:scale-[1.02] disabled:opacity-50"
              onClick={save}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save SCI to plan'}
            </button>
            <button
              className="px-3 py-2 bg-[var(--color-accent)] text-white rounded shadow transition-transform hover:scale-[1.02] disabled:opacity-50"
              onClick={exportProse}
              disabled={exporting}
            >
              {exporting ? 'Exporting…' : 'Export SCI'}
            </button>
          </div>
          <textarea
            value={customNote}
            onChange={(e)=>setCustomNote(e.target.value)}
            placeholder="Add custom emphasis (e.g., focus on youth engagement, high digital inclusion)."
            className="w-full mt-3 px-3 py-2 border border-[var(--color-edge)] rounded bg-[var(--color-surface)] text-[var(--color-ink)]"
          />
        </div>

        {loading && <LoadingSpinner />}

        {!loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="col-span-1 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
                <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Overarching commitments</div>
                <div className="flex flex-wrap gap-2">
                  {(spec.commitments || []).map((c, idx) => <span key={idx} className="px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded text-xs text-[var(--color-ink)]">{c}</span>)}
                </div>
              </div>
              <div className="col-span-1 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
                <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Methods</div>
                <div className="text-xs text-[var(--color-muted)] mb-1">Digital</div>
                <div className="flex flex-wrap gap-1 mb-2">{(spec.methods?.digital || []).map((m, idx) => <span key={`dig-${idx}`} className="px-2 py-1 rounded-full text-xs border bg-[var(--color-surface)] border-[var(--color-edge)] text-[var(--color-ink)]">{m}</span>)}</div>
                <div className="text-xs text-[var(--color-muted)] mb-1">In-person</div>
                <div className="flex flex-wrap gap-1">{(spec.methods?.inPerson || []).map((m, idx) => <span key={`ip-${idx}`} className="px-2 py-1 rounded-full text-xs border bg-[var(--color-panel)] border-[var(--color-edge)] text-[var(--color-muted)]">{m}</span>)}</div>
              </div>
              <div className="col-span-1 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
                <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Review & standards</div>
                <div className="text-xs text-[var(--color-muted)]">Review: {spec.review?.frequency || 'n/a'}</div>
                <div className="mt-1 flex flex-wrap gap-1">{(spec.review?.triggers || []).map((t, idx)=>tagSpan(t, `tr-${idx}`))}</div>
                <div className="mt-2 text-xs text-[var(--color-muted)]">Consultation: {spec.review?.consultation || 'n/a'}</div>
              </div>
            </div>

            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-ink)]">Audience map</div>
                  <div className="text-xs text-[var(--color-muted)]">Channels and tailored methods per group.</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(spec.audiences || []).map((a, idx) => {
                  const channels = normalizeList(a.channels);
                  const methods = normalizeList(a.methods);
                  const barriers = normalizeList(a.barriers);
                  return (
                    <div key={`${a.group || 'aud'}-${idx}`} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                      <div className="font-semibold text-[var(--color-ink)]">{a.group}</div>
                      <div className="text-[11px] text-[var(--color-muted)] mt-1">Channels</div>
                      <div className="flex flex-wrap gap-1 mb-2">{channels.map((c, i)=> <span key={`ch-${idx}-${i}`} className="px-2 py-1 rounded-full text-xs border bg-[var(--color-surface)] border-[var(--color-edge)] text-[var(--color-ink)]">{c}</span>)}</div>
                      <div className="text-[11px] text-[var(--color-muted)]">Methods</div>
                      <div className="flex flex-wrap gap-1 mb-2">{methods.map((m, i)=> <span key={`m-${idx}-${i}`} className="px-2 py-1 rounded-full text-xs border bg-[var(--color-panel)] border-[var(--color-edge)] text-[var(--color-muted)]">{m}</span>)}</div>
                      {barriers.length > 0 && (
                        <div className="text-[11px] text-[var(--color-muted)]">Barriers: {barriers.join('; ')}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
              <div className="text-sm font-semibold text-[var(--color-ink)] mb-3">Plan cycle (Create → Examine → Adopt → Update)</div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                  <div className="font-semibold text-[var(--color-ink)] mb-2">Create</div>
                  {renderPlanCycle('Early engagement', spec.planCycle?.create?.earlyEngagement)}
                  {renderPlanCycle('Drafting', spec.planCycle?.create?.drafting)}
                  {renderPlanCycle('Final plan', spec.planCycle?.create?.finalPlan)}
                </div>
                <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                  <div className="font-semibold text-[var(--color-ink)] mb-2">Examine</div>
                  {renderPlanCycle('Examination', spec.planCycle?.examine)}
                </div>
                <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                  <div className="font-semibold text-[var(--color-ink)] mb-2">Adopt</div>
                  {renderPlanCycle('Adoption', spec.planCycle?.adopt)}
                </div>
                <div className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                  <div className="font-semibold text-[var(--color-ink)] mb-2">Update</div>
                  {renderPlanCycle('Minor updates', spec.planCycle?.update?.minor)}
                  {renderPlanCycle('Material updates', spec.planCycle?.update?.material)}
                  {renderPlanCycle('Continuous feedback', spec.planCycle?.update?.continuous)}
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
              <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Development management standards</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {renderPlanCycle('Application publicity', spec.developmentManagement?.publicity)}
                {renderPlanCycle('Commenting', spec.developmentManagement?.commenting)}
                {renderPlanCycle('Decision transparency', spec.developmentManagement?.transparency)}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3">
              <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
                <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Data, standards, accessibility</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {renderPlanCycle('Data standards', spec.dataStandards?.data)}
                  {renderPlanCycle('Accessibility', spec.dataStandards?.accessibility)}
                  {renderPlanCycle('Transparency', spec.dataStandards?.transparency)}
                </div>
              </div>
              <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
                <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Narrative</div>
                {spec.narrative ? <MarkdownContent content={spec.narrative} /> : <div className="text-sm text-[var(--color-muted)]">Add a short SCI narrative if needed.</div>}
              </div>
            </div>
          </div>
        )}
      </div>
      {showExport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-edge)]">
              <div className="font-semibold text-[var(--color-ink)]">SCI export (prose)</div>
              <div className="flex items-center gap-2">
                <button className="text-xs text-[var(--color-accent)]" onClick={() => navigator.clipboard.writeText(exportText || '')}>Copy text</button>
                <button className="text-xs text-[var(--color-accent)]" onClick={() => setShowExport(false)}>Close</button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[75vh]">
              {exportText ? <MarkdownContent content={exportText} /> : <div className="text-sm text-[var(--color-muted)]">Generating…</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
