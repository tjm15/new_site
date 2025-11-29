// No-op helpers: return raw text untouched.
export function sanitizeGptOssMarkdown(raw: string): string {
  return raw == null ? '' : String(raw);
}

export function normalizeLLMText(raw: string): string {
  return sanitizeGptOssMarkdown(raw);
}

export const cleanGptOssMarkdown = sanitizeGptOssMarkdown;
export const prepareAssistantMarkdown = sanitizeGptOssMarkdown;
