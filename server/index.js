#!/usr/bin/env node
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenAI } from '@google/genai'

const app = express()
const port = Number(process.env.PORT || 8080)

// Enable trust proxy for proper IP detection behind reverse proxies
app.set('trust proxy', 'loopback')

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

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 20 // Max requests per window
const MAX_TOKENS_PER_WINDOW = 50000 // Max estimated tokens per window
const PENALTY_DURATION_MS = 5 * 60 * 1000 // 5 minute penalty for abuse
const MAX_429_BEFORE_PENALTY = 3 // After 3 upstream 429s, apply penalty

// In-memory rate limiting state (per client IP)
const clientState = new Map()

// Get client IP from request
function getClientIP(req) {
  return req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
}

// Estimate token count from text (rough approximation: ~4 chars per token)
function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0
  return Math.ceil(text.length / 4)
}

// Get or create client state
function getClientState(clientIP) {
  const now = Date.now()
  let state = clientState.get(clientIP)
  
  if (!state) {
    state = {
      requests: [],
      tokens: [],
      upstream429Count: 0,
      penaltyUntil: 0
    }
    clientState.set(clientIP, state)
  }
  
  // Clean up old entries outside the window
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  state.requests = state.requests.filter(ts => ts > windowStart)
  state.tokens = state.tokens.filter(entry => entry.ts > windowStart)
  
  // Reset 429 count if outside penalty window
  if (state.penaltyUntil && now > state.penaltyUntil) {
    state.upstream429Count = 0
    state.penaltyUntil = 0
  }
  
  return state
}

// Check rate limits and return error response if exceeded
function checkRateLimits(req) {
  const clientIP = getClientIP(req)
  const now = Date.now()
  const state = getClientState(clientIP)
  const promptText = req.body?.prompt || ''
  const estimatedTokens = estimateTokens(promptText)
  
  // Check if client is in penalty period
  if (state.penaltyUntil && now < state.penaltyUntil) {
    const retryAfter = Math.ceil((state.penaltyUntil - now) / 1000)
    return {
      limited: true,
      status: 429,
      error: 'Too many requests causing upstream rate limits. Please wait before retrying.',
      retryAfter
    }
  }
  
  // Check request count limit
  if (state.requests.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestRequest = Math.min(...state.requests)
    const retryAfter = Math.ceil((oldestRequest + RATE_LIMIT_WINDOW_MS - now) / 1000)
    return {
      limited: true,
      status: 429,
      error: 'Rate limit exceeded. Too many requests.',
      retryAfter: Math.max(1, retryAfter)
    }
  }
  
  // Check token limit
  const totalTokens = state.tokens.reduce((sum, entry) => sum + entry.tokens, 0)
  if (totalTokens + estimatedTokens > MAX_TOKENS_PER_WINDOW) {
    const oldestToken = state.tokens.length > 0 ? Math.min(...state.tokens.map(e => e.ts)) : now
    const retryAfter = Math.ceil((oldestToken + RATE_LIMIT_WINDOW_MS - now) / 1000)
    return {
      limited: true,
      status: 429,
      error: 'Rate limit exceeded. Too many tokens in requests.',
      retryAfter: Math.max(1, retryAfter)
    }
  }
  
  return { limited: false, estimatedTokens }
}

// Record a successful request
function recordRequest(req, estimatedTokens) {
  const clientIP = getClientIP(req)
  const state = getClientState(clientIP)
  const now = Date.now()
  
  state.requests.push(now)
  state.tokens.push({ ts: now, tokens: estimatedTokens })
}

// Record an upstream 429 error and apply penalty if threshold exceeded
function recordUpstream429(req) {
  const clientIP = getClientIP(req)
  const state = getClientState(clientIP)
  const now = Date.now()
  
  state.upstream429Count++
  
  if (state.upstream429Count >= MAX_429_BEFORE_PENALTY) {
    state.penaltyUntil = now + PENALTY_DURATION_MS
    console.warn(`[RateLimit] Client ${clientIP} penalized until ${new Date(state.penaltyUntil).toISOString()} after ${state.upstream429Count} upstream 429s`)
  }
}

// Check if an error indicates a rate limit was hit
function isRateLimitError(error) {
  if (!error) return false
  if (error.status === 429) return true
  
  const message = String(error.message || error).toLowerCase()
  return message.includes('429') || 
         message.includes('rate limit') || 
         message.includes('quota') ||
         message.includes('too many requests')
}

// Periodic cleanup of stale client state (every 2 minutes to match stale threshold)
setInterval(() => {
  const now = Date.now()
  const staleThreshold = now - RATE_LIMIT_WINDOW_MS * 2
  
  for (const [ip, state] of clientState.entries()) {
    const hasRecentActivity = state.requests.some(ts => ts > staleThreshold) ||
                              state.tokens.some(e => e.ts > staleThreshold) ||
                              (state.penaltyUntil && state.penaltyUntil > now)
    
    if (!hasRecentActivity) {
      clientState.delete(ip)
    }
  }
}, 2 * 60 * 1000)

app.post('/api/llm', async (req, res) => {
  try {
    const { prompt, mode } = req.body || {}
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })

    // Check rate limits before processing
    const rateLimitCheck = checkRateLimits(req)
    if (rateLimitCheck.limited) {
      res.set('Retry-After', String(rateLimitCheck.retryAfter))
      return res.status(rateLimitCheck.status).json({
        error: rateLimitCheck.error,
        retryAfter: rateLimitCheck.retryAfter
      })
    }

    // Record request immediately to prevent abuse (even if API call fails)
    recordRequest(req, rateLimitCheck.estimatedTokens)

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
      if (!response.ok) {
        // Track upstream 429 errors
        if (response.status === 429) {
          recordUpstream429(req)
          const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10)
          res.set('Retry-After', String(retryAfter))
          return res.status(429).json({ error: 'Upstream rate limit exceeded. Please try again later.', retryAfter })
        }
        return res.status(response.status).json({ error: txt || 'Upstream error' })
      }
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
    
    // Check for rate limit errors from Gemini
    if (isRateLimitError(e)) {
      recordUpstream429(req)
      res.set('Retry-After', '60')
      return res.status(429).json({ error: 'Upstream rate limit exceeded. Please try again later.', retryAfter: 60 })
    }
    
    const errorMessage = String(e?.message || e)
    return res.status(500).json({ error: errorMessage })
  }
})

// Static SPA hosting
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.resolve(__dirname, '..', 'dist')

app.use(express.static(distPath))
app.get('/healthz', (_req, res) => res.send('ok'))
// Catch-all: serve index.html for SPA routing
app.use((_req, res) => res.sendFile(path.join(distPath, 'index.html')))

app.listen(port, () => console.log(`Web server listening on http://0.0.0.0:${port}`))
