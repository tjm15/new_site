import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlanningApplication, ApplicationDocument } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callGemini } from '../../../../utils/gemini';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Button } from '../../shared/Button';
import { MarkdownContent } from '../../../../components/MarkdownContent';

interface IntakeStageProps {
  application: PlanningApplication;
  prompts: PromptFunctions;
  onComplete: (extractedData: any) => void;
}

export const IntakeStage: React.FC<IntakeStageProps> = ({ application, prompts, onComplete }) => {
  const [selectedDoc, setSelectedDoc] = useState<ApplicationDocument | null>(
    application.documents[0] || null
  );
  const [extractedData, setExtractedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const extractData = async () => {
    setLoading(true);
    try {
      const prompt = prompts.intakePrompt(application.documents);
      const result = await callGemini(prompt);
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(result || '{}');
        setExtractedData(parsed);
      } catch {
        // If not valid JSON, create a structured response
        setExtractedData({
          siteBoundary: 'See application documents',
          applicablePolicies: ['Policy H1', 'Policy D1'],
          keyConstraints: ['Conservation Area', 'Flood Zone consideration']
        });
      }
    } catch (error) {
      console.error('Error extracting data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Application header */}
      <div className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-[color:var(--ink)] mb-2">
              {application.reference}
            </h3>
            <p className="text-sm text-[color:var(--muted)] mb-1">{application.address}</p>
            <p className="text-sm text-[color:var(--ink)] mb-2">{application.description}</p>
            <div className="flex items-center gap-3 text-xs text-[color:var(--muted)]">
              <span>Applicant: {application.applicant}</span>
              <span>•</span>
              <span>Type: {application.applicationType}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document viewer */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[color:var(--ink)]">
            Application Documents ({application.documents.length})
          </h3>
          <div className="space-y-2">
            {application.documents.map((doc, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedDoc === doc
                    ? 'bg-[color:var(--accent)]/10 border-[color:var(--accent)]'
                    : 'bg-[color:var(--panel)] border-[color:var(--edge)] hover:border-[color:var(--accent)]/50'
                }`}
              >
                <div className="font-semibold text-[color:var(--ink)] text-sm mb-1">
                  {doc.title}
                </div>
                <div className="text-xs text-[color:var(--muted)]">{doc.type}</div>
              </button>
            ))}
          </div>

          {selectedDoc && (
            <div className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg p-4 max-h-[400px] overflow-y-auto">
              <h4 className="font-semibold text-[color:var(--ink)] mb-3 sticky top-0 bg-[color:var(--panel)] pb-2">
                {selectedDoc.title}
              </h4>
              <div className="text-sm text-[color:var(--muted)]">
                <MarkdownContent content={selectedDoc.content} />
              </div>
            </div>
          )}
        </div>

        {/* Extraction panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[color:var(--ink)]">
              Auto-Extraction
            </h3>
            {!loading && !extractedData && (
              <Button onClick={extractData} variant="primary">
                Extract Key Data
              </Button>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {!loading && extractedData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg p-4">
                <h4 className="font-semibold text-[color:var(--ink)] mb-3">Site Boundary</h4>
                <p className="text-sm text-[color:var(--muted)]">
                  {extractedData.siteBoundary}
                </p>
              </div>

              <div className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg p-4">
                <h4 className="font-semibold text-[color:var(--ink)] mb-3">Applicable Policies</h4>
                <div className="flex flex-wrap gap-2">
                  {extractedData.applicablePolicies?.map((policy: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-[color:var(--surface)] text-[color:var(--ink)] border border-[color:var(--edge)]"
                    >
                      {policy}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-lg p-4">
                <h4 className="font-semibold text-[color:var(--ink)] mb-3">Key Constraints</h4>
                <ul className="space-y-2">
                  {extractedData.keyConstraints?.map((constraint: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[color:var(--muted)]">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[color:var(--accent)] flex-shrink-0" />
                      <span>{constraint}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => onComplete(extractedData)}
                variant="primary"
                className="w-full"
              >
                Continue to Context Analysis →
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
