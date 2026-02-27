import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/types';
import { getVillage, getRelationships } from '@/lib/personas';
import { seedRelationships } from '@/lib/state';
import { getStoryPack } from '@/lib/story-pack';

export async function POST() {
  const pack = getStoryPack();
  const env = getEnv();
  const village = await getVillage(env, pack.villageId);

  // Only seed if no relationships exist yet
  const existing = await getRelationships(village);
  if (existing.length === 0) {
    await seedRelationships(village, pack);
  }

  return NextResponse.json({ ok: true });
}
