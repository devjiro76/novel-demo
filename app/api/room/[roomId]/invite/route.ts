import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRoom, addNpcToRoom, addMessage } from '@/lib/room-store';
import { getStoryPack } from '@/lib/story-pack';
import { parseBody, formatError } from '@/lib/api-utils';

const inviteSchema = z.object({
  npcCharacterId: z.string().min(1).max(200),
});

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  try {
    const parsed = await parseBody(request, inviteSchema);
    if ('error' in parsed) return parsed.error;

    const { npcCharacterId } = parsed.data;

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
  } catch (err) {
    console.error('[room/invite] Error:', err);
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}
