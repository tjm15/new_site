// LLM task prompt templates. These are used by `utils/llmTasks.runLLMTask` to build
// task-specific prompts that drive JSON-structured responses from the LLM.

const STAGE_SEA_HRA_CUES: Record<string, string> = {
  TIMETABLE: 'Band A1 Timetable — show SEA requirement checker, baseline env database placeholder, and pre-G1 SEA readiness RAG alongside the Gantt.',
  NOTICE: 'Band A2 Notice — countdown to Gateway 1, show SEA/HRA readiness banner and baseline completeness indicator on the notice preview.',
  SCOPING: 'Band A3/A4 Scoping — engagement dashboard plus SEA/HRA scoping grid (biodiversity, water, climate, landscape, heritage), traffic-light baseline completeness, and one-click scoping report.',
  GATEWAY_1: 'Band A5 Gateway 1 — readiness dial with SEA/HRA baseline/scoping status and quick-fix suggestions.',
  G1_SUMMARY: 'Gateway 1 publication — lock in SEA/HRA baseline + scoping status in the published summary.',
  BASELINING: 'Band B1 Prepare plan — running 30-month countdown; include SEA/HRA early baseline, alternatives testing hook, and environmental database.',
  VISION_OUTCOMES: 'Band B1 Vision/Outcomes — show SEA/HRA lens on outcomes and risks, keep baseline threads visible.',
  SITE_SELECTION: 'Band B1 Sites/Strategy — spatial strategy environmental effects, site allocation environmental scoring, mitigation builder, cumulative effects analysis.',
  CONSULTATION_1: 'Consultation 1 — SEA scope & early baseline check, “Have we captured all environmental issues?” prompt.',
  GATEWAY_2: 'Gateway 2 — Environmental Report progress review, alternatives completeness check, and risks-to-soundness warnings.',
  CONSULTATION_2: 'Consultation 2 — Full Environmental Report published; public + statutory SEA consultation status and summaries.',
  GATEWAY_3: 'Gateway 3 — Gateway 3 Pack Builder (RAG, Compliance/Soundness/Readiness statements, bundle validator) with SEA/HRA compliance carried through all outputs; adoption hand-off sits in monitoring/evaluation.',
  MONITORING: 'Adoption/Monitoring — adoption/Post-Adoption statement with SEA/HRA hooks, indicators + annual monitoring, year-4 evaluation feeding the next plan.'
};

const compact = (val: any) => JSON.stringify(val);

export function buildPrompt(promptId: string, input: Record<string, any>): string {
  switch (promptId) {
    case 'timetable_suggest_v1':
      return `You are an expert local plan timetabling assistant.
Input: ${compact(input)}

Task: Suggest a set of milestone dates for a 30-month local plan timetable appropriate for the authority and area provided.

Output: Return JSON only with shape { "milestones": [{ "stageId": "<STAGE_ID>", "date": "YYYY-MM-DD"}, ...] }
`;

    case 'tool_suggest_prefill_v1': {
      const stageCue = input?.stageId ? STAGE_SEA_HRA_CUES[input.stageId] : undefined;
      return `You are a planning assistant that seeds *mission dashboard* style tools with smart defaults based on the current plan stage and state. No blank forms.
Input: ${compact(input)}
Stage cue: ${stageCue || 'Use general CULP flow. Always keep SEA/HRA visible at some intensity.'}

Task: For the given toolId, produce a JSON object with recommended field values to prefill the tool. Keep suggestions concise, factual, and grounded in planState and stageId. Bias towards pre-filled summaries, warnings, and baseline data rather than empty text.

Rules:
- Output MUST be valid JSON only (no explanation).
- Keep SEA/HRA present in every stage: surface scoping/baseline status, environmental risks, or consultation hooks even if light-touch.
- For 'sea' tool, keys should include: seaScopingStatus ("Not started"|"Drafted"|"Consulted"), seaScopingNotes (string), hraBaselineSummary (string). Adjust tone/intensity to the current stage cue.
- For 'sci' tool, keys should include: hasStrategy (true|false), keyStakeholders (array of strings), methods (array of strings), timelineNote (string).
- For 'notice' tool, keys should include: publicationDate (ISO), timetableUrl (string), draft (string), instructions (string).
- For 'prepRisk' tool, keys should include: pidDone ("yes"|"no"|"partial"), governance (string), resources (string), scope (string), headlineRisks (string).
- For 'baselining' tool, keys should include: topics (comma-separated string), focusNotes (string).

Return the JSON object only.`;
    }

    case 'gateway1_summary_v1':
      return `You are a planning officer assistant. Input: ${compact(input)}

Task: Produce a short, clear Gateway 1 summary suitable for publication. Include current readiness highlights and 3 next actions. Output plain text.`;

    case 'gateway1_rag_v1':
      return `You are an expert assessor. Input: ${compact(input)}

Task: Return a JSON object describing readiness RAG per assessment area and an overallStatus (red|amber|green). Format: { "areas": [{ "id": "<area>", "rag": "red|amber|green", "summary": "..." }], "overallStatus": "amber" }
`;

    case 'plan_stage_help_v1': {
      const stageCue = input?.stageId ? STAGE_SEA_HRA_CUES[input.stageId] : undefined;
      return `You are an assistant that explains the next actions for a plan stage using a mission-dashboard mindset (no blank forms).
Input: ${compact(input)}
Stage cue: ${stageCue || 'Use CULP stage defaults with SEA/HRA always visible.'}

Principles:
- Surface what the law requires, data you already have, gaps, LLM inferences, next steps, and dynamic risk/progress indicators.
- Every stage must mention SEA/HRA (at the intensity suggested by the stage cue).
- Prefer 3–6 crisp, tool-triggerable actions; avoid waffle.

Task: Return JSON: { description: string, actions: [string], recommendedToolId?: string, reason?: string }`;
    }

    case 'ask_question_router_v1':
      return `You are a router that maps user questions to the most appropriate tool and a short suggested action.
Question: ${input.question}
Plan summary: ${compact(input.planSummary)}
StageId: ${input.stageId || 'unknown'}
Context passages (most relevant first): ${compact(input.context || [])}

Task: Return JSON: { "targetToolId": string, "proposedAction"?: string, "shortAnswer"?: string, "why"?: string }
Keep shortAnswer terse (1-2 sentences).`;

    case 'plan_next_stage_suggestion_v1':
      return `You are deciding the most likely next plan stage based on current progress.
Input: ${compact(input)}

Task: Return JSON only: { "suggestedStageId": "<PLAN_STAGE_ID>", "reasonText": "short reason (1-2 sentences)" }
Valid PLAN_STAGE_ID values: ["TIMETABLE","NOTICE","SCOPING","GATEWAY_1","G1_SUMMARY","BASELINING","VISION_OUTCOMES","SITE_SELECTION","CONSULTATION_1","GATEWAY_2","CONSULTATION_2","GATEWAY_3","MONITORING"].
`;

    case 'stage_insights_v1':
      return `You are an inspector generating a concise insight pack for the current stage.
Input: ${compact(input)}

Task: Return JSON only with shape: { "summary": string, "actions": [string], "risks": [string], "primaryToolIds": [string] }
Keep summary to 2 sentences, 3-5 actions, and 0-3 risks. Use tool ids like "EvidenceTool", "SiteAssessmentTool", "PolicyDrafterTool", "TimetableTool" where relevant.
`;

    case 'followup_questions_v1':
      return `Suggest follow-up questions a planning officer might ask next.
Input: ${compact(input)}

Task: Return JSON only: { "followups": [string] }
Limit to 3-5 concise questions.
`;

    case 'vision_suggest_v1':
      return `Propose candidate outcomes for a local plan vision.
Input: ${compact(input)}

Task: Return JSON array of strings (each a concise outcome with an indicator/target hint). 6-12 items maximum. Example element: "Deliver 8,000 homes by 2040 with 40% affordable". No extra fields.
`;

    case 'vision_refine_v1':
      return `Refine raw outcome ideas into structured, measurable outcomes.
Input: ${compact(input)}

Task: Return JSON array of objects: { "id": "outcome_1", "text": "Outcome text", "metric": "indicator/target", "linkedPolicies": [string], "linkedSites": [string] }
- Cap the list to maxOutcomes (default 10).
- Fill linkedPolicies/linkedSites only if obvious; otherwise empty arrays.
`;

    case 'site_rag_v1':
      return `Classify a site against suitability, availability, and achievability (S/A/A) using plan context.
Input: ${compact(input)}

Task: Return JSON only with shape:
{
  "suitability": { "rag": "R"|"A"|"G", "reason": string },
  "availability": { "rag": "R"|"A"|"G", "reason": string },
  "achievability": { "rag": "R"|"A"|"G", "reason": string },
  "overall": "R"|"A"|"G",
  "notes": string
}
Reasons should be 1-2 sentences each.
`;

    case 'site_capacity_v1':
      return `Estimate indicative capacity for a site.
Input: ${compact(input)}

Task: Return JSON only: { "capacityEstimate": number, "reason": string, "assumptions": [string] }
Use realistic densities/typologies; keep reason concise.
`;

    case 'plan_checklist_v1':
      return `Run a short checklist on the plan and flag risks.
Input: ${compact(input)}

Task: Return JSON array of items: [{ "id": string, "status": "pass"|"risk"|"fail"|"not_applicable"|"insufficient_data", "summary": string, "suggestedActions": [string] }]
Provide 3-6 items. Summaries 1 sentence each. suggestedActions optional.
`;

    default:
      // Fallback generic wrapper
      return `[${promptId}]
Input:
${JSON.stringify(input)}
`;
  }
}

export default buildPrompt;
