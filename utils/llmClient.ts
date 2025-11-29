import { callGemini } from './gemini'
import { callOllama, callOllamaStream, callOllamaStreamWithReasoning, type OllamaStreamChunk } from './ollama'

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
export async function callLLM(prompt: string): Promise<string> {
  const useOllama = isOllamaEnabled()

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
        body: JSON.stringify({ prompt })
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

  if (useOllama) return callOllama(prompt)
  return callGemini(prompt)
}

export default callLLM

// Streaming API: returns an async generator of text chunks.
export async function* callLLMStream(prompt: string): AsyncGenerator<string, void, unknown> {
  const useOllama = isOllamaEnabled()

  // If running in browser, prefer same-origin proxy which is not streaming in this setup.
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
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
    for await (const chunk of callOllamaStream(prompt)) {
      yield chunk
    }
    return
  }

  // Fallback: non-streaming Gemini — yield full response once.
  const full = await callGemini(prompt)
  yield full
}

export type LLMReasoningChunk = { type: 'response' | 'reasoning'; text: string }

// Structured streaming that includes reasoning/thinking chunks when available (Ollama).
export async function* callLLMStreamWithReasoning(prompt: string): AsyncGenerator<LLMReasoningChunk, void, unknown> {
  const useOllama = isOllamaEnabled()

  // Do not use the /api/llm proxy here — it is non-streaming and can return raw NDJSON text.
  if (useOllama) {
    for await (const chunk of callOllamaStreamWithReasoning(prompt)) {
      // Treat any JSON-ish text as reasoning to avoid leaking raw objects into UI.
      const looksLikeJson = chunk.text.trim().startsWith('{') && chunk.text.includes('"model"')
      const type: LLMReasoningChunk['type'] = chunk.type === 'thinking' || looksLikeJson ? 'reasoning' : 'response'
      if (chunk.type === 'response' && looksLikeJson) continue
      yield { type, text: chunk.text }
    }
    return
  }

  const full = await callGemini(prompt)
  yield { type: 'response', text: full }
}
