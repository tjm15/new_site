// Zero-shot classifier utilities using @xenova/transformers
// Lazy loads the pipeline on first use. Browser-compatible, no backend required.

import type { CouncilData } from '../data/types';

let zeroShotPromise: Promise<any> | null = null;

async function getZeroShot() {
  if (!zeroShotPromise) {
    zeroShotPromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');
      // DeBERTa v3 small NLI is a good size/speed tradeoff
      const classifier = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-small');
      return classifier;
    })();
  }
  return zeroShotPromise;
}

export type ToolId = 'evidence' | 'vision' | 'policy' | 'strategy' | 'sites' | 'feedback';

const TOOL_LABELS: { label: string; id: ToolId }[] = [
  { label: 'Evidence', id: 'evidence' },
  { label: 'Vision & Concepts', id: 'vision' },
  { label: 'Policy Drafting', id: 'policy' },
  { label: 'Strategy Modeling', id: 'strategy' },
  { label: 'Site Assessment', id: 'sites' },
  { label: 'Feedback Analysis', id: 'feedback' }
];

export async function classifyTool(question: string): Promise<ToolId> {
  try {
    const clf = await getZeroShot();
    const labels = TOOL_LABELS.map(t => t.label);
    const res = await clf(question, labels, { multi_label: false });
    const top = Array.isArray(res.labels) ? res.labels[0] : labels[0];
    const mapped = TOOL_LABELS.find(t => t.label === top)?.id || 'evidence';
    return mapped;
  } catch {
    // Fallback to evidence on any failure
    return 'evidence';
  }
}

export async function classifyTopics(question: string, councilData: CouncilData, threshold = 0.45): Promise<string[]> {
  const labels = councilData.topics.map(t => t.label);
  if (labels.length === 0) return [];
  try {
    const clf = await getZeroShot();
    const res = await clf(question, labels, { multi_label: true });
    const selectedLabels: string[] = [];
    if (Array.isArray(res.scores) && Array.isArray(res.labels)) {
      res.labels.forEach((lab: string, idx: number) => {
        const score = res.scores[idx] ?? 0;
        if (score >= threshold) selectedLabels.push(lab);
      });
    }
    const byId = councilData.topics
      .filter(t => selectedLabels.includes(t.label))
      .map(t => t.id);
    return byId;
  } catch {
    return [];
  }
}

export function inferSiteId(question: string, councilData: CouncilData): string | null {
  const q = question.toLowerCase();
  const sites = councilData.spatialData?.allocations || [];
  // Simple heuristics: exact id mention or name substring
  for (const s of sites) {
    if (q.includes((s.id || '').toLowerCase())) return s.id;
    if (s.name && q.includes(s.name.toLowerCase())) return s.id;
  }
  return null;
}
