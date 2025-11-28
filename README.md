
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
- **AI**: Google Gemini API for intelligent assistance
- **Build Tool**: Vite
- **Styling**: Custom CSS variables with responsive design

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local development server (typically http://localhost:5173)

## Project Structure

- `/components` - Reusable UI components (Layout, Header, Footer, etc.)
- `/pages` - Main application pages and routing
- `/pages/app` - Interactive planning demos (spatial and development management)
- `/data` - Mock data for different councils
- `/prompts` - AI prompt templates for different planning scenarios
- `/utils` - Utility functions (Gemini API integration, PDF generation)
- `/hooks` - React hooks for responsive design and animations

## License

Open source - built for the public good. AGPLv3
