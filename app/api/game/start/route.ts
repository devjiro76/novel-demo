import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/types';
import { getVillage, getRelationships } from '@/lib/personas';
import { seedRelationships } from '@/lib/state';

export async function POST() {
  const env = getEnv();
  const village = await getVillage(env);

  // Only seed if no relationships exist yet
  const existing = await getRelationships(village);
  if (existing.length === 0) {
    await seedRelationships(village);
  }

  return NextResponse.json({ ok: true });
}
