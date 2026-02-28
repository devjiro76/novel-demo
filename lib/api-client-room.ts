import type { RoomMessage, Player } from './room';
import { post, get } from './fetch-utils';

// ---- Room API ----

export interface RoomStateResponse {
  ok: boolean;
  room: {
    roomId: string;
    slug: string;
    villageId: string;
    npcCharacterId: string;
    players: Array<{
      playerId: string;
      displayName: string;
      characterId: string;
      isDefault: boolean;
      joinedAt: number;
    }>;
    messageCount: number;
    createdAt: number;
  };
  messages: RoomMessage[];
}

export async function createRoomAPI(opts: {
  slug: string;
  villageId: string;
  npcCharacterId: string;
  player: { displayName: string; characterId: string };
}): Promise<{ roomId: string; playerId: string }> {
  return post('/api/room/create', opts);
}

export async function joinRoomAPI(opts: {
  roomId: string;
  displayName: string;
  characterId: string;
  playerId?: string;
  slug?: string;
  villageId?: string;
  npcCharacterId?: string;
}): Promise<{
  ok: boolean;
  playerId: string;
  player: Player;
  room: RoomStateResponse['room'];
  messages: RoomMessage[];
}> {
  return post('/api/room/join', opts);
}

export async function getRoomState(roomId: string): Promise<RoomStateResponse> {
  return get(`/api/room/${roomId}`);
}

export async function leaveRoom(roomId: string, playerId: string): Promise<{ ok: boolean }> {
  return post(`/api/room/${roomId}/leave`, { playerId });
}

export async function sendRoomMessage(
  roomId: string,
  playerId: string,
  text: string,
  context?: {
    slug: string;
    villageId: string;
    npcCharacterId: string;
    displayName: string;
    characterId: string;
  },
): Promise<{ ok: boolean; playerMessage: RoomMessage; npcMessage: RoomMessage }> {
  return post(`/api/room/${roomId}/message`, { playerId, text, ...context });
}
