import * as React from 'react'
import { useState, useEffect } from 'react'
import type { CouncilData } from '../../../../data/types'
import { usePlan } from '../../../../contexts/PlanContext'

interface HRAToolProps {
  councilData: CouncilData
  autoRun?: boolean
  onSaved?: () => void
}

export const HRATool: React.FC<HRAToolProps> = ({ councilData, autoRun = false, onSaved }) => {
  const { activePlan, updatePlan } = usePlan()
  const [hra, setHra] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!activePlan) return
    const s = activePlan.seaHra
    if (s?.hraBaselineSummary) setHra(s.hraBaselineSummary)
  }, [activePlan])

  const save = async () => {
    if (!activePlan) return
    setSaving(true)
    try {
      const next = { ...(activePlan.seaHra || {}), hraBaselineSummary: hra }
      updatePlan(activePlan.id, { seaHra: next } as any)
      if (onSaved) onSaved()
    } catch (e) {
      console.warn('Failed to save HRA data', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-ink)]">HRA baseline</h3>
      <div>
        <label className="text-sm text-[var(--color-ink)]">HRA baseline summary</label>
        <textarea value={hra} onChange={e=>setHra(e.target.value)} rows={6} className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" />
      </div>
      <div>
        <button onClick={save} disabled={saving} className="px-3 py-2 bg-[var(--color-accent)] text-white rounded">{saving ? 'Saving…' : 'Save HRA'}</button>
      </div>
    </div>
  )
}
