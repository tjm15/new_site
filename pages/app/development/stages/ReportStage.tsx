import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlanningApplication } from '../../../../data/types';
import { PromptFunctions } from '../../../../prompts';
import { callGemini } from '../../../../utils/gemini';
import { printReport, copyToClipboard } from '../../../../utils/printToPDF';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { Button } from '../../shared/Button';
import { MarkdownContent } from '../../../../components/MarkdownContent';

interface ReportStageProps {
  application: PlanningApplication;
  extractedData: any;
  contextAnalysis: string;
  reasoningChain: any[];
  prompts: PromptFunctions;
  onBack: () => void;
  onNewApplication: () => void;
}

export const ReportStage: React.FC<ReportStageProps> = ({
  application,
  extractedData,
  contextAnalysis,
  reasoningChain,
  prompts,
  onBack,
  onNewApplication
}) => {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const allData = {
        extractedData,
        contextAnalysis,
        reasoningChain
      };
      const prompt = prompts.reportPrompt(application, allData);
      const result = await callGemini(prompt);
      setReport(result || 'No report generated.');
    } catch (error) {
      setReport('Error generating report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(report);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
        <button onClick={onBack} className="text-[color:var(--accent)] hover:underline">
          ← Back
        </button>
        <span>•</span>
        <span>Step 4 of 4: Officer Report</span>
      </div>

      {/* Application summary */}
      <div className="bg-[color:var(--panel)] border border-[color:var(--edge)] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[color:var(--ink)] mb-1">
              {application.reference}
            </h3>
            <p className="text-sm text-[color:var(--muted)]">{application.description}</p>
          </div>
          {!loading && !report && (
            <Button onClick={generateReport} variant="primary">
              Generate Full Report
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            Generating comprehensive officer report...
          </p>
        </div>
      )}

      {!loading && report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => printReport()} variant="primary">
              Print / Save as PDF
            </Button>
            <Button onClick={handleCopy} variant="secondary">
              {copied ? '✓ Copied!' : 'Copy to Clipboard'}
            </Button>
            <Button onClick={generateReport} variant="outline">
              Regenerate
            </Button>
            <Button onClick={onNewApplication} variant="outline">
              New Application
            </Button>
          </div>

          {/* Report content */}
          <div
            id="report-content"
            className="bg-white text-black rounded-xl border border-[color:var(--edge)] p-8 shadow-lg"
          >
            {/* Report header */}
            <div className="border-b border-gray-300 pb-6 mb-6">
              <h1 className="text-2xl font-bold mb-4">PLANNING OFFICER'S REPORT</h1>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold">Application Reference:</div>
                  <div>{application.reference}</div>
                </div>
                <div>
                  <div className="font-semibold">Application Type:</div>
                  <div>{application.applicationType}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-semibold">Site Address:</div>
                  <div>{application.address}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-semibold">Proposal:</div>
                  <div>{application.description}</div>
                </div>
                <div>
                  <div className="font-semibold">Applicant:</div>
                  <div>{application.applicant}</div>
                </div>
              </div>
            </div>

            {/* Report body */}
            <div className="prose prose-sm max-w-none">
              <MarkdownContent content={report} />
            </div>

            {/* Report footer */}
            <div className="border-t border-gray-300 mt-8 pt-6 text-sm text-gray-600">
              <p>Report generated: {new Date().toLocaleDateString('en-GB')}</p>
              <p className="mt-2 text-xs">
                This is an AI-assisted draft report. All recommendations should be reviewed by a qualified planning officer before use.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
