import * as React from 'react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePlan } from '../../contexts/PlanContext'
import { assessGateway1, runLLMTask } from '../../utils/llmTasks'
import type { ReadinessAssessment } from '../../data/types'

const AREAS = [
  {
    id: 'timetable',
    label: 'Timetable & project management',
    description: 'Expect a credible 30-month timetable, clear milestones, and a realistic delivery plan with resourcing.',
    questions: [
      { id: 'hasDraftTimetable', label: 'Do you have a draft 30‑month timetable?', type: 'yesno' },
      { id: 'criticalMilestones', label: 'List any uncertain milestones (e.g., SEA scoping, Reg 18).', type: 'text' },
      { id: 'projectManager', label: 'Named plan/project manager?', type: 'text' },
    ],
  },
  {
    id: 'governance',
    label: 'Governance & decision-making',
    description: 'Who decides, how, and when: governance route to Cabinet/Mayor, project board, TOR, decision schedule.',
    questions: [
      { id: 'decisionMaker', label: 'Who is the political decision-maker?', type: 'text' },
      { id: 'hasBoard', label: 'Is there a formal project board?', type: 'yesno' },
      { id: 'boardFrequency', label: 'How often will the board meet?', type: 'select', options: ['Monthly', '6-weekly', 'Quarterly'] },
    ],
  },
  {
    id: 'engagement',
    label: 'Consultation & engagement strategy',
    description: 'Early engagement plan, key stakeholders, hard-to-reach, and proposed methods with timeline.',
    questions: [
      { id: 'hasStrategy', label: 'Do you have a written engagement strategy?', type: 'yesno' },
      { id: 'keyStakeholders', label: 'List key stakeholders already identified.', type: 'text' },
    ],
  },
  {
    id: 'evidence',
    label: 'Anticipated plan content & evidence',
    description: 'Baseline evidence audit, planned commissions, and how this informs plan content/outcomes.',
    questions: [
      { id: 'evidenceAudit', label: 'Have you completed an evidence audit/gap analysis?', type: 'yesno' },
      { id: 'plannedCommissions', label: 'What evidence will be commissioned next?', type: 'text' },
    ],
  },
  {
    id: 'sea',
    label: 'SEA/HRA baseline and scoping',
    description: 'Status of Strategic Environmental Assessment and Habitats Regulations Assessment baselines and scoping.',
    questions: [
      { id: 'seaScoping', label: 'Has SEA scoping been drafted or consulted?', type: 'select', options: ['Not started', 'Drafted', 'Consulted'] },
      { id: 'hraBaseline', label: 'Summarise HRA baseline status.', type: 'text' },
    ],
  },
]

export default function Gateway1Page() {
  const { activePlan, updatePlan } = usePlan()
  const [form, setForm] = useState<Record<string, Record<string, any>>>(() => {
    const init: Record<string, Record<string, any>> = {}
    for (const a of AREAS) init[a.id] = {}
    return init
  })
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    if (!activePlan) return
    // Prefill form fields from plan SEA/HRA and SCI state
    setForm(prev => {
      const next = { ...prev }
      // SEA/HRA
      const sea = activePlan.seaHra || {}
      next.sea = { ...(next.sea || {}), seaScoping: sea.seaScopingStatus || '', hraBaseline: sea.hraBaselineSummary || '' }
      // Engagement / SCI
      const sci = activePlan.sci || {}
      next.engagement = { ...(next.engagement || {}), hasStrategy: sci.hasStrategy ? 'Yes' : (sci.hasStrategy === false ? 'No' : ''), keyStakeholders: (sci.keyStakeholders || []).join(', ') }
      return next
    })
    setNotes(prev => ({ ...prev, sea: activePlan.seaHra?.seaScopingNotes || '', engagement: (activePlan.sci?.timelineNote || '') }))
  }, [activePlan])

  if (!activePlan) return <div className="p-6">No active plan.</div>

  const statusClasses = (s: string | undefined) => {
    switch (s) {
      case 'green':
      case 'G':
      case 'g':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'amber':
      case 'A':
      case 'a':
        return 'bg-amber-100 text-amber-800 border border-amber-200'
      case 'red':
      case 'R':
      case 'r':
        return 'bg-red-100 text-red-800 border border-red-200'
      default:
        return 'bg-[var(--color-surface)] border border-[var(--color-edge)] text-[var(--color-ink)]'
    }
  }

  const runAssessment = async () => {
    setRunning(true)
    try {
      const payload = {
        authorityName: activePlan.area,
        planId: activePlan.id,
        timetableInfo: activePlan.timetable,
        answers: { ...form, notes },
      }
      const assessment = await assessGateway1(payload)
      const assessed: ReadinessAssessment = {
        areas: assessment.areas || [],
        overallStatus: assessment.overallStatus,
        overallComment: assessment.overallComment,
        assessedAt: new Date().toISOString(),
      }
      updatePlan(activePlan.id, { readinessAssessment: assessed })
      const summary = await runLLMTask('gateway1_summary', {
        authorityName: activePlan.area,
        gatewayStatus: assessed.overallStatus,
        readinessAssessment: assessed,
        timetable: activePlan.timetable,
        planOverview: { title: activePlan.title, area: activePlan.area },
      })
      updatePlan(activePlan.id, { gateway1SummaryText: typeof summary === 'string' ? summary : JSON.stringify(summary) })
    } catch (e) {
      console.warn('Gateway 1 assessment failed', e)
    } finally {
      setRunning(false)
    }
  }

  const publish = () => {
    const noticeDate = new Date().toISOString()
    const milestones = Array.isArray(activePlan.timetable?.milestones) ? [...activePlan.timetable.milestones] : []
    const hasG1 = milestones.find(m => m.stageId === 'GATEWAY_1')
    if (!hasG1) milestones.push({ stageId: 'GATEWAY_1', date: noticeDate })
    updatePlan(activePlan.id, { planStage: 'BASELINING', gateway1PublishedAt: noticeDate, timetable: { ...activePlan.timetable, noticeToCommenceDate: noticeDate, milestones } } as any)
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-[var(--color-ink)]">Gateway 1: Readiness Self-Assessment</h2>

      {/* Area cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {AREAS.map(area => (
          <div key={area.id} className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded-lg p-4">
            <div className="font-semibold text-[var(--color-ink)]">{area.label}</div>
            <p className="text-sm text-[var(--color-muted)] mb-3">{area.description}</p>
            <div className="space-y-3">
              {area.questions.map(q => (
                <div key={q.id} className="space-y-1">
                  <label className="text-sm text-[var(--color-ink)]">{q.label}</label>
                  {q.type === 'text' && (
                    <input className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" value={form[area.id][q.id] || ''} onChange={e=>setForm(prev=>({ ...prev, [area.id]: { ...prev[area.id], [q.id]: e.target.value } }))} />
                  )}
                  {q.type === 'yesno' && (
                    <select className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" value={form[area.id][q.id] || ''} onChange={e=>setForm(prev=>({ ...prev, [area.id]: { ...prev[area.id], [q.id]: e.target.value } }))}>
                      <option value="">Select…</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  )}
                  {q.type === 'select' && (
                    <select className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" value={form[area.id][q.id] || ''} onChange={e=>setForm(prev=>({ ...prev, [area.id]: { ...prev[area.id], [q.id]: e.target.value } }))}>
                      <option value="">Select…</option>
                      {q.options?.map((opt: string)=> <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  )}
                </div>
              ))}
              <div>
                <label className="text-sm text-[var(--color-ink)]">Other notes</label>
                <textarea className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-edge)] rounded" rows={3} value={notes[area.id] || ''} onChange={e=>setNotes(prev=>({ ...prev, [area.id]: e.target.value }))} />
              </div>
              {/* Helpful quick links when plan data is missing */}
              {area.id === 'sea' && (!activePlan.seaHra || activePlan.seaHra.seaScopingStatus === 'Not started') && (
                <div className="mt-2 text-xs">
                  <Link to="/app?tool=sea" className="text-[var(--color-accent)] hover:underline">Open SEA/HRA tool to draft scoping</Link>
                </div>
              )}
              {area.id === 'engagement' && (!activePlan.sci || !activePlan.sci.hasStrategy) && (
                <div className="mt-2 text-xs">
                  <Link to="/app?tool=sci" className="text-[var(--color-accent)] hover:underline">Open SCI tool to capture engagement strategy</Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-2 bg-[var(--color-accent)] text-white rounded" onClick={runAssessment} disabled={running}>{running ? 'Assessing…' : 'Run Readiness RAG'}</button>
        <button className="px-3 py-2 bg-[var(--color-ink)] text-white rounded" onClick={async ()=>{
          // Allow generating summary again based on existing readiness
          if (!activePlan.readinessAssessment) return
          const s = await runLLMTask('gateway1_summary', {
            authorityName: activePlan.area,
            gatewayStatus: activePlan.readinessAssessment.overallStatus,
            readinessAssessment: activePlan.readinessAssessment,
            timetable: activePlan.timetable,
            planOverview: { title: activePlan.title, area: activePlan.area },
          })
          updatePlan(activePlan.id, { gateway1SummaryText: typeof s === 'string' ? s : JSON.stringify(s) })
        }} disabled={!activePlan.readinessAssessment}>Generate summary</button>
        <button className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50" onClick={publish} disabled={!(activePlan.readinessAssessment && activePlan.gateway1SummaryText)}>Publish Gateway 1</button>
      </div>

      {/* Readiness Results */}
      {activePlan.readinessAssessment && (
        <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-[var(--color-ink)]">Readiness Results</div>
            {activePlan.readinessAssessment.overallStatus && (
              <span className={`px-2 py-1 text-xs rounded ${statusClasses(activePlan.readinessAssessment.overallStatus)}`}>Overall: {activePlan.readinessAssessment.overallStatus.toUpperCase()}</span>
            )}
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-muted)]">
                  <th className="py-2 pr-3">Area</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Summary</th>
                  <th className="py-2 pr-3">Critical gaps</th>
                </tr>
              </thead>
              <tbody>
                {activePlan.readinessAssessment.areas.map((a, idx) => (
                  <tr key={idx} className="border-t border-[var(--color-edge)]">
                    <td className="py-2 pr-3">{a.id}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-1 text-xs rounded ${statusClasses(a.rag)}`}>{(a.rag || '').toUpperCase()}</span>
                    </td>
                    <td className="py-2 pr-3">{a.summary}</td>
                    <td className="py-2 pr-3">{(a.actions||[]).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gateway 1 Summary */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-[var(--color-ink)]">Gateway 1 self-assessment summary (for publication)</div>
          <button className="text-sm text-[var(--color-accent)]" onClick={async ()=>{
            if (!activePlan.readinessAssessment) return
            const s = await runLLMTask('gateway1_summary', {
              authorityName: activePlan.area,
              gatewayStatus: activePlan.readinessAssessment.overallStatus,
              readinessAssessment: activePlan.readinessAssessment,
              timetable: activePlan.timetable,
              planOverview: { title: activePlan.title, area: activePlan.area },
            })
            updatePlan(activePlan.id, { gateway1SummaryText: typeof s === 'string' ? s : JSON.stringify(s) })
          }}>Regenerate with AI</button>
        </div>
        <div className="text-sm whitespace-pre-wrap text-[var(--color-ink)] min-h-[80px]">{activePlan.gateway1SummaryText || 'No summary yet. Run RAG then generate summary.'}</div>
      </div>

      {/* Developer debug */}
      <div className="bg-[var(--color-panel)] border border-[var(--color-edge)] rounded p-3">
        <button className="text-sm text-[var(--color-accent)]" onClick={()=>setShowDebug(s=>!s)}>{showDebug ? 'Hide' : 'Show'} raw LLM payloads</button>
        {showDebug && (
          <div className="mt-3 grid gap-3">
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify({ form, notes }, null, 2)}</pre>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(activePlan.readinessAssessment, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}