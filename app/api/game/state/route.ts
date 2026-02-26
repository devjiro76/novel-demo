import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/types';
import { getVillage, getEvents } from '@/lib/personas';
import { loadState, getRelationshipsAsAffinity } from '@/lib/state';

export async function GET(request: Request) {
  const gameId = request.headers.get('X-Game-ID');
  if (!gameId) return NextResponse.json({ error: 'Missing X-Game-ID header' }, { status: 400 });

  const state = await loadState(gameId);
  if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const env = getEnv();
  const village = await getVillage(env);

  const [relationships, eventsResult] = await Promise.all([
    getRelationshipsAsAffinity(village),
    getEvents(village, 5),
  ]);

  return NextResponse.json({
    gameId: state.gameId,
    chapter: state.chapter,
    turnCount: state.turnCount,
    relationships,
    tension: state.tension,
    recentEvents: eventsResult.events,
  });
}
