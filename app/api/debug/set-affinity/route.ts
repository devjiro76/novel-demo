import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/types';
import { getVillage } from '@/lib/personas';
import { getRelationshipsAsAffinity } from '@/lib/state';

export async function POST(request: Request) {
  const env = getEnv();
  const body = await request.json() as Record<string, number>;
  const village = await getVillage(env);

  await Promise.all(
    Object.entries(body).map(([charId, affinity]) =>
      village.setRelationship({
        source: { type: 'user', id: 'yongjun' },
        target: { type: 'persona', id: charId },
        relationshipType: 'player_npc',
        strength: Math.max(0, Math.min(1, affinity / 200 + 0.5)),
        trust: Math.max(0, Math.min(1, affinity / 200 + 0.5)),
      }),
    ),
  );

  const relationships = await getRelationshipsAsAffinity(village);
  return NextResponse.json({ ok: true, relationships });
}
