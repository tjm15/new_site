import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData } from '../../../../data/types';
import { usePlan } from '../../../../contexts/PlanContext';
import { classifySite } from '../../../../utils/llmTasks';
import { PromptFunctions } from '../../../../prompts';
import { callLLM } from '../../../../utils/llmClient';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { SpatialMap } from '../shared/SpatialMap';
import { MarkdownContent } from '../../../../components/MarkdownContent';
import type { GeoLayerSet } from '../../../../data/geojsonLayers';

interface SiteAssessmentToolProps {
  councilData: CouncilData;
  prompts: PromptFunctions;
  initialSiteId?: string;
  initialAppraisal?: string;
  initialDetails?: { constraints?: string[]; opportunities?: string[]; policies?: string[] } | null;
  autoRun?: boolean;
  onSessionChange?: (session: { selectedSite: string | null; appraisal: string; details: { constraints?: string[]; opportunities?: string[]; policies?: string[] } | null }) => void;
  geoLayers?: GeoLayerSet | null;
}

export const SiteAssessmentTool: React.FC<SiteAssessmentToolProps> = ({ councilData, prompts, initialSiteId, initialAppraisal, initialDetails, autoRun, onSessionChange, geoLayers }) => {
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [appraisal, setAppraisal] = useState('');
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<{ constraints?: string[]; opportunities?: string[]; policies?: string[] } | null>(null);
  const [rag, setRag] = useState<{ suitability?: 'R'|'A'|'G'; availability?: 'R'|'A'|'G'; achievability?: 'R'|'A'|'G'; overall?: 'R'|'A'|'G' } | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionChoice, setDecisionChoice] = useState<'selected' | 'rejected'>('selected');
  const [decisionText, setDecisionText] = useState('');
  const [savingDecision, setSavingDecision] = useState(false);
  const [savingPreferredSite, setSavingPreferredSite] = useState(false);
  const { activePlan, updatePlan } = usePlan();
  const planMatchesCouncil = !!(activePlan && activePlan.councilId === councilData.id);
  const preferredSite = planMatchesCouncil ? activePlan?.preferredOptions?.site : undefined;
  const preferredSiteId = preferredSite?.id;

  const assessSite = async (siteId: string) => {
    setSelectedSite(siteId);
    setLoading(true);
    setRag(null);
    setDecisionModalOpen(false);

    try {
      const site = councilData.spatialData.allocations.find(s => s.id === siteId);
      if (site) {
          const prompt = prompts.siteAppraisalPrompt(site);
          try {
            // Use non-streaming call to preserve original spacing/formatting from the model.
            const full = await callLLM({ mode: 'markdown', prompt });
            // eslint-disable-next-line no-console
            console.log('[site appraisal raw]', full);
            setAppraisal(full || 'No appraisal generated.');
          } catch (e) {
            console.warn('Site appraisal generation failed', e);
            setAppraisal('No appraisal generated.');
          }
        // Derive simple structured details
        const constraints = councilData.spatialData.constraints.slice(0,3).map(c=>c.label);
        const opportunities = ['Brownfield regeneration', 'Transit proximity', 'Town centre vitality'];
        const policies = councilData.policies.filter(p=>p.topics.includes(site.category)).slice(0,3).map(p=>`${p.reference} ${p.title}`);
        setDetails({ constraints, opportunities, policies });
        // AI RAG prefill
        try {
          const ai = await classifySite({ id: site.id, name: site.name }, activePlan as any);
          const normalized = {
            suitability: ai?.suitability?.rag?.toUpperCase?.() as 'R'|'A'|'G',
            availability: ai?.availability?.rag?.toUpperCase?.() as 'R'|'A'|'G',
            achievability: ai?.achievability?.rag?.toUpperCase?.() as 'R'|'A'|'G',
            overall: (ai?.overall?.rag || ai?.overall)?.toString()?.toUpperCase() as 'R'|'A'|'G'
          };
          setRag(normalized);
          if (activePlan && activePlan.councilId === councilData.id) {
            const updatedSites = [...activePlan.sites];
            const idx = updatedSites.findIndex(s => s.id === site.id);
            if (idx >= 0) {
              updatedSites[idx] = { ...updatedSites[idx], suitability: normalized.suitability, availability: normalized.availability, achievability: normalized.achievability };
            } else {
              updatedSites.push({ id: site.id, name: site.name, suitability: normalized.suitability, availability: normalized.availability, achievability: normalized.achievability });
            }
            updatePlan(activePlan.id, { sites: updatedSites });
          }
        } catch (e) {
          console.warn('Site RAG classify failed', e);
        }
      }
    } catch (error) {
      setAppraisal('Error generating appraisal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Restore session if provided
    if (initialAppraisal) setAppraisal(initialAppraisal);
    if (initialDetails) setDetails(initialDetails);
    if (initialSiteId) setSelectedSite(initialSiteId);

    // Prefer initial site from autopick
    if (autoRun && initialSiteId) {
      assessSite(initialSiteId);
      return;
    }
    // If restoring existing appraisal, skip auto selection
    if (initialAppraisal) return;
    const first = councilData.spatialData.allocations[0]?.id;
    if (first) {
      assessSite(first);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!planMatchesCouncil || !preferredSiteId) return;
    if (selectedSite === preferredSiteId) return;
    assessSite(preferredSiteId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planMatchesCouncil, preferredSiteId, selectedSite]);

  useEffect(() => {
    if (onSessionChange) {
      onSessionChange({ selectedSite, appraisal, details });
    }
  }, [selectedSite, appraisal, details]);

  const existingDecision = selectedSite && activePlan?.siteDecisions?.find(d => d.siteId === selectedSite);

  const selectedSiteData = selectedSite
    ? councilData.spatialData.allocations.find(s => s.id === selectedSite)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-ink)] mb-2">
          Site Assessment
        </h2>
        <p className="text-[var(--color-muted)]">
          Select a site from the map to generate an AI-powered development appraisal
        </p>
      </div>

      {/* Interactive map */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6">
        <SpatialMap
          boroughOutline={councilData.spatialData.boroughOutline}
          constraints={councilData.spatialData.constraints.map(c => c.path)}
          centres={councilData.spatialData.centres.map(c => c.label)}
          allocations={councilData.spatialData.allocations}
          selectedSite={selectedSite}
          onSiteSelect={assessSite}
          showConstraints={true}
          showCentres={false}
          showAllocations={true}
          geojsonLayers={geoLayers || undefined}
        />
      </div>

      {/* Selected site details */}
      {selectedSiteData && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-surface)] border border-[var(--color-edge)] rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-3">
            {selectedSiteData.name}
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              className="px-3 py-1.5 rounded border border-[var(--color-edge)] text-[var(--color-ink)] text-sm bg-[var(--color-panel)] hover:border-[var(--color-accent)]"
              onClick={() => {
                setDecisionChoice(existingDecision?.decision || 'selected');
                setDecisionText(existingDecision?.rationale || '');
                setDecisionModalOpen(true);
              }}
            >
              Selection / rejection reasons
            </button>
            {planMatchesCouncil && (
              <button
                className="px-3 py-1.5 rounded border border-[var(--color-edge)] text-[var(--color-ink)] text-sm bg-[var(--color-panel)] hover:border-[var(--color-accent)] disabled:opacity-60"
                disabled={savingPreferredSite}
                onClick={() => {
                  if (!activePlan || !selectedSiteData) return;
                  setSavingPreferredSite(true);
                  updatePlan(activePlan.id, {
                    preferredOptions: {
                      ...(activePlan.preferredOptions || {}),
                      site: {
                        id: selectedSiteData.id,
                        name: selectedSiteData.name,
                        rationale: existingDecision?.rationale || decisionText || undefined,
                        appraisal: appraisal || undefined,
                      }
                    }
                  });
                  setSavingPreferredSite(false);
                }}
              >
                {preferredSiteId === selectedSite ? 'Preferred option saved' : (savingPreferredSite ? 'Saving...' : 'Save as preferred')}
              </button>
            )}
            {existingDecision?.decision && (
              <span className="text-xs text-[var(--color-muted)]">Logged: {existingDecision.decision}</span>
            )}
            {preferredSiteId === selectedSite && (
              <span className="text-xs text-green-700">Marked as preferred site for this plan</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {selectedSiteData.area && (
              <div>
                <div className="text-xs text-[var(--color-muted)] mb-1">Area</div>
                <div className="text-lg font-semibold text-[var(--color-ink)]">
                  {selectedSiteData.area} ha
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-[var(--color-muted)] mb-1">Capacity</div>
              <div className="text-lg font-semibold text-[var(--color-ink)]">
                {selectedSiteData.capacity}
              </div>
            </div>
            {selectedSiteData.proposedUse && (
              <div>
                <div className="text-xs text-[var(--color-muted)] mb-1">Use</div>
                <div className="text-lg font-semibold text-[var(--color-ink)]">
                  {selectedSiteData.proposedUse}
                </div>
              </div>
            )}
            {selectedSiteData.timeframe && (
              <div>
                <div className="text-xs text-[var(--color-muted)] mb-1">Timeframe</div>
                <div className="text-lg font-semibold text-[var(--color-ink)]">
                  {selectedSiteData.timeframe}
                </div>
              </div>
            )}
          </div>
          {selectedSiteData.description && (
            <p className="text-sm text-[var(--color-muted)]">
              {selectedSiteData.description}
            </p>
          )}
          {details && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
                <div className="font-semibold text-[var(--color-ink)] mb-2">⚠️ Constraints</div>
                <ul className="text-sm text-[var(--color-muted)] list-disc pl-5">
                  {details.constraints?.map((c, idx) => (<li key={idx}>{c}</li>))}
                </ul>
              </div>
              <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
                <div className="font-semibold text-[var(--color-ink)] mb-2">💡 Opportunities</div>
                <ul className="text-sm text-[var(--color-muted)] list-disc pl-5">
                  {details.opportunities?.map((c, idx) => (<li key={idx}>{c}</li>))}
                </ul>
              </div>
              <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
                <div className="font-semibold text-[var(--color-ink)] mb-2 flex items-center gap-2">
                  <span>📜 Relevant Policies</span>
                  {!details.policies?.length && <span className="text-xs text-amber-700 flex items-center gap-1">❗ Incomplete</span>}
                </div>
                {details.policies?.length ? (
                  <ul className="text-sm text-[var(--color-muted)] list-disc pl-5">
                    {details.policies.map((c, idx) => (<li key={idx}>{c}</li>))}
                  </ul>
                ) : (
                  <div className="text-sm text-[var(--color-muted)]">
                    No site-specific policies linked yet. Open the Policy Drafter to create site policies with indicators and obligations.
                    <div className="mt-2">
                      <button
                        className="text-[var(--color-accent)] underline text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          window.dispatchEvent(new CustomEvent('openPolicyDrafter', { detail: { hint: 'site-policies' } }));
                          localStorage.setItem('initialTool', 'policy');
                        }}
                      >
                        → Draft site policy in Policy Drafter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* RAG ratings */}
          {rag && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              {(['suitability','availability','achievability','overall'] as const).map(key => (
                <div key={key} className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
                  <div className="text-xs text-[var(--color-muted)] mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                  <div className={`text-lg font-semibold ${rag[key] === 'G' ? 'text-green-600' : rag[key] === 'A' ? 'text-amber-600' : 'text-red-600'}`}>{rag[key]}</div>
                  <div className="mt-2">
                    <select
                      value={rag[key]}
                      onChange={(e)=>{
                        const next = { ...rag, [key]: e.target.value as 'R'|'A'|'G' }
                        setRag(next)
                        if (activePlan && activePlan.councilId === councilData.id && selectedSite) {
                          const updatedSites = [...activePlan.sites]
                          const idx = updatedSites.findIndex(s => s.id === selectedSite)
                          if (idx >= 0) {
                            updatedSites[idx] = { ...updatedSites[idx], suitability: next.suitability, availability: next.availability, achievability: next.achievability }
                          }
                          updatePlan(activePlan.id, { sites: updatedSites })
                        }
                      }}
                      className="border border-[var(--color-edge)] rounded p-1 text-sm"
                    >
                      <option value="G">G</option>
                      <option value="A">A</option>
                      <option value="R">R</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Appraisal output */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center py-12"
          >
            <LoadingSpinner />
          </motion.div>
        )}

        {!loading && appraisal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">🛠️ Site Appraisal</h3>
            <MarkdownContent content={appraisal} />
          </motion.div>
        )}
      </AnimatePresence>
      {decisionModalOpen && (
        <div className="fixed inset-0 z-30 flex justify-end bg-black/20">
          <div className="w-full max-w-md h-full bg-[var(--color-panel)] border-l border-[var(--color-edge)] shadow-2xl p-4 overflow-y-auto">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="text-sm text-[var(--color-muted)]">Selection / Rejection</div>
                <div className="text-lg font-semibold text-[var(--color-ink)]">{selectedSiteData?.name || 'Site'}</div>
              </div>
              <button className="text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)]" onClick={() => setDecisionModalOpen(false)}>Close</button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-[var(--color-muted)] mb-1">Decision</div>
                <select
                  value={decisionChoice}
                  onChange={(e)=>setDecisionChoice(e.target.value as 'selected'|'rejected')}
                  className="w-full border border-[var(--color-edge)] rounded-lg p-2 text-sm"
                >
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-[var(--color-muted)]">Reasoning</div>
                  <button
                    className="text-xs text-[var(--color-accent)] hover:underline"
                    onClick={async ()=>{
                      if (!selectedSiteData) return;
                      const prompt = `
Draft concise ${decisionChoice} rationale (3-5 bullets) for the site below. Include constraints, opportunities, policy alignment, and delivery/SEA considerations.
Site: ${selectedSiteData.name}
Category: ${selectedSiteData.category || ''}
Capacity: ${selectedSiteData.capacity || 'n/a'}
Constraints: ${(details?.constraints || []).join('; ')}
Opportunities: ${(details?.opportunities || []).join('; ')}
Policies: ${(details?.policies || []).join('; ')}
RAG: ${rag ? JSON.stringify(rag) : 'n/a'}
Decision: ${decisionChoice}
Return plain text bullets.`;
                      try {
                        setSavingDecision(true);
                        const text = await callLLM({ mode: 'markdown', prompt });
                        setDecisionText(text || '');
                      } catch {
                        setDecisionText(decisionText || '');
                      } finally {
                        setSavingDecision(false);
                      }
                    }}
                  >
                    Auto-draft
                  </button>
                </div>
                <textarea
                  value={decisionText}
                  onChange={(e)=>setDecisionText(e.target.value)}
                  rows={8}
                  className="w-full border border-[var(--color-edge)] rounded-lg p-3 text-sm bg-[var(--color-surface)]"
                  placeholder="Log why this site is selected or rejected..."
                />
              </div>
              <button
                className="px-3 py-2 rounded bg-[var(--color-accent)] text-white text-sm"
                disabled={savingDecision}
                onClick={()=>{
                  if (!activePlan || !selectedSiteData) return;
                  const next = (activePlan.siteDecisions || []).filter(d => d.siteId !== selectedSiteData.id);
                  next.push({ siteId: selectedSiteData.id, decision: decisionChoice, rationale: decisionText || 'Reason not provided' });
                  updatePlan(activePlan.id, { siteDecisions: next });
                  setSavingDecision(false);
                  setDecisionModalOpen(false);
                }}
              >
                {savingDecision ? 'Saving...' : 'Save decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
