// Lightweight local retrieval using @xenova/transformers with lazy loading.
// Builds a simple in-memory index per plan (and council) from outcomes, sites, and policies.
export type RetrievedChunk = { id: string; text: string; source?: string; field?: string; chunkIndex?: number; score?: number }

type PlanLike = {
  id: string
  councilId?: string
  visionStatements?: Array<{ id: string; text: string }>
  smartOutcomes?: Array<{ id: string; outcomeStatement?: string; text?: string; theme?: string; measurable?: string }>
  sites?: Array<{ id: string; name: string; notes?: string; suitability?: string; availability?: string; achievability?: string }>
  stages?: Array<{ id: string; title?: string; targetDate?: string }>
  timetable?: { milestones?: Array<{ stageId?: string; date?: string }> }
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
const EMBED_STORAGE_PREFIX = 'plan.embeddings.v1:'

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
  const addChunk = (text: string, source: string, field: string, chunkIndex: number) => {
    if (!text) return
    texts.push(text)
    meta.push({ id: `chunk_${chunkCounter++}`, text, source, field, chunkIndex })
  }
  // Outcomes
  for (const o of plan.visionStatements || []) {
    addChunk(`Outcome: ${o.text}`, 'outcome', 'visionStatements', 0)
  }
  for (const o of plan.smartOutcomes || []) {
    addChunk(`SMART outcome (${o.theme || 'general'}): ${o.outcomeStatement || o.text} — measure: ${o.measurable || ''}`.trim(), 'outcome', 'smartOutcomes', 0)
  }
  // SEA / HRA
  if (plan.seaHra) {
    const s = plan.seaHra
    if (s.seaScopingStatus) {
      addChunk(`SEA scoping status: ${s.seaScopingStatus}`, 'sea', 'seaHra', 0)
    }
    if (s.seaScopingNotes) {
      addChunk(`SEA scoping notes: ${s.seaScopingNotes}`, 'sea', 'seaHra', 1)
    }
    if (s.hraBaselineSummary) {
      addChunk(`HRA baseline summary: ${s.hraBaselineSummary}`, 'hra', 'seaHra', 2)
    }
    if (s.baselineGrid) {
      Object.entries(s.baselineGrid).forEach(([k, v]) => {
        if (!v) return
        addChunk(`SEA baseline (${k}): ${v}`, 'sea', `seaHra.${k}`, 0)
      })
    }
    if (Array.isArray(s.keyRisks)) {
      addChunk(`SEA/HRA risks: ${s.keyRisks.join('; ')}`, 'sea', 'seaHra.keyRisks', 0)
    }
    if (Array.isArray(s.mitigationIdeas)) {
      addChunk(`SEA/HRA mitigation ideas: ${s.mitigationIdeas.join('; ')}`, 'sea', 'seaHra.mitigationIdeas', 0)
    }
    if (s.cumulativeEffects) {
      addChunk(`Cumulative effects: ${s.cumulativeEffects}`, 'sea', 'seaHra.cumulativeEffects', 0)
    }
  }
  // SCI / engagement
  if (plan.sci) {
    const c = plan.sci
    if (typeof c.hasStrategy === 'boolean') {
      addChunk(`Has engagement strategy: ${c.hasStrategy ? 'Yes' : 'No'}`, 'sci', 'sci.hasStrategy', 0)
    }
    if (c.keyStakeholders && c.keyStakeholders.length) {
      addChunk(`Key stakeholders: ${c.keyStakeholders.join(', ')}`, 'sci', 'sci.keyStakeholders', 0)
    }
    if (c.methods && c.methods.length) {
      addChunk(`Engagement methods: ${c.methods.join(', ')}`, 'sci', 'sci.methods', 0)
    }
    if (c.timelineNote) {
      addChunk(`Engagement timeline note: ${c.timelineNote}`, 'sci', 'sci.timelineNote', 0)
    }
  }
  // Stage targets and timetable cues
  for (const st of plan.stages || []) {
    if (st.targetDate) {
      addChunk(`Stage ${st.id} (${st.title || ''}) target date: ${st.targetDate}`, 'timetable', `stages.${st.id}`, 0)
    }
  }
  for (const ms of plan.timetable?.milestones || []) {
    if (ms.stageId && ms.date) {
      addChunk(`Milestone ${ms.stageId} due ${ms.date}`, 'timetable', `timetable.${ms.stageId}`, 0)
    }
  }
  // Sites
  for (const s of plan.sites || []) {
    const rag = [s.suitability, s.availability, s.achievability].filter(Boolean).join('/')
    const t = `Site ${s.name}: notes ${s.notes || ''} RAG ${rag}`.trim()
    if (t) addChunk(t, 'site', `sites.${s.id}`, 0)
  }
  // Chunked readiness and narrative data
  const readiness = (plan as any).readinessAssessment
  if (readiness?.areas) {
    for (const area of readiness.areas) {
      const chunks = chunkText(area.summary || '')
      chunks.forEach((c, idx) => {
        addChunk(`Readiness (${area.id || 'area'}) [${idx + 1}]: ${c}`, 'readiness', `readiness.${area.id || 'area'}`, idx)
      })
    }
  }
  if ((plan as any).baselineNarrative) {
    chunkText((plan as any).baselineNarrative).forEach((c, idx) => {
      addChunk(`Baseline narrative [${idx + 1}]: ${c}`, 'baseline', 'baselineNarrative', idx)
    })
  }
  // Preferred options snapshot
  const prefs = plan.preferredOptions
  if (prefs?.strategy) {
    addChunk(`Preferred strategy: ${prefs.strategy.label || 'Unnamed'} — ${prefs.strategy.analysis || ''}`.trim(), 'strategy', 'preferredOptions.strategy', 0)
  }
  if (prefs?.policy) {
    addChunk(`Preferred policy (${prefs.policy.topicLabel || 'topic'}): ${prefs.policy.draft || ''}`.trim(), 'policy', 'preferredOptions.policy', 0)
  }
  if (prefs?.site) {
    addChunk(`Preferred site: ${prefs.site.name || prefs.site.id || 'site'} — ${prefs.site.rationale || prefs.site.appraisal || ''}`.trim(), 'site_preferred', 'preferredOptions.site', 0)
  }
  if (prefs?.evidence) {
    addChunk(`Preferred evidence: ${prefs.evidence.title || ''} — ${prefs.evidence.content || ''}`.trim(), 'evidence', 'preferredOptions.evidence', 0)
  }
  // Policies (summaries)
  for (const p of council?.policies || []) {
    addChunk(`Policy ${p.reference} ${p.title}: ${p.summary}`, 'policy', `policy.${p.reference}`, 0)
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
    const stored = tryLoadEmbeddings(cacheKey, planSignature, cache.texts.length)
    if (stored) cache.embeddings = stored
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
    persistEmbeddings(cacheKey, planSignature, cache.embeddings)
  }
  const qemb = (await model(question, { pooling: 'mean', normalize: true })).data as Float32Array
  const scored = cache.embeddings.map((e, i) => ({ i, score: cosine(qemb, e) }))
  scored.sort((a, b) => b.score - a.score)
  const filtered = scored.filter(s => s.score >= minScore).slice(0, topK)
  return filtered.map(({ i, score }) => ({ ...cache!.meta[i], score }))
}
function tryLoadEmbeddings(cacheKey: string, signature: string, expectedCount: number): Float32Array[] | null {
  try {
    const raw = localStorage.getItem(`${EMBED_STORAGE_PREFIX}${cacheKey}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.signature !== signature || !Array.isArray(parsed.embeddings)) return null
    if (parsed.embeddings.length !== expectedCount) return null
    return parsed.embeddings.map((arr: number[]) => Float32Array.from(arr))
  } catch {
    return null
  }
}

function persistEmbeddings(cacheKey: string, signature: string, embeddings: Float32Array[]) {
  // Keep storage reasonable: only persist if small-ish
  if (embeddings.length > 300) return
  try {
    const serialised = embeddings.map(e => Array.from(e))
    localStorage.setItem(`${EMBED_STORAGE_PREFIX}${cacheKey}`, JSON.stringify({ signature, embeddings: serialised }))
  } catch {
    // ignore storage failures
  }
}

// Polyfill esbuild helper when it isn't injected (seen in browser bundles with transformers)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).__publicField = (globalThis as any).__publicField || ((obj: any, key: any, value: any) => {
  obj[key] = value
  return value
})
