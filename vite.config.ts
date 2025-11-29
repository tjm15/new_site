import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { callLLM } from './utils/llmClient'
import type { ViteDevServer } from 'vite'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // Dev-only LLM proxy: handle /api/llm in the Vite dev server so the browser
        // can call a same-origin endpoint without CORS. This middleware is active
        // only in dev (vite) and does not affect your Dockerfile or production build.
        {
          name: 'vite:llm-proxy',
          configureServer(server: ViteDevServer) {
            server.middlewares.use('/api/llm', async (req, res, next) => {
              try {
                // Only accept POST
                if (req.method !== 'POST') {
                  res.statusCode = 405
                  res.end('Method Not Allowed')
                  return
                }
                let body = ''
                for await (const chunk of req) body += chunk
                let parsed = {}
                try {
                  parsed = JSON.parse(body || '{}')
                } catch (e) {
                  // ignore parse errors
                }
                const prompt = (parsed as any).prompt || parsed
                const text = await callLLM(typeof prompt === 'string' ? prompt : JSON.stringify(prompt))
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ text }))
              } catch (e: any) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: String(e?.message || e) }))
              }
            })
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Expose Ollama toggle to the client so status indicators match the backend choice.
        'import.meta.env.USE_OLLAMA': JSON.stringify(env.USE_OLLAMA || ''),
        'import.meta.env.VITE_USE_OLLAMA': JSON.stringify(env.VITE_USE_OLLAMA || env.USE_OLLAMA || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
