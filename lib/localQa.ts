// Lightweight local retrieval using @xenova/transformers with lazy loading.
// Builds a simple in-memory index per plan (and council) from outcomes, sites, and policies.
export type RetrievedChunk = { id: string; text: string; source?: string; field?: string; chunkIndex?: number; score?: number }

type PlanLike = {
  id: string
  councilId?: string
  visionStatements?: Array<{ id: string; text: string }>
  smartOutcomes?: Array<{ id: string; outcomeStatement?: string; text?: string; theme?: string; measurable?: string }>
  sites?: Array<{ id: string; name: string; notes?: string; suitability?: string; availability?: string; achievability?: string }>
  // include SEA/HRA and SCI summary fields for retrieval
  seaHra?: { seaScopingStatus?: string; seaScopingNotes?: string; hraBaselineSummary?: string }
  sci?: { hasStrategy?: boolean; keyStakeholders?: string[]; methods?: string[]; timelineNote?: string }
  preferredOptions?: {
    strategy?: { label?: string; analysis?: string }
    policy?: { topicLabel?: string; draft?: string }
    site?: { id?: string; name?: string; rationale?: string; appraisal?: string }
    evidence?: { id?: string; title?: string; content?: string }
  }
}
type CouncilLike = { id?: string; policies?: Array<{ reference: string; title: string; summary: string; text: string }> }

let modelPromise: Promise<any> | null = null
const planCache: Record<string, { texts: string[]; meta: RetrievedChunk[]; embeddings?: Float32Array[]; signature: string }> = {}

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
  const batchSize = 4
  for (let i = 0; i < arr.length; i += batchSize) {
    const batch = arr.slice(i, i + batchSize)
    // Process in small batches to avoid large memory spikes
    // eslint-disable-next-line no-await-in-loop
    const embedded = await Promise.all(batch.map(text => model(text, { pooling: 'mean', normalize: true })))
    embedded.forEach(res => out.push(res.data as Float32Array))
  }
  return out
}

function chunkText(text: string, maxLen = 480): string[] {
  if (!text) return []
  const clean = text.toString().replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLen) return [clean]
  const words = clean.split(' ')
  const chunks: string[] = []
  let current: string[] = []
  for (const w of words) {
    if (current.join(' ').length + w.length + 1 > maxLen) {
      chunks.push(current.join(' '))
      current = []
    }
    current.push(w)
  }
  if (current.length) chunks.push(current.join(' '))
  return chunks
}

function hashString(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i)
    hash |= 0
  }
  return hash.toString()
}

function buildTexts(plan: PlanLike, council?: CouncilLike): { texts: string[]; meta: RetrievedChunk[] } {
  const texts: string[] = []
  const meta: RetrievedChunk[] = []
  let chunkCounter = 0
  // Outcomes
  for (const o of plan.visionStatements || []) {
    const t = `Outcome: ${o.text}`
    texts.push(t)
    meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'outcome', field: 'visionStatements', chunkIndex: 0 })
  }
  for (const o of plan.smartOutcomes || []) {
    const t = `SMART outcome (${o.theme || 'general'}): ${o.outcomeStatement || o.text} — measure: ${o.measurable || ''}`.trim()
    texts.push(t)
    meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'outcome', field: 'smartOutcomes', chunkIndex: 0 })
  }
  // SEA / HRA
  if (plan.seaHra) {
    const s = plan.seaHra
    if (s.seaScopingStatus) {
      const t = `SEA scoping status: ${s.seaScopingStatus}`
      texts.push(t)
      meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'sea', field: 'seaHra', chunkIndex: 0 })
    }
    if (s.seaScopingNotes) {
      const t = `SEA scoping notes: ${s.seaScopingNotes}`
      texts.push(t)
      meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'sea', field: 'seaHra', chunkIndex: 1 })
    }
    if (s.hraBaselineSummary) {
      const t = `HRA baseline summary: ${s.hraBaselineSummary}`
      texts.push(t)
      meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'hra', field: 'seaHra', chunkIndex: 2 })
    }
    if (s.baselineGrid) {
      Object.entries(s.baselineGrid).forEach(([k, v]) => {
        if (!v) return
        const t = `SEA baseline (${k}): ${v}`
        texts.push(t)
        meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'sea', field: `seaHra.${k}`, chunkIndex: 0 })
      })
    }
    if (Array.isArray(s.keyRisks)) {
      const t = `SEA/HRA risks: ${s.keyRisks.join('; ')}`
      texts.push(t)
      meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'sea', field: 'seaHra.keyRisks', chunkIndex: 0 })
    }
    if (Array.isArray(s.mitigationIdeas)) {
      const t = `SEA/HRA mitigation ideas: ${s.mitigationIdeas.join('; ')}`
      texts.push(t)
      meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'sea', field: 'seaHra.mitigationIdeas', chunkIndex: 0 })
    }
    if (s.cumulativeEffects) {
      const t = `Cumulative effects: ${s.cumulativeEffects}`
      texts.push(t)
      meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'sea', field: 'seaHra.cumulativeEffects', chunkIndex: 0 })
    }
  }
  // SCI / engagement
  if (plan.sci) {
    const c = plan.sci
    if (typeof c.hasStrategy === 'boolean') {
      const t = `Has engagement strategy: ${c.hasStrategy ? 'Yes' : 'No'}`
      texts.push(t)
      meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'sci', field: 'sci.hasStrategy', chunkIndex: 0 })
    }
    if (c.keyStakeholders && c.keyStakeholders.length) {
      const t = `Key stakeholders: ${c.keyStakeholders.join(', ')}`
      texts.push(t)
      meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'sci', field: 'sci.keyStakeholders', chunkIndex: 0 })
    }
    if (c.methods && c.methods.length) {
      const t = `Engagement methods: ${c.methods.join(', ')}`
      texts.push(t)
      meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'sci', field: 'sci.methods', chunkIndex: 0 })
    }
    if (c.timelineNote) {
      const t = `Engagement timeline note: ${c.timelineNote}`
      texts.push(t)
      meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'sci', field: 'sci.timelineNote', chunkIndex: 0 })
    }
  }
  // Sites
  for (const s of plan.sites || []) {
    const rag = [s.suitability, s.availability, s.achievability].filter(Boolean).join('/')
    const t = `Site ${s.name}: notes ${s.notes || ''} RAG ${rag}`.trim()
    if (t) {
      texts.push(t)
      meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'site', field: `sites.${s.id}`, chunkIndex: 0 })
    }
  }
  // Chunked readiness and narrative data
  const readiness = (plan as any).readinessAssessment
  if (readiness?.areas) {
    for (const area of readiness.areas) {
      const chunks = chunkText(area.summary || '')
      chunks.forEach((c, idx) => {
        const t = `Readiness (${area.id || 'area'}) [${idx + 1}]: ${c}`
        texts.push(t)
        meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'readiness', field: `readiness.${area.id || 'area'}`, chunkIndex: idx })
      })
    }
  }
  if ((plan as any).baselineNarrative) {
    chunkText((plan as any).baselineNarrative).forEach((c, idx) => {
      const t = `Baseline narrative [${idx + 1}]: ${c}`
      texts.push(t)
      meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'baseline', field: 'baselineNarrative', chunkIndex: idx })
    })
  }
  // Preferred options snapshot
  const prefs = plan.preferredOptions
  if (prefs?.strategy) {
    const t = `Preferred strategy: ${prefs.strategy.label || 'Unnamed'} — ${prefs.strategy.analysis || ''}`.trim()
    texts.push(t)
    meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'strategy', field: 'preferredOptions.strategy', chunkIndex: 0 })
  }
  if (prefs?.policy) {
    const t = `Preferred policy (${prefs.policy.topicLabel || 'topic'}): ${prefs.policy.draft || ''}`.trim()
    texts.push(t)
    meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'policy', field: 'preferredOptions.policy', chunkIndex: 0 })
  }
  if (prefs?.site) {
    const t = `Preferred site: ${prefs.site.name || prefs.site.id || 'site'} — ${prefs.site.rationale || prefs.site.appraisal || ''}`.trim()
    texts.push(t)
    meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'site_preferred', field: 'preferredOptions.site', chunkIndex: 0 })
  }
  if (prefs?.evidence) {
    const t = `Preferred evidence: ${prefs.evidence.title || ''} — ${prefs.evidence.content || ''}`.trim()
    texts.push(t)
    meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'evidence', field: 'preferredOptions.evidence', chunkIndex: 0 })
  }
  // Whole-plan JSON chunks for QA (capped to avoid dominance)
  const planJson = JSON.stringify(plan, null, 2)
  chunkText(planJson, 520).slice(0, 6).forEach((c, idx) => {
    const t = `Plan object chunk [${idx + 1}]: ${c}`
    texts.push(t)
    meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'plan_json', field: 'plan', chunkIndex: idx })
  })
  // Policies (summaries)
  for (const p of council?.policies || []) {
    const t = `Policy ${p.reference} ${p.title}: ${p.summary}`
    texts.push(t)
    meta.push({ id: `chunk_${chunkCounter++}`, text: t, source: 'policy', field: `policy.${p.reference}`, chunkIndex: 0 })
  }
  return { texts, meta }
}

export async function retrieveContext(
  question: string,
  plan: PlanLike,
  council?: CouncilLike,
  topK = 5,
  minScore = 0.2
): Promise<RetrievedChunk[]> {
  const planSignature = hashString(JSON.stringify(plan))
  const cacheKey = `${plan.councilId || (council?.id || 'unknown')}:${plan.id}`
  const model = await getModel().catch(() => null)
  let cache = planCache[cacheKey]
  if (!cache || cache.signature !== planSignature) {
    cache = { ...buildTexts(plan, council), signature: planSignature }
    planCache[cacheKey] = cache
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
    return scored.slice(0, topK).map(({ i, score }) => ({ ...cache!.meta[i], score }))
  }

  if (!cache.embeddings) {
    cache.embeddings = await embedAll(model, cache.texts)
  }
  const qemb = (await model(question, { pooling: 'mean', normalize: true })).data as Float32Array
  const scored = cache.embeddings.map((e, i) => ({ i, score: cosine(qemb, e) }))
  scored.sort((a, b) => b.score - a.score)
  const filtered = scored.filter(s => s.score >= minScore).slice(0, topK)
  return filtered.map(({ i, score }) => ({ ...cache!.meta[i], score }))
}
// Polyfill esbuild helper when it isn't injected (seen in browser bundles with transformers)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).__publicField = (globalThis as any).__publicField || ((obj: any, key: any, value: any) => {
  obj[key] = value
  return value
})
