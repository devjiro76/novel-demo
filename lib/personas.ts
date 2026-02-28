import { World, Village } from '@molroo-ai/world-sdk';
import type { ActionData } from '@molroo-ai/world-sdk';
import type { Env } from './types';

export type { Village, ActionData };

export interface Relationship {
  id: string;
  village_id: string;
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

export interface VillageEvent {
  id: string;
  village_id: string;
  event_type: string;
  actor_type: string | null;
  actor_id: string | null;
  target_type: string | null;
  target_id: string | null;
  action_name: string | null;
  payload: Record<string, unknown> | null;
  created_at: number;
}

const _villageCache = new Map<string, Village>();

export async function getVillage(env: Env, villageId: string): Promise<Village> {
  const cached = _villageCache.get(villageId);
  if (cached) return cached;
  const world = new World({ apiKey: env.WORLD_API_KEY, baseUrl: env.WORLD_API_URL });
  const village = await world.getVillage(villageId);
  _villageCache.set(villageId, village);
  return village;
}

export async function getRelationships(village: Village): Promise<Relationship[]> {
  return await village.listRelationships() as unknown as Relationship[];
}

export async function getEvents(
  village: Village,
  limit: number,
): Promise<{ events: VillageEvent[]; nextCursor: string | null }> {
  return await village.getEvents({ limit }) as unknown as { events: VillageEvent[]; nextCursor: string | null };
}
