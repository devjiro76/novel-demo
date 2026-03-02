import { NextResponse } from 'next/server';
import { getRoom, getMessages, deleteRoom, roomToJSON } from '@/lib/room-store';

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;

  try {
    const deleted = await deleteRoom(roomId);
    if (!deleted) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[room/delete] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
