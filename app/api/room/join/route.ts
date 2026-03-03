import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRoom, createRoomWithId, addPlayer, ensurePlayer, getMessages, roomToJSON, playerToJSON } from '@/lib/room-store';
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

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, joinRoomSchema);
    if ('error' in parsed) return parsed.error;

    const { roomId, displayName, characterId, playerId: existingPlayerId, slug, worldId, npcCharacterId } = parsed.data;

    let room = await getRoom(roomId);

    // Room not found — re-create if we have context
    if (!room) {
      if (!slug || !worldId || !npcCharacterId) {
        return NextResponse.json({ error: 'Room not found and missing context to recreate' }, { status: 404 });
      }
      await createRoomWithId(roomId, { slug, worldId, npcCharacterId });
      room = await getRoom(roomId);
    }

    if (!room) {
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }

    // Reuse existing player if possible (by playerId or displayName)
    let player;
    if (existingPlayerId) {
      player = await ensurePlayer(roomId, existingPlayerId, { displayName, characterId });
    } else {
      // Check if a player with same displayName already exists
      const existingByName = room.players.find((p) => p.displayName === displayName);
      if (existingByName) {
        player = existingByName;
      } else {
        player = await addPlayer(roomId, { displayName, characterId });
      }
    }

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
