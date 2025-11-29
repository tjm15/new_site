// Gentle cleanup for LLM markdown that sometimes arrives without line breaks.
// Keep this minimal to avoid mangling bullet lists.
export function normalizeLLMText(input: string): string {
  if (!input) return '';
  // Minimal, non-destructive cleanup.
  let text = input.replace(/\r\n/g, '\n');

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
