import type { RoomMessage, Player } from './room';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

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
  playerId?: string; // If provided, reuse existing player (rejoin)
  // Context for re-creating room if server lost it
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
