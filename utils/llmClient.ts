import { callGemini } from './gemini'
import { callOllama, callOllamaStream, callOllamaStreamWithReasoning, type OllamaStreamChunk } from './ollama'

export type LLMMode = 'markdown' | 'json' | 'text'

type LLMRequest = { prompt: string; mode?: LLMMode }

const MARKDOWN_RULES = [
  'You are a UK planning officer producing professional, structured, inspector-ready text.',
  '',
  'OUTPUT FORMAT RULES (MANDATORY):',
  '- Output ONLY GitHub-Flavoured Markdown (GFM).',
  '- DO NOT use ``` code fences of any kind.',
  '- DO NOT use HTML tags (no <br>, <p>, <ul>, etc.).',
  '- DO NOT inline dashes (e.g. “Text-Text”). If you need a heading, use bold or a proper Markdown heading.',
  '- NEVER join sentences using hyphens as glue.',
  '- Tables, lists, and headings MUST follow the rules below.',
  '',
  'HEADINGS:',
  '- Use markdown headings (#, ##, ###) or bold labels (“**Strategic Fit:**”).',
  '- Leave a BLANK LINE before and after each heading.',
  '',
  'PARAGRAPHS:',
  '- Separate paragraphs with exactly ONE blank line.',
  '',
  'BULLET LISTS:',
  '- Each bullet MUST be on its own line.',
  '- Each bullet MUST begin exactly with “- ” (dash + space).',
  '- NOTHING may appear on the same line before the dash.',
  '- NO blank “-” lines: every list item must have text.',
  '',
  'TABLES (VERY IMPORTANT):',
  '- Leave ONE blank line before the table.',
  '- Use normal GFM table syntax:',
  '  | Column A | Column B | Column C |',
  '  | --- | --- | --- |',
  '  | Row 1 A | Row 1 B | Row 1 C |',
  '- EVERY table row must be on ONE line.',
  '- DO NOT insert line breaks inside table cells.',
  '- If a cell needs multiple ideas, separate them with semicolons or commas, NOT line breaks.',
  '- DO NOT output HTML (no <br> inside cells).',
  '',
  'STYLE:',
  '- Planning text MUST be concise, evidence-based, and sound enough for examination.',
  '- Use professional tone, short paragraphs, and structured arguments.',
  '- You MAY and SHOULD use tables to present structured planning information (constraints, opportunities, risks, etc.).',
  '',
  'Return ONLY the markdown content.'
].join('\n')

const JSON_RULES = [
  'You must output ONLY valid JSON.',
  'No markdown. No bullets. No tables. No explanation text.',
  'Do not wrap the JSON in ``` fences.',
  'Return only the JSON object, nothing else.'
].join('\n')

const TEXT_RULES = [
  'You must output ONLY plain text.',
  'No markdown formatting. No code fences. No HTML. No JSON.',
  'Just simple text lines.'
].join('\n')

function buildPrompt(input: string | LLMRequest, defaultMode: LLMMode | undefined): { prompt: string; mode?: LLMMode } {
  if (typeof input === 'string') return { prompt: input, mode: defaultMode }
  return { prompt: input.prompt, mode: input.mode ?? defaultMode }
}

function applyModeRules(prompt: string, mode?: LLMMode): string {
  if (!mode) return prompt
  const prelude =
    mode === 'markdown'
      ? MARKDOWN_RULES
      : mode === 'json'
      ? JSON_RULES
      : TEXT_RULES
  return `${prelude}\n\n${prompt}`
}

const parseOllamaFlag = (val: any) => {
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val === 1
  if (typeof val === 'string') {
    const t = val.trim().toLowerCase()
    return t === '1' || t === 'true' || t === 'yes' || t === 'on'
  }
  return false
}

// Shared helper so UI and clients agree on which backend is active.
export function isOllamaEnabled(): boolean {
  let useOllama = false
  try {
    const proc = typeof process !== 'undefined' && (process as any).env
    if (proc) {
      useOllama = parseOllamaFlag(proc.USE_OLLAMA) || parseOllamaFlag(proc.VITE_USE_OLLAMA)
    }
  } catch {}
  try {
    // Vite exposes only VITE_* by default; include USE_OLLAMA for consistency when manually injected.
    const meta: any = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined
    if (meta) {
      useOllama = useOllama || parseOllamaFlag(meta.VITE_USE_OLLAMA) || parseOllamaFlag(meta.USE_OLLAMA)
    }
  } catch {}
  try {
    const win: any = typeof window !== 'undefined' ? window : undefined
    if (win) {
      useOllama = useOllama || parseOllamaFlag(win.USE_OLLAMA) || parseOllamaFlag(win.VITE_USE_OLLAMA) || parseOllamaFlag(win.__USE_OLLAMA__)
    }
  } catch {}
  return useOllama
}

// callLLM: choose LLM backend based on environment variables.
// - If process.env.USE_OLLAMA === '1' or process.env.VITE_USE_OLLAMA === '1', use Ollama.
// - Otherwise, fall back to Gemini.
export async function callLLM(input: string | LLMRequest): Promise<string> {
  const useOllama = isOllamaEnabled()
  const { prompt, mode } = buildPrompt(input, undefined)
  const finalPrompt = applyModeRules(prompt, mode)

  // Debug log to help trace which backend is selected during development.
  try {
    // eslint-disable-next-line no-console
    console.debug('[llmClient] useOllama=', useOllama ? 'true' : 'false')
  } catch {}

  // If running in the browser, prefer calling the same-origin dev proxy `/api/llm`
  // which is provided by the Vite middleware during local development. This
  // avoids CORS and ensures the server-side selection logic is used.
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt })
      })
      if (res.ok) {
        const js = await res.json()
        if (js && typeof js.text === 'string') return js.text
        return js && js.text ? String(js.text) : JSON.stringify(js)
      }
      const txt = await res.text()
      throw new Error(`Proxy error ${res.status}: ${txt}`)
    } catch (e) {
      // If proxy isn't available (production or not running), fall back to direct client call.
      // eslint-disable-next-line no-console
      console.debug('[llmClient] proxy /api/llm failed, falling back to direct call:', e?.message || e)
    }
  }

  if (useOllama) return callOllama(finalPrompt)
  return callGemini(finalPrompt)
}

export default callLLM

// Streaming API: returns an async generator of text chunks.
export async function* callLLMStream(input: string | LLMRequest): AsyncGenerator<string, void, unknown> {
  const useOllama = isOllamaEnabled()
  const { prompt, mode } = buildPrompt(input, 'markdown')
  const finalPrompt = applyModeRules(prompt, mode)

  // If running in browser, prefer same-origin proxy which is not streaming in this setup.
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt })
      })
      if (res.ok) {
        const js = await res.json()
        const text = js && typeof js.text === 'string' ? js.text : (js && js.text ? String(js.text) : JSON.stringify(js))
        yield text
        return
      }
      const txt = await res.text()
      throw new Error(`Proxy error ${res.status}: ${txt}`)
    } catch (e) {
      // Proxy failed — fall through to direct clients.
      // eslint-disable-next-line no-console
      console.debug('[llmClient] proxy /api/llm failed in stream, falling back to direct call:', e?.message || e)
    }
  }

  if (useOllama) {
    // Server-side streaming with Ollama
    for await (const chunk of callOllamaStream(finalPrompt)) {
      yield chunk
    }
    return
  }

  // Fallback: non-streaming Gemini — yield full response once.
  const full = await callGemini(finalPrompt)
  yield full
}

export type LLMReasoningChunk = { type: 'response' | 'reasoning'; text: string }

// Structured streaming that includes reasoning/thinking chunks when available (Ollama).
export async function* callLLMStreamWithReasoning(input: string | LLMRequest): AsyncGenerator<LLMReasoningChunk, void, unknown> {
  const useOllama = isOllamaEnabled()
  const { prompt, mode } = buildPrompt(input, 'markdown')
  const finalPrompt = applyModeRules(prompt, mode)

  // Do not use the /api/llm proxy here — it is non-streaming and can return raw NDJSON text.
  if (useOllama) {
    for await (const chunk of callOllamaStreamWithReasoning(finalPrompt)) {
      // Treat any JSON-ish text as reasoning to avoid leaking raw objects into UI.
      const looksLikeJson = chunk.text.trim().startsWith('{') && chunk.text.includes('"model"')
      const type: LLMReasoningChunk['type'] = chunk.type === 'thinking' || looksLikeJson ? 'reasoning' : 'response'
      if (chunk.type === 'response' && looksLikeJson) continue
      yield { type, text: chunk.text }
      }
      return
    }

  const full = await callGemini(finalPrompt)
  yield { type: 'response', text: full }
}
