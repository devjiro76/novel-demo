import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/types';
import { getVillage } from '@/lib/personas';
import { createInitialState, saveState, seedRelationships } from '@/lib/state';

export async function POST() {
  const env = getEnv();
  const village = await getVillage(env);

  const gameId = crypto.randomUUID();
  const state = createInitialState(gameId);

  await seedRelationships(village);
  await saveState(state);

  return NextResponse.json({ gameId });
}
