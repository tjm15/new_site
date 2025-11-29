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

  // If LLM emitted double pipes as separators, break them onto new lines to avoid inline noise.
  text = text.replace(/\|\|/g, '\n');

  // Help GFM tables: replace em/en dashes with ASCII hyphens so separator rows like |---| parse.
  text = text.replace(/[—–]/g, '-');

  // If numbered items are jammed together (e.g., "1. Item2. Item"), insert line breaks before the number.
  text = text.replace(/([^\n])(\d+\.)\s*/g, '$1\n$2 ');

  // Ensure there's a space after bold spans when text is jammed (e.g., "**Title**Next").
  text = text.replace(/(\*\*[^*]+\*\*)(?=\S)/g, '$1 ');

  // Insert a blank line before table rows so GFM tables parse after preceding text.
  text = addTablePadding(text);

  // Break out bullet markers that are jammed against prior text (but leave table rows alone).
  text = text.replace(/([^\n])([*-])(\s+)/g, (match, prevChar, bullet, spaces, offset, str) => {
    const lineStart = str.lastIndexOf('\n', offset) + 1;
    const lineEnd = str.indexOf('\n', offset);
    const line = str.slice(lineStart, lineEnd === -1 ? str.length : lineEnd);
    if (line.trim().startsWith('|')) return match;

    const prevNonSpace = str.slice(0, offset + 1).trimEnd().slice(-1);
    const nextNonSpaceMatch = str.slice(offset + match.length).match(/\S/);
    const nextNonSpace = nextNonSpaceMatch ? nextNonSpaceMatch[0] : '';
    if (prevNonSpace && /\d/.test(prevNonSpace) && /\d/.test(nextNonSpace)) return match;

    return `${prevChar}\n${bullet}${spaces}`;
  });

  // Lightly tidy excess blank lines.
  text = text.replace(/\n{3,}/g, '\n\n');

  const trimmed = text.trim();
  return trimmed.length ? trimmed : input;
}

// Minimal prep for assistant answers to ensure markdown renders (unescape newlines, strip outer fences).
export function prepareAssistantMarkdown(raw: string): string {
  if (!raw) return '';
  const unescaped = String(raw).replace(/\\n/g, '\n');
  return normalizeLLMText(unescaped);
}

function addTablePadding(markdown: string): string {
  const lines = markdown.split('\n');
  const out: string[] = [];
  const isTableLine = (line: string) => /^\s*\|.*\|/.test(line.trim());

  lines.forEach(line => {
    const prev = out[out.length - 1];
    if (isTableLine(line)) {
      const prevBlank = prev === undefined || prev.trim() === '';
      const prevTable = prev !== undefined && isTableLine(prev);
      if (!prevBlank && !prevTable) out.push('');
    }
    out.push(line);
  });

  return out.join('\n');
}
