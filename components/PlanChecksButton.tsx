import React, { useState } from 'react'
import { usePlan } from '../contexts/PlanContext'
import { runPlanChecks, CheckResult } from '../utils/planChecks'

export function PlanChecksButton({ councilId }: { councilId?: string }) {
  const { activePlan, getActiveForCouncil } = usePlan()
  const plan = councilId ? getActiveForCouncil(councilId) : activePlan
  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<CheckResult[] | null>(null)

  if (!plan) return null

  const run = async () => {
    setRunning(true)
    const res = await runPlanChecks(plan)
    setResults(res)
    setRunning(false)
    setOpen(true)
  }

  return (
    <div>
      <button className="px-3 py-2 bg-[var(--color-ink)] text-white rounded" onClick={run} disabled={running}>
        {running ? 'Running checks…' : 'Run QA Checks'}
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center" onClick={()=>setOpen(false)}>
          <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-xl p-4 w-[600px]" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-[var(--color-ink)]">Plan QA Results</div>
              <button className="text-sm text-[var(--color-muted)]" onClick={()=>setOpen(false)}>Close</button>
            </div>
            <ul className="space-y-2">
              {results?.map(r => (
                <li key={r.id} className="flex items-start gap-3 text-sm">
                  <span className={`mt-1 h-2 w-2 rounded-full ${r.status==='pass'?'bg-green-500': r.status==='risk'?'bg-amber-500':'bg-red-500'}`} />
                  <div>
                    <div className="font-medium text-[var(--color-ink)]">{r.id}</div>
                    <div className="text-[var(--color-muted)]">{r.summary}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
