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

/** User-created character stored in KV */
export interface UserCharacter {
  id: string;                 // uuid
  name: string;               // 표시 이름 (e.g., "유리")
  fullName: string;           // 전체 이름 (e.g., "김유리")
  age: number;
  role: string;               // 역할 설명 (e.g., "카페 바리스타")
  desc: string;               // 캐릭터 설명 (2-3문장)
  personality: string;        // 성격 프롬프트 (LLM에 전달)
  speakingStyle: string;      // 말투 예시
  tags: string[];             // 태그
  isPublic: boolean;          // 공개 여부
  isAdult: boolean;           // 성인 콘텐츠 여부
  glow: string;               // 테마 색상 hex
  createdAt: number;          // timestamp
  creatorId?: string;         // 추후 인증 연동용
  imageUrl?: string;          // 이미지 URL (optional)
}

// ---- World types ----

export interface UserWorldCharacter {
  id: string;
  name: string;
  fullName: string;
  age: number;
  role: string;
  desc: string;
  personality: string;
  speakingStyle: string;
  glow: string;
}

export interface UserWorldRelationship {
  sourceId: string;
  targetId: string;
  relationshipType: string;
  strength: number; // 0-1
  trust: number;    // 0-1
}

export interface UserWorld {
  id: string;
  name: string;
  description: string;
  lore: string;
  tags: string[];
  themeColor: string;
  isPublic: boolean;
  isAdult: boolean;
  characters: UserWorldCharacter[];
  relationships: UserWorldRelationship[];
  createdAt: number;
  creatorId?: string;
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

/** Emotion detail from World SDK interact() — attached to RoomMessage */
export interface EmotionDetail {
  primary: string;
  secondary?: string;
  vad: { V: number; A: number; D: number };
  delta?: { V: number; A: number; D: number };
  intensity?: number;
}
