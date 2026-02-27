/**
 * World API relationship seeding.
 */

import type { Village } from './personas';
import type { StoryManifest } from './story-pack';

export async function seedRelationships(village: Village, pack: StoryManifest): Promise<void> {
  const promises = pack.initialRelationships.map((rel) =>
    village.setRelationship({
      source: rel.source,
      target: rel.target,
      relationshipType: rel.relationshipType,
      description: rel.description,
      strength: rel.strength,
      trust: rel.trust,
    }),
  );
  await Promise.all(promises);
}
