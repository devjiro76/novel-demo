// ---- Room system types ----

import type { EmotionDetail } from './types';

export interface Player {
  playerId: string;
  displayName: string;
  characterId: string; // role in the story (e.g. 'yongjun')
  isDefault: boolean; // true if room creator (first player)
  joinedAt: number;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  timestamp: number;
  sender:
    | { type: 'player'; id: string; name: string }
    | { type: 'npc'; id: string; name: string }
    | { type: 'system' };
  text: string;
  action?: string;
  innerThought?: string;
  emotion?: string;
  emotionDetail?: EmotionDetail;
  relationshipDelta?: { trust: number; strength: number };
}
