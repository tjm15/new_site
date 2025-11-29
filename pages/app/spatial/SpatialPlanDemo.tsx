import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { PlanningWorkspaceLayout } from '../../../components/PlanningWorkspaceLayout';
import { ContextSidebar } from '../../../components/ContextSidebar';
import { CurrentStagePanel } from '../../../components/CurrentStagePanel';
import { AllToolsDrawer } from '../../../components/AllToolsDrawer';
import { STAGES } from '../../../data/stageMeta';
import { classifyTool, classifyTopics, inferSiteId } from '../../../utils/classifier';
import { usePlan } from '../../../contexts/PlanContext';
import { suggestTimetable, suggestToolPrefill } from '../../../utils/llmTasks';
import { PlanTimeline } from '../../../components/PlanTimeline';

interface SpatialPlanDemoProps {
  councilData: CouncilData;
  onBack: () => void;
  initialTool?: string | undefined;
}

type ToolId = 'evidence' | 'vision' | 'policy' | 'strategy' | 'sites' | 'feedback' | 'sea' | 'sci';

interface Tool {
  id: ToolId;
  label: string;
  icon: string;
  description: string;
}

const TOOLS: Tool[] = [
  {
    id: 'evidence',
    label: 'Evidence Base',
    icon: '🗺️',
    description: 'Build your foundation by exploring geospatial data and querying a vast library of planning documents.'
  },
  {
    id: 'vision',
    label: 'Vision & Concepts',
    icon: '🎨',
    description: 'Translate data and policy into compelling visuals. Generate high-quality architectural and landscape imagery.'
  },
  {
    id: 'policy',
    label: 'Policy Drafter',
    icon: '📋',
    description: 'Draft, refine, and validate planning policy. Research, check for national compliance, and get editing suggestions.'
  },
  {
    id: 'strategy',
    label: 'Strategy Modeler',
    icon: '📊',
    description: 'Explore the future impact of high-level strategies. Model and compare complex scenarios for informed decisions.'
  },
  {
    id: 'sites',
    label: 'Site Assessment',
    icon: '📍',
    description: 'Conduct detailed, map-based site assessments. Generate grounded reports for any location or uploaded site data.'
  },
  {
    id: 'feedback',
    label: 'Feedback Analysis',
    icon: '💬',
    description: 'Instantly synthesize public and stakeholder feedback. Analyze unstructured text to find actionable insights.'
  }
];

export const SpatialPlanDemo: React.FC<SpatialPlanDemoProps> = ({ councilData, onBack, initialTool }) => {
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const prompts = getPrompts(councilData.id, 'spatial', councilData.name);
  const [question, setQuestion] = useState('');
  const [autoRunning, setAutoRunning] = useState(false);
  const [sidebarTopics, setSidebarTopics] = useState<string[]>([]);
  const { getActiveForCouncil, setActiveForCouncil, createPlan, updatePlan, setPlanStage } = usePlan();
  const [creating, setCreating] = useState(false);
  const [showAllTools, setShowAllTools] = useState(false);
  React.useEffect(() => {
    if (!initialTool) return
    const simpleMap: Record<string, ToolId> = {
      vision: 'vision',
      sites: 'sites',
      evidence: 'evidence',
      policy: 'policy',
      strategy: 'strategy',
      feedback: 'feedback',
      sea: 'sea',
      sci: 'sci'
    }
    const picked = simpleMap[initialTool]
    if (picked) {
      // Request an LLM prefill suggestion for the picked tool and thread into initialProps.
      ;(async () => {
        try {
          const plan = getActiveForCouncil(councilData.id)
          const suggested = plan ? await suggestToolPrefill(picked, plan, plan.planStage) : undefined
          if (picked === 'sea') {
            setInitialProps({ sea: { autoRun: true, prefill: suggested } } as any)
          } else if (picked === 'sci') {
            setInitialProps({ sci: { autoRun: true, prefill: suggested } } as any)
          } else {
            setInitialProps({ [picked]: { autoRun: true, ...(suggested ? { prefill: suggested } : {}) } } as any)
          }
        } catch (e) {
          setInitialProps({ [picked]: { autoRun: true } } as any)
        } finally {
          setSelectedTool(picked)
        }
      })()
    }
  }, [initialTool])
  // Handoff props for initial autorun per tool
  const [initialProps, setInitialProps] = useState<{
    evidence?: { initialQuery?: string; initialTopics?: string[]; initialCards?: { title: string; content: string; question?: string }[]; autoRun?: boolean };
    policy?: { initialTopic?: string; initialBrief?: string; initialDraftPolicy?: string; initialVariants?: string[]; autoRun?: boolean };
    vision?: { initialArea?: string; initialVisionText?: string; initialHighlightsText?: string; initialConceptImage?: string; autoRun?: boolean };
    strategy?: { initialStrategyId?: string; initialAnalysis?: string; initialMetrics?: { totalSites: number; totalCapacity: number } | null; autoRun?: boolean };
    sites?: { initialSiteId?: string; initialAppraisal?: string; initialDetails?: { constraints?: string[]; opportunities?: string[]; policies?: string[] } | null; autoRun?: boolean };
    feedback?: { initialText?: string; initialThemes?: any[]; autoRun?: boolean };
    sea?: { autoRun?: boolean; prefill?: Record<string, any> };
    sci?: { autoRun?: boolean; prefill?: Record<string, any> };
  }>({});
  const [toolSessions, setToolSessions] = useState<Record<string, any>>({});

  const renderToolWorkspace = () => {
    switch (selectedTool) {
      case 'evidence':
        return <EvidenceTool
          councilData={councilData}
          prompts={prompts}
          {...(initialProps.evidence || {})}
          initialCards={toolSessions.evidence?.cards}
          initialQuery={toolSessions.evidence?.query || initialProps.evidence?.initialQuery}
          initialTopics={toolSessions.evidence?.selectedTopics || initialProps.evidence?.initialTopics || sidebarTopics}
          autoRun={initialProps.evidence?.autoRun && !toolSessions.evidence}
          selectedTopicsOverride={sidebarTopics.length ? sidebarTopics : undefined}
          onToggleTopicOverride={(id)=>setSidebarTopics(prev=> prev.includes(id)? prev.filter(t=>t!==id): [...prev,id])}
          onSessionChange={(session)=> setToolSessions(s=> ({ ...s, evidence: session }))}
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
          onSessionChange={(session)=> setToolSessions(s=> ({ ...s, vision: session }))}
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
          onSessionChange={(session)=> setToolSessions(s=> ({ ...s, policy: session }))}
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
          onSessionChange={(session)=> setToolSessions(s=> ({ ...s, strategy: session }))}
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
          onSessionChange={(session)=> setToolSessions(s=> ({ ...s, sites: session }))}
        />;
      case 'feedback':
        return <FeedbackAnalysisTool
          prompts={prompts}
          {...(initialProps.feedback || {})}
          initialText={toolSessions.feedback?.consultationText || initialProps.feedback?.initialText}
          initialThemes={toolSessions.feedback?.themes || initialProps.feedback?.initialThemes}
          autoRun={initialProps.feedback?.autoRun && !toolSessions.feedback}
          onSessionChange={(session)=> setToolSessions(s=> ({ ...s, feedback: session }))}
        />;
      case 'sea':
        return <SEATool councilData={councilData} autoRun={initialProps.sea?.autoRun} initialData={initialProps.sea?.prefill} onSaved={() => { /* noop */ }} />;
      case 'sci':
        return <SCITool councilData={councilData} autoRun={initialProps.sci?.autoRun} initialData={initialProps.sci?.prefill} onSaved={() => { /* noop */ }} />;
      default:
        return null;
    }
  };

  const regexAutoPick = (text: string): ToolId => {
    const q = text.toLowerCase();
    if (q.match(/vision|concept|image|diagram|visual/)) return 'vision';
    if (q.match(/policy|draft|wording|compliance/)) return 'policy';
    if (q.match(/strategy|scenario|compare|future/)) return 'strategy';
    if (q.match(/site|allocation|address|parcel|boundary/)) return 'sites';
    if (q.match(/feedback|consultation|responses|comments|survey/)) return 'feedback';
    return 'evidence';
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Header */}
      <div className="bg-[var(--color-panel)] border-b border-[var(--color-edge)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-[var(--color-accent)] hover:underline text-sm"
              >
                ← Back to Selection
              </button>
              <div className="h-6 w-px bg-[var(--color-edge)]" />
              <div>
                <h1 className="text-xl font-bold text-[var(--color-ink)]">
                  Welcome to The Planner's Assistant
                </h1>
                <p className="text-sm text-[var(--color-muted)]">
                  Your comprehensive toolkit for modern urban and regional planning. Select a tool below to get started.
                </p>
              </div>
            </div>
            {/* Timetable summary at top */}
            <div className="flex items-center gap-3">
              {getActiveForCouncil(councilData.id) ? (
                <div className="text-right">
                  <div className="text-xs text-[var(--color-muted)]">Local Plan Timetable</div>
                  <div className="text-sm text-[var(--color-ink)]">
                    {getActiveForCouncil(councilData.id)!.timetable?.noticeToCommenceDate
                      ? `Notice: ${new Date(getActiveForCouncil(councilData.id)!.timetable.noticeToCommenceDate!).toLocaleDateString()}`
                      : 'Notice: not set'}
                    {' • '}
                    {getActiveForCouncil(councilData.id)!.stages
                      .filter(s=>s.targetDate)
                      .slice(0,3)
                      .map(s=>`${s.title}: ${new Date(s.targetDate!).toLocaleDateString()}`)
                      .join(' • ')}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[var(--color-muted)]">Timetable: current (no plan in progress)</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-4">
        <AnimatePresence mode="wait">
          {!selectedTool ? (
            <motion.div key="plan-hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {getActiveForCouncil(councilData.id) ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left: Timeline clickable */}
                  <div className="lg:col-span-3 lg:sticky lg:top-16 max-h-[calc(100vh-160px)] overflow-auto">
                    <PlanTimeline
                      plan={getActiveForCouncil(councilData.id)!}
                      onSelectStage={(sid: string) => setPlanStage(getActiveForCouncil(councilData.id)!.id, sid as any)}
                    />
                  </div>
                  {/* Center: Current Stage Panel */}
                  <div className="lg:col-span-6 max-h-[calc(100vh-180px)] overflow-auto">
                    <CurrentStagePanel
                      councilData={councilData}
                      showAllTools={() => setShowAllTools(true)}
                      onOpenTool={(toolId, ctx) => {
                        // Map meta tool IDs to existing tool IDs
                        const map: Record<string, ToolId> = {
                          EvidenceTool: 'evidence',
                          VisionConceptsTool: 'vision',
                          PolicyDrafterTool: 'policy',
                          StrategyModelerTool: 'strategy',
                          SiteAssessmentTool: 'sites',
                          FeedbackAnalysisTool: 'feedback',
                          SEATool: 'sea',
                          SCITool: 'sci',
                        }
                        const picked = map[toolId]
                        if (!picked) return
                        // Request LLM-suggested prefills for the chosen tool and open it
                        ;(async () => {
                          try {
                            const plan = getActiveForCouncil(councilData.id)
                            const suggested = plan ? await suggestToolPrefill(picked, plan, plan.planStage) : undefined
                            if (picked === 'sea') setInitialProps({ sea: { autoRun: true, prefill: suggested } } as any)
                            else if (picked === 'sci') setInitialProps({ sci: { autoRun: true, prefill: suggested } } as any)
                            else setInitialProps({ [picked]: { autoRun: true, ...(suggested ? { prefill: suggested } : {}) } } as any)
                          } catch (e) {
                            setInitialProps({ [picked]: { autoRun: true } } as any)
                          } finally {
                            setSelectedTool(picked)
                          }
                        })()
                      }}
                    />
                  </div>
                  {/* Right: Context Sidebar */}
                  <aside className="lg:col-span-3 lg:sticky lg:top-16 max-h-[calc(100vh-160px)] overflow-auto">
                    <ContextSidebar
                      councilData={councilData}
                      selectedTopics={sidebarTopics}
                      onToggleTopic={(id)=>setSidebarTopics(prev=> prev.includes(id)? prev.filter(t=>t!==id): [...prev,id])}
                      onBackToTools={() => setSelectedTool(null)}
                    />
                  </aside>
                </div>
              ) : (
                <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6 lg:sticky lg:bottom-0">
                  <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2">Create a Plan</h3>
                  <p className="text-sm text-[var(--color-muted)] mb-4">Start a 30‑month Local Plan for {councilData.name}. We'll set up your timetable and workflow.</p>
                  <button
                    className="px-3 py-2 bg-[var(--color-accent)] text-white rounded"
                    onClick={async ()=>{
                      setCreating(true);
                      const plan = createPlan({ title: 'New Local Plan', area: councilData.name, systemType: 'new', councilId: councilData.id });
                      try {
                        const tt = await suggestTimetable(councilData.name, councilData.name);
                        const stageTargets = (tt?.milestones || []).reduce((acc: Record<string,string>, m: any) => { acc[m.stageId] = m.date; return acc; }, {})
                        const stages = plan.stages.map(s => ({ ...s, targetDate: stageTargets[s.id] }))
                        updatePlan(plan.id, { timetable: tt, stages, planStage: STAGES[0].id } as any);
                        setActiveForCouncil(councilData.id, plan.id)
                      } catch (e) {
                        console.warn('Timetable suggestion failed', e);
                      } finally {
                        setCreating(false);
                      }
                    }}
                    disabled={creating}
                  >{creating ? 'Creating…' : 'Create New Plan'}</button>
                </div>
              )}
              <AllToolsDrawer open={showAllTools} onClose={()=>setShowAllTools(false)} onOpenTool={(id)=>{
                const map: Record<string, ToolId> = {
                  EvidenceTool: 'evidence',
                  VisionConceptsTool: 'vision',
                  PolicyDrafterTool: 'policy',
                  StrategyModelerTool: 'strategy',
                  SiteAssessmentTool: 'sites',
                  FeedbackAnalysisTool: 'feedback',
                  SEATool: 'sea',
                  SCITool: 'sci',
                }
                const picked = map[id]
                if (!picked) return
                ;(async () => {
                  try {
                    const plan = getActiveForCouncil(councilData.id)
                    const suggested = plan ? await suggestToolPrefill(picked, plan, plan.planStage) : undefined
                    if (picked === 'sea') setInitialProps({ sea: { autoRun: true, prefill: suggested } } as any)
                    else if (picked === 'sci') setInitialProps({ sci: { autoRun: true, prefill: suggested } } as any)
                    else setInitialProps({ [picked]: { autoRun: true, ...(suggested ? { prefill: suggested } : {}) } } as any)
                  } catch (e) {
                    setInitialProps({ [picked]: { autoRun: true } } as any)
                  } finally {
                    setSelectedTool(picked)
                    setShowAllTools(false)
                  }
                })()
              }} />
            </motion.div>
          ) : (
            <motion.div
              key={`tool-${selectedTool}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button
                onClick={() => setSelectedTool(null)}
                className="mb-6 text-[var(--color-accent)] hover:underline text-sm"
              >
                ← Back to Tools
              </button>
              <PlanningWorkspaceLayout
                councilId={councilData.id}
                context={<ContextSidebar councilData={councilData} selectedTopics={sidebarTopics} onToggleTopic={(id)=>setSidebarTopics(prev=> prev.includes(id)? prev.filter(t=>t!==id): [...prev,id])} onBackToTools={() => setSelectedTool(null)} />}
                workspace={renderToolWorkspace()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
