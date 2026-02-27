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
