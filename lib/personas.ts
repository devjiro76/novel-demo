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

let _village: Village | null = null;
let _villageKey = '';

export async function getVillage(env: Env, villageId?: string): Promise<Village> {
  const key = villageId ?? env.VILLAGE_ID;
  if (_village && _villageKey === key) return _village;
  const world = new World({ apiKey: env.WORLD_API_KEY, baseUrl: env.WORLD_API_URL });
  _village = await world.getVillage(key);
  _villageKey = key;
  return _village;
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
