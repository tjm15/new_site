import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { CouncilData } from '../../../data/types';
import { getPrompts } from '../../../prompts';
import { EvidenceTool } from './tools/EvidenceTool';
import { VisionConceptsTool } from './tools/VisionConceptsTool';
import { PolicyDrafterTool } from './tools/PolicyDrafterTool';
import { StrategyModelerTool } from './tools/StrategyModelerTool';
import { SiteAssessmentTool } from './tools/SiteAssessmentTool';
import { FeedbackAnalysisTool } from './tools/FeedbackAnalysisTool';
import { SEATool } from './tools/SEATool';
import { SCITool } from './tools/SCITool';
import { TimetableTool } from './tools/TimetableTool';
import { NoticeToCommenceTool } from './tools/NoticeToCommenceTool';
import { PrepRiskTool } from './tools/PrepRiskTool';
import { BaseliningTool } from './tools/BaseliningTool';
import { STAGES } from '../../../data/stageMeta';
import { usePlan } from '../../../contexts/PlanContext';
import { suggestToolPrefill, runLLMTask } from '../../../utils/llmTasks';
import { StageInsightsPanel } from '../../../components/StageInsightsPanel';
import { Link } from 'react-router-dom';
import { retrieveContext } from '../../../lib/localQa';
import { getGeoLayerSet } from '../../../data/geojsonLayers';
import { MapLibreFrame } from '../../../components/MapLibreFrame';
import { callLLM } from '../../../utils/llmClient';
import { prepareAssistantMarkdown } from '../../../utils/markdown';
import { STAGES as STAGE_MODEL } from '../../../data/stageMeta';
import { PlanTimelineHorizontal } from '../../../components/PlanTimelineHorizontal';
import { MarkdownContent } from '../../../components/MarkdownContent';

interface SpatialPlanDemoProps {
  councilData: CouncilData;
  onBack: () => void;
  initialTool?: string | undefined;
}

type ToolId = 'timetable' | 'notice' | 'prepRisk' | 'baselining' | 'evidence' | 'vision' | 'policy' | 'strategy' | 'sites' | 'feedback' | 'sea' | 'sci';

interface Tool {
  id: ToolId;
  label: string;
  icon: string;
  description: string;
}

const TOOLS: Tool[] = [
  { id: 'timetable', label: 'Timetable Drafting', icon: '📆', description: 'Lay out a 30-month timetable visually, auto-draft with AI, and save milestones to the plan.' },
  { id: 'notice', label: 'Notice to Commence', icon: '📢', description: 'Generate compliant notice text ready for publication with timetable link.' },
  { id: 'prepRisk', label: 'Preparation Risk Assessor', icon: '⚠️', description: 'RAG governance/resources before Gateway 1 with actions.' },
  { id: 'baselining', label: 'Baselining Studio', icon: '📚', description: 'Generate datasets, trends, SWOT, and baseline narrative with plan-aware autofill.' },
  { id: 'evidence', label: 'Evidence Base', icon: '🗺️', description: 'Build your foundation by exploring geospatial data and querying a vast library of planning documents.' },
  { id: 'vision', label: 'Vision & Concepts', icon: '🎨', description: 'Translate data and policy into compelling visuals. Generate high-quality architectural and landscape imagery.' },
  { id: 'policy', label: 'Policy Drafter', icon: '📋', description: 'Draft, refine, and validate planning policy. Research, check for national compliance, and get editing suggestions.' },
  { id: 'strategy', label: 'Strategy Modeler', icon: '📊', description: 'Explore the future impact of high-level strategies. Model and compare complex scenarios for informed decisions.' },
  { id: 'sites', label: 'Site Assessment', icon: '📍', description: 'Conduct detailed, map-based site assessments. Generate grounded reports for any location or uploaded site data.' },
  { id: 'feedback', label: 'Feedback Analysis', icon: '💬', description: 'Instantly synthesize public and stakeholder feedback. Analyze unstructured text to find actionable insights.' },
  { id: 'sea', label: 'SEA / HRA', icon: '🌊', description: 'Capture SEA scoping and HRA baseline with quick drafting support.' },
  { id: 'sci', label: 'Engagement / SCI', icon: '🗣️', description: 'Record who you will engage, how, and when for this plan.' },
];

export const SpatialPlanDemo: React.FC<SpatialPlanDemoProps> = ({ councilData, onBack, initialTool }) => {
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const [planView, setPlanView] = useState<'new' | 'adopted'>('new');
  const prompts = getPrompts(councilData.id, 'spatial', councilData.name);
  const [question, setQuestion] = useState('');
  const [chatHistoryByPlan, setChatHistoryByPlan] = useState<Record<string, Array<{ role: 'user' | 'assistant'; text: string }>>>({});
  const [lastAnswerByPlan, setLastAnswerByPlan] = useState<Record<string, string>>({});
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const { plans, getActiveForCouncil, setActiveForCouncil, setActivePlan, createPlan, updatePlan, setPlanStage } = usePlan();
  const [creating, setCreating] = useState(false);
  const [initialProps, setInitialProps] = useState<{
    evidence?: { initialQuery?: string; initialTopics?: string[]; initialCards?: { title: string; content: string; question?: string }[]; autoRun?: boolean };
    policy?: { initialTopic?: string; initialBrief?: string; initialDraftPolicy?: string; initialVariants?: string[]; autoRun?: boolean };
    vision?: { initialArea?: string; initialVisionText?: string; initialHighlightsText?: string; initialConceptImage?: string; autoRun?: boolean };
    strategy?: { initialStrategyId?: string; initialAnalysis?: string; initialMetrics?: { totalSites: number; totalCapacity: number } | null; autoRun?: boolean };
    sites?: { initialSiteId?: string; initialAppraisal?: string; initialDetails?: { constraints?: string[]; opportunities?: string[]; policies?: string[] } | null; autoRun?: boolean };
    feedback?: { initialText?: string; initialThemes?: any[]; autoRun?: boolean };
    sea?: { autoRun?: boolean; prefill?: Record<string, any> };
    sci?: { autoRun?: boolean; prefill?: Record<string, any> };
    culp?: { autoRun?: boolean };
    timetable?: { autoRun?: boolean };
    notice?: { autoRun?: boolean; prefill?: Record<string, any>; initialPublicationDate?: string; initialTimetableUrl?: string; initialDraft?: string; initialInstructions?: string };
    prepRisk?: { autoRun?: boolean; prefill?: Record<string, any>; initialGovernance?: string; initialResources?: string; initialScope?: string; initialRisks?: string; initialPidDone?: string };
    baselining?: { autoRun?: boolean; prefill?: Record<string, any>; initialTopics?: string; initialFocusNotes?: string };
  }>({});
  const [toolSessionsByPlan, setToolSessionsByPlan] = useState<Record<string, Record<string, any>>>({});
  const activePlan = getActiveForCouncil(councilData.id);
  const activePlanKey = activePlan?.id || 'no-plan';
  const currentStageId = (activePlan?.planStage || STAGES[0].id) as (typeof STAGES)[number]['id'];
  const stageMeta = useMemo(() => STAGES.find(s => s.id === currentStageId) || STAGES[0], [currentStageId]);
  const geoLayers = useMemo(() => getGeoLayerSet(councilData.id), [councilData.id]);
  const [gatewayState, setGatewayState] = useState<{ summary?: string; readiness?: any; loading?: boolean }>({});
  const [baselineState, setBaselineState] = useState<{ datasets?: string; trends?: string; swot?: string; narrative?: string; loading?: boolean }>({});

  const runBaseline = useCallback(async () => {
    if (!activePlan) return;
    setBaselineState(prev => ({ ...prev, loading: true }));
    try {
      const ctx = `
Authority: ${activePlan.area}
Plan: ${activePlan.title}
Known outcomes: ${(activePlan.visionStatements || []).map(v=>v.text).join('; ') || 'None yet'}
Sites scored: ${activePlan.sites?.length || 0}
`;
      const datasets = await callLLM({ mode: 'markdown', prompt: `List the top 8 datasets (with source suggestions) this authority should include in its Local Plan baseline. Return as markdown bullets.` });
      const trends = await callLLM({ mode: 'markdown', prompt: `Given this planning authority context, draft bullet trends and issues by topic (housing, economy, transport, environment, infrastructure). Keep concise.\nContext:\n${ctx}` });
      const swot = await callLLM({ mode: 'markdown', prompt: `Create a SWOT / key challenges list grounded in constraints and opportunities. Return as markdown list with four sections.` });
      const narrative = await callLLM({ mode: 'markdown', prompt: `Draft a short baseline narrative (200-250 words) for this authority.\nContext:\n${ctx}` });
      setBaselineState({
        datasets,
        trends,
        swot,
        narrative,
        loading: false,
      });
    } catch {
      setBaselineState({ loading: false });
    }
  }, [activePlan]);

  const toolLaunchMap = useMemo<Record<string, ToolId>>(() => ({
    EvidenceTool: 'evidence',
    VisionConceptsTool: 'vision',
    PolicyDrafterTool: 'policy',
    StrategyModelerTool: 'strategy',
    SiteAssessmentTool: 'sites',
    FeedbackAnalysisTool: 'feedback',
    SEATool: 'sea',
    SCITool: 'sci',
    TimetableTool: 'timetable',
    NoticeTool: 'notice',
    PrepRiskTool: 'prepRisk',
    BaseliningTool: 'baselining',
  }), []);

  const toolById = useMemo(() => {
    const map: Record<ToolId, Tool> = {} as any;
    TOOLS.forEach(t => { map[t.id] = t; });
    return map;
  }, []);
  const stageModel = useMemo(() => STAGE_MODEL.find(s => s.id === currentStageId), [currentStageId]);

  const renderAssistantPanel = () => {
    if (!activePlan) {
      return (
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
          <div className="font-semibold text-[var(--color-ink)] mb-1">Inspector</div>
          <p className="text-sm text-[var(--color-muted)]">Start a plan to see AI guidance, QA checks, and warnings.</p>
        </div>
      );
    }
    return (
      <>
        <StageInsightsPanel plan={activePlan} stageId={currentStageId} qaNotes={stageMeta.qaNotes} />
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
          <div className="font-semibold text-[var(--color-ink)] mb-2">Plan-aware assistant (Ask anything)</div>
          <div className="text-xs text-[var(--color-muted)] mb-2">Context: {stageMeta.label}</div>
          <div className="space-y-2 max-h-48 overflow-auto border border-[var(--color-edge)] rounded p-2 bg-[var(--color-surface)]">
            {chatHistory.length === 0 && <div className="text-xs text-[var(--color-muted)]">No messages yet. Ask a question to start.</div>}
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`text-sm ${msg.role === 'assistant' ? 'text-[var(--color-ink)]' : 'text-[var(--color-muted)]'}`}>
                <span className="font-semibold">{msg.role === 'assistant' ? 'Assistant: ' : 'You: '}</span>{msg.text}
              </div>
            ))}
          </div>
          {lastAnswer && (
            <button className="mt-2 text-xs text-[var(--color-accent)] hover:underline" onClick={()=>setShowAnswerModal(true)}>Open last answer</button>
          )}
          <div className="mt-2 flex gap-2">
            <input value={question} onChange={(e)=>setQuestion(e.target.value)} className="flex-1 px-3 py-2 text-[var(--color-ink)] bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" placeholder="Ask about this stage, evidence, sites, or guidance" />
            <button
              className="px-3 py-2 bg-[var(--color-brand)] rounded text-[var(--color-ink)] transition transform hover:scale-[1.01] active:scale-[0.99]"
              onClick={handleAsk}
              aria-label="Ask the assistant"
              title="Send question to the assistant"
            >
              Ask
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {((stageModel?.actionsRecommended || []).map(a => a.assistantPromptHint || '').filter(Boolean) as string[]).map((q, i) => (
              <button key={i} className="px-3 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-edge)] text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]" onClick={()=>setQuestion(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  };

  const handleCreatePlan = async () => {
    setCreating(true);
    const plan = createPlan({ title: 'New Local Plan', area: councilData.name, systemType: 'new', councilId: councilData.id });
    try {
      const tt = await suggestTimetable(councilData.name, councilData.name);
      const stageTargets = (tt?.milestones || []).reduce((acc: Record<string, string>, m: any) => { acc[m.stageId] = m.date; return acc; }, {});
      const stages = plan.stages.map(s => ({ ...s, targetDate: stageTargets[s.id] }));
      updatePlan(plan.id, { timetable: tt, stages, planStage: STAGES[0].id } as any);
      setActiveForCouncil(councilData.id, plan.id);
    } catch (e) {
      console.warn('Timetable suggestion failed', e);
    } finally {
      setCreating(false);
    }
  };

  const openTool = useCallback((picked: ToolId, opts?: { prefill?: Record<string, any>; autoRun?: boolean }) => {
    (async () => {
      let suggested = opts?.prefill;
      if (!suggested && activePlan) {
        try {
          suggested = await suggestToolPrefill(picked, activePlan, activePlan.planStage);
        } catch (e) {
          suggested = undefined;
        }
      }
      const base = suggested && typeof suggested === 'object' ? suggested : {};
      const autoRun = opts?.autoRun ?? true;
      if (picked === 'sea') {
        setInitialProps(prev => ({ ...prev, sea: { autoRun, prefill: suggested || base } } as any));
      } else if (picked === 'sci') {
        setInitialProps(prev => ({ ...prev, sci: { autoRun, prefill: suggested || base } } as any));
      } else {
        setInitialProps(prev => ({ ...prev, [picked]: { autoRun, prefill: suggested || base, ...(base as any) } } as any));
      }
      setSelectedTool(picked);
    })();
  }, [activePlan]);

  React.useEffect(() => {
    if (!initialTool) return;
    const simpleMap: Record<string, ToolId> = { vision: 'vision', sites: 'sites', evidence: 'evidence', policy: 'policy', strategy: 'strategy', feedback: 'feedback', sea: 'sea', sci: 'sci', timetable: 'timetable', notice: 'notice', preprisk: 'prepRisk', prepRisk: 'prepRisk', baselining: 'baselining', baseline: 'baselining' };
    const picked = simpleMap[initialTool];
    if (picked) openTool(picked);
  }, [initialTool, openTool]);

  // Ensure a plan exists/active for this council
  React.useEffect(() => {
    if (activePlan) return;
    const fallback = plans.find(p => p.councilId === councilData.id);
    if (fallback) {
      setActivePlan(fallback.id);
      setActiveForCouncil(councilData.id, fallback.id);
      if (!fallback.planStage) setPlanStage(fallback.id, STAGES[0].id);
    }
  }, [activePlan?.id, plans, councilData.id, setActivePlan, setActiveForCouncil, setPlanStage]);

  const chatHistory = activePlan ? (chatHistoryByPlan[activePlan.id] || []) : [];
  const lastAnswer = activePlan ? lastAnswerByPlan[activePlan.id] : undefined;
  const toolSessions = toolSessionsByPlan[activePlanKey] || {};

  // Clear tool workspace when switching plans to avoid cross-plan state bleed
  React.useEffect(() => {
    setSelectedTool(null);
  }, [activePlanKey]);

  // Removed auto planNextStageSuggestion to avoid extra LLM calls; run only on demand if needed.

  // Auto-run Gateway 1 readiness when entering the stage
  React.useEffect(() => {
    if (!activePlan || currentStageId !== 'GATEWAY_1') return;
    if (gatewayState.loading) return;
    if (activePlan.readinessAssessment) {
      setGatewayState({ summary: activePlan.gateway1SummaryText, readiness: activePlan.readinessAssessment, loading: false });
      return;
    }
    setGatewayState(prev => ({ ...prev, loading: true }));
    (async () => {
      try {
        const payload = {
          authorityName: activePlan.area,
          planId: activePlan.id,
          timetableInfo: activePlan.timetable,
          answers: {
            timetable: { hasDraftTimetable: 'Yes', criticalMilestones: 'Gateway 1, Baselining, Consultation windows', projectManager: 'Named lead officer' },
            governance: { decisionMaker: 'Cabinet/Mayor', hasBoard: 'Yes', boardFrequency: 'Monthly' },
            engagement: { hasStrategy: 'Yes', keyStakeholders: 'Members; communities; statutory bodies' },
            evidence: { evidenceAudit: 'Yes', plannedCommissions: 'Housing needs, viability, transport' },
            sea: { seaScoping: 'Drafted', hraBaseline: 'Baseline in progress' }
          },
          notes: {},
        };
        const readiness = await runLLMTask('gateway1_readiness_rag', payload);
        const assessed = {
          areas: readiness?.areas || [],
          overallStatus: readiness?.overallStatus || 'amber',
          overallComment: readiness?.overallComment || '',
          assessedAt: new Date().toISOString(),
        };
        updatePlan(activePlan.id, { readinessAssessment: assessed });
        const summary = await runLLMTask('gateway1_summary', {
          authorityName: activePlan.area,
          gatewayStatus: assessed.overallStatus,
          readinessAssessment: assessed,
          timetable: activePlan.timetable,
          planOverview: { title: activePlan.title, area: activePlan.area },
        });
        const text = typeof summary === 'string' ? summary : JSON.stringify(summary, null, 2);
        updatePlan(activePlan.id, { gateway1SummaryText: text });
        setGatewayState({ summary: text, readiness: assessed, loading: false });
      } catch {
        setGatewayState({ loading: false });
      }
    })();
  }, [activePlan?.id, currentStageId, gatewayState.loading, updatePlan]);

  // Auto-run baselining helpers when entering baselining stage
  React.useEffect(() => {
    if (!activePlan || currentStageId !== 'BASELINING') return;
    if (baselineState.loading) return;
    // Baseline outputs now live inside Evidence tool tabs; do not render inline here.
  }, [activePlan?.id, currentStageId, baselineState.loading, runBaseline]);

  const handleAsk = async () => {
    if (!activePlan || !question.trim()) return;
    const history = chatHistoryByPlan[activePlan.id] || [];
    const stage = stageMeta;
    const ctx = await retrieveContext(question, activePlan, councilData);
    const milestones = (activePlan.timetable?.milestones || []).map(m => `${m.stageId}:${m.date}`).join('; ') || 'none logged';
    const outcomes = (activePlan.visionStatements || []).map(v => v.text).join(' | ') || 'none recorded';
    const sites = (activePlan.sites || []).map(s => {
      const rag = [s.suitability, s.availability, s.achievability].filter(Boolean).join('/');
      return `${s.name}${rag ? ` (${rag})` : ''}`;
    }).join(' | ') || 'no sites captured';
    const evidence = (activePlan.evidenceInventory || []).map(ev => `${ev.title}${ev.status ? ` [${ev.status}]` : ''}`).join(' | ') || 'no evidence logged';
    const readiness = activePlan.readinessAssessment?.overallStatus ? `Readiness RAG: ${activePlan.readinessAssessment.overallStatus}` : 'Readiness: not assessed';
    const planState = [
      `Authority: ${councilData.name}`,
      `Plan title: ${activePlan.title}`,
      `Plan area: ${activePlan.area}`,
      `Current stage: ${stage?.label} (${currentStageId})`,
      `Stage aim: ${stage?.aim}`,
      `Milestones: ${milestones}`,
      `Vision/outcomes: ${outcomes}`,
      `Sites: ${sites}`,
      `Evidence: ${evidence}`,
      readiness,
    ].join('\n');
    const ctxText = (ctx || []).map((c:any)=>c.text).filter(Boolean).join(' | ') || 'No retrieved context';
    const prompt = [
      `You are the plan-aware assistant for ${councilData.name}. Anchor every answer in this authority and its current plan state. Do not invent other places (avoid placeholders like "Testborough").`,
      `Plan snapshot:\n${planState}`,
      `Core tasks: ${(stage?.coreTasks || stage?.tasks || []).join(' • ')}`,
      `QA reminders: ${(stage?.qaNotes || []).join(' • ')}`,
      `Recent chat:`,
      ...history.slice(-4).map(m => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.text}`),
      `Context snippets: ${ctxText}`,
      `User question (respond concisely in professional planning language): ${question}`,
      `Assistant:`
    ].join('\n');
    try {
      const replyRaw = await callLLM({ mode: 'markdown', prompt });
      const reply = replyRaw || '(no response)';
      const newHistory = [...history, { role: 'user', text: question }, { role: 'assistant', text: reply }];
      setChatHistoryByPlan(prev => ({ ...prev, [activePlan.id]: newHistory }));
      setLastAnswerByPlan(prev => ({ ...prev, [activePlan.id]: reply }));
      setQuestion('');
      setShowAnswerModal(true);
    } catch (e) {
      const newHistory = [...history, { role: 'user', text: question }, { role: 'assistant', text: '(error retrieving answer)' }];
      setChatHistoryByPlan(prev => ({ ...prev, [activePlan.id]: newHistory }));
      setLastAnswerByPlan(prev => ({ ...prev, [activePlan.id]: '(error retrieving answer)' }));
      setShowAnswerModal(true);
    }
  };

  const renderToolWorkspace = () => {
    switch (selectedTool) {
      case 'evidence':
        return <EvidenceTool
          councilData={councilData}
          prompts={prompts}
          {...(initialProps.evidence || {})}
          initialCards={toolSessions.evidence?.cards}
          initialQuery={toolSessions.evidence?.query || initialProps.evidence?.initialQuery}
          initialTopics={toolSessions.evidence?.selectedTopics || initialProps.evidence?.initialTopics}
          autoRun={initialProps.evidence?.autoRun && !toolSessions.evidence}
          onSessionChange={(session)=> setToolSessionsByPlan(s=> ({ ...s, [activePlanKey]: { ...(s[activePlanKey]||{}), evidence: session } }))}
        />;
      case 'vision':
        return <VisionConceptsTool
          councilData={councilData}
          prompts={prompts}
          {...(initialProps.vision || {})}
          initialArea={toolSessions.vision?.areaDescription || initialProps.vision?.initialArea}
          initialVisionText={toolSessions.vision?.visionText || initialProps.vision?.initialVisionText}
          initialHighlightsText={toolSessions.vision?.highlightsText || initialProps.vision?.initialHighlightsText}
          initialConceptImage={toolSessions.vision?.conceptImage || initialProps.vision?.initialConceptImage}
          autoRun={initialProps.vision?.autoRun && !toolSessions.vision}
          onSessionChange={(session)=> setToolSessionsByPlan(s=> ({ ...s, [activePlanKey]: { ...(s[activePlanKey]||{}), vision: session } }))}
        />;
      case 'policy':
        return <PolicyDrafterTool
          councilData={councilData}
          prompts={prompts}
          {...(initialProps.policy || {})}
          initialTopic={toolSessions.policy?.selectedTopic || initialProps.policy?.initialTopic}
          initialBrief={toolSessions.policy?.policyBrief || initialProps.policy?.initialBrief}
          initialDraftPolicy={toolSessions.policy?.draftPolicy || initialProps.policy?.initialDraftPolicy}
          initialVariants={toolSessions.policy?.variants || initialProps.policy?.initialVariants}
          autoRun={initialProps.policy?.autoRun && !toolSessions.policy}
          onSessionChange={(session)=> setToolSessionsByPlan(s=> ({ ...s, [activePlanKey]: { ...(s[activePlanKey]||{}), policy: session } }))}
        />;
      case 'strategy':
        return <StrategyModelerTool
          councilData={councilData}
          prompts={prompts}
          {...(initialProps.strategy || {})}
          initialStrategyId={toolSessions.strategy?.selectedStrategy || initialProps.strategy?.initialStrategyId}
          initialAnalysis={toolSessions.strategy?.analysis || initialProps.strategy?.initialAnalysis}
          initialMetrics={toolSessions.strategy?.metrics || initialProps.strategy?.initialMetrics}
          autoRun={initialProps.strategy?.autoRun && !toolSessions.strategy}
          onSessionChange={(session)=> setToolSessionsByPlan(s=> ({ ...s, [activePlanKey]: { ...(s[activePlanKey]||{}), strategy: session } }))}
          geoLayers={geoLayers}
        />;
      case 'sites':
        return <SiteAssessmentTool
          councilData={councilData}
          prompts={prompts}
          {...(initialProps.sites || {})}
          initialSiteId={toolSessions.sites?.selectedSite || initialProps.sites?.initialSiteId}
          initialAppraisal={toolSessions.sites?.appraisal || initialProps.sites?.initialAppraisal}
          initialDetails={toolSessions.sites?.details || initialProps.sites?.initialDetails}
          autoRun={initialProps.sites?.autoRun && !toolSessions.sites}
          onSessionChange={(session)=> setToolSessionsByPlan(s=> ({ ...s, [activePlanKey]: { ...(s[activePlanKey]||{}), sites: session } }))}
          geoLayers={geoLayers}
        />;
      case 'feedback':
        return <FeedbackAnalysisTool
          prompts={prompts}
          {...(initialProps.feedback || {})}
          initialText={toolSessions.feedback?.consultationText || initialProps.feedback?.initialText}
          initialThemes={toolSessions.feedback?.themes || initialProps.feedback?.initialThemes}
          autoRun={initialProps.feedback?.autoRun && !toolSessions.feedback}
          onSessionChange={(session)=> setToolSessionsByPlan(s=> ({ ...s, [activePlanKey]: { ...(s[activePlanKey]||{}), feedback: session } }))}
        />;
      case 'sea':
        return <SEATool councilData={councilData} autoRun={initialProps.sea?.autoRun} initialData={initialProps.sea?.prefill} onSaved={() => { /* noop */ }} />;
      case 'sci':
        return <SCITool councilData={councilData} autoRun={initialProps.sci?.autoRun} initialData={initialProps.sci?.prefill} onSaved={() => { /* noop */ }} />;
      case 'notice':
        return <NoticeToCommenceTool
          councilData={councilData}
          autoRun={initialProps.notice?.autoRun}
          prefill={initialProps.notice?.prefill}
          initialPublicationDate={initialProps.notice?.initialPublicationDate}
          initialTimetableUrl={initialProps.notice?.initialTimetableUrl}
          initialDraft={initialProps.notice?.initialDraft}
          initialInstructions={initialProps.notice?.initialInstructions}
        />;
      case 'prepRisk':
        return <PrepRiskTool
          councilData={councilData}
          autoRun={initialProps.prepRisk?.autoRun}
          prefill={initialProps.prepRisk?.prefill}
          initialGovernance={initialProps.prepRisk?.initialGovernance}
          initialResources={initialProps.prepRisk?.initialResources}
          initialScope={initialProps.prepRisk?.initialScope}
          initialRisks={initialProps.prepRisk?.initialRisks}
          initialPidDone={initialProps.prepRisk?.initialPidDone}
        />;
      case 'baselining':
        return <BaseliningTool councilData={councilData} autoRun={initialProps.baselining?.autoRun} prefill={initialProps.baselining?.prefill} />;
      case 'timetable':
        return <TimetableTool councilData={councilData} autoRun={initialProps.timetable?.autoRun} />;
      default:
        return null;
    }
  };

  const renderStageInline = () => {
    if (!activePlan) return null;
    switch (currentStageId) {
      case 'GATEWAY_1': {
        const readiness = activePlan.readinessAssessment || gatewayState.readiness;
        const summary = activePlan.gateway1SummaryText || gatewayState.summary;
        const statusBadge = (s?: string) => {
          const base = 'px-2 py-1 text-xs rounded-full border';
          if (!s) return `${base} border-[var(--color-edge)] text-[var(--color-muted)]`;
          const st = s.toLowerCase();
          if (st.startsWith('g')) return `${base} bg-green-100 text-green-800 border-green-200`;
          if (st.startsWith('a')) return `${base} bg-amber-100 text-amber-800 border-amber-200`;
          return `${base} bg-red-100 text-red-800 border-red-200`;
        };
        const runGateway = async () => {
          setGatewayState(prev => ({ ...prev, loading: true }));
          try {
            const payload = {
              authorityName: activePlan.area,
              planId: activePlan.id,
              timetableInfo: activePlan.timetable,
              answers: {
                timetable: { hasDraftTimetable: 'Yes', criticalMilestones: 'Gateway 1, Baselining, Consultation windows', projectManager: 'Named lead officer' },
                governance: { decisionMaker: 'Cabinet/Mayor', hasBoard: 'Yes', boardFrequency: 'Monthly' },
                engagement: { hasStrategy: 'Yes', keyStakeholders: 'Members; communities; statutory bodies' },
                evidence: { evidenceAudit: 'Yes', plannedCommissions: 'Housing needs, viability, transport' },
                sea: { seaScoping: 'Drafted', hraBaseline: 'Baseline in progress' }
              },
              notes: {},
            };
            const readinessRes = await runLLMTask('gateway1_readiness_rag', payload);
            const assessed = {
              areas: readinessRes?.areas || [],
              overallStatus: readinessRes?.overallStatus || 'amber',
              overallComment: readinessRes?.overallComment || '',
              assessedAt: new Date().toISOString(),
            };
            updatePlan(activePlan.id, { readinessAssessment: assessed });
            const summaryRes = await runLLMTask('gateway1_summary', {
              authorityName: activePlan.area,
              gatewayStatus: assessed.overallStatus,
              readinessAssessment: assessed,
              timetable: activePlan.timetable,
              planOverview: { title: activePlan.title, area: activePlan.area },
            });
            const text = typeof summaryRes === 'string' ? summaryRes : JSON.stringify(summaryRes, null, 2);
            updatePlan(activePlan.id, { gateway1SummaryText: text });
            setGatewayState({ summary: text, readiness: assessed, loading: false });
          } catch {
            setGatewayState({ loading: false });
          }
        };

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs text-[var(--color-muted)]">Gateway 1 readiness</div>
                  <div className="text-lg font-semibold text-[var(--color-ink)]">Self-assessment snapshot</div>
                </div>
                <span className={statusBadge(readiness?.overallStatus)}>Overall {readiness?.overallStatus?.toUpperCase?.() || 'N/A'}</span>
              </div>
              <div className="flex gap-2 mb-3">
                <button className="px-3 py-2 bg-[var(--color-accent)] text-white rounded text-sm" onClick={runGateway} disabled={gatewayState.loading}>
                  {gatewayState.loading ? 'Running…' : 'Re-run with AI'}
                </button>
                <Link to="/app/gateway1" className="px-3 py-2 bg-[var(--color-panel)] border border-[var(--color-edge)] rounded text-sm text-[var(--color-ink)]">Open full Gateway 1 form</Link>
              </div>
              {summary ? (
                <MarkdownContent content={summary} />
              ) : (
                <div className="text-sm text-[var(--color-muted)]">No summary yet — run the assessment to populate.</div>
              )}
            </div>
            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
              <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Stage map</div>
              {geoLayers ? <MapLibreFrame layers={geoLayers} height={260} /> : <div className="text-xs text-[var(--color-muted)]">No map available.</div>}
            </div>
          </div>
        );
      }
      case 'BASELINING': {
        return (
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
            <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Stage map</div>
            {geoLayers ? <MapLibreFrame layers={geoLayers} height={260} /> : <div className="text-xs text-[var(--color-muted)]">No map available.</div>}
          </div>
        );
      }
      default:
        return (
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
            <div className="text-sm font-semibold text-[var(--color-ink)] mb-2">Stage context map</div>
            {geoLayers ? <MapLibreFrame layers={geoLayers} height={280} /> : <div className="text-xs text-[var(--color-muted)]">No map available.</div>}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="bg-[var(--color-panel)] border-b border-[var(--color-edge)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={onBack} className="text-[var(--color-accent)] hover:underline text-sm">← Back to selection</button>
          <div className="h-6 w-px bg-[var(--color-edge)]" />
          <div className="flex flex-col">
            <span className="text-xs text-[var(--color-muted)]">Local Planning Authority</span>
            <span className="text-lg font-semibold text-[var(--color-ink)]">{councilData.name}</span>
            <span className="text-sm text-[var(--color-muted)]">{activePlan ? `Plan: ${activePlan.title}` : 'No plan in progress'}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={()=>setPlanView('adopted')}
              className={`px-3 py-1.5 text-sm rounded border ${planView === 'adopted' ? 'bg-[var(--color-surface)] border-[var(--color-accent)] text-[var(--color-ink)]' : 'border-[var(--color-edge)] text-[var(--color-muted)]'}`}
            >
              Adopted plan
            </button>
            <button
              onClick={()=>setPlanView('new')}
              className={`px-3 py-1.5 text-sm rounded border ${planView === 'new' ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'border-[var(--color-edge)] text-[var(--color-muted)]'}`}
            >
              New plan (CULP)
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4">
        {!selectedTool ? (
          <div className="space-y-4">
            {activePlan ? (
              <PlanTimelineHorizontal
                plan={activePlan}
                currentStageId={currentStageId}
                onSelectStage={(sid: any) => setPlanStage(activePlan.id, sid)}
              />
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
              <section className="space-y-4">
              {!activePlan ? (
                <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2">Create a Local Plan workspace</h3>
                  <p className="text-sm text-[var(--color-muted)] mb-4">Set up the new-system Local Plan for {councilData.name}. We will seed the timetable and stage workflow.</p>
                  <button className="px-3 py-2 bg-[var(--color-accent)] text-white rounded" onClick={handleCreatePlan} disabled={creating}>{creating ? 'Creating…' : 'Create new plan'}</button>
                </div>
              ) : (
                <>
                  {/* Stage header */}
                  <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs text-[var(--color-muted)]">Current stage</div>
                        <div className="text-xl font-semibold text-[var(--color-ink)]">{stageMeta.label}</div>
                        <p className="text-sm text-[var(--color-muted)] mt-1">{stageMeta.description}</p>
                      </div>
                      <span className="px-3 py-1 text-xs rounded-full bg-[var(--color-surface)] border border-[var(--color-edge)]">Stage owner: you</span>
                    </div>
                    <p className="text-sm text-[var(--color-ink)] mt-3 leading-relaxed">{stageMeta.aim}</p>
                  </div>

                  {/* Next steps (authoritative actions) */}
                  <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-[var(--color-ink)]">Next steps</div>
                        <p className="text-xs text-[var(--color-muted)]">Highest priority actions for this stage.</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {(stageModel?.actionsRecommended || []).map(action => {
                        const mapped = action.primaryToolId ? toolLaunchMap[action.primaryToolId] : undefined;
                        return (
                          <div key={action.id} className="border border-[var(--color-edge)] rounded-lg p-3 bg-[var(--color-surface)]">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-semibold text-[var(--color-ink)]">{action.label}</div>
                              {mapped && (
                                <button className="text-sm text-[var(--color-accent)] hover:underline" onClick={()=>openTool(mapped)}>
                                  Open tool
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-[var(--color-muted)]">{action.shortExplainer}</p>
                          </div>
                        )
                      })}
                      {(!stageModel?.actionsRecommended || stageModel.actionsRecommended.length === 0) && (
                        <div className="text-sm text-[var(--color-muted)]">No recommended actions defined for this stage.</div>
                      )}
                    </div>
                  </div>

                  {/* Core work */}
                  <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-[var(--color-ink)]">Core work at this stage</div>
                        <p className="text-xs text-[var(--color-muted)]">Descriptive context to progress before moving on.</p>
                      </div>
                      {stageMeta.id === 'GATEWAY_1' && (
                        <Link to="/app/gateway1" className="text-sm text-[var(--color-accent)] hover:underline">Open Gateway 1</Link>
                      )}
                    </div>
                    <ul className="list-disc ml-5 text-sm text-[var(--color-ink)] space-y-1">
                      {(stageModel?.coreTasks && stageModel.coreTasks.length ? stageModel.coreTasks : stageMeta.tasks).map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>

                  {/* Stage tools (merged) */}
                  <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-[var(--color-ink)]">Stage tools</div>
                        <p className="text-xs text-[var(--color-muted)]">Only the tools relevant to the current stage.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(stageModel?.stageTools && stageModel.stageTools.length ? stageModel.stageTools : stageMeta.recommendedTools)
                        .map(t => toolLaunchMap[t])
                        .filter((t): t is ToolId => Boolean(t))
                        .map(tid => {
                          const tool = toolById[tid];
                          if (!tool) return null;
                          return (
                            <button
                              key={tid}
                              className="text-left bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-xl p-3 hover:border-[var(--color-accent)] transition-all"
                              onClick={() => openTool(tid)}
                            >
                              <div className="text-2xl mb-1">{tool.icon}</div>
                              <div className="font-semibold text-[var(--color-ink)]">{tool.label}</div>
                              <p className="text-sm text-[var(--color-muted)] mt-1">{tool.description}</p>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {renderStageInline()}

                </>
              )}
            </section>

              <aside className="lg:sticky lg:top-20 space-y-3">
                {renderAssistantPanel()}
              </aside>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
            <section className="space-y-4 lg:col-span-1">
              <button
                onClick={() => setSelectedTool(null)}
                className="text-[var(--color-accent)] hover:underline text-sm"
              >
                ← Back to stage workspace
              </button>
              <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
                {renderToolWorkspace()}
              </div>
            </section>
            <aside className="lg:sticky lg:top-20 space-y-3">
              {renderAssistantPanel()}
            </aside>
          </div>
        )}
      <AnswerModal open={showAnswerModal} onClose={()=>setShowAnswerModal(false)} answer={lastAnswer} />
      </div>
    </div>
  );
};

// Simple modal to show last assistant answer with markdown rendering
const AnswerModal: React.FC<{
  open: boolean
  onClose: () => void
  answer?: string
}> = ({ open, onClose, answer }) => {
  if (!open) return null;
  const markdown = prepareAssistantMarkdown(answer || '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-edge)]">
          <div className="font-semibold text-[var(--color-ink)]">Assistant answer</div>
          <button className="text-[var(--color-accent)] text-sm hover:underline" onClick={onClose}>Close</button>
        </div>
        <div className="p-4 overflow-auto max-h-[75vh]">
          {markdown ? (
            <MarkdownContent content={markdown} />
          ) : (
            <div className="text-sm text-[var(--color-muted)]">No answer yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function stageDefaultSuggestions(stageId: string): string[] {
  switch (stageId) {
    case 'PREP':
      return ['Draft a 30-month timetable for this plan', 'Draft a Notice to Commence for this authority', 'RAG our governance/resources before Gateway 1', 'What goes into Gateway 1 readiness?', 'List the biggest risks before Gateway 1'];
    case 'GATEWAY_1':
      return ['Are we Gateway 1 ready?', 'Generate a short Gateway 1 summary', 'What gaps remain before baselining?'];
    case 'BASELINING':
      return ['Which datasets are missing for the baseline?', 'Summarise housing and economy trends', 'Draft a baseline narrative intro'];
    case 'VISION_OUTCOMES':
      return ['Propose a distinctive vision statement', 'Suggest measurable outcomes with indicators', 'Which outcomes lack supporting evidence?'];
    case 'SITE_SELECTION':
      return ['Which sites look weakest on deliverability?', 'Draft reasons to reject a site', 'Estimate capacity for key sites'];
    case 'CONSULTATION_1':
      return ['Who should we engage for Consultation 1?', 'Draft neutral questions on scope and vision', 'How should early feedback shape options?'];
    case 'GATEWAY_2':
      return ['What belongs in the Gateway 2 pack?', 'List emerging soundness risks', 'What to ask the assessor about?'];
    case 'CONSULTATION_2':
      return ['Tag issues raised against policies and sites', 'Summarise likely main issues', 'Draft the Consultation 2 summary outline'];
    case 'GATEWAY_3':
      return ['Run a prescribed requirements checklist', 'Draft a Statement of Soundness intro', 'What logistics should the readiness statement cover?'];
    case 'SUBMISSION_EXAM':
      return ['What is missing from the submission bundle?', 'Simulate inspector questions for a policy', 'Highlight cross-exam lines for contentious sites'];
    case 'ADOPTION_MONITORING':
      return ['Suggest indicators and baselines per outcome', 'What to include in the annual monitoring text?', 'How to approach the year-4 evaluation?'];
    default:
      return ['What should I do next in this stage?', 'Where are the biggest risks right now?', 'Which tool should I open first?'];
  }
}
