import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { LanguageModel } from 'ai';

export const NARRATIVE_MODEL = 'google/gemini-2.5-flash';
export const ENGINE_MODEL = 'openai/gpt-4o-mini';

export function createModel(apiKey: string, model?: string): LanguageModel {
  const provider = createOpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    compatibility: 'compatible',
  });
  return provider.chat(model ?? NARRATIVE_MODEL);
}

export { generateObject, z };
