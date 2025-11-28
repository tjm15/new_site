import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData } from '../../../data/types';
import { getPrompts } from '../../../prompts';
import { EvidenceTool } from './tools/EvidenceTool';
import { VisionConceptsTool } from './tools/VisionConceptsTool';
import { PolicyDrafterTool } from './tools/PolicyDrafterTool';
import { StrategyModelerTool } from './tools/StrategyModelerTool';
import { SiteAssessmentTool } from './tools/SiteAssessmentTool';
import { FeedbackAnalysisTool } from './tools/FeedbackAnalysisTool';
import { PlanningWorkspaceLayout } from '../../../components/PlanningWorkspaceLayout';
import { ContextSidebar } from '../../../components/ContextSidebar';
import { classifyTool, classifyTopics, inferSiteId } from '../../../utils/classifier';

interface SpatialPlanDemoProps {
  councilData: CouncilData;
  onBack: () => void;
}

type ToolId = 'evidence' | 'vision' | 'policy' | 'strategy' | 'sites' | 'feedback';

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

export const SpatialPlanDemo: React.FC<SpatialPlanDemoProps> = ({ councilData, onBack }) => {
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null);
  const prompts = getPrompts(councilData.id, 'spatial');
  const [question, setQuestion] = useState('');
  const [autoRunning, setAutoRunning] = useState(false);
  const [sidebarTopics, setSidebarTopics] = useState<string[]>([]);
  // Handoff props for initial autorun per tool
  const [initialProps, setInitialProps] = useState<{
    evidence?: { initialQuery?: string; initialTopics?: string[]; initialCards?: { title: string; content: string; question?: string }[]; autoRun?: boolean };
    policy?: { initialTopic?: string; initialBrief?: string; initialDraftPolicy?: string; initialVariants?: string[]; autoRun?: boolean };
    vision?: { initialArea?: string; initialVisionText?: string; initialHighlightsText?: string; initialConceptImage?: string; autoRun?: boolean };
    strategy?: { initialStrategyId?: string; initialAnalysis?: string; initialMetrics?: { totalSites: number; totalCapacity: number } | null; autoRun?: boolean };
    sites?: { initialSiteId?: string; initialAppraisal?: string; initialDetails?: { constraints?: string[]; opportunities?: string[]; policies?: string[] } | null; autoRun?: boolean };
    feedback?: { initialText?: string; initialThemes?: any[]; autoRun?: boolean };
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
    <div className="min-h-screen bg-[color:var(--surface)]">
      {/* Header */}
      <div className="bg-[color:var(--panel)] border-b border-[color:var(--edge)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-[color:var(--accent)] hover:underline text-sm"
              >
                ← Back to Selection
              </button>
              <div className="h-6 w-px bg-[color:var(--edge)]" />
              <div>
                <h1 className="text-xl font-bold text-[color:var(--ink)]">
                  Welcome to The Planner's Assistant
                </h1>
                <p className="text-sm text-[color:var(--muted)]">
                  Your comprehensive toolkit for modern urban and regional planning. Select a tool below to get started.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {!selectedTool ? (
            <motion.div
              key="tool-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-[color:var(--ink)] mb-2">Select a Tool</h2>
                <p className="text-[color:var(--muted)]">Choose from 6 AI-powered tools to assist with spatial plan development</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TOOLS.map((tool) => (
                  <motion.button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    whileHover={{ y: -5 }}
                    className="text-left bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-6 hover:border-[color:var(--accent)] transition-all hover:shadow-lg"
                  >
                    <div className="text-4xl mb-3">{tool.icon}</div>
                    <h3 className="text-lg font-semibold text-[color:var(--ink)] mb-2">
                      {tool.label}
                    </h3>
                    <p className="text-sm text-[color:var(--muted)]">
                      {tool.description}
                    </p>
                  </motion.button>
                ))}
              </div>

              {/* Ask a question */}
              <div className="mt-8 bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-6">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[color:var(--ink)]">Or ask a question… (we'll pick the best tool)</h3>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., How many affordable homes are planned in the area?"
                    className="flex-1 px-4 py-2 bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg text-[color:var(--ink)] placeholder-[color:var(--muted)]"
                  />
                  <button
                    onClick={async () => {
                      if (!question.trim()) return;
                      setAutoRunning(true);
                      // Try classifier; fallback to regex while model loads
                      let picked: ToolId = regexAutoPick(question);
                      try {
                        picked = await classifyTool(question);
                      } catch {}

                      const nextInitial: typeof initialProps = {};
                      if (picked === 'evidence') {
                        const topics = await classifyTopics(question, councilData).catch(() => []);
                        nextInitial.evidence = { initialQuery: question, initialTopics: topics, autoRun: true };
                      } else if (picked === 'policy') {
                        // Infer topic if possible
                        const topics = await classifyTopics(question, councilData).catch(() => []);
                        nextInitial.policy = { initialTopic: topics[0], initialBrief: question, autoRun: true };
                      } else if (picked === 'vision') {
                        nextInitial.vision = { initialArea: question, autoRun: true };
                      } else if (picked === 'sites') {
                        const siteId = inferSiteId(question, councilData);
                        nextInitial.sites = { initialSiteId: siteId || undefined, autoRun: true };
                      } else if (picked === 'feedback') {
                        nextInitial.feedback = { initialText: question, autoRun: true };
                      } else if (picked === 'strategy') {
                        nextInitial.strategy = { initialStrategyId: councilData.strategies?.[0]?.id, autoRun: true };
                      }
                      setInitialProps(nextInitial);
                      setSelectedTool(picked);
                      setAutoRunning(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-[color:var(--brand)] text-[color:var(--ink)] font-semibold"
                  >
                    {autoRunning ? 'Working…' : 'Ask'}
                  </button>
                </div>
                <p className="text-xs text-[color:var(--muted)] mt-3">We'll auto-pick a tool and run it for you.</p>
                {/* Example quick asks */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    'How many affordable homes are planned in the area?',
                    'Draft a climate resilience policy for town centres',
                    'Summarise transport constraints in the plan',
                    'Appraise Site A23 and list constraints',
                    'Analyze consultation comments about tall buildings'
                  ].map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setQuestion(ex)}
                      className="px-3 py-1.5 rounded-full bg-[color:var(--panel)] border border-[color:var(--edge)] text-xs text-[color:var(--muted)] hover:text-[color:var(--ink)]"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
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
                className="mb-6 text-[color:var(--accent)] hover:underline text-sm"
              >
                ← Back to Tools
              </button>
              <PlanningWorkspaceLayout
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
