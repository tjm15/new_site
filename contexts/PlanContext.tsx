import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import type { Plan } from '../data/types'
import { NEW_SYSTEM_STAGES } from '../constants'
import { STAGES, type PlanStageId } from '../data/stageMeta'
import { PLAN_SEEDS } from '../data/planSeeds'

type PlanCtx = {
  plans: Plan[]
  activePlan?: Plan
  getActiveForCouncil: (councilId: string) => Plan | undefined
  createPlan: (partial: Pick<Plan, 'title' | 'area' | 'systemType' | 'councilId'>) => Plan
  setActivePlan: (id: string) => void
  setActiveForCouncil: (councilId: string, id: string) => void
  updatePlan: (id: string, patch: Partial<Plan>) => void
  setPlanStage: (id: string, stage: PlanStageId) => void
}

const Ctx = createContext<PlanCtx | null>(null)

const legacyStageIdMap: Record<string, PlanStageId> = {
  PREP: 'TIMETABLE',
  SUBMISSION: 'SUBMISSION_EXAM',
  ADOPTION: 'ADOPTION',
  ADOPTION_MONITORING: 'ADOPTION',
}

function normalizePlan(plan: Plan): Plan {
  if (plan.systemType !== 'new') return { ...plan, smartOutcomes: plan.smartOutcomes || [], preferredOptions: plan.preferredOptions || {}, strategyDraft: plan.strategyDraft || {}, consultationPack: plan.consultationPack || { sections: [] }, gateway2Pack: plan.gateway2Pack || { sections: [] } }
  const seaHraDefaults = {
    seaScopingStatus: 'Not started',
    seaScopingNotes: '',
    hraBaselineSummary: '',
    baselineGrid: {},
    baselineCompleteness: 'red' as 'red' | 'amber' | 'green',
    readinessScore: 0,
    readinessNotes: '',
    mitigationIdeas: [] as string[],
    cumulativeEffects: '',
    consultationStatus: 'not_started' as 'not_started' | 'live' | 'complete',
    consultationNotes: '',
    reportDraft: '',
    environmentalDatabase: [] as string[],
    keyRisks: [] as string[],
  }
  const mappedStage = (legacyStageIdMap[plan.planStage as string] || plan.planStage || legacyStageIdMap[plan.currentStage as string] || plan.currentStage || NEW_SYSTEM_STAGES[0].id) as PlanStageId
  const milestoneMap = (plan.timetable?.milestones || []).reduce<Record<string, string>>((acc, m) => {
    if (m.stageId && m.date) acc[m.stageId] = m.date
    return acc
  }, {})
  const existingById = (plan.stages || []).reduce<Record<string, any>>((acc, stage) => {
    const normalizedId = (legacyStageIdMap[stage.id as string] as PlanStageId) || stage.id
    acc[normalizedId] = { ...stage, id: normalizedId }
    return acc
  }, {})
  const mergedStages = NEW_SYSTEM_STAGES.map(stage => ({
    id: stage.id,
    title: stage.title,
    band: stage.band,
    ...(existingById[stage.id] || {}),
    targetDate: (existingById[stage.id]?.targetDate) || milestoneMap[stage.id],
  }))
  const migratedMilestones = (plan.timetable?.milestones || []).map(m => ({
    ...m,
    stageId: (legacyStageIdMap[m.stageId as string] as PlanStageId) || m.stageId,
  }))
  return {
    ...plan,
    preferredOptions: plan.preferredOptions || {},
    stages: mergedStages,
    planStage: mappedStage,
    timetable: { ...(plan.timetable || { milestones: [] }), milestones: migratedMilestones },
    seaHra: { ...seaHraDefaults, ...(plan.seaHra || {}) },
    sci: { hasStrategy: false, keyStakeholders: [], methods: [], timelineNote: '', ...(plan.sci || {}) },
    smartOutcomes: plan.smartOutcomes || [],
    strategyDraft: plan.strategyDraft || {},
    consultationPack: plan.consultationPack || { sections: [] },
    gateway2Pack: plan.gateway2Pack || { sections: [] }
  }
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<Plan[]>(() => {
    const raw = localStorage.getItem('plans.v1')
    const parsed = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed) && parsed.length) return parsed.map(normalizePlan)
    // Seed default demo plans if none saved
    return Object.values(PLAN_SEEDS).map(normalizePlan)
  })
  const [activeId, setActiveId] = useState<string | undefined>(() => {
    return localStorage.getItem('plans.activeId') || undefined
  })
  const [activeByCouncil, setActiveByCouncil] = useState<Record<string, string>>(() => {
    const raw = localStorage.getItem('plans.activeByCouncil')
    return raw ? JSON.parse(raw) : {}
  })

  useEffect(() => {
    localStorage.setItem('plans.v1', JSON.stringify(plans))
  }, [plans])
  useEffect(() => {
    if (activeId) localStorage.setItem('plans.activeId', activeId)
  }, [activeId])
  useEffect(() => {
    localStorage.setItem('plans.activeByCouncil', JSON.stringify(activeByCouncil))
  }, [activeByCouncil])

  const activePlan = useMemo(() => plans.find(p => p.id === activeId), [plans, activeId])
  const getActiveForCouncil = (councilId: string) => {
    const id = activeByCouncil[councilId]
    if (id) {
      const found = plans.find(p => p.id === id)
      if (found && found.councilId === councilId) return found
    }
    // Fallback: first plan matching this council
    const fallback = plans.find(p => p.councilId === councilId)
    return fallback
  }

  const createPlan: PlanCtx['createPlan'] = (partial) => {
    const id = `plan_${Date.now()}`
    const stages = NEW_SYSTEM_STAGES.map(s => ({ id: s.id, title: s.title, band: s.band }))
    const plan: Plan = {
      id,
      title: partial.title,
      area: partial.area,
      councilId: partial.councilId,
      systemType: partial.systemType,
      stages,
      timetable: { milestones: [] },
      smartOutcomes: [],
      visionStatements: [],
      sites: [],
      // New workflow-centric field
      planStage: STAGES[0].id,
      strategyDraft: {},
      preferredOptions: {},
      consultationPack: { sections: [] },
      gateway2Pack: { sections: [] },
      // initialize SEA/HRA and SCI blanks so components can safely read
      seaHra: {
        seaScopingStatus: 'Not started',
        seaScopingNotes: '',
        hraBaselineSummary: '',
        baselineGrid: {},
        baselineCompleteness: 'red',
        readinessScore: 0,
        readinessNotes: '',
        mitigationIdeas: [],
        cumulativeEffects: '',
        consultationStatus: 'not_started',
        consultationNotes: '',
        reportDraft: '',
        environmentalDatabase: [],
        keyRisks: []
      },
      sci: { hasStrategy: false, keyStakeholders: [], methods: [], timelineNote: '' }
    }
    setPlans(prev => [...prev, plan])
    setActiveId(id)
    if (partial.councilId) {
      setActiveByCouncil(prev => ({ ...prev, [partial.councilId!]: id }))
    }
    return plan
  }

  const setActivePlan = (id: string) => setActiveId(id)
  const setActiveForCouncil = (councilId: string, id: string) => {
    setActiveByCouncil(prev => ({ ...prev, [councilId]: id }))
  }
  const updatePlan = (id: string, patch: Partial<Plan>) => {
    setPlans(prev => prev.map(p => (p.id === id ? normalizePlan({ ...p, ...patch }) : p)))
  }

  const setPlanStage: PlanCtx['setPlanStage'] = (id, stage) => {
    setPlans(prev => prev.map(p => (p.id === id ? { ...p, planStage: stage } : p)))
  }

  const value: PlanCtx = { plans, activePlan, getActiveForCouncil, createPlan, setActivePlan, setActiveForCouncil, updatePlan, setPlanStage }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePlan() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePlan must be used within PlanProvider')
  return ctx
}
