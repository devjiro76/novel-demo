import { NextResponse } from 'next/server';
import { createRoom } from '@/lib/room-store';

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      slug: string;
      villageId: string;
      npcCharacterId: string;
      player: { displayName: string; characterId: string };
    };

    const { slug, villageId, npcCharacterId, player } = body;

    if (!slug || !villageId || !npcCharacterId || !player?.displayName || !player?.characterId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const result = await createRoom({
      slug,
      villageId,
      npcCharacterId,
      player: { displayName: player.displayName, characterId: player.characterId },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('[room/create] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
