import { NextResponse } from 'next/server';
import { getRoom, removePlayer } from '@/lib/room-store';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;

  try {
    const body = await request.json() as { playerId: string };
    const { playerId } = body;

    if (!playerId) {
      return NextResponse.json({ error: 'Missing playerId' }, { status: 400 });
    }

    const room = await getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const removed = await removePlayer(roomId, playerId);
    if (!removed) {
      return NextResponse.json({ error: 'Player not in room' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[room/leave] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
