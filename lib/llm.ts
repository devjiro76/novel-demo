import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import type { LanguageModel } from 'ai';

export const NARRATIVE_MODEL = 'deepseek-v3.2';
export const ENGINE_MODEL = 'llama-3.3-70b';

export function createModel(
  apiKey: string,
  model?: string,
  baseURL?: string,
): LanguageModel {
  const provider = createOpenAI({
    apiKey,
    baseURL: baseURL ?? 'https://api.venice.ai/api/v1',
  });
  return provider.chat(model ?? NARRATIVE_MODEL);
}

export { generateObject, z };
