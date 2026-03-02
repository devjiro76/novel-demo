import { NextResponse } from 'next/server';
import { getRoom, createRoomWithId, addPlayer, ensurePlayer, getMessages, roomToJSON, playerToJSON } from '@/lib/room-store';

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      roomId: string;
      displayName: string;
      characterId: string;
      playerId?: string; // If provided, reuse existing player (rejoin)
      slug?: string;
      worldId?: string;
      npcCharacterId?: string;
    };

    const { roomId, displayName, characterId, playerId: existingPlayerId, slug, worldId, npcCharacterId } = body;

    if (!roomId || !displayName || !characterId) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId, displayName, characterId' },
        { status: 400 },
      );
    }

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
  } catch (err: any) {
    console.error('[room/join] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
