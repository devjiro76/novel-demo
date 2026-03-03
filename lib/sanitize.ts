/**
 * LLM input sanitization — prevent prompt injection and enforce limits.
 */

const MAX_USER_INPUT_LENGTH = 2000;

/** Patterns commonly used in prompt injection attempts */
const INJECTION_MARKERS = [
  /\b(?:system|assistant)\s*:/gi,
  /\[INST\]/gi,
  /<<\s*SYS\s*>>/gi,
  /<\|(?:im_start|im_end|system|user|assistant)\|>/gi,
  /```\s*(?:system|instruction)/gi,
  /\bignore\s+(?:all\s+)?(?:previous|above|prior)\s+instructions?\b/gi,
  /\byou\s+are\s+now\b/gi,
  /\bforget\s+(?:all\s+)?(?:previous|your)\s+instructions?\b/gi,
];

/**
 * Sanitize user input before passing to LLM.
 * - Truncate to max length
 * - Strip prompt injection markers
 * - Remove control characters (except newline, tab)
 */
export function sanitizeUserInput(input: string): string {
  // Truncate
  let sanitized = input.slice(0, MAX_USER_INPUT_LENGTH);

  // Remove control characters (keep \n \r \t)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Strip prompt injection markers
  for (const pattern of INJECTION_MARKERS) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized.trim();
}

/**
 * Sanitize chat history messages.
 */
export function sanitizeChatHistory<T extends { text: string }>(
  history: T[],
): T[] {
  return history.map((msg) => ({
    ...msg,
    text: sanitizeUserInput(msg.text),
  }));
}
