#!/usr/bin/env node
/*
  Simple Express-based LLM proxy. Run this separately in environments where
  you want a server-side proxy (e.g. during local testing or staging). It will
  accept POST /api/llm { prompt: string } and forward to the chosen backend.

  This file is intentionally not referenced by the app's build or Dockerfile.
  To run locally:
    node ./server/llmProxy.js
  or with ts-node in dev.
*/

import express from 'express'
import bodyParser from 'body-parser'
import { callLLM } from '../utils/llmClient'

const app = express()
const port = process.env.LLM_PROXY_PORT ? Number(process.env.LLM_PROXY_PORT) : 3002

app.use(bodyParser.json({ limit: '1mb' }))

app.post('/api/llm', async (req, res) => {
  try {
    const { prompt, mode } = req.body || {}
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })
    const text = await callLLM(typeof prompt === 'string' ? { mode, prompt } : { mode, prompt: JSON.stringify(prompt) })
    res.json({ text })
  } catch (e: any) {
    console.error('LLM proxy error:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

app.get('/healthz', (_req, res) => res.send('ok'))

app.listen(port, () => console.log(`LLM proxy listening on http://localhost:${port}`))
