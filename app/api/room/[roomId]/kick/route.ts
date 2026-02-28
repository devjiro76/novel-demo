import { NextResponse } from 'next/server';
import { getRoom, removeNpcFromRoom, addMessage } from '@/lib/room-store';
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

    if (npcCharacterId === room.npcCharacterId) {
      return NextResponse.json({ error: 'Cannot kick primary NPC' }, { status: 400 });
    }

    const pack = getStoryPack(room.slug);
    const char = pack.characters.find((c) => c.id === npcCharacterId);

    const npcCharacterIds = await removeNpcFromRoom(roomId, npcCharacterId);

    await addMessage(roomId, {
      sender: { type: 'system' },
      text: `${char?.fullName ?? npcCharacterId}이(가) 대화에서 나갔습니다.`,
    });

    return NextResponse.json({ ok: true, npcCharacterIds });
  } catch (err: any) {
    console.error('[room/kick] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
