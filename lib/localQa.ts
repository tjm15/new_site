// Lightweight local retrieval using @xenova/transformers with lazy loading.
// Builds a simple in-memory index per plan from outcomes, sites, and policies.
export type RetrievedChunk = { text: string; source?: string }

type PlanLike = {
  id: string
  visionStatements?: Array<{ id: string; text: string }>
  smartOutcomes?: Array<{ id: string; outcomeStatement?: string; text?: string; theme?: string; measurable?: string }>
  sites?: Array<{ id: string; name: string; notes?: string; suitability?: string; availability?: string; achievability?: string }>
  // include SEA/HRA and SCI summary fields for retrieval
  seaHra?: { seaScopingStatus?: string; seaScopingNotes?: string; hraBaselineSummary?: string }
  sci?: { hasStrategy?: boolean; keyStakeholders?: string[]; methods?: string[]; timelineNote?: string }
}
type CouncilLike = { policies?: Array<{ reference: string; title: string; summary: string; text: string }> }

let modelPromise: Promise<any> | null = null
const planCache: Record<string, { texts: string[]; meta: RetrievedChunk[]; embeddings?: Float32Array[] }> = {}

async function getModel() {
  if (!modelPromise) {
    modelPromise = import('@xenova/transformers').then(async ({ pipeline }) => {
      const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
      return extractor
    })
  }
  return modelPromise
}

function cosine(a: Float32Array, b: Float32Array) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8)
}

async function embedAll(model: any, arr: string[]): Promise<Float32Array[]> {
  const out: Float32Array[] = []
  for (const text of arr) {
    const res = await model(text, { pooling: 'mean', normalize: true })
    out.push(res.data as Float32Array)
  }
  return out
}

function buildTexts(plan: PlanLike, council?: CouncilLike): { texts: string[]; meta: RetrievedChunk[] } {
  const texts: string[] = []
  const meta: RetrievedChunk[] = []
  // Outcomes
  for (const o of plan.visionStatements || []) {
    const t = `Outcome: ${o.text}`
    texts.push(t)
    meta.push({ text: t, source: 'outcome' })
  }
  for (const o of plan.smartOutcomes || []) {
    const t = `SMART outcome (${o.theme || 'general'}): ${o.outcomeStatement || o.text} — measure: ${o.measurable || ''}`.trim()
    texts.push(t)
    meta.push({ text: t, source: 'outcome' })
  }
  // SEA / HRA
  if (plan.seaHra) {
    const s = plan.seaHra
    if (s.seaScopingStatus) {
      const t = `SEA scoping status: ${s.seaScopingStatus}`
      texts.push(t)
      meta.push({ text: t, source: 'sea' })
    }
    if (s.seaScopingNotes) {
      const t = `SEA scoping notes: ${s.seaScopingNotes}`
      texts.push(t)
      meta.push({ text: t, source: 'sea' })
    }
    if (s.hraBaselineSummary) {
      const t = `HRA baseline summary: ${s.hraBaselineSummary}`
      texts.push(t)
      meta.push({ text: t, source: 'hra' })
    }
    if (s.baselineGrid) {
      Object.entries(s.baselineGrid).forEach(([k, v]) => {
        if (!v) return
        const t = `SEA baseline (${k}): ${v}`
        texts.push(t)
        meta.push({ text: t, source: 'sea' })
      })
    }
    if (Array.isArray(s.keyRisks)) {
      const t = `SEA/HRA risks: ${s.keyRisks.join('; ')}`
      texts.push(t)
      meta.push({ text: t, source: 'sea' })
    }
    if (Array.isArray(s.mitigationIdeas)) {
      const t = `SEA/HRA mitigation ideas: ${s.mitigationIdeas.join('; ')}`
      texts.push(t)
      meta.push({ text: t, source: 'sea' })
    }
    if (s.cumulativeEffects) {
      const t = `Cumulative effects: ${s.cumulativeEffects}`
      texts.push(t)
      meta.push({ text: t, source: 'sea' })
    }
  }
  // SCI / engagement
  if (plan.sci) {
    const c = plan.sci
    if (typeof c.hasStrategy === 'boolean') {
      const t = `Has engagement strategy: ${c.hasStrategy ? 'Yes' : 'No'}`
      texts.push(t)
      meta.push({ text: t, source: 'sci' })
    }
    if (c.keyStakeholders && c.keyStakeholders.length) {
      const t = `Key stakeholders: ${c.keyStakeholders.join(', ')}`
      texts.push(t)
      meta.push({ text: t, source: 'sci' })
    }
    if (c.methods && c.methods.length) {
      const t = `Engagement methods: ${c.methods.join(', ')}`
      texts.push(t)
      meta.push({ text: t, source: 'sci' })
    }
    if (c.timelineNote) {
      const t = `Engagement timeline note: ${c.timelineNote}`
      texts.push(t)
      meta.push({ text: t, source: 'sci' })
    }
  }
  // Sites
  for (const s of plan.sites || []) {
    const rag = [s.suitability, s.availability, s.achievability].filter(Boolean).join('/')
    const t = `Site ${s.name}: notes ${s.notes || ''} RAG ${rag}`.trim()
    if (t) {
      texts.push(t)
      meta.push({ text: t, source: 'site' })
    }
  }
  // Policies (summaries)
  for (const p of council?.policies || []) {
    const t = `Policy ${p.reference} ${p.title}: ${p.summary}`
    texts.push(t)
    meta.push({ text: t, source: 'policy' })
  }
  return { texts, meta }
}

export async function retrieveContext(
  question: string,
  plan: PlanLike,
  council?: CouncilLike,
  topK = 5
): Promise<RetrievedChunk[]> {
  const model = await getModel().catch(() => null)
  let cache = planCache[plan.id]
  if (!cache) {
    cache = planCache[plan.id] = buildTexts(plan, council)
  }
  // Fallback: simple keyword scoring if the model cannot be loaded.
  if (!model) {
    const keywords = question.toLowerCase().split(/\W+/).filter(w => w.length > 3)
    const scored = cache.meta.map((m, i) => {
      const text = cache.texts[i].toLowerCase()
      const score = keywords.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0)
      return { i, score }
    })
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, topK).map(({ i }) => cache!.meta[i])
  }

  if (!cache.embeddings) {
    cache.embeddings = await embedAll(model, cache.texts)
  }
  const qemb = (await model(question, { pooling: 'mean', normalize: true })).data as Float32Array
  const scored = cache.embeddings.map((e, i) => ({ i, score: cosine(qemb, e) }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK).map(({ i }) => cache!.meta[i])
}
// Polyfill esbuild helper when it isn't injected (seen in browser bundles with transformers)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).__publicField = (globalThis as any).__publicField || ((obj: any, key: any, value: any) => {
  obj[key] = value
  return value
})
