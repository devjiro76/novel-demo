import { NextRequest } from 'next/server';
import { getRoom, getMessages } from '@/lib/room-store';
import { onRoomEvent } from '@/lib/room-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;

  const room = await getRoom(roomId);
  if (!room) {
    return new Response(JSON.stringify({ ok: false, error: 'room_not_found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = await getMessages(roomId);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function send(event: string, data: unknown) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      // Initial sync
      send('room_state', {
        messages,
        playerCount: room.players.length,
      });

      // Subscribe to room events
      const unsub = onRoomEvent(roomId, (evt) => {
        try {
          send(evt.type, evt.data);
        } catch {
          // Controller closed — clean up
          unsub();
        }
      });

      // Heartbeat to detect dead connections
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          unsub();
        }
      }, 15_000);

      // Clean up when client disconnects
      _req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsub();
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
