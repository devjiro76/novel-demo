import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRoom } from '@/lib/room-store';
import { parseBody, formatError } from '@/lib/api-utils';

const createRoomSchema = z.object({
  slug: z.string().min(1).max(100),
  worldId: z.string().min(1).max(200),
  npcCharacterId: z.string().min(1).max(200),
  player: z.object({
    displayName: z.string().min(1).max(50),
    characterId: z.string().min(1).max(200),
  }),
});

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, createRoomSchema);
    if ('error' in parsed) return parsed.error;

    const { slug, worldId, npcCharacterId, player } = parsed.data;

    const result = await createRoom({
      slug,
      worldId,
      npcCharacterId,
      player: { displayName: player.displayName, characterId: player.characterId },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[room/create] Error:', err);
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}
