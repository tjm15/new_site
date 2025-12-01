
# The Planner's Assistant

An open-source environment for spatial planning — built to restore coherence, capacity, and trust in how decisions about place are made. This application brings evidence, policy, and spatial data into one unified workspace, helping planning officers and policy teams reason clearly across strategy and development management.

## What It Does

The Planner's Assistant is designed for use inside government, strengthening professional judgement rather than replacing it. It supports:

- **Development Management**: AI-assisted planning application assessment with policy analysis, evidence gathering, and reasoning support
- **Spatial Planning**: Interactive tools for plan-making, strategy modeling, site assessment, and policy drafting
- **Transparent Decision Making**: Clear links between national policy, local plans, and individual planning decisions

The application provides interactive demonstrations for multiple councils (Camden, Cornwall, Manchester) showcasing both spatial planning and development management workflows.

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Routing**: React Router with hash-based navigation
- **UI**: Framer Motion for animations, Lucide React for icons
- **AI**: Google Gemini API or local Ollama via HTTP API
- **Build Tool**: Vite
- **Styling**: Custom CSS variables with responsive design

## Architecture

- **Client + Dev Server**: Vite serves the React app on `http://localhost:3000` in development. A dev-only middleware handles `POST /api/llm` so the browser can call a same-origin endpoint without CORS.
- **LLM Selection**: `utils/llmClient.ts` chooses the backend at runtime:
  - Use Ollama when `USE_OLLAMA=1` or `VITE_USE_OLLAMA=1` is set.
  - Otherwise use Google Gemini (requires `GEMINI_API_KEY`).
- **Ollama Client**: `utils/ollama.ts` calls the local Ollama HTTP API (`/api/generate`) and supports streaming/structured reasoning in dev tools.
- **Gemini Client**: `utils/gemini.ts` uses `@google/genai` with `gemini-flash-latest`.
**Production Server**: `server/index.js` serves the built SPA and exposes `POST /api/llm` for Cloud Run. It reads `GEMINI_API_KEY` from Secret Manager via `--set-secrets`.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Choose your LLM backend:
   - Gemini (hosted): set `GEMINI_API_KEY` in `.env.local`.
   - Ollama (local): install and run Ollama, then set the flags below.

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open your browser at http://localhost:3000

### Using Ollama locally (recommended for offline/dev)

1. Install Ollama and pull a model, e.g.:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ollama pull gpt-oss:20b
   # or: ollama pull llama3.1:8b / qwen2.5:14b / mistral:7b
   ```
2. Create `.env.local` with:
   ```ini
   VITE_USE_OLLAMA=true
   VITE_OLLAMA_HOST=http://localhost:11434
   VITE_OLLAMA_MODEL=gpt-oss:20b
   ```
3. Start dev server: `npm run dev`

Notes:
- You can use non-Vite variants (`USE_OLLAMA`, `OLLAMA_HOST`, `OLLAMA_MODEL`) when running server-side code or the standalone proxy.
- When Ollama is enabled, the Vite dev server handles `POST /api/llm` and calls the local Ollama API server-side; no browser CORS issues.

### Using Gemini

Create `.env.local` with:
```ini
GEMINI_API_KEY=your_key_here
```
Run `npm run dev` and the app will call Gemini unless `USE_OLLAMA`/`VITE_USE_OLLAMA` is set.

 

## Project Structure

- `/components` - Reusable UI components (Layout, Header, Footer, etc.)
- `/pages` - Main application pages and routing
- `/pages/app` - Interactive planning demos (spatial and development management)
- `/data` - Mock data for different councils
- `/prompts` - AI prompt templates for different planning scenarios
- `/utils` - Utility functions (LLM client/router, Gemini+Ollama, PDF generation)
- `/hooks` - React hooks for responsive design and animations
- `/server` - Production Node server (`index.js`) serving static files and `/api/llm`

## Local Dev Flags

- `VITE_USE_OLLAMA` / `USE_OLLAMA`: enable Ollama when `true` or `1`.
- `VITE_OLLAMA_HOST` / `OLLAMA_HOST`: default `http://localhost:11434`.
- `VITE_OLLAMA_MODEL` / `OLLAMA_MODEL`: default `gpt-oss:20b`.
- `GEMINI_API_KEY` (or `API_KEY`): required for Gemini.
 

Vite reads `VITE_*` variables into the client bundle; non-`VITE_*` variables are read server-side (dev middleware/proxy).

## Troubleshooting

- Ollama enabled but no output: verify `ollama serve` is running and `OLLAMA_HOST` is reachable; confirm the model name exists (`ollama list`).
- Gemini errors about API key: ensure `GEMINI_API_KEY` is set in `.env.local` and restart the dev server.
- 404 on `/api/llm`: ensure you are using `npm run dev` (Vite middleware active) or start the standalone proxy.

## License

Open source - built for the public good. AGPLv3
