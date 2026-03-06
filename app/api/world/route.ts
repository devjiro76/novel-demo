import { NextResponse } from 'next/server';
import { z } from 'zod';
import { kvGet, kvPut } from '@/lib/kv';
import type { UserWorld } from '@/lib/types';
import { parseBody, formatError } from '@/lib/api-utils';

// KV schema:
//   user-world:{id}        → JSON UserWorld
//   user-worlds:index      → JSON WorldIndexEntry[]

interface WorldIndexEntry {
  id: string;
  name: string;
  description: string;
  tags: string[];
  themeColor: string;
  isPublic: boolean;
  isAdult: boolean;
  createdAt: number;
  creatorId?: string;
}

async function getWorldIndex(): Promise<WorldIndexEntry[]> {
  const raw = await kvGet('user-worlds:index');
  if (!raw) return [];
  return JSON.parse(raw) as WorldIndexEntry[];
}

async function saveWorldIndex(index: WorldIndexEntry[]): Promise<void> {
  await kvPut('user-worlds:index', JSON.stringify(index));
}

const createWorldSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  lore: z.string().max(5000).optional().default(''),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  themeColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional()
    .default('#6366f1'),
  isPublic: z.boolean().optional().default(false),
  isAdult: z.boolean().optional().default(false),
  characters: z
    .array(
      z.object({
        id: z.string().min(1).max(200),
        name: z.string().min(1).max(100),
        fullName: z.string().min(1).max(100),
        age: z.number().int().min(1).max(200),
        role: z.string().max(200),
        desc: z.string().max(1000),
        personality: z.string().max(2000),
        speakingStyle: z.string().max(2000),
        glow: z.string().max(20),
      }),
    )
    .optional()
    .default([]),
  relationships: z
    .array(
      z.object({
        sourceId: z.string().min(1).max(200),
        targetId: z.string().min(1).max(200),
        relationshipType: z.string().max(100),
        strength: z.number().min(0).max(1),
        trust: z.number().min(0).max(1),
      }),
    )
    .optional()
    .default([]),
  creatorId: z.string().max(200).optional(),
});

// GET /api/world — list public worlds, optional ?q= search
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() ?? '';

  const index = await getWorldIndex();
  const publicWorlds = index.filter((w) => w.isPublic);

  const filtered = q
    ? publicWorlds.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.tags.some((t) => t.toLowerCase().includes(q)),
      )
    : publicWorlds;

  return NextResponse.json({ ok: true, worlds: filtered });
}

// POST /api/world — create a new world
export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, createWorldSchema);
    if ('error' in parsed) return parsed.error;

    const body = parsed.data;
    const id = crypto.randomUUID();
    const createdAt = Date.now();

    const world: UserWorld = {
      id,
      name: body.name,
      description: body.description,
      lore: body.lore,
      tags: body.tags,
      themeColor: body.themeColor,
      isPublic: body.isPublic,
      isAdult: body.isAdult,
      characters: body.characters,
      relationships: body.relationships,
      createdAt,
      creatorId: body.creatorId,
    };

    // Store world
    await kvPut(`user-world:${id}`, JSON.stringify(world));

    // Update index
    const index = await getWorldIndex();
    const entry: WorldIndexEntry = {
      id,
      name: world.name,
      description: world.description,
      tags: world.tags,
      themeColor: world.themeColor,
      isPublic: world.isPublic,
      isAdult: world.isAdult,
      createdAt,
      creatorId: world.creatorId,
    };
    index.push(entry);
    await saveWorldIndex(index);

    return NextResponse.json({ ok: true, id: world.id, world }, { status: 201 });
  } catch (err) {
    console.error('[world/create] Error:', err);
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}
