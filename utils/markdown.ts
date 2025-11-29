// Remove surrounding code fences often emitted by GPT-OSS (```markdown ... ```).
export function cleanGptOssMarkdown(raw: string): string {
  if (!raw) return ''
  let s = raw.trim().replace(/^```[a-zA-Z0-9]*\s*\n?/, '')
  s = s.replace(/```$/, '')
  return s.trim()
}

// Gentle cleanup for LLM markdown that sometimes arrives without line breaks.
// Keep this minimal to avoid mangling bullet lists.
export function normalizeLLMText(input: string): string {
  if (!input) return '';
  // Strip surrounding fences first (common GPT-OSS issue).
  let text = cleanGptOssMarkdown(input);
  // Minimal, non-destructive cleanup.
  text = text.replace(/\r\n/g, '\n');

  // Render HTML breaks as real newlines for Markdown parsing.
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // If LLM emitted double pipes as separators, break them onto new lines to avoid inline noise.
  text = text.replace(/\|\|/g, '\n');

  // Help GFM tables: replace em/en dashes with ASCII hyphens so separator rows like |---| parse.
  text = text.replace(/[—–]/g, '-');

  // If numbered items are jammed together (e.g., "1. Item2. Item"), insert line breaks before the number.
  text = text.replace(/([^\n])(\d+\.)\s*/g, '$1\n$2 ');

  // Ensure there's a space after bold spans when text is jammed (e.g., "**Title**Next").
  text = text.replace(/(\*\*[^*]+\*\*)(?=\S)/g, '$1 ');

  // Lightly tidy excess blank lines.
  text = text.replace(/\n{3,}/g, '\n\n');

  const trimmed = text.trim();
  return trimmed.length ? trimmed : input;
}

// Minimal prep for assistant answers to ensure markdown renders (unescape newlines, strip outer fences).
export function prepareAssistantMarkdown(raw: string): string {
  if (!raw) return '';
  let s = String(raw).trim();
  s = s.replace(/^```[a-zA-Z0-9]*\s*\n?/, '');
  s = s.replace(/```$/, '');
  s = s.replace(/\\n/g, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  return s.trim();
}
