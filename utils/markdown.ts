// Minimal, non-destructive cleanup for GPT-OSS markdown.
// Strip only outer fences and unescape literal "\n". Do not touch bullets, tables, or dashes.
export function sanitizeGptOssMarkdown(raw: string): string {
  if (!raw) return '';
  let s = String(raw).trim();

  const fenceMatch = s.match(/^```[a-zA-Z0-9-]*\s*\n([\s\S]*?)\n```$/);
  if (fenceMatch) {
    s = fenceMatch[1];
  }

  s = s.replace(/\\n/g, '\n');
  return s.trim();
}

// Backwards-compatible exports
export const cleanGptOssMarkdown = sanitizeGptOssMarkdown;
export const normalizeLLMText = sanitizeGptOssMarkdown;
export const prepareAssistantMarkdown = sanitizeGptOssMarkdown;
