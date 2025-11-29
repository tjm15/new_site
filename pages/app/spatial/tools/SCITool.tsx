import * as React from 'react'
import { useState, useEffect } from 'react'
import type { CouncilData } from '../../../../data/types'
import { usePlan } from '../../../../contexts/PlanContext'

interface SCIToolProps {
  councilData: CouncilData
  autoRun?: boolean
  onSaved?: () => void
  initialData?: Record<string, any>
}

export const SCITool: React.FC<SCIToolProps> = ({ councilData, autoRun = false, onSaved, initialData }) => {
  const { activePlan, updatePlan } = usePlan()
  const [hasStrategy, setHasStrategy] = useState(false)
  const [keyStakeholders, setKeyStakeholders] = useState('')
  const [methods, setMethods] = useState('')
  const [timelineNote, setTimelineNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!activePlan) return
    const s = activePlan.sci
    if (s) {
      if (typeof s.hasStrategy === 'boolean') setHasStrategy(s.hasStrategy)
      if (s.keyStakeholders) setKeyStakeholders((s.keyStakeholders || []).join(', '))
      if (s.methods) setMethods((s.methods || []).join(', '))
      if (s.timelineNote) setTimelineNote(s.timelineNote)
    }
  }, [activePlan])

  // Apply any LLM-suggested prefill data (do not overwrite already-saved plan data)
  useEffect(() => {
    // @ts-ignore - initialData may be any shape from LLM
    if (!initialData) return
    // prefer plan values if they exist
    if (initialData.hasStrategy !== undefined && (!activePlan || !activePlan.sci || typeof activePlan.sci.hasStrategy !== 'boolean')) setHasStrategy(Boolean(initialData.hasStrategy))
    if (initialData.keyStakeholders && (!activePlan || !activePlan.sci || !(activePlan.sci.keyStakeholders && activePlan.sci.keyStakeholders.length))) setKeyStakeholders((initialData.keyStakeholders || []).join ? (initialData.keyStakeholders || []).join(', ') : String(initialData.keyStakeholders))
    if (initialData.methods && (!activePlan || !activePlan.sci || !(activePlan.sci.methods && activePlan.sci.methods.length))) setMethods((initialData.methods || []).join ? (initialData.methods || []).join(', ') : String(initialData.methods))
    if (initialData.timelineNote && (!activePlan || !activePlan.sci || !activePlan.sci.timelineNote)) setTimelineNote(initialData.timelineNote)
  }, [initialData])

  const save = async () => {
    if (!activePlan) return
    setSaving(true)
    try {
      const next = { hasStrategy, keyStakeholders: keyStakeholders.split(',').map(s=>s.trim()).filter(Boolean), methods: methods.split(',').map(s=>s.trim()).filter(Boolean), timelineNote }
      updatePlan(activePlan.id, { sci: next } as any)
      if (onSaved) onSaved()
    } catch (e) {
      console.warn('Failed to save SCI data', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-ink)]">Statement of Community Involvement (SCI)</h3>
      <div>
        <label className="text-sm text-[var(--color-ink)]">Do you have a written engagement strategy?</label>
        <select value={hasStrategy ? 'yes' : 'no'} onChange={e=>setHasStrategy(e.target.value==='yes')} className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded">
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
      <div>
        <label className="text-sm text-[var(--color-ink)]">Key stakeholders (comma separated)</label>
        <input value={keyStakeholders} onChange={e=>setKeyStakeholders(e.target.value)} className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" />
      </div>
      <div>
        <label className="text-sm text-[var(--color-ink)]">Proposed engagement methods (comma separated)</label>
        <input value={methods} onChange={e=>setMethods(e.target.value)} className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" />
      </div>
      <div>
        <label className="text-sm text-[var(--color-ink)]">Timeline note</label>
        <textarea value={timelineNote} onChange={e=>setTimelineNote(e.target.value)} rows={3} className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" />
      </div>
      <div>
        <button onClick={save} disabled={saving} className="px-3 py-2 bg-[var(--color-accent)] text-white rounded">{saving ? 'Saving…' : 'Save SCI'}</button>
      </div>
    </div>
  )
}
