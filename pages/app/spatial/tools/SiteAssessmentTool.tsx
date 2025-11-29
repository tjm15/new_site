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
  const { activePlan, updatePlan } = usePlan();

  const assessSite = async (siteId: string) => {
    setSelectedSite(siteId);
    setLoading(true);

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
            overall: ai?.overall?.rag?.toUpperCase?.() as 'R'|'A'|'G'
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
    if (onSessionChange) {
      onSessionChange({ selectedSite, appraisal, details });
    }
  }, [selectedSite, appraisal, details]);

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
                <div className="font-semibold text-[var(--color-ink)] mb-2">📜 Relevant Policies</div>
                <ul className="text-sm text-[var(--color-muted)] list-disc pl-5">
                  {details.policies?.map((c, idx) => (<li key={idx}>{c}</li>))}
                </ul>
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
    </div>
  );
};
