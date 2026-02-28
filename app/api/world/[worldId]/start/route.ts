import { NextResponse } from 'next/server';
import { World } from '@molroo-ai/world-sdk';
import { getEnv } from '@/lib/types';
import { kvGet, kvPut } from '@/lib/kv';
import type { UserWorld } from '@/lib/types';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ worldId: string }> },
) {
  const { worldId } = await params;
  const env = getEnv();

  // 1. Load world from KV
  const raw = await kvGet(`user-world:${worldId}`);
  if (!raw) {
    return NextResponse.json({ error: 'World not found' }, { status: 404 });
  }

  const userWorld = JSON.parse(raw) as UserWorld;

  // Check if village already exists for this world
  const existingVillageId = await kvGet(`world-village:${worldId}`);
  if (existingVillageId) {
    return NextResponse.json({ ok: true, villageId: existingVillageId });
  }

  try {
    const world = new World({ apiKey: env.WORLD_API_KEY, baseUrl: env.WORLD_API_URL });

    // 2. Create Village
    const village = await world.createVillage({
      name: `${userWorld.name} — ${Date.now()}`,
      description: userWorld.description || userWorld.lore || userWorld.name,
      accessPolicy: 'closed',
      responseRule: 'target',
    });

    // 3. Add personas from world characters
    await Promise.all(
      userWorld.characters.map((char) =>
        village.addPersona({
          configId: char.id,
          displayName: char.name,
          config: {
            type: 'persona',
            identity: {
              name: char.fullName || char.name,
              role: char.role,
              description: char.desc,
              speakingStyle: char.speakingStyle,
              age: String(char.age),
            },
            personality: {
              O: 0.5,
              C: 0.7,
              E: 0.5,
              A: 0.7,
              N: 0.5,
              H: 0.6,
            },
          },
        }),
      ),
    );

    // 4. Set up initial relationships
    if (userWorld.relationships && userWorld.relationships.length > 0) {
      await Promise.all(
        userWorld.relationships.map((rel) =>
          village.setRelationship({
            source: { type: 'persona' as const, id: rel.sourceId },
            target: { type: 'persona' as const, id: rel.targetId },
            relationshipType: rel.relationshipType,
            strength: rel.strength,
            trust: rel.trust,
          }),
        ),
      );
    }

    // 5. Store villageId mapping in KV for reuse
    await kvPut(`world-village:${worldId}`, village.id);

    return NextResponse.json({ ok: true, villageId: village.id });
  } catch (err: any) {
    console.error('[world/start] Error:', err);
    return NextResponse.json(
      { error: err.message ?? 'Failed to create village' },
      { status: 500 },
    );
  }
}
