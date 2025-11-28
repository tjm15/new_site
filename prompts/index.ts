// Prompt library index - returns council and mode-specific prompts

export interface PromptFunctions {
  evidencePrompt: (query: string, selectedTopics?: string[]) => string;
  policyDraftPrompt: (topic: string, brief: string) => string;
  strategyPrompt: (strategyName: string, strategyDesc: string) => string;
  siteAppraisalPrompt: (site: any) => string;
  visionPrompt: (area: string) => string;
  conceptPrompt: (area: string) => string;
  feedbackPrompt: (feedback: string) => string;
  intakePrompt: (documents: any[]) => string;
  contextPrompt: (application: any) => string;
  reasoningPrompt: (application: any, contextData: any) => string;
  reportPrompt: (application: any, allData: any) => string;
}

export function getPrompts(councilId: string, mode: 'spatial' | 'development'): PromptFunctions {
  return {
    evidencePrompt: (query: string, selectedTopics?: string[]) => `
You are an expert planning policy officer.

User Question: "${query}"
${selectedTopics && selectedTopics.length > 0 ? `Focus on topics: ${selectedTopics.join(', ')}` : ''}

Answer the question with evidence from local planning data and policy context.
Keep it concise (max 250 words).
Use clear, professional planning language.
`,

    policyDraftPrompt: (topic: string, brief: string) => `
Act as a senior planning policy officer.
Draft a new policy or supporting text related to: ${topic}.
User specific focus: "${brief || "General update based on best practice"}"

Output format:
1. Policy Title
2. Policy Text (formal planning language)
3. Short justification (max 100 words)
`,

    strategyPrompt: (strategyName: string, strategyDesc: string) => `
Act as a strategic planner. Evaluate the following spatial strategy.
Strategy Name: ${strategyName}
Description: ${strategyDesc}

Provide a 300-word analysis covering:
1. Likely housing delivery effectiveness
2. Sustainability implications (transport/climate)
3. Key risks and trade-offs
`,

    siteAppraisalPrompt: (site: any) => `
Perform a rapid planning appraisal for the following site allocation.
Site: ${site.name}
Description: ${site.description}
Area: ${site.area} hectares
Capacity: ${site.capacity} units
Proposed Use: ${site.proposedUse}
Timeframe: ${site.timeframe}

Output Structure (max 250 words):
1. **Strategic Fit**: How it meets planning objectives
2. **Key Constraints**: Likely issues (heritage, flood, transport, etc.)
3. **Opportunities**: Potential for improvement (permeability, greening, etc.)
`,

    visionPrompt: (area: string) => `
Write a 'Place Vision' for ${area} in 2040 based on sustainable planning principles.

Style: Inspiring, forward-looking, but grounded in planning policy. Max 150 words.
Include references to sustainable transport, climate action, and community.
`,

    conceptPrompt: (area: string) => `
A photorealistic architectural visualization of ${area}, in the year 2040.
Urban street scene, pedestrianised, lots of street trees and rain gardens.
Modern sustainable architecture blended with historic buildings.
Cyclists, diverse people walking, sunny day, vibrant atmosphere.
No cars. High quality public realm. Photorealistic, architectural rendering style.
`,

    feedbackPrompt: (feedback: string) => `
Analyze the following consultation feedback for a local plan.

Feedback:
"${feedback}"

Task:
Group the feedback into key themes. For each theme, determine the sentiment (Positive, Negative, Mixed, Neutral) and summarise the key points.

Output format should identify:
Theme 1: [Title]
Sentiment: [Positive/Negative/Neutral]
Summary: [Key points]

Theme 2: [Title]
Sentiment: [Positive/Negative/Neutral]
Summary: [Key points]

etc.
`,

    intakePrompt: (documents: any[]) => `
Extract planning application information from the following documents:

${documents.map(d => `=== ${d.type}: ${d.title} ===\n${d.content.substring(0, 500)}...`).join('\n\n')}

Extract and return in JSON format:
{
  "siteBoundary": "brief description of site location and boundaries",
  "applicablePolicies": ["list of policy references mentioned"],
  "keyConstraints": ["list of constraints mentioned (heritage, flood, etc.)"]
}

Return raw JSON only, no markdown.
`,

    contextPrompt: (application: any) => `
Analyze the planning context for this application:

Application: ${application.reference}
Address: ${application.address}
Description: ${application.description}

Generate a context analysis covering:
1. Constraint Analysis (heritage, environmental, infrastructure)
2. Policy Cross-References (which policies apply and why)
3. Comparable Cases (similar applications and their outcomes)

Format as structured text (max 400 words).
`,

    reasoningPrompt: (application: any, contextData: any) => `
Generate a structured reasoning chain for assessing this planning application.

Application: ${application.description}
Context: ${contextData}

Create a reasoning chain with 5-7 points covering:
- Principle of development
- Design and amenity
- Transport and access
- Environmental impacts
- Heritage impacts (if applicable)

For each point, reference specific policies and state whether the proposal complies.
Format as a numbered list.
`,

    reportPrompt: (application: any, allData: any) => `
Generate a formal planning officer's report for the following application.

APPLICATION DETAILS:
Reference: ${application.reference}
Address: ${application.address}
Description: ${application.description}
Applicant: ${application.applicant}

EXTRACTED DATA:
${JSON.stringify(allData.extractedData || {}, null, 2)}

CONTEXT ANALYSIS:
${allData.contextAnalysis || 'See application documents'}

REASONING CHAIN:
${allData.reasoningChain ? allData.reasoningChain.map((r: any, i: number) => `${i + 1}. ${r.text || r}`).join('\n') : 'Standard assessment'}

Generate a formal planning officer report with the following sections:
1. APPLICATION DETAILS (summary)
2. SITE & CONTEXT (description of site and surroundings)
3. POLICY FRAMEWORK (relevant policies)
4. PLANNING ASSESSMENT (detailed analysis)
5. CONSULTATION RESPONSES (summary)
6. PLANNING BALANCE (weighing harm and benefits)
7. RECOMMENDATION (Approve/Refuse with reasons)
8. CONDITIONS/REASONS (if applicable)

Use formal planning language. Cite policies using square brackets [Policy X].
Max 1500 words.
`
  };
}
