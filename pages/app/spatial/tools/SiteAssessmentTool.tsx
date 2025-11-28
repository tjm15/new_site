import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilData } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callGemini } from '../../../../utils/gemini';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { SpatialMap } from '../shared/SpatialMap';
import { MarkdownContent } from '../../../../components/MarkdownContent';

interface SiteAssessmentToolProps {
  councilData: CouncilData;
  prompts: PromptFunctions;
}

export const SiteAssessmentTool: React.FC<SiteAssessmentToolProps> = ({ councilData, prompts }) => {
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [appraisal, setAppraisal] = useState('');
  const [loading, setLoading] = useState(false);

  const assessSite = async (siteId: string) => {
    setSelectedSite(siteId);
    setLoading(true);

    try {
      const site = councilData.spatialData.allocations.find(s => s.id === siteId);
      if (site) {
        const prompt = prompts.siteAppraisalPrompt(site);
        const result = await callGemini(prompt);
        setAppraisal(result || 'No appraisal generated.');
      }
    } catch (error) {
      setAppraisal('Error generating appraisal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedSiteData = selectedSite
    ? councilData.spatialData.allocations.find(s => s.id === selectedSite)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[color:var(--ink)] mb-2">
          Site Assessment
        </h2>
        <p className="text-[color:var(--muted)]">
          Select a site from the map to generate an AI-powered development appraisal
        </p>
      </div>

      {/* Interactive map */}
      <div className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-6">
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
        />
      </div>

      {/* Selected site details */}
      {selectedSiteData && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[color:var(--surface)] border border-[color:var(--edge)] rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-[color:var(--ink)] mb-3">
            {selectedSiteData.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {selectedSiteData.area && (
              <div>
                <div className="text-xs text-[color:var(--muted)] mb-1">Area</div>
                <div className="text-lg font-semibold text-[color:var(--ink)]">
                  {selectedSiteData.area} ha
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-[color:var(--muted)] mb-1">Capacity</div>
              <div className="text-lg font-semibold text-[color:var(--ink)]">
                {selectedSiteData.capacity}
              </div>
            </div>
            {selectedSiteData.proposedUse && (
              <div>
                <div className="text-xs text-[color:var(--muted)] mb-1">Use</div>
                <div className="text-lg font-semibold text-[color:var(--ink)]">
                  {selectedSiteData.proposedUse}
                </div>
              </div>
            )}
            {selectedSiteData.timeframe && (
              <div>
                <div className="text-xs text-[color:var(--muted)] mb-1">Timeframe</div>
                <div className="text-lg font-semibold text-[color:var(--ink)]">
                  {selectedSiteData.timeframe}
                </div>
              </div>
            )}
          </div>
          {selectedSiteData.description && (
            <p className="text-sm text-[color:var(--muted)]">
              {selectedSiteData.description}
            </p>
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
            className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-[color:var(--ink)] mb-4">
              Site Appraisal
            </h3>
            <div className="prose prose-sm max-w-none text-[color:var(--muted)] whitespace-pre-wrap">
              {appraisal}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
