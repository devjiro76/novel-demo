import { Molroo, World, type ActionData } from '@molroo-io/sdk/world';
import type { Env } from './types';

export type { World, ActionData };

export interface Relationship {
  id: string;
  world_id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relationship_type: string | null;
  description: string | null;
  strength: number;
  trust: number;
  created_at: number;
  updated_at: number;
}

export interface WorldEvent {
  id: string;
  world_id: string;
  event_type: string;
  actor_type: string | null;
  actor_id: string | null;
  target_type: string | null;
  target_id: string | null;
  action_name: string | null;
  payload: Record<string, unknown> | null;
  created_at: number;
}

const _worldCache = new Map<string, World>();

export async function getWorld(env: Env, worldId: string): Promise<World> {
  const cached = _worldCache.get(worldId);
  if (cached) return cached;
  const molroo = new Molroo({ apiKey: env.WORLD_API_KEY, baseUrl: env.WORLD_API_URL });
  const world = await molroo.getWorld(worldId);
  _worldCache.set(worldId, world);
  return world;
}

function isRelationshipArray(data: unknown): data is Relationship[] {
  return (
    Array.isArray(data) &&
    data.every(
      (item) =>
        typeof item === 'object' && item !== null && 'source_id' in item && 'target_id' in item,
    )
  );
}

export async function getRelationships(world: World): Promise<Relationship[]> {
  const data = await world.listRelationships();
  if (isRelationshipArray(data)) return data;
  return [];
}

function isEventsResponse(
  data: unknown,
): data is { events: WorldEvent[]; nextCursor: string | null } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'events' in data &&
    Array.isArray((data as Record<string, unknown>).events)
  );
}

export async function getEvents(
  world: World,
  limit: number,
): Promise<{ events: WorldEvent[]; nextCursor: string | null }> {
  const data = await world.getEvents({ limit });
  if (isEventsResponse(data)) return data;
  return { events: [], nextCursor: null };
}
