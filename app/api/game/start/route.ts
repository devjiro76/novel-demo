import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/types';
import { getVillage } from '@/lib/personas';
import { seedRelationships } from '@/lib/state';

export async function POST() {
  const env = getEnv();
  const village = await getVillage(env);

  await seedRelationships(village);

  return NextResponse.json({ ok: true });
}
