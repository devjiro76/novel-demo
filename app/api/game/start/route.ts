import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Molroo } from '@molroo-io/sdk/world';
import { getEnv } from '@/lib/types';
import { getStoryPack } from '@/lib/story-pack';
import { rateLimitGuard } from '@/lib/rate-limit';
import { parseBody, formatError } from '@/lib/api-utils';

const gameStartSchema = z.object({
  slug: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  const blocked = await rateLimitGuard(request);
  if (blocked) return blocked;

  const parsed = await parseBody(request, gameStartSchema);
  if ('error' in parsed) return parsed.error;

  const pack = getStoryPack(parsed.data.slug);
  const env = getEnv();

  try {
    const molroo = new Molroo({ apiKey: env.WORLD_API_KEY, baseUrl: env.WORLD_API_URL });

    // 1. Create World
    const world = await molroo.createWorld({
      name: `${pack.title} — ${Date.now()}`,
      description: pack.description,
      accessPolicy: 'closed',
      responseRule: 'target',
    });

    // 2. Create Personas
    await Promise.all(
      pack.personas.map((p) =>
        world.addPersona({
          configId: p.persona_config_id,
          displayName: p.display_name,
          config: p.config,
        }),
      ),
    );

    // 3. Create Actions
    await Promise.all(
      pack.actions.map((a) =>
        world.createAction({
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
        world.setRelationship({
          source: rel.source,
          target: rel.target,
          relationshipType: rel.relationshipType,
          description: rel.description,
          strength: rel.strength,
          trust: rel.trust,
        }),
      ),
    );

    return NextResponse.json({ ok: true, worldId: world.id });
  } catch (err) {
    console.error('[start] Error:', err);
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}
