import type { RoomMessage, Player } from './room';
import { post, get, del } from './fetch-utils';

// ---- Room API ----

export interface RoomStateResponse {
  ok: boolean;
  room: {
    roomId: string;
    slug: string;
    worldId: string;
    npcCharacterId: string;
    npcCharacterIds: string[];
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
  worldId: string;
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
  worldId?: string;
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
    worldId: string;
    npcCharacterId: string;
    displayName: string;
    characterId: string;
    targetNpcId?: string;
  },
): Promise<{ ok: boolean; playerMessage: RoomMessage; npcMessage: RoomMessage; npcMessages?: RoomMessage[] }> {
  return post(`/api/room/${roomId}/message`, { playerId, text, ...context });
}

export async function kickNpcAPI(
  roomId: string,
  npcCharacterId: string,
): Promise<{ ok: boolean; npcCharacterIds: string[] }> {
  return post(`/api/room/${roomId}/kick`, { npcCharacterId });
}

export async function deleteRoomAPI(roomId: string): Promise<{ ok: boolean }> {
  return del(`/api/room/${roomId}`);
}

export async function deleteWorldAPI(
  worldId: string,
  worldInstanceId?: string,
): Promise<{ ok: boolean }> {
  const params = worldInstanceId ? `?worldInstanceId=${encodeURIComponent(worldInstanceId)}` : '';
  return del(`/api/world/${worldId}${params}`);
}

export async function inviteNpcAPI(
  roomId: string,
  npcCharacterId: string,
): Promise<{ ok: boolean; npcCharacterIds: string[] }> {
  return post(`/api/room/${roomId}/invite`, { npcCharacterId });
}
