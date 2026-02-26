import { NextResponse } from 'next/server';
import { deleteState } from '@/lib/state';

export async function POST(request: Request) {
  const gameId = request.headers.get('X-Game-ID');
  if (!gameId) return NextResponse.json({ error: 'Missing X-Game-ID header' }, { status: 400 });

  await deleteState(gameId);
  return NextResponse.json({ ok: true });
}
