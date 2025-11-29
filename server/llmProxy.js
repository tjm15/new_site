#!/usr/bin/env node
import express from 'express'

// Simple Node proxy that forwards prompts to a local Ollama instance.
// Usage: `node server/llmProxy.js` or add an npm script.

const app = express()
const port = process.env.LLM_PROXY_PORT ? Number(process.env.LLM_PROXY_PORT) : 3003

app.use(express.json({ limit: '1mb' }))

app.post('/api/llm', async (req, res) => {
  try {
    const { prompt, mode } = req.body || {}
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

    const host = process.env.OLLAMA_HOST || process.env.VITE_OLLAMA_HOST || 'http://localhost:11434'
    const model = process.env.OLLAMA_MODEL || process.env.VITE_OLLAMA_MODEL || 'gpt-oss:20b'
    const url = `${host.replace(/\/$/, '')}/api/generate`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false })
    })

    if (!response.ok) {
      const errText = await response.text()
      return res.status(response.status).json({ error: errText || 'Upstream error' })
    }

    const data = await response.json()
    const text = data?.response || data?.content || ''
    res.json({ text })
  } catch (err) {
    console.error('LLM proxy error', err)
    res.status(500).json({ error: String(err?.message || err) })
  }
})

app.get('/healthz', (_req, res) => res.send('ok'))

app.listen(port, () => console.log(`LLM proxy (JS) listening on http://localhost:${port}`))
