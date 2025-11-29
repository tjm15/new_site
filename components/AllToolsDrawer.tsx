import * as React from 'react'

const tools = [
  { id: 'EvidenceTool', label: 'Evidence Base', icon: '🗺️' },
  { id: 'VisionConceptsTool', label: 'Vision & Concepts', icon: '🎨' },
  { id: 'PolicyDrafterTool', label: 'Policy Drafter', icon: '📋' },
  { id: 'StrategyModelerTool', label: 'Strategy Modeler', icon: '📊' },
  { id: 'SiteAssessmentTool', label: 'Site Assessment', icon: '📍' },
  { id: 'FeedbackAnalysisTool', label: 'Feedback Analysis', icon: '💬' },
  { id: 'SEATool', label: 'SEA / HRA', icon: '🌊' },
  { id: 'SCITool', label: 'SCI / Engagement', icon: '👥' },
]

export const AllToolsDrawer: React.FC<{ open: boolean; onClose: () => void; onOpenTool: (toolId: string) => void }> = ({ open, onClose, onOpenTool }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 z-50">
      <div className="absolute right-0 top-0 bottom-0 w-[420px] bg-[var(--color-surface)] border-l border-[var(--color-edge)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">All Tools</h3>
          <button onClick={onClose} className="text-sm text-[var(--color-accent)]">Close</button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {tools.map(t => (
            <button key={t.id} onClick={() => onOpenTool(t.id)} className="text-left bg-[var(--color-panel)] border border-[var(--color-edge)] rounded p-3 hover:border-[var(--color-accent)]">
              <div className="text-2xl">{t.icon}</div>
              <div className="font-medium">{t.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
