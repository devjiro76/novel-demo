import { NextResponse } from 'next/server';
import { World } from '@molroo-ai/world-sdk';
import { getEnv } from '@/lib/types';
import { getStoryPack } from '@/lib/story-pack';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { slug?: string };
  const pack = getStoryPack(body.slug);
  const env = getEnv();

  try {
    const world = new World({ apiKey: env.WORLD_API_KEY, baseUrl: env.WORLD_API_URL });

    // 1. Create Village
    const village = await world.createVillage({
      name: `${pack.title} — ${Date.now()}`,
      description: pack.description,
      accessPolicy: 'closed',
      responseRule: 'target',
    });

    // 2. Create Personas
    await Promise.all(
      pack.personas.map((p) =>
        village.addPersona({
          configId: p.persona_config_id,
          displayName: p.display_name,
          config: p.config,
        }),
      ),
    );

    // 3. Create Actions
    await Promise.all(
      pack.actions.map((a) =>
        village.createAction({
          name: a.name,
          description: a.description,
          appraisalVector: {
            goalRelevance: a.appraisal.goal_relevance,
            goalCongruence: a.appraisal.goal_congruence,
            expectedness: a.appraisal.expectedness,
            controllability: a.appraisal.controllability,
            agency: a.appraisal.agency,
            normCompatibility: a.appraisal.norm_compatibility,
            internalStandards: a.appraisal.internal_standards,
            adjustmentPotential: a.appraisal.adjustment_potential,
            urgency: a.appraisal.urgency,
          },
        }),
      ),
    );

    // 4. Seed Relationships
    await Promise.all(
      pack.initialRelationships.map((rel) =>
        village.setRelationship({
          source: rel.source,
          target: rel.target,
          relationshipType: rel.relationshipType,
          description: rel.description,
          strength: rel.strength,
          trust: rel.trust,
        }),
      ),
    );

    return NextResponse.json({ ok: true, villageId: village.id });
  } catch (err: any) {
    console.error('[start] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Failed to create village' }, { status: 500 });
  }
}
