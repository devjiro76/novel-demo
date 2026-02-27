// ---- Server env ----

export interface Env {
  LLM_API_KEY: string;
  LLM_BASE_URL: string;
  EMBEDDING_API_KEY: string;
  EMBEDDING_BASE_URL: string;
  WORLD_API_KEY: string;
  WORLD_API_URL: string;
}

export function getEnv(): Env {
  return {
    LLM_API_KEY: process.env.LLM_API_KEY!,
    LLM_BASE_URL: process.env.LLM_BASE_URL || 'https://api.venice.ai/api/v1',
    EMBEDDING_API_KEY: process.env.EMBEDDING_API_KEY || process.env.LLM_API_KEY!,
    EMBEDDING_BASE_URL: process.env.EMBEDDING_BASE_URL || 'https://openrouter.ai/api/v1',
    WORLD_API_KEY: process.env.WORLD_API_KEY!,
    WORLD_API_URL: process.env.WORLD_API_URL!,
  };
}

// ---- Cloudflare bindings (available at runtime via getRequestContext) ----

import type { D1Database, VectorizeIndex, AiBinding } from './memory';

export interface CfBindings {
  EPISODES_DB: D1Database;
  VECTORIZE_INDEX: VectorizeIndex;
  AI: AiBinding;
}

/**
 * Get CF bindings from the request context.
 * Uses the same pattern as room-store.ts (getCloudflareContext from @opennextjs/cloudflare).
 * Returns null for each binding that isn't available (e.g. local dev without bindings).
 */
export async function getCfBindings(): Promise<{ db: D1Database | null; vectorize: VectorizeIndex | null; ai: AiBinding | null }> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx.env as any;
    return {
      db: env.EPISODES_DB ?? null,
      vectorize: env.VECTORIZE_INDEX ?? null,
      ai: env.AI ?? null,
    };
  } catch {
    return { db: null, vectorize: null, ai: null };
  }
}

// ---- Conversation response ----

export interface ConversationResponse {
  characterId: string;
  displayName: string;
  dialogue: string;
  action: string;
  innerThought: string;
  emotion: { primary: string; vad: { V: number; A: number; D: number } };
  conversationOver: boolean;
}
