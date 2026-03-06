import { z } from 'zod';

// ---- Server env ----

const envSchema = z.object({
  LLM_API_KEY: z.string().min(1, 'LLM_API_KEY is required'),
  LLM_BASE_URL: z.string().url().default('https://api.venice.ai/api/v1'),
  EMBEDDING_API_KEY: z.string().min(1),
  EMBEDDING_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  WORLD_API_KEY: z.string().min(1, 'WORLD_API_KEY is required'),
  WORLD_API_URL: z.string().url().min(1, 'WORLD_API_URL is required'),
});

export type Env = z.infer<typeof envSchema>;

let _envCache: Env | null = null;

export function getEnv(): Env {
  if (_envCache) return _envCache;

  const result = envSchema.safeParse({
    LLM_API_KEY: process.env.LLM_API_KEY,
    LLM_BASE_URL: process.env.LLM_BASE_URL || 'https://api.venice.ai/api/v1',
    EMBEDDING_API_KEY: process.env.EMBEDDING_API_KEY || process.env.LLM_API_KEY,
    EMBEDDING_BASE_URL: process.env.EMBEDDING_BASE_URL || 'https://openrouter.ai/api/v1',
    WORLD_API_KEY: process.env.WORLD_API_KEY,
    WORLD_API_URL: process.env.WORLD_API_URL,
  });

  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Environment validation failed: ${issues}`);
  }

  _envCache = result.data;
  return _envCache;
}

/** User-created character stored in KV */
export interface UserCharacter {
  id: string; // uuid
  name: string; // 표시 이름 (e.g., "유리")
  fullName: string; // 전체 이름 (e.g., "김유리")
  age: number;
  role: string; // 역할 설명 (e.g., "카페 바리스타")
  desc: string; // 캐릭터 설명 (2-3문장)
  personality: string; // 성격 프롬프트 (LLM에 전달)
  speakingStyle: string; // 말투 예시
  tags: string[]; // 태그
  isPublic: boolean; // 공개 여부
  isAdult: boolean; // 성인 콘텐츠 여부
  glow: string; // 테마 색상 hex
  createdAt: number; // timestamp
  creatorId?: string; // 추후 인증 연동용
  imageUrl?: string; // 이미지 URL (optional)
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
  trust: number; // 0-1
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
