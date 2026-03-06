import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getRoom,
  createRoomWithId,
  addPlayer,
  ensurePlayer,
  getMessages,
  roomToJSON,
  playerToJSON,
} from '@/lib/room-store';
import { parseBody, formatError } from '@/lib/api-utils';

const joinRoomSchema = z.object({
  roomId: z.string().min(1).max(200),
  displayName: z.string().min(1).max(50),
  characterId: z.string().min(1).max(200),
  playerId: z.string().max(200).optional(),
  slug: z.string().max(100).optional(),
  worldId: z.string().max(200).optional(),
  npcCharacterId: z.string().max(200).optional(),
});

type JoinBody = z.infer<typeof joinRoomSchema>;

async function getOrCreateRoom(body: JoinBody) {
  const { roomId, slug, worldId, npcCharacterId } = body;
  const room = await getRoom(roomId);
  if (room) return room;

  if (!slug || !worldId || !npcCharacterId) return null;

  await createRoomWithId(roomId, { slug, worldId, npcCharacterId });
  return getRoom(roomId);
}

async function resolvePlayer(
  roomId: string,
  room: Awaited<ReturnType<typeof getRoom>>,
  body: JoinBody,
) {
  const { playerId: existingPlayerId, displayName, characterId } = body;
  if (existingPlayerId) {
    return ensurePlayer(roomId, existingPlayerId, { displayName, characterId });
  }
  const existingByName = room!.players.find((p) => p.displayName === displayName);
  if (existingByName) return existingByName;
  return addPlayer(roomId, { displayName, characterId });
}

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, joinRoomSchema);
    if ('error' in parsed) return parsed.error;

    const body = parsed.data;
    const { roomId } = body;

    const room = await getOrCreateRoom(body);

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found and missing context to recreate' },
        { status: 404 },
      );
    }

    const player = await resolvePlayer(roomId, room, body);

    if (!player) {
      return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
    }

    const updatedRoom = await getRoom(roomId);
    const messages = await getMessages(roomId);

    return NextResponse.json({
      ok: true,
      playerId: player.playerId,
      player: playerToJSON(player),
      room: roomToJSON(updatedRoom!),
      messages,
    });
  } catch (err) {
    console.error('[room/join] Error:', err);
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}
