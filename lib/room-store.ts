import type { Player, RoomMessage } from './room';
import { kvGet, kvPut } from './kv';

/**
 * Room store — KV-backed for Cloudflare Workers, in-memory fallback for local dev.
 *
 * KV schema:
 *   room:{roomId}        → JSON RoomData
 *   room:{roomId}:msgs   → JSON RoomMessage[]
 */

// ---- Serializable types (no Map, no controllers) ----

interface RoomData {
  roomId: string;
  slug: string;
  villageId: string;
  npcCharacterId: string;
  players: Player[];
  createdAt: number;
}

// ---- Helpers ----

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function getRoomData(roomId: string): Promise<RoomData | null> {
  const raw = await kvGet(`room:${roomId}`);
  if (!raw) return null;
  return JSON.parse(raw) as RoomData;
}

async function saveRoomData(data: RoomData): Promise<void> {
  await kvPut(`room:${data.roomId}`, JSON.stringify(data));
}

async function getRoomMessages(roomId: string): Promise<RoomMessage[]> {
  const raw = await kvGet(`room:${roomId}:msgs`);
  if (!raw) return [];
  return JSON.parse(raw) as RoomMessage[];
}

async function saveRoomMessages(roomId: string, msgs: RoomMessage[]): Promise<void> {
  await kvPut(`room:${roomId}:msgs`, JSON.stringify(msgs));
}

// ---- CRUD ----

export async function createRoom(opts: {
  slug: string;
  villageId: string;
  npcCharacterId: string;
  player: Omit<Player, 'playerId' | 'joinedAt' | 'isDefault'>;
}): Promise<{ roomId: string; playerId: string }> {
  const roomId = generateId();
  const playerId = generateId();

  const player: Player = {
    playerId,
    displayName: opts.player.displayName,
    characterId: opts.player.characterId,
    isDefault: true,
    joinedAt: Date.now(),
  };

  const data: RoomData = {
    roomId,
    slug: opts.slug,
    villageId: opts.villageId,
    npcCharacterId: opts.npcCharacterId,
    players: [player],
    createdAt: Date.now(),
  };

  await saveRoomData(data);
  await saveRoomMessages(roomId, []);
  return { roomId, playerId };
}

export async function createRoomWithId(
  roomId: string,
  opts: { slug: string; villageId: string; npcCharacterId: string },
): Promise<void> {
  const existing = await getRoomData(roomId);
  if (existing) return;

  const data: RoomData = {
    roomId,
    slug: opts.slug,
    villageId: opts.villageId,
    npcCharacterId: opts.npcCharacterId,
    players: [],
    createdAt: Date.now(),
  };

  await saveRoomData(data);
  await saveRoomMessages(roomId, []);
}

export async function getRoom(roomId: string): Promise<RoomData | null> {
  return getRoomData(roomId);
}

export async function addPlayer(
  roomId: string,
  opts: Omit<Player, 'playerId' | 'joinedAt' | 'isDefault'>,
): Promise<Player | null> {
  const data = await getRoomData(roomId);
  if (!data) return null;

  const playerId = generateId();
  const player: Player = {
    playerId,
    displayName: opts.displayName,
    characterId: opts.characterId,
    isDefault: false,
    joinedAt: Date.now(),
  };

  data.players.push(player);
  await saveRoomData(data);

  // Add system message (also emits 'message' event)
  await addMessage(roomId, {
    sender: { type: 'system' },
    text: `${player.displayName}님이 입장했습니다.`,
  });

  return player;
}

export async function removePlayer(roomId: string, playerId: string): Promise<boolean> {
  const data = await getRoomData(roomId);
  if (!data) return false;

  const idx = data.players.findIndex((p) => p.playerId === playerId);
  if (idx === -1) return false;

  const player = data.players[idx];
  data.players.splice(idx, 1);
  await saveRoomData(data);

  await addMessage(roomId, {
    sender: { type: 'system' },
    text: `${player.displayName}님이 퇴장했습니다.`,
  });

  return true;
}

// ---- Messages ----

export async function addMessage(
  roomId: string,
  opts: Omit<RoomMessage, 'id' | 'roomId' | 'timestamp'>,
): Promise<RoomMessage | null> {
  const data = await getRoomData(roomId);
  if (!data) return null;

  const msg: RoomMessage = {
    id: generateId(),
    roomId,
    timestamp: Date.now(),
    ...opts,
  };

  // Re-read right before write to narrow the race window.
  // KV has no transactions, but since addMessage calls are serialized per
  // request (player msg → NPC msg), the realistic race is two different
  // players sending at the exact same moment — re-reading minimises that gap.
  const msgs = await getRoomMessages(roomId);
  if (msgs.some((m) => m.id === msg.id)) return msg; // dedup guard
  msgs.push(msg);
  const trimmed = msgs.slice(-200);
  await saveRoomMessages(roomId, trimmed);
  return msg;
}

export async function getMessages(roomId: string): Promise<RoomMessage[]> {
  return getRoomMessages(roomId);
}

// ---- Re-add player with specific ID (for stateless recovery) ----

export async function ensurePlayer(
  roomId: string,
  playerId: string,
  opts: { displayName: string; characterId: string },
): Promise<Player | null> {
  const data = await getRoomData(roomId);
  if (!data) return null;

  // Already exists
  const existing = data.players.find((p) => p.playerId === playerId);
  if (existing) return existing;

  const player: Player = {
    playerId,
    displayName: opts.displayName,
    characterId: opts.characterId,
    isDefault: false,
    joinedAt: Date.now(),
  };

  data.players.push(player);
  await saveRoomData(data);
  return player;
}

// ---- JSON helpers ----

export function playerToJSON(player: Player) {
  return {
    playerId: player.playerId,
    displayName: player.displayName,
    characterId: player.characterId,
    isDefault: player.isDefault,
    joinedAt: player.joinedAt,
  };
}

export function roomToJSON(data: RoomData) {
  return {
    roomId: data.roomId,
    slug: data.slug,
    villageId: data.villageId,
    npcCharacterId: data.npcCharacterId,
    players: data.players.map(playerToJSON),
    createdAt: data.createdAt,
  };
}
