import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRoom, removePlayer } from '@/lib/room-store';
import { parseBody, formatError } from '@/lib/api-utils';

const leaveSchema = z.object({
  playerId: z.string().min(1).max(200),
});

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  try {
    const parsed = await parseBody(request, leaveSchema);
    if ('error' in parsed) return parsed.error;

    const { playerId } = parsed.data;

    const room = await getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const removed = await removePlayer(roomId, playerId);
    if (!removed) {
      return NextResponse.json({ error: 'Player not in room' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[room/leave] Error:', err);
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}
