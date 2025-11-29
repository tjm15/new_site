import { callGemini } from './gemini'
import { callOllama } from './ollama'

export type LLMMode = 'markdown' | 'json' | 'text'

type LLMRequest = { prompt: string; mode?: LLMMode }

const MARKDOWN_RULES = '' // Stop over-prescribing markdown; let the prompt carry any needed format hints.

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
  if (mode === 'markdown') return prompt
  const prelude = mode === 'json' ? JSON_RULES : TEXT_RULES
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
        throw new Error('Proxy response missing text field')
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

// Streaming APIs removed: use callLLM (non-streaming) instead.
export type LLMReasoningChunk = { type: 'response' | 'reasoning'; text: string }
