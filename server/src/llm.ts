/**
 * LLM client — uses @molroo-ai/adapter-llm (Vercel AI SDK) via OpenRouter.
 *
 * Two model tiers:
 *   NARRATIVE_MODEL — creative writing (director, narrator). Higher quality.
 *   ENGINE_MODEL    — structured numeric output (appraisal). Cheap & fast.
 */

import { createVercelAIAdapter } from '@molroo-ai/adapter-llm/vercel-ai';
import type { LLMAdapter } from '@molroo-ai/adapter-llm';
import { z } from 'zod';

/** Creative LLM for director/narrator — needs good Korean + writing quality */
export const NARRATIVE_MODEL = 'google/gemini-2.5-flash';

/** Engine LLM for appraisal — only outputs 9 numbers, cheap & fast */
export const ENGINE_MODEL = 'google/gemini-2.5-flash-lite';

/** Create an LLMAdapter instance from an OpenRouter API key */
export function createLLM(apiKey: string, model?: string): LLMAdapter {
  return createVercelAIAdapter({
    provider: 'openrouter',
    apiKey,
    model: model ?? NARRATIVE_MODEL,
  });
}

// Re-export types for convenience
export type { LLMAdapter };
export { z };
