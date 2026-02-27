import { NextResponse } from 'next/server';
import { getRoom, getMessages, roomToJSON } from '@/lib/room-store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  const room = await getRoom(roomId);

  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const messages = await getMessages(roomId);

  return NextResponse.json({
    ok: true,
    room: roomToJSON(room),
    messages,
  });
}
