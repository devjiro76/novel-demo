// ---- Server env ----

export interface Env {
  OPENROUTER_API_KEY: string;
  WORLD_API_KEY: string;
  WORLD_API_URL: string;
}

export function getEnv(): Env {
  return {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
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
