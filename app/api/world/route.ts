import { NextResponse } from 'next/server';
import { kvGet, kvPut } from '@/lib/kv';
import type { UserWorld } from '@/lib/types';

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
  const body = await request.json().catch(() => ({})) as Omit<UserWorld, 'id' | 'createdAt'>;

  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const createdAt = Date.now();

  const world: UserWorld = {
    id,
    name: body.name,
    description: body.description ?? '',
    lore: body.lore ?? '',
    tags: Array.isArray(body.tags) ? body.tags : [],
    themeColor: body.themeColor ?? '#6366f1',
    isPublic: body.isPublic ?? false,
    isAdult: body.isAdult ?? false,
    characters: Array.isArray(body.characters) ? body.characters : [],
    relationships: Array.isArray(body.relationships) ? body.relationships : [],
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
}
