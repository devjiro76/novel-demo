import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import type { LanguageModel } from 'ai';
import type { Env } from './types.js';

export const NARRATIVE_MODEL = 'google/gemini-2.5-flash';
export const ENGINE_MODEL = 'openai/gpt-4o-mini';

function createModel(apiKey: string, model: string, baseURL: string): LanguageModel {
  return createOpenAI({ apiKey, baseURL }).chat(model);
}

/** 대화 생성용 — OpenRouter / Gemini 2.5 Flash */
export function primaryModel(env: Env): LanguageModel {
  return createModel(env.EMBEDDING_API_KEY, NARRATIVE_MODEL, env.EMBEDDING_BASE_URL);
}

/** Appraisal 추출용 — OpenRouter / gpt-4o-mini */
export function engineModel(env: Env): LanguageModel {
  return createModel(env.EMBEDDING_API_KEY, ENGINE_MODEL, env.EMBEDDING_BASE_URL);
}

export { generateObject, generateText, z };
