import * as React from 'react'
import { useState, useEffect } from 'react'
import type { CouncilData } from '../../../../data/types'
import { usePlan } from '../../../../contexts/PlanContext'

interface SEAToolProps {
  councilData: CouncilData
  autoRun?: boolean
  onSaved?: () => void
  initialData?: Record<string, any>
}

export const SEATool: React.FC<SEAToolProps> = ({ councilData, autoRun = false, onSaved, initialData }) => {
  const { activePlan, updatePlan } = usePlan()
  const [status, setStatus] = useState<'Not started'|'Drafted'|'Consulted'>('Not started')
  const [notes, setNotes] = useState('')
  const [hra, setHra] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!activePlan) return
    const s = activePlan.seaHra
    if (s) {
      if (s.seaScopingStatus) setStatus(s.seaScopingStatus)
      if (s.seaScopingNotes) setNotes(s.seaScopingNotes)
      if (s.hraBaselineSummary) setHra(s.hraBaselineSummary)
    }
  }, [activePlan])

  // Apply any LLM-suggested prefill data if provided (do not overwrite existing saved plan values)
  useEffect(() => {
    if (!initialData) return
    if (initialData.seaScopingStatus && (!activePlan || !activePlan.seaHra || !activePlan.seaHra.seaScopingStatus)) setStatus(initialData.seaScopingStatus)
    if (initialData.seaScopingNotes && (!activePlan || !activePlan.seaHra || !activePlan.seaHra.seaScopingNotes)) setNotes(initialData.seaScopingNotes)
    if (initialData.hraBaselineSummary && (!activePlan || !activePlan.seaHra || !activePlan.seaHra.hraBaselineSummary)) setHra(initialData.hraBaselineSummary)
  }, [initialData])

  const save = async () => {
    if (!activePlan) return
    setSaving(true)
    try {
      updatePlan(activePlan.id, { seaHra: { seaScopingStatus: status, seaScopingNotes: notes, hraBaselineSummary: hra } } as any)
      if (onSaved) onSaved()
    } catch (e) {
      console.warn('Failed to save SEA data', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-ink)]">SEA / HRA scoping</h3>
      <div>
        <label className="text-sm text-[var(--color-ink)]">SEA scoping status</label>
        <select value={status} onChange={e=>setStatus(e.target.value as any)} className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded">
          <option>Not started</option>
          <option>Drafted</option>
          <option>Consulted</option>
        </select>
      </div>
      <div>
        <label className="text-sm text-[var(--color-ink)]">SEA scoping notes</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" />
      </div>
      <div>
        <label className="text-sm text-[var(--color-ink)]">HRA baseline summary</label>
        <textarea value={hra} onChange={e=>setHra(e.target.value)} rows={4} className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" />
      </div>
      <div>
        <button onClick={save} disabled={saving} className="px-3 py-2 bg-[var(--color-accent)] text-white rounded">{saving ? 'Saving…' : 'Save SEA/HRA'}</button>
      </div>
    </div>
  )
}
