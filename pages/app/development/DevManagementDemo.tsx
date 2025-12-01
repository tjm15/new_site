import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CouncilData, PlanningApplication } from '../../../data/types';
import { getPrompts } from '../../../prompts';
import { callLLM } from '../../../utils/llmClient';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MarkdownContent } from '../../../components/MarkdownContent';
import { getGeoLayerSet, type GeoLayerSet } from '../../../data/geojsonLayers';
import { MapLibreFrame } from '../../../components/MapLibreFrame';

type StageId = 'overview' | 'documents' | 'context' | 'reasoning' | 'conditions' | 'decision' | 'audit';
type StageStatus = 'not-started' | 'in-progress' | 'complete';

type ReasoningCard = {
  id: string;
  lane: 'benefit' | 'neutral' | 'harm';
  title: string;
  text: string;
  topic: string;
  policies: string[];
  confidence: number;
};

type ConditionRow = {
  id: string;
  title: string;
  trigger: string;
  hook: string;
  origin: 'ai' | 'officer';
  status: 'suggested' | 'accepted' | 'draft';
};

type ObligationRow = {
  id: string;
  title: string;
  value: string;
  basis: string;
  origin: 'ai' | 'officer';
  status: 'suggested' | 'accepted' | 'draft';
};

type AuditEvent = {
  id: string;
  stage: StageId | 'workspace';
  label: string;
  timestamp: string;
};

const STAGES: { id: StageId; label: string; hint: string }[] = [
  { id: 'overview', label: 'Overview', hint: 'Validation + early risks' },
  { id: 'documents', label: 'Documents', hint: 'Statements, plans, overlays' },
  { id: 'context', label: 'Context', hint: 'Map, constraints, policy' },
  { id: 'reasoning', label: 'Reasoning', hint: 'Themes, harms, benefits' },
  { id: 'conditions', label: 'Conditions & S106', hint: 'Draft and accept' },
  { id: 'decision', label: 'Decision & Report', hint: 'Outcome + draft report' },
  { id: 'audit', label: 'Audit', hint: 'AI trace & export' }
];

const DOCUMENT_FILTERS = ['All', 'Statements', 'Plans', 'Technical', 'Other'] as const;
type DocumentFilter = (typeof DOCUMENT_FILTERS)[number];

const REPORT_SECTIONS = ['Summary', 'Site & Context', 'Policy', 'Assessment', 'Balance', 'Conclusion', 'Conditions/S106'];

const nowIso = () => new Date().toISOString();

function friendlyTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function deriveOverlayColor(status: StageStatus) {
  if (status === 'complete') return 'bg-emerald-500';
  if (status === 'in-progress') return 'bg-amber-500';
  return 'bg-gray-400';
}

const FALLBACK_LAYERS: GeoLayerSet = {
  outline: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Demo area' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-0.16, 51.55],
              [-0.12, 51.55],
              [-0.12, 51.53],
              [-0.16, 51.53],
              [-0.16, 51.55]
            ]
          ]
        }
      }
    ]
  },
  constraints: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { id: 'heritage', label: 'Conservation setting' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-0.155, 51.548],
              [-0.135, 51.548],
              [-0.135, 51.538],
              [-0.155, 51.538],
              [-0.155, 51.548]
            ]
          ]
        }
      }
    ]
  },
  allocations: {
    type: 'FeatureCollection',
    features: []
  },
  centres: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Town centre' }, geometry: { type: 'Point', coordinates: [-0.145, 51.54] } }
    ]
  }
};

function seedReasoningCards(reasoning: string): ReasoningCard[] {
  const lines = reasoning
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, 7);

  if (!lines.length) {
    return [
      { id: 'seed-1', lane: 'neutral', title: 'Principle', text: 'Major town centre mixed-use scheme requires strong housing and retail justification.', topic: 'Principle', policies: ['DS1', 'H1'], confidence: 0.62 },
      { id: 'seed-2', lane: 'benefit', title: 'Affordable housing', text: '50% affordable offer with family units meets local priorities.', topic: 'Housing', policies: ['H4'], confidence: 0.71 },
      { id: 'seed-3', lane: 'harm', title: 'Design & heritage', text: 'Height at nine storeys may erode conservation area setting unless stepped massing mitigates.', topic: 'Design', policies: ['D2', 'D4'], confidence: 0.54 }
    ];
  }

  return lines.map((line, idx) => {
    const lower = line.toLowerCase();
    const lane: ReasoningCard['lane'] =
      lower.includes('harm') || lower.includes('conflict') ? 'harm' :
      lower.includes('benefit') || lower.includes('support') || lower.includes('complies') ? 'benefit' :
      'neutral';

    const topic =
      lower.includes('design') ? 'Design & Amenity' :
      lower.includes('transport') || lower.includes('highway') ? 'Transport' :
      lower.includes('heritage') ? 'Heritage' :
      lower.includes('flood') || lower.includes('climate') ? 'Environment' :
      lower.includes('principle') ? 'Principle' :
      'Assessment';

    const cleanText = line.replace(/^\d+[\).]/, '').trim();

    return {
      id: `reason-${idx}`,
      lane,
      title: topic,
      text: cleanText,
      topic,
      policies: [],
      confidence: 0.48 + (idx % 3) * 0.1
    };
  });
}

function buildSiteFeature(layers: GeoLayerSet) {
  const centre = layers.centres?.features?.[0]?.geometry?.type === 'Point'
    ? (layers.centres.features[0].geometry as any).coordinates as [number, number]
    : [-0.142, 51.542];

  const [lng, lat] = centre;
  const delta = 0.0015;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Application site' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [lng - delta, lat + delta],
              [lng + delta, lat + delta],
              [lng + delta, lat - delta],
              [lng - delta, lat - delta],
              [lng - delta, lat + delta]
            ]
          ]
        }
      }
    ]
  };
}

function seedConditions(): ConditionRow[] {
  return [
    { id: 'c1', title: 'Materials samples (brick, precast, metalwork)', trigger: 'Pre-commencement', hook: 'Policy D1 / D2', origin: 'ai', status: 'suggested' },
    { id: 'c2', title: 'Construction Logistics Plan', trigger: 'Pre-commencement', hook: 'Policy T1', origin: 'ai', status: 'accepted' },
    { id: 'c3', title: 'Energy strategy update to reflect ASHP + PV', trigger: 'Pre-occupation', hook: 'Policy CC1', origin: 'officer', status: 'draft' },
    { id: 'c4', title: 'Archaeological watching brief', trigger: 'During works', hook: 'NPPF 205', origin: 'ai', status: 'suggested' }
  ];
}

function seedObligations(): ObligationRow[] {
  return [
    { id: 's1', title: 'Affordable housing (26 units, 60% SR / 40% Intermediate)', value: 'In-kind', basis: 'Policy H4 + viability', origin: 'officer', status: 'accepted' },
    { id: 's2', title: 'Transport contribution for cycle network upgrades', value: '£52,000', basis: 'Policy T1 / DSP', origin: 'ai', status: 'suggested' },
    { id: 's3', title: 'Local employment & apprenticeships', value: 'Obligation', basis: 'Planning Statement offer', origin: 'ai', status: 'draft' },
    { id: 's4', title: 'Travel plan monitoring', value: '£6,000', basis: 'Condition 106 template', origin: 'officer', status: 'accepted' }
  ];
}

interface DevManagementDemoProps {
  councilData: CouncilData;
  onBack: () => void;
}

export const DevManagementDemo: React.FC<DevManagementDemoProps> = ({ councilData, onBack }) => {
  const [selectedApplication, setSelectedApplication] = useState<PlanningApplication | null>(null);
  const [activeStage, setActiveStage] = useState<StageId>('overview');
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>('All');
  const [selectedDoc, setSelectedDoc] = useState<number>(0);
  const [overlayLayers, setOverlayLayers] = useState<string[]>(['Key claims', 'Policy references']);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [contextAnalysis, setContextAnalysis] = useState<string>('');
  const [reasoningCards, setReasoningCards] = useState<ReasoningCard[]>(seedReasoningCards(''));
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [conditions, setConditions] = useState<ConditionRow[]>(seedConditions());
  const [obligations, setObligations] = useState<ObligationRow[]>(seedObligations());
  const [report, setReport] = useState<string>('');
  const [reportSections, setReportSections] = useState<Record<string, string>>({});
  const [decisionOutcome, setDecisionOutcome] = useState<string>('Approve (delegated)');
  const [decisionSummary, setDecisionSummary] = useState<string>('Major mixed-use scheme in town centre with strong affordable housing offer; design height risk to be mitigated.');
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [askText, setAskText] = useState<string>('');
  const [copilotAnswer, setCopilotAnswer] = useState<string>('');
  const [copilotError, setCopilotError] = useState<string | null>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const geoLayers = useMemo<GeoLayerSet>(() => getGeoLayerSet(councilData.id) || FALLBACK_LAYERS, [councilData.id]);
  const siteLayer = useMemo(() => buildSiteFeature(geoLayers), [geoLayers]);
  const combinedLayers: GeoLayerSet = useMemo(() => {
    const constraintWithSite = {
      type: 'FeatureCollection',
      features: [
        ...(geoLayers.constraints?.features || []),
        ...(siteLayer.features || [])
      ]
    };
    return {
      outline: geoLayers.outline,
      constraints: constraintWithSite,
      allocations: geoLayers.allocations,
      centres: geoLayers.centres
    };
  }, [geoLayers, siteLayer]);

  const prompts = getPrompts(councilData.id, 'development', councilData.name);

  const resetWorkspace = () => {
    setActiveStage('overview');
    setDocumentFilter('All');
    setSelectedDoc(0);
    setOverlayLayers(['Key claims', 'Policy references']);
    setExtractedData(null);
    setContextAnalysis('');
    setReasoningCards(seedReasoningCards(''));
    setSelectedCardId(null);
    setConditions(seedConditions());
    setObligations(seedObligations());
    setReport('');
    setReportSections({});
    setDecisionOutcome('Approve (delegated)');
    setDecisionSummary('Major mixed-use scheme in town centre with strong affordable housing offer; design height risk to be mitigated.');
    setAuditLog([]);
    setAskText('');
    setCopilotAnswer('');
    setCopilotError(null);
    setCopilotLoading(false);
  };

  const handleSelectApplication = (app: PlanningApplication) => {
    setSelectedApplication(app);
    resetWorkspace();
    setAuditLog([{ id: `audit-${Date.now()}`, stage: 'workspace', label: `Workspace created for ${app.reference}`, timestamp: nowIso() }]);
  };

  const selectedDocuments = useMemo(() => {
    if (!selectedApplication) return [];
    if (documentFilter === 'All') return selectedApplication.documents;
    if (documentFilter === 'Statements') return selectedApplication.documents.filter(d => d.type.toLowerCase().includes('statement'));
    if (documentFilter === 'Plans') return selectedApplication.documents.filter(d => d.type.toLowerCase().includes('plan'));
    if (documentFilter === 'Technical') return selectedApplication.documents.filter(d => ['transport', 'flood', 'viability', 'ecology'].some(k => d.type.toLowerCase().includes(k)));
    return selectedApplication.documents.filter(d => !['statement', 'plan', 'design', 'transport', 'heritage'].some(k => d.type.toLowerCase().includes(k)));
  }, [selectedApplication, documentFilter]);

  const activeDocument = selectedDocuments[selectedDoc] || selectedDocuments[0];

  const stageStatus: Record<StageId, StageStatus> = useMemo(() => {
    const hasExtraction = !!extractedData;
    const hasContext = !!contextAnalysis;
    const hasReasoning = reasoningCards.length > 0;
    const hasConditions = conditions.some(c => c.status === 'accepted') || obligations.some(o => o.status === 'accepted');
    const hasReport = !!report;
    return {
      overview: hasExtraction ? 'complete' : 'in-progress',
      documents: activeDocument ? 'in-progress' : 'not-started',
      context: hasContext ? 'complete' : hasExtraction ? 'in-progress' : 'not-started',
      reasoning: hasReasoning ? 'complete' : 'not-started',
      conditions: hasConditions ? 'complete' : 'in-progress',
      decision: hasReport ? 'complete' : 'in-progress',
      audit: auditLog.length > 1 ? 'in-progress' : 'not-started'
    };
  }, [extractedData, contextAnalysis, reasoningCards, conditions, obligations, report, activeDocument, auditLog.length]);

  const stageConfidence = useMemo(() => ({
    overview: extractedData ? 0.8 : 0.45,
    documents: 0.6,
    context: contextAnalysis ? 0.78 : 0.52,
    reasoning: reasoningCards.length ? 0.74 : 0.4,
    conditions: conditions.length ? 0.63 : 0.35,
    decision: report ? 0.68 : 0.4,
    audit: 0.55
  }), [extractedData, contextAnalysis, reasoningCards.length, conditions.length, report]);

  const timeSaved = {
    overview: '~22 mins saved',
    documents: '~18 mins saved',
    context: '~15 mins saved',
    reasoning: '~30 mins saved',
    conditions: '~12 mins saved',
    decision: '~28 mins saved',
    audit: '~5 mins saved'
  };

  const baselineExtraction = useMemo(() => {
    if (!selectedApplication) return null;
    return {
      siteBoundary: selectedApplication.siteBoundary || 'Boundary red line pending GIS sync.',
      applicablePolicies: selectedApplication.applicablePolicies || [],
      keyConstraints: selectedApplication.keyConstraints || []
    };
  }, [selectedApplication]);

  // Map rendering is handled by MapLibreFrame; no manual lifecycle needed here.

  const addAudit = (label: string, stage: StageId) => {
    setAuditLog(prev => [{ id: `audit-${Date.now()}`, stage, label, timestamp: nowIso() }, ...prev]);
  };

  const runExtraction = async () => {
    if (!selectedApplication) return;
    setLoadingKey('extract');
    try {
      const prompt = prompts.intakePrompt(selectedApplication.documents);
      const res = await callLLM(prompt);
      let parsed;
      try {
        parsed = JSON.parse(res || '{}');
      } catch {
        parsed = baselineExtraction || {};
      }
      setExtractedData({ ...(baselineExtraction || {}), ...parsed });
      addAudit('Ran augmented validation & auto-extraction', 'overview');
    } catch (e) {
      setExtractedData(baselineExtraction);
    } finally {
      setLoadingKey(null);
    }
  };

  const generateContext = async () => {
    if (!selectedApplication) return;
    setLoadingKey('context');
    try {
      const prompt = prompts.contextPrompt(selectedApplication);
      const res = await callLLM(prompt);
      setContextAnalysis(res || 'No context generated.');
      addAudit('Generated AI context narrative', 'context');
    } catch (e) {
      setContextAnalysis('Context generation failed; using placeholder narrative.');
    } finally {
      setLoadingKey(null);
    }
  };

  const generateReasoning = async () => {
    if (!selectedApplication) return;
    setLoadingKey('reasoning');
    try {
      const prompt = prompts.reasoningPrompt(selectedApplication, contextAnalysis || extractedData || '');
      const res = await callLLM(prompt);
      const next = seedReasoningCards(res || '');
      setReasoningCards(next);
      setSelectedCardId(next[0]?.id || null);
      addAudit('Reasoning board generated', 'reasoning');
    } catch (e) {
      const fallback = seedReasoningCards('');
      setReasoningCards(fallback);
      setSelectedCardId(fallback[0]?.id || null);
    } finally {
      setLoadingKey(null);
    }
  };

  const generateReport = async () => {
    if (!selectedApplication) return;
    setLoadingKey('report');
    try {
      const prompt = prompts.reportPrompt(selectedApplication, { extractedData, contextAnalysis, reasoningChain: reasoningCards });
      const res = await callLLM(prompt);
      setReport(res || 'No report generated.');
      const derivedSections: Record<string, string> = {};
      REPORT_SECTIONS.forEach(section => {
        const marker = new RegExp(`\\b${section}`, 'i');
        const match = res?.split('\n').find(line => marker.test(line));
        derivedSections[section] = match ? res.substring(res.indexOf(match)) : res || 'Draft pending.';
      });
      setReportSections(derivedSections);
      addAudit('Report drafted with AI assistance', 'decision');
    } catch (e) {
      setReport('Report drafting failed; try again.');
      setReportSections({});
    } finally {
      setLoadingKey(null);
    }
  };

  const handleAskCopilot = async () => {
    if (!askText.trim() || !selectedApplication) return;
    setCopilotLoading(true);
    setCopilotError(null);
    const reasoningSummary = reasoningCards.map(c => `${c.lane}: ${c.text}`).join(' | ');
    const conditionsSummary = conditions.map(c => `${c.title} (${c.status})`).join('; ');
    const stageContext = {
      stage: activeStage,
      decision: decisionOutcome,
      summary: decisionSummary,
      extractedData: extractedData || baselineExtraction,
      contextAnalysis: contextAnalysis?.slice(0, 500),
      document: activeDocument ? { title: activeDocument.title, type: activeDocument.type } : null,
      reasoning: reasoningSummary,
      conditions: conditionsSummary
    };
    const prompt = [
      `You are the AI copilot inside a planning Decision Workspace for ${councilData.name}.`,
      `Stage: ${activeStage}`,
      `Application: ${selectedApplication.reference} — ${selectedApplication.description}`,
      `Officer mode: AI suggestions should be concise, cite policies where possible, and respect evidence-only grounding.`,
      `Context snapshot: ${JSON.stringify(stageContext, null, 2)}`,
      `User question: ${askText}`,
      `Respond with helpful, stage-appropriate bullets. Make it short and ready to paste.`
    ].join('\n');
    try {
      const res = await callLLM(prompt);
      setCopilotAnswer(res || 'No response received.');
      addAudit(`Copilot asked: ${askText.slice(0, 60)}${askText.length > 60 ? '…' : ''}`, activeStage);
    } catch (e: any) {
      setCopilotError(e?.message || 'Unable to reach copilot.');
    } finally {
      setCopilotLoading(false);
    }
  };

  const moveCard = (id: string, lane: ReasoningCard['lane']) => {
    setReasoningCards(prev => prev.map(card => card.id === id ? { ...card, lane } : card));
  };

  const toggleConditionStatus = (id: string) => {
    setConditions(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nextStatus = c.status === 'accepted' ? 'draft' : 'accepted';
      return { ...c, status: nextStatus };
    }));
  };

  const toggleObligationStatus = (id: string) => {
    setObligations(prev => prev.map(o => {
      if (o.id !== id) return o;
      const nextStatus = o.status === 'accepted' ? 'draft' : 'accepted';
      return { ...o, status: nextStatus };
    }));
  };

  const toggleOverlay = (layer: string) => {
    setOverlayLayers(prev => prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]);
  };

  const balanceScore = useMemo(() => {
    const benefit = reasoningCards.filter(c => c.lane === 'benefit').length;
    const harm = reasoningCards.filter(c => c.lane === 'harm').length;
    const neutral = reasoningCards.filter(c => c.lane === 'neutral').length || 1;
    return (benefit - harm) / (benefit + harm + neutral);
  }, [reasoningCards]);

  const copilotPrompts: Record<StageId, string[]> = {
    overview: ['Summarise proposal in 3 lines', 'List likely statutory consultees', 'Highlight any obvious validation issues'],
    documents: ['Summarise this document', 'Extract commitments (units/heights/parking)', 'Find contradictions across statements'],
    context: ['Highlight constraints that imply refusal risk', 'Generate bullet list for Site & Context section', 'Which policies are missing?'],
    reasoning: ['Generate initial set of themes', 'Stress-test this reasoning from an appellant’s view', 'What would a refusal on design need?'],
    conditions: ['Generate conditions from reasoning + constraints', 'Flag any risky conditions under NPPF tests', 'Summarise S106 heads of terms'],
    decision: ['Regenerate this section in officer tone', 'Explain which parts depend on AI inference', 'Draft committee presentation bullets'],
    audit: ['Summarise how AI was used for FOI response', 'List AI-sourced statements affecting outcome', 'Export audit trace']
  };

  const quickContextCards = [
    { label: 'Flood', color: 'bg-amber-100 text-amber-700', count: 1 },
    { label: 'Heritage', color: 'bg-red-100 text-red-700', count: 2 },
    { label: 'Transport', color: 'bg-emerald-100 text-emerald-700', count: 1 },
    { label: 'Neighbour amenity', color: 'bg-amber-100 text-amber-700', count: 2 }
  ];

  const renderOverview = () => {
    const docTypes = (selectedApplication?.documents || []).map(d => d.type.toLowerCase());
    const validationChecklist = [
      { label: 'Application form', status: 'received' },
      { label: 'Red line location plan', status: docTypes.some(d => d.includes('plan')) ? 'received' : 'missing' },
      { label: 'Design & Access Statement', status: docTypes.some(d => d.includes('design')) ? 'received' : 'ai-flag' },
      { label: 'Heritage Statement', status: docTypes.some(d => d.includes('heritage')) ? 'received' : 'ai-flag' },
      { label: 'Transport Statement', status: docTypes.some(d => d.includes('transport')) ? 'received' : 'ai-flag' }
    ];
    const validationLegend: Record<string, { text: string; className: string }> = {
      received: { text: 'Received', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      missing: { text: 'Missing', className: 'bg-red-100 text-red-800 border-red-200' },
      'ai-flag': { text: 'AI suggests required', className: 'bg-amber-100 text-amber-800 border-amber-200' }
    };
    const extraction = extractedData || baselineExtraction || {};

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,1fr] gap-4">
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-1">Case header</div>
                <div className="text-xl font-semibold text-[var(--color-ink)]">{selectedApplication?.reference}</div>
                <div className="text-sm text-[var(--color-muted)]">{selectedApplication?.address}</div>
                <p className="text-sm text-[var(--color-ink)] mt-2">{selectedApplication?.description}</p>
                <div className="flex flex-wrap gap-2 mt-3 text-xs text-[var(--color-muted)]">
                  <span className="px-2 py-1 rounded-full border border-[var(--color-edge)] bg-[var(--color-surface)]">{selectedApplication?.applicationType}</span>
                  <span className="px-2 py-1 rounded-full border border-[var(--color-edge)] bg-[var(--color-surface)]">Applicant: {selectedApplication?.applicant}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase text-[var(--color-muted)]">Status</div>
                <div className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Ready for decision
                </div>
                <div className="text-xs text-[var(--color-muted)] mt-2">Audit trail live</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-[var(--color-muted)]">
              <button onClick={runExtraction} disabled={loadingKey === 'extract'} className="px-3 py-1.5 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)] text-[var(--color-ink)]">
                {loadingKey === 'extract' ? 'Running augmented validation…' : 'Run augmented validation'}
              </button>
              <span>Latest extraction</span>
              <span className="px-2 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-edge)]">{extraction.applicablePolicies?.length || 0} policies</span>
              <span className="px-2 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-edge)]">{extraction.keyConstraints?.length || 0} constraints</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[var(--color-panel)] to-[var(--color-surface)] border border-[var(--color-edge)] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-[var(--color-muted)] mb-1">Key Risks Snapshot</div>
                <div className="text-lg font-semibold text-[var(--color-ink)]">Flagged themes</div>
              </div>
              <div className="text-xs text-[var(--color-muted)]">Click to jump into Reasoning</div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {quickContextCards.map(card => (
                <button
                  key={card.label}
                  onClick={() => setActiveStage('reasoning')}
                  className={`px-3 py-2 rounded-lg border border-[var(--color-edge)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] text-sm flex items-center gap-2 ${card.color}`}
                >
                  <span className="h-2 w-2 rounded-full bg-current opacity-60" />
                  <span className="font-semibold">{card.label}</span>
                  <span className="text-xs opacity-70">{card.count} issues</span>
                </button>
              ))}
            </div>
            <div className="mt-4 text-xs text-[var(--color-muted)]">Powered by constraint + policy inference.</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,1fr] gap-4">
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-[var(--color-muted)]">Validation checklist</div>
                <div className="text-lg font-semibold text-[var(--color-ink)]">AI + officer blend</div>
              </div>
              <div className="text-xs text-[var(--color-muted)]">Officer ticks override AI</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {validationChecklist.map(item => (
                <div key={item.label} className="flex items-center justify-between gap-3 border border-[var(--color-edge)] rounded-lg px-3 py-2 bg-[var(--color-surface)]">
                  <div className="text-sm text-[var(--color-ink)]">{item.label}</div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${validationLegend[item.status].className}`}>{validationLegend[item.status].text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-[var(--color-muted)]">Extracted highlights</div>
                <div className="text-lg font-semibold text-[var(--color-ink)]">Proposal snapshot</div>
              </div>
              <button onClick={() => setActiveStage('documents')} className="text-xs text-[var(--color-accent)] underline">Open documents</button>
            </div>
            <div className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
              <div><span className="font-semibold text-[var(--color-ink)]">Policies: </span>{(extraction.applicablePolicies || []).slice(0, 4).join(', ') || 'AI will populate once extraction runs.'}</div>
              <div><span className="font-semibold text-[var(--color-ink)]">Constraints: </span>{(extraction.keyConstraints || []).slice(0, 3).join('; ') || 'None flagged yet.'}</div>
              <div className="flex gap-2 pt-2">
                <span className="text-[var(--color-accent)] text-xs px-2 py-1 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30">AI sourced</span>
                <span className="text-[var(--color-muted)] text-xs px-2 py-1 rounded-full border border-[var(--color-edge)] bg-[var(--color-surface)]">Officer editable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDocuments = () => {
    if (!selectedApplication) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase text-[var(--color-muted)]">Documents</div>
            <div className="text-lg font-semibold text-[var(--color-ink)]">Filter, skim, overlay</div>
          </div>
          <div className="flex gap-2">
            {DOCUMENT_FILTERS.map(filter => (
              <button
                key={filter}
                onClick={() => { setDocumentFilter(filter); setSelectedDoc(0); }}
                className={`px-3 py-1.5 rounded-full border text-sm ${documentFilter === filter ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-ink)]' : 'border-[var(--color-edge)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-4">
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-2 max-h-[700px] overflow-y-auto">
            {selectedDocuments.map((doc, idx) => (
              <button
                key={`${doc.title}-${idx}`}
                onClick={() => setSelectedDoc(idx)}
                className={`w-full text-left rounded-lg border px-3 py-3 transition-colors ${idx === selectedDoc ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]' : 'bg-[var(--color-surface)] border-[var(--color-edge)] hover:border-[var(--color-accent)]/50'}`}
              >
                <div className="text-sm font-semibold text-[var(--color-ink)]">{doc.title}</div>
                <div className="text-xs text-[var(--color-muted)]">{doc.type}</div>
              </button>
            ))}
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-[var(--color-muted)]">Document viewer</div>
                <div className="text-lg font-semibold text-[var(--color-ink)]">{activeDocument?.title}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Key claims', 'Policy references', 'Numbers & commitments', 'Design parameters'].map(layer => (
                  <button
                    key={layer}
                    onClick={() => toggleOverlay(layer)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border ${overlayLayers.includes(layer) ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-ink)]' : 'border-[var(--color-edge)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'}`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr),260px] gap-3">
              <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg p-3 max-h-[520px] overflow-y-auto text-sm text-[var(--color-muted)] prose prose-sm">
                {activeDocument ? <MarkdownContent content={activeDocument.content} /> : 'Select a document to view.'}
              </div>
              <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg p-3 space-y-3">
                <div className="text-xs uppercase text-[var(--color-muted)]">AI overlays</div>
                {overlayLayers.length === 0 && <div className="text-sm text-[var(--color-muted)]">Toggle overlays to surface AI insights.</div>}
                {overlayLayers.includes('Key claims') && (
                  <div className="p-2 rounded border border-[var(--color-edge)]">
                    <div className="text-xs text-[var(--color-muted)] mb-1">Key claims</div>
                    <div className="text-sm text-[var(--color-ink)]">Applicant states scheme delivers 50% affordable (60% SR) and activates district centre frontage.</div>
                  </div>
                )}
                {overlayLayers.includes('Policy references') && (
                  <div className="p-2 rounded border border-[var(--color-edge)]">
                    <div className="text-xs text-[var(--color-muted)] mb-1">Policy references</div>
                    <div className="text-sm text-[var(--color-ink)]">H4 affordable housing; D2 tall buildings; T1 sustainable transport; CC1 climate.</div>
                  </div>
                )}
                {overlayLayers.includes('Numbers & commitments') && (
                  <div className="p-2 rounded border border-[var(--color-edge)]">
                    <div className="text-xs text-[var(--color-muted)] mb-1">Numbers & commitments</div>
                    <div className="text-sm text-[var(--color-ink)]">52 homes; 104 cycle spaces; 0 car parking except 2 Blue Badge; 150sqm roof terrace.</div>
                  </div>
                )}
                {overlayLayers.includes('Design parameters') && (
                  <div className="p-2 rounded border border-[var(--color-edge)]">
                    <div className="text-xs text-[var(--color-muted)] mb-1">Design parameters</div>
                    <div className="text-sm text-[var(--color-ink)]">Height 9→8 storeys stepping to conservation edge; London stock brick + precast; dual aspect units.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContext = () => {
    const constraintLabels = (geoLayers.constraints?.features || []).slice(0, 4).map((f: any) => f.properties?.name || f.properties?.label || f.properties?.id || 'Constraint');
    const siteCentre = siteLayer.features?.[0]?.geometry?.type === 'Polygon' ? (siteLayer.features[0].geometry as any).coordinates?.[0]?.[0] : null;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,1fr] gap-4">
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-[var(--color-muted)]">Context map</div>
                <div className="text-lg font-semibold text-[var(--color-ink)]">Constraints + layers (OSM)</div>
              </div>
              <button onClick={generateContext} disabled={loadingKey === 'context'} className="px-3 py-1.5 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)] text-xs">
                {loadingKey === 'context' ? 'Generating…' : 'Refresh AI narrative'}
              </button>
            </div>
            <div className="relative rounded-xl border border-[var(--color-edge)] overflow-hidden h-[420px]">
              <MapLibreFrame layers={combinedLayers} height={420} />
              <div className="absolute top-3 left-3 bg-[var(--color-panel)]/90 backdrop-blur-sm border border-[var(--color-edge)] rounded-lg p-2 text-xs text-[var(--color-muted)] space-y-1 shadow">
                <div className="text-[var(--color-ink)] font-semibold">Layers active</div>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Site</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">Constraints</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Centres</span>
                </div>
                <div className="text-[10px] text-[var(--color-muted)]">Base: OpenStreetMap tiles (live)</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {constraintLabels.map(label => (
                <span key={label} className="px-3 py-1.5 rounded-full border border-[var(--color-edge)] bg-[var(--color-surface)] text-[var(--color-ink)]">{label}</span>
              ))}
              <span className="px-3 py-1.5 rounded-full border border-[var(--color-edge)] bg-[var(--color-surface)] text-[var(--color-muted)]">Allocations layer ready</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
                <div className="text-xs uppercase text-[var(--color-muted)] mb-1">Site facts</div>
                <div className="text-sm text-[var(--color-ink)]">Urban brownfield, PTAL 4, district centre edge, mixed heights.</div>
                <div className="mt-2 text-xs text-[var(--color-muted)]">Area: 0.18ha · Character: commercial core</div>
              </div>
              <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
                <div className="text-xs uppercase text-[var(--color-muted)] mb-1">Constraints</div>
                <ul className="text-sm text-[var(--color-ink)] space-y-1">
                  <li>Conservation area adjacency</li>
                  <li>Archaeology priority area</li>
                  <li>Article 4 (HMO)</li>
                </ul>
              </div>
              <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
                <div className="text-xs uppercase text-[var(--color-muted)] mb-1">Policy footprint</div>
                <ul className="text-sm text-[var(--color-ink)] space-y-1">
                  <li>Local Plan: D2 tall buildings, H4 affordable</li>
                  <li>Neighbourhood: none</li>
                  <li>National: NPPF para 11 tilted balance not engaged</li>
                </ul>
              </div>
            </div>
            <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 space-y-2">
              <div className="text-xs uppercase text-[var(--color-muted)]">AI context analysis</div>
              <div className="text-sm text-[var(--color-ink)]">
                {loadingKey === 'context' && <div className="flex items-center gap-2"><LoadingSpinner size={16} /><span>Thinking…</span></div>}
                {!loadingKey && (contextAnalysis
                  ? <MarkdownContent content={contextAnalysis} />
                  : 'Run the context narrative to populate a site-specific summary with constraint implications.')}
              </div>
              {contextAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[var(--color-muted)]">
                  <div className="p-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]">Constraints → implications</div>
                  <div className="p-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)]">Policy references → tests to meet</div>
                </div>
              )}
              <div className="text-xs text-[var(--color-muted)]">
                Mock spatial data includes {geoLayers.constraints?.features?.length || 0} constraints and {geoLayers.centres?.features?.length || 0} centres. Site seed near {siteCentre ? `${siteCentre[1].toFixed(3)}, ${siteCentre[0].toFixed(3)}` : 'London'}.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReasoning = () => {
    const lanes: ReasoningCard['lane'][] = ['benefit', 'neutral', 'harm'];
    const laneTitles = { benefit: 'Benefits', neutral: 'Neutral / Mitigation', harm: 'Harms' };
    const selectedCard = reasoningCards.find(c => c.id === selectedCardId) || reasoningCards[0];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase text-[var(--color-muted)]">Reasoning themes</div>
            <div className="text-lg font-semibold text-[var(--color-ink)]">Kanban of planning judgement</div>
          </div>
          <div className="flex gap-2">
            <button onClick={generateReasoning} disabled={loadingKey === 'reasoning'} className="px-3 py-1.5 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)] text-xs">
              {loadingKey === 'reasoning' ? 'Generating…' : 'Generate from AI'}
            </button>
            <button onClick={() => setReasoningCards([...reasoningCards, { id: `custom-${Date.now()}`, lane: 'neutral', title: 'Custom note', text: 'Officer note added manually.', topic: 'Officer input', policies: [], confidence: 0.4 }])} className="px-3 py-1.5 rounded border border-[var(--color-edge)] text-xs">
              Add card
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr),280px] gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {lanes.map(lane => (
              <div key={lane} className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[var(--color-ink)]">{laneTitles[lane]}</div>
                  <span className="text-xs text-[var(--color-muted)]">{reasoningCards.filter(c => c.lane === lane).length}</span>
                </div>
                {reasoningCards.filter(c => c.lane === lane).map(card => (
                  <motion.div
                    key={card.id}
                    layout
                    className={`rounded-lg border px-3 py-2 bg-[var(--color-surface)] cursor-pointer ${selectedCardId === card.id ? 'border-[var(--color-accent)]' : 'border-[var(--color-edge)]'}`}
                    onClick={() => setSelectedCardId(card.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase text-[var(--color-muted)]">{card.topic}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-ink)] border border-[var(--color-accent)]/40">{Math.round(card.confidence * 100)}%</span>
                    </div>
                    <div className="text-sm text-[var(--color-ink)] mt-1">{card.text}</div>
                    <div className="flex items-center gap-2 mt-2">
                      {lanes.map(moveLane => (
                        <button key={moveLane} onClick={() => moveCard(card.id, moveLane)} className={`text-[10px] px-2 py-1 rounded-full border ${card.lane === moveLane ? 'border-[var(--color-accent)] text-[var(--color-ink)]' : 'border-[var(--color-edge)] text-[var(--color-muted)]'}`}>
                          {laneTitles[moveLane]}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-2">
            <div className="text-xs uppercase text-[var(--color-muted)]">Policy & evidence</div>
            {selectedCard ? (
              <>
                <div className="text-sm font-semibold text-[var(--color-ink)]">{selectedCard.topic}</div>
                <div className="text-xs text-[var(--color-muted)]">Linked policies</div>
                <div className="flex flex-wrap gap-2">
                  {(selectedCard.policies.length ? selectedCard.policies : ['H4', 'D2', 'T1']).map(p => (
                    <span key={p} className="px-2 py-1 rounded-full border border-[var(--color-edge)] bg-[var(--color-surface)] text-xs text-[var(--color-ink)]">{p}</span>
                  ))}
                </div>
                <div className="text-xs text-[var(--color-muted)] pt-2">Constraints referenced</div>
                <ul className="text-sm text-[var(--color-ink)] space-y-1">
                  <li>Conservation area adjacency</li>
                  <li>PTAL 4 supports car-free</li>
                  <li>Scale transition required</li>
                </ul>
              </>
            ) : (
              <div className="text-sm text-[var(--color-muted)]">Select a card to see linked policy and evidence.</div>
            )}
          </div>
        </div>

        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase text-[var(--color-muted)]">Planning balance</div>
            <div className="text-sm text-[var(--color-ink)]">Overall: {balanceScore > 0.15 ? 'favour of approval' : balanceScore < -0.15 ? 'leaning to refusal' : 'finely balanced'}</div>
          </div>
          <div className="relative w-64 h-2 rounded-full bg-[var(--color-edge)] overflow-hidden">
            <div className={`absolute top-0 h-2 bg-[var(--color-accent)]`} style={{ width: `${Math.min(100, Math.max(0, 50 + balanceScore * 100))}%` }} />
          </div>
        </div>
      </div>
    );
  };

  const renderConditions = () => {
    const acceptedCount = conditions.filter(c => c.status === 'accepted').length + obligations.filter(o => o.status === 'accepted').length;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase text-[var(--color-muted)]">Conditions & S106</div>
            <div className="text-lg font-semibold text-[var(--color-ink)]">Draft, accept, flag risk</div>
          </div>
          <div className="text-xs text-[var(--color-muted)]">Accepted: {acceptedCount}</div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--color-ink)]">Conditions</div>
              <div className="text-xs text-[var(--color-muted)]">AI vs officer origin</div>
            </div>
            <div className="divide-y divide-[var(--color-edge)]">
              {conditions.map(cond => (
                <div key={cond.id} className="py-2 flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-[var(--color-ink)]">{cond.title}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--color-edge)] bg-[var(--color-surface)]">{cond.trigger}</span>
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">Hook: {cond.hook} · {cond.origin === 'ai' ? 'AI suggested' : 'Officer drafted'}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => toggleConditionStatus(cond.id)} className={`text-[11px] px-2 py-1 rounded border ${cond.status === 'accepted' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-[var(--color-edge)] text-[var(--color-muted)]'}`}>
                        {cond.status === 'accepted' ? 'Accepted' : 'Accept'}
                      </button>
                      <button className="text-[11px] px-2 py-1 rounded border border-[var(--color-edge)] text-[var(--color-muted)]">Edit</button>
                      <span className="text-[10px] text-[var(--color-muted)]">Risk check: pass</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--color-ink)]">S106 obligations</div>
              <div className="text-xs text-[var(--color-muted)]">Mark draft vs final</div>
            </div>
            <div className="divide-y divide-[var(--color-edge)]">
              {obligations.map(item => (
                <div key={item.id} className="py-2 flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-[var(--color-ink)]">{item.title}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--color-edge)] bg-[var(--color-surface)]">{item.value}</span>
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">Basis: {item.basis} · {item.origin === 'ai' ? 'AI suggested' : 'Officer drafted'}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => toggleObligationStatus(item.id)} className={`text-[11px] px-2 py-1 rounded border ${item.status === 'accepted' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-[var(--color-edge)] text-[var(--color-muted)]'}`}>
                        {item.status === 'accepted' ? 'Accepted' : 'Accept'}
                      </button>
                      <button className="text-[11px] px-2 py-1 rounded border border-[var(--color-edge)] text-[var(--color-muted)]">Edit</button>
                      <span className="text-[10px] text-[var(--color-muted)]">Audit tag</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDecision = () => {
    return (
      <div className="space-y-4">
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xs uppercase text-[var(--color-muted)]">Decision banner</div>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={decisionOutcome} onChange={e => setDecisionOutcome(e.target.value)} className="px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)]">
                <option>Approve (delegated)</option>
                <option>Approve (committee)</option>
                <option>Refuse</option>
                <option>Hold / further info</option>
              </select>
              <input value={decisionSummary} onChange={e => setDecisionSummary(e.target.value)} className="flex-1 min-w-[260px] px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={generateReport} disabled={loadingKey === 'report'} className="px-3 py-2 rounded border border-[var(--color-edge)] hover:border-[var(--color-accent)] text-xs">
              {loadingKey === 'report' ? 'Generating…' : 'Draft report'}
            </button>
            <button className="px-3 py-2 rounded border border-[var(--color-edge)] text-xs">Export notice</button>
          </div>
        </div>

        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {REPORT_SECTIONS.map(section => (
              <span key={section} className="px-3 py-1.5 text-xs rounded-full border border-[var(--color-edge)] bg-[var(--color-surface)]">{section}</span>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr,260px] gap-4">
            <div className="prose prose-sm max-w-none text-[var(--color-ink)] bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg p-3 min-h-[320px]">
              {report ? <MarkdownContent content={report} /> : <div className="text-sm text-[var(--color-muted)]">Generate the report to populate this canvas. AI confidence highlights will appear where evidence is thin.</div>}
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg p-3 space-y-2">
              <div className="text-xs uppercase text-[var(--color-muted)]">AI provenance</div>
              <div className="text-sm text-[var(--color-ink)]">Sections with heavy AI lift are flagged; officer edits tracked for audit.</div>
              <div className="space-y-1">
                {REPORT_SECTIONS.map(section => (
                  <div key={section} className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                    <span>{section}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-ink)]">AI + officer</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAudit = () => {
    const filtered = auditLog.slice(0, 8);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase text-[var(--color-muted)]">Audit trail</div>
            <div className="text-lg font-semibold text-[var(--color-ink)]">AI involvement & officer edits</div>
          </div>
          <div className="flex gap-2 text-xs">
            <button className="px-3 py-1.5 rounded border border-[var(--color-edge)]">Export</button>
            <button className="px-3 py-1.5 rounded border border-[var(--color-edge)]">Filter</button>
          </div>
        </div>

        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-3">
          {filtered.length === 0 && <div className="text-sm text-[var(--color-muted)]">Actions will appear here automatically as AI is used.</div>}
          <div className="divide-y divide-[var(--color-edge)]">
            {filtered.map(event => (
              <div key={event.id} className="py-2 flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-[var(--color-accent)] mt-2" />
                <div>
                  <div className="text-sm text-[var(--color-ink)]">{event.label}</div>
                  <div className="text-xs text-[var(--color-muted)] flex gap-2">
                    <span>{event.stage}</span>
                    <span>•</span>
                    <span>{friendlyTime(event.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCenterPanel = () => {
    switch (activeStage) {
      case 'overview': return renderOverview();
      case 'documents': return renderDocuments();
      case 'context': return renderContext();
      case 'reasoning': return renderReasoning();
      case 'conditions': return renderConditions();
      case 'decision': return renderDecision();
      case 'audit': return renderAudit();
      default: return null;
    }
  };

  const renderCopilot = () => {
    const promptsForStage = copilotPrompts[activeStage];
    return (
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-4 shadow-sm h-fit sticky top-4">
        <div className="text-xs uppercase text-[var(--color-muted)]">AI Copilot</div>
        <div className="text-lg font-semibold text-[var(--color-ink)] mb-2">
          {activeStage === 'overview' && 'AI validation triage'}
          {activeStage === 'documents' && 'Document insights'}
          {activeStage === 'context' && 'AI context analysis'}
          {activeStage === 'reasoning' && 'Reasoning assistant'}
          {activeStage === 'conditions' && 'Conditions drafter'}
          {activeStage === 'decision' && 'Report shaper'}
          {activeStage === 'audit' && 'Transparency helper'}
        </div>
        <div className="space-y-2 mb-4">
          {promptsForStage.map(prompt => (
            <button
              key={prompt}
              className="w-full text-left px-3 py-2 rounded-lg border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] hover:border-[var(--color-accent)]"
              onClick={() => setAskText(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="text-xs uppercase text-[var(--color-muted)]">Ask anything</div>
        <textarea
          value={askText}
          onChange={e => setAskText(e.target.value)}
          rows={4}
          className="w-full mt-1 px-3 py-2 rounded border border-[var(--color-edge)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)]"
          placeholder="Ask for a summary, a cross-check, or a fresh draft…"
        />
        <button onClick={handleAskCopilot} disabled={copilotLoading} className="mt-2 w-full px-3 py-2 rounded bg-[var(--color-accent)] text-white text-sm disabled:opacity-60">
          {copilotLoading ? 'Thinking…' : 'Send to copilot'}
        </button>
        {copilotError && <div className="text-xs text-red-600 mt-2">{copilotError}</div>}
        {copilotAnswer && (
          <div className="mt-3 text-sm bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-lg p-3 max-h-56 overflow-y-auto">
            <MarkdownContent content={copilotAnswer} />
          </div>
        )}
        <div className="mt-3 text-xs text-[var(--color-muted)]">Outputs land back in the stage panel and audit trail logs usage automatically.</div>
      </div>
    );
  };

  const renderCaseRail = () => (
    <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-3 w-[260px] h-fit sticky top-4 shadow-sm">
      <div className="text-xs uppercase text-[var(--color-muted)] mb-2">Decision stages</div>
      <div className="space-y-1">
        {STAGES.map(stage => (
          <button
            key={stage.id}
            onClick={() => setActiveStage(stage.id)}
            className={`w-full text-left px-3 py-2 rounded-lg border flex items-center justify-between gap-2 ${activeStage === stage.id ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-[var(--color-edge)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/60'}`}
          >
            <div>
              <div className="text-sm font-semibold text-[var(--color-ink)] flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${deriveOverlayColor(stageStatus[stage.id])}`} />
                {stage.label}
              </div>
              <div className="text-[11px] text-[var(--color-muted)]">{stage.hint}</div>
              <div className="text-[11px] text-[var(--color-muted)]">{timeSaved[stage.id]}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="w-16 h-1.5 rounded-full bg-[var(--color-edge)] overflow-hidden">
                <div className="h-full bg-[var(--color-accent)]" style={{ width: `${Math.round(stageConfidence[stage.id] * 100)}%` }} />
              </div>
              <div className="text-[10px] text-[var(--color-muted)]">{Math.round(stageConfidence[stage.id] * 100)}% AI</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderWorkspace = () => {
    if (!selectedApplication) return null;
    return (
      <div className="min-h-screen bg-[var(--color-surface)]">
        <div className="bg-[var(--color-panel)] border-b border-[var(--color-edge)] sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedApplication(null)} className="text-[var(--color-accent)] text-sm">← Back to cases</button>
              <div className="h-6 w-px bg-[var(--color-edge)]" />
              <div>
                <div className="text-xs uppercase text-[var(--color-muted)]">Decision workspace</div>
                <div className="text-xl font-semibold text-[var(--color-ink)]">{selectedApplication.reference} · {selectedApplication.address}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
              <span className="px-2 py-1 rounded-full border border-[var(--color-edge)] bg-[var(--color-surface)]">Mode: Officer + AI</span>
              <span className="px-2 py-1 rounded-full border border-[var(--color-edge)] bg-[var(--color-surface)]">Env: Demo</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col xl:flex-row gap-4 items-start">
            <div className="w-full xl:w-[260px] shrink-0">{renderCaseRail()}</div>
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr),340px] gap-4">
              <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-2xl p-4 shadow-sm">
                {renderCenterPanel()}
              </div>
              {renderCopilot()}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-edge)] bg-[var(--color-panel)] sticky bottom-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[var(--color-ink)]">Decision footer</span>
              <span className="text-[var(--color-muted)]">Status: {decisionOutcome}</span>
              <span className="text-[var(--color-muted)]">Audit log entries: {auditLog.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded border border-[var(--color-edge)] text-xs">Save locally</button>
              <button className="px-3 py-2 rounded border border-[var(--color-edge)] text-xs">Export PDF</button>
              <button className="px-3 py-2 rounded bg-[var(--color-accent)] text-white text-xs">Publish</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      {!selectedApplication && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs uppercase text-[var(--color-muted)]">Development management</div>
              <h1 className="text-2xl font-bold text-[var(--color-ink)]">Pick a case to open the Decision Workspace</h1>
              <p className="text-sm text-[var(--color-muted)]">Each application spins up a single workspace with modes for overview, documents, context, reasoning, conditions, decision, and audit.</p>
            </div>
            <button onClick={onBack} className="text-[var(--color-accent)] text-sm">← Back</button>
          </div>
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 gap-4">
              {councilData.applications.map(app => (
                <motion.button
                  key={app.id}
                  onClick={() => handleSelectApplication(app)}
                  whileHover={{ x: 4 }}
                  className="text-left bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6 hover:border-[var(--color-accent)] transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[var(--color-ink)]">{app.reference}</h3>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-edge)]">{app.applicationType}</span>
                      </div>
                      <p className="text-sm text-[var(--color-muted)] mb-2">{app.address}</p>
                      <p className="text-sm text-[var(--color-ink)] mb-3 line-clamp-2">{app.description}</p>
                      <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
                        <span>Applicant: {app.applicant}</span>
                        <span>•</span>
                        <span>{app.documents.length} documents</span>
                      </div>
                    </div>
                    <div className="text-[var(--color-accent)] text-2xl">→</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </AnimatePresence>
        </div>
      )}
      {selectedApplication && renderWorkspace()}
    </div>
  );
};
