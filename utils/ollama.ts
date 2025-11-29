export type OllamaStreamChunk = { type: 'response' | 'thinking' | 'plain'; text: string };
type ParsedChunk = { responses: string[]; thinking: string[]; plain: string[] };

// Extract response and reasoning text from an Ollama streaming chunk.
// Handles NDJSON, concatenated JSON objects (}{), and falls back to regex parsing.
function extractResponsesFromChunk(chunk: string): ParsedChunk {
  const parsed: ParsedChunk = { responses: [], thinking: [], plain: [] };
  const candidates = chunk.replace(/}\s*{/g, '}\n{').split('\n').filter(Boolean);
  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    try {
      const js = JSON.parse(trimmed);
      const maybeResponse = js?.response ?? js?.content ?? js?.text ?? js?.message?.content ?? js?.choices?.[0]?.message?.content;
      if (typeof maybeResponse === 'string' && maybeResponse.trim()) {
        parsed.responses.push(maybeResponse);
      } else if (Array.isArray(maybeResponse)) {
        const joined = maybeResponse.map((p: any) => (typeof p === 'string' ? p : '')).join(' ').trim();
        if (joined) parsed.responses.push(joined);
      }
      if (typeof js?.thinking === 'string' && js.thinking.trim()) {
        parsed.thinking.push(js.thinking);
      }
      continue;
    } catch {
      // Fall through to regex/plain handling
    }

    // Lenient regex extraction for response/thinking even if JSON is malformed.
    const respMatches = [...trimmed.matchAll(/"response"\s*:\s*"([^"]*?)"/g)].map(m => m[1]).filter(Boolean);
    const thinkMatches = [...trimmed.matchAll(/"thinking"\s*:\s*"([^"]*?)"/g)].map(m => m[1]).filter(Boolean);
    parsed.responses.push(...respMatches.filter(r => r.trim()).map(r => r.trim()));
    parsed.thinking.push(...thinkMatches.filter(t => t.trim()).map(t => t.trim()));

    // Only treat as plain text when it is clearly not JSON.
    if (!trimmed.startsWith('{') && !trimmed.endsWith('}')) {
      parsed.plain.push(trimmed);
    }
  }
  // Do not add raw JSON as plain; prefer empty when nothing was recoverable.
  return parsed;
}

// Streaming Harmony/Ollama client: yields content as it arrives (NDJSON or chunked)
export async function* callOllamaStream(prompt: string): AsyncGenerator<string, void, unknown> {
  for await (const chunk of callOllamaStreamWithReasoning(prompt)) {
    if (chunk.type === 'response') yield chunk.text;
  }
}

// Structured streaming variant that emits response and reasoning chunks.
export async function* callOllamaStreamWithReasoning(prompt: string): AsyncGenerator<OllamaStreamChunk, void, unknown> {
  const host = process.env.OLLAMA_HOST || process.env.VITE_OLLAMA_HOST || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || process.env.VITE_OLLAMA_MODEL || 'gpt-oss:20b';
  const url = `${host.replace(/\/$/, '')}/api/generate`;
  const body = { model, prompt };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = '';
  let yielded = false;
  const salvage: string[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/}\s*{/g, '}\n{');
    let lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const extracted = extractResponsesFromChunk(trimmed);
      salvage.push(...extracted.thinking, ...extracted.plain);
      for (const resp of extracted.responses) {
        yielded = true;
        yield { type: 'response', text: resp };
      }
      for (const think of extracted.thinking) {
        yield { type: 'thinking', text: think };
      }
      for (const plain of extracted.plain) {
        yield { type: 'thinking', text: plain };
      }
    }
  }
  if (buffer.trim()) {
    const extracted = extractResponsesFromChunk(buffer.trim());
    salvage.push(...extracted.thinking, ...extracted.plain);
    for (const resp of extracted.responses) {
      yielded = true;
      yield { type: 'response', text: resp };
    }
    for (const think of extracted.thinking) {
      yield { type: 'thinking', text: think };
    }
    for (const plain of extracted.plain) {
      yield { type: 'thinking', text: plain };
    }
  }
  // Do not emit raw JSON fallback; if the model never sent response text,
  // just emit accumulated thinking as reasoning so UI can surface it separately.
  if (!yielded && salvage.length) {
    const fallback = salvage.join(' ').trim();
    if (fallback) yield { type: 'thinking', text: fallback };
  }
}
// Minimal Ollama HTTP client wrapper. Uses the local Ollama HTTP API when available.
// This file is intentionally simple — it sends a JSON POST to the Ollama /api/generate
// endpoint and returns the generated text. It's used as an alternative to Gemini.

export async function callOllama(prompt: string): Promise<string> {
  try {
    const host = process.env.OLLAMA_HOST || process.env.VITE_OLLAMA_HOST || 'http://localhost:11434'
    const model = process.env.OLLAMA_MODEL || process.env.VITE_OLLAMA_MODEL || 'gpt-oss:20b'

    const url = `${host.replace(/\/$/, '')}/api/generate`
    const body = { model, prompt }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`Ollama API error ${res.status}: ${txt}`)
    }

    const contentType = res.headers.get('content-type') || ''

    // If the server streams NDJSON, read the stream and parse responses.
    if (contentType.includes('application/x-ndjson') || contentType.includes('text/event-stream') || contentType.includes('application/octet-stream')) {
      const reader = res.body?.getReader()
      if (reader) {
        const decoder = new TextDecoder()
        let buffer = ''
        const responses: string[] = []
        const reasoning: string[] = []
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          buffer = buffer.replace(/}\s*{/g, '}\n{')
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            const parsed = extractResponsesFromChunk(line.trim())
            responses.push(...parsed.responses)
            reasoning.push(...parsed.thinking)
          }
        }
        if (buffer.trim()) {
          const parsed = extractResponsesFromChunk(buffer.trim())
          responses.push(...parsed.responses)
          reasoning.push(...parsed.thinking)
        }
        if (responses.length) return responses.join('')
        if (reasoning.length) return reasoning.join(' ')
        return ''
      }
    }

    if (contentType.includes('application/json')) {
      const js = await res.json()
      // Harmony format: { choices: [{ message: { content: "..." } }], ... }
      if (js && js.choices && Array.isArray(js.choices) && js.choices[0]?.message?.content) {
        return js.choices[0].message.content
      }
      // Ollama default: { results: [{ content: "..." }], ... }
      if (js && js.results) {
        const parts = js.results.map((r: any) => r?.content || r?.text || '').filter(Boolean)
        return parts.join('\n') || JSON.stringify(js)
      }
      // Fallback: try to extract 'content' or 'text' directly
      if (js && js.content) return js.content
      if (js && js.text) return js.text
      return JSON.stringify(js)
    }

    // Non-JSON text: attempt to strip NDJSON noise if present.
    const raw = await res.text()
    if (raw.includes('"model"') && raw.includes('"response"')) {
      const lines = raw.replace(/}\s*{/g, '}\n{').split('\n')
      const responses: string[] = []
      const thinking: string[] = []
      for (const line of lines) {
        const parsed = extractResponsesFromChunk(line.trim())
        responses.push(...parsed.responses)
        thinking.push(...parsed.thinking)
      }
      if (responses.length) return responses.join('')
      if (thinking.length) return thinking.join(' ')
    }

    return raw
  } catch (e: any) {
    console.error('Ollama client error:', e)
    return `Error: Ollama request failed: ${e?.message || e}`
  }
}
