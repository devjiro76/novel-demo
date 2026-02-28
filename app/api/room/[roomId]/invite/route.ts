import { NextResponse } from 'next/server';
import { getRoom, addNpcToRoom, addMessage } from '@/lib/room-store';
import { getStoryPack } from '@/lib/story-pack';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;

  try {
    const body = await request.json() as { npcCharacterId: string };
    const { npcCharacterId } = body;

    if (!npcCharacterId) {
      return NextResponse.json({ error: 'Missing npcCharacterId' }, { status: 400 });
    }

    const room = await getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const pack = getStoryPack(room.slug);
    const char = pack.characters.find((c) => c.id === npcCharacterId);
    if (!char) {
      return NextResponse.json({ error: 'Unknown character' }, { status: 400 });
    }

    const npcCharacterIds = await addNpcToRoom(roomId, npcCharacterId);

    // System message announcing the new NPC
    await addMessage(roomId, {
      sender: { type: 'system' },
      text: `${char.fullName}이(가) 대화에 참여했습니다.`,
    });

    return NextResponse.json({ ok: true, npcCharacterIds });
  } catch (err: any) {
    console.error('[room/invite] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
