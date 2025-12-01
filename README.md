# The Planner's Assistant

An interactive environment for spatial planning and development management. The app runs entirely in the browser, keeps demo data in local storage, and lets you explore Local Plan and decision-workflow tools across Camden, Cornwall, and Manchester.

## Workspaces

- **Spatial Plan workspace**: New-system Local Plan flow with stage timeline, Gateway 1/2/3 packs, SEA/HRA, engagement/SCI, timetable + notice, evidence base, vision + concept imagery (via Gemini Imagen when available), SMART outcomes, policy drafter, strategy modeler, site assessments with MapLibre layers, consultation pack generator, adoption, monitoring, and year-4 evaluation. Stage tools auto-suggest prefills and QA checks from the current plan state.
- **Development Management workspace**: Stage-based decision room for sample applications (overview, documents, context, reasoning board, conditions/S106, decision/report, audit). Includes map overlays, auto-extraction/summary prompts, and a copilot panel scoped to the chosen stage.
- **Monitoring dashboard**: AMR + year-4 evaluation overview with links back into the plan tools for the selected authority.
- **Plan-aware assistant**: Uses local retrieval (`@xenova/transformers`) over saved plans, outcomes, SEA/SCI notes, and council policies to ground answers.
- **Fixtures**: `data/` seeds plan context, policies, geojson layers, and mock application documents for the three authorities.

## Tech Stack

- React 19 + TypeScript, React Router v7 (`HashRouter`), Vite 6
- Styling: Tailwind CSS v4 tokens plus custom CSS variables; Framer Motion; Lucide icons
- Maps: MapLibre GL (no API token required)
- AI: Gemini via `@google/genai` or local Ollama HTTP; optional Imagen for concept images; local QA embeddings via `@xenova/transformers`
- Server: `server/index.js` Express host for `dist/` plus `POST /api/llm`; dev middleware mirrors the same endpoint

## Getting Started

Prereqs: Node 20+ and npm.

1. Create `.env.local` (or export env vars) to pick your LLM backend:

   ```ini
   # Gemini (default)
   GEMINI_API_KEY=your_key_here

   # Or local Ollama
   VITE_USE_OLLAMA=1
   VITE_OLLAMA_HOST=http://localhost:11434
   VITE_OLLAMA_MODEL=gpt-oss:20b
   # Server-side equivalents: USE_OLLAMA / OLLAMA_HOST / OLLAMA_MODEL
   ```

2. Install deps and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

The app is served on http://localhost:3000 with a dev-only `/api/llm` proxy. The first plan-aware assistant call will download the `@xenova/transformers` model in-browser (expect a short delay).

## Production

- Build: `npm run build` (outputs to `dist/`)
- Serve: `npm start` (Express server on port 8080 by default) — set `GEMINI_API_KEY` or `USE_OLLAMA=1` (+ optional `OLLAMA_HOST`/`OLLAMA_MODEL`) in the environment before starting.
- Docker: multi-stage `Dockerfile` builds the static assets and runs `server/index.js`.
- Cloud Run: `deploy-cloud-run.sh` and `deploy-secure.sh` deploy the container and wire `GEMINI_API_KEY` via Secret Manager.

## Data, Storage, and Routing

- Plan state is stored only in the browser (`plans.v1`, `plans.activeId`, `plans.activeByCouncil` in `localStorage`); no backend persistence.
- Councils, policies, mock applications, and geojson layers live under `data/`.
- Deep links: `?c=camden|cornwall|manchester`, `mode=spatial|development`, and `tool=evidence|vision|policy|strategy|sites|feedback|sea|sci|timetable|notice|preprisk|baselining|gateway1|consultationpack|gateway3|inspector|adoption|monitoring|year4` open a specific authority/mode/tool.
- Hash-based routing means static hosting can serve the built assets without server-side route handling.

## Project Structure

- `components/` shared UI (layout, headers, timelines, map frame, markdown renderer)
- `pages/` marketing pages and the app workspaces (`app/` for spatial + DM demos, monitoring dashboard)
- `contexts/` shared state (`PlanContext`, `ThemeContext`)
- `data/` seeded plans, policies, applications, geojson layers, stage metadata
- `utils/` LLM clients (`llmClient`, `gemini`, `ollama`), prompts, local retrieval (`lib/localQa.ts`), PDF export
- `server/` production Express host with `/api/llm`
- `deploy-*.sh` Cloud Run helper scripts; `Dockerfile` for container builds

## Troubleshooting

- No AI responses: ensure `GEMINI_API_KEY` is set or Ollama is running at `OLLAMA_HOST`. The dev proxy and server both respect `USE_OLLAMA`/`VITE_USE_OLLAMA`.
- Slow first assistant answer: model download from `@xenova/transformers` happens on first use; subsequent calls are fast.
- Map tiles blank: MapLibre runs fully offline; check `data/geojsonLayers.ts` for the loaded layers per authority.

## License

Open source – intended for public-good use (AGPLv3).
