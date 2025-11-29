// LLM task prompt templates. These are used by `utils/llmTasks.runLLMTask` to build
// task-specific prompts that drive JSON-structured responses from the LLM.

export function buildPrompt(promptId: string, input: Record<string, any>): string {
  switch (promptId) {
    case 'timetable_suggest_v1':
      return `You are an expert local plan timetabling assistant.
Input: ${JSON.stringify(input, null, 2)}

Task: Suggest a set of milestone dates for a 30-month local plan timetable appropriate for the authority and area provided.

Output: Return JSON only with shape { "milestones": [{ "stageId": "<STAGE_ID>", "date": "YYYY-MM-DD"}, ...] }
`;

    case 'tool_suggest_prefill_v1':
      return `You are a planning assistant that suggests sensible initial values for tool forms based on the current plan state.
Input: ${JSON.stringify(input, null, 2)}

Task: For the given toolId, produce a JSON object with recommended field values suitable to prefill the tool's form. Use concise, factual suggestions grounded on the provided planState.

Rules:
- Output MUST be valid JSON only (no explanation).
- For 'sea' tool, keys should include: seaScopingStatus ("Not started"|"Drafted"|"Consulted"), seaScopingNotes (string), hraBaselineSummary (string).
- For 'sci' tool, keys should include: hasStrategy (true|false), keyStakeholders (array of strings), methods (array of strings), timelineNote (string).

Return the JSON object only.
`;

    case 'gateway1_summary_v1':
      return `You are a planning officer assistant. Input: ${JSON.stringify(input, null, 2)}

Task: Produce a short, clear Gateway 1 summary suitable for publication. Include current readiness highlights and 3 next actions. Output plain text.`;

    case 'gateway1_rag_v1':
      return `You are an expert assessor. Input: ${JSON.stringify(input, null, 2)}

Task: Return a JSON object describing readiness RAG per assessment area and an overallStatus (red|amber|green). Format: { "areas": [{ "id": "<area>", "rag": "red|amber|green", "summary": "..." }], "overallStatus": "amber" }
`;

    case 'plan_stage_help_v1':
      return `You are an assistant that explains the next actions for a plan stage.
Input: ${JSON.stringify(input, null, 2)}

Task: Return JSON: { description: string, actions: [string], recommendedToolId?: string, reason?: string }`;

    case 'ask_question_router_v1':
      return `You are a router that maps user questions to the most appropriate tool and a short suggested action.
Input: ${JSON.stringify(input, null, 2)}

Task: Return JSON: { targetToolId: string, proposedAction?: string, shortAnswer?: string, why?: string }
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
