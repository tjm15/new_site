#!/usr/bin/env node
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenAI } from '@google/genai'

const app = express()
const port = Number(process.env.PORT || 8080)

app.use(express.json({ limit: '1mb' }))

const parseFlag = (val) => {
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val === 1
  if (typeof val === 'string') {
    const t = val.trim().toLowerCase()
    return t === '1' || t === 'true' || t === 'yes' || t === 'on'
  }
  return false
}

app.post('/api/llm', async (req, res) => {
  try {
    const { prompt, mode } = req.body || {}
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

    const useOllama = parseFlag(process.env.USE_OLLAMA) || parseFlag(process.env.VITE_USE_OLLAMA)
    if (useOllama) {
      const host = process.env.OLLAMA_HOST || process.env.VITE_OLLAMA_HOST || 'http://localhost:11434'
      const model = process.env.OLLAMA_MODEL || process.env.VITE_OLLAMA_MODEL || 'gpt-oss:20b'
      const url = `${host.replace(/\/$/, '')}/api/generate`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false })
      })
      const txt = await response.text()
      if (!response.ok) return res.status(response.status).json({ error: txt || 'Upstream error' })
      let data = {}
      try { data = JSON.parse(txt) } catch {}
      const text = data?.response || data?.content || ''
      return res.json({ text })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' })
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: { parts: [{ text: String(prompt) }] }
    })
    const text = response?.text || ''
    return res.json({ text })
  } catch (e) {
    console.error('LLM error', e)
    return res.status(500).json({ error: String(e?.message || e) })
  }
})

// Static SPA hosting
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.resolve(__dirname, '..', 'dist')

app.use(express.static(distPath))
app.get('/healthz', (_req, res) => res.send('ok'))
app.get('/*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))

app.listen(port, () => console.log(`Web server listening on http://0.0.0.0:${port}`))
