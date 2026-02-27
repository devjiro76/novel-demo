// ---- Server env ----

export interface Env {
  OPENROUTER_API_KEY: string;
  WORLD_API_KEY: string;
  WORLD_API_URL: string;
  VILLAGE_ID: string;
}

export function getEnv(): Env {
  return {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
    WORLD_API_KEY: process.env.WORLD_API_KEY!,
    WORLD_API_URL: process.env.WORLD_API_URL!,
    VILLAGE_ID: process.env.VILLAGE_ID!,
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
