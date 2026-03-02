import { NextResponse } from 'next/server';
import { kvGet, kvPut, kvDelete } from '@/lib/kv';
import type { UserWorld } from '@/lib/types';
import { getStoryPack, storyToWorldCard } from '@/lib/story-pack';
import { getEnv } from '@/lib/types';
import { getWorld } from '@/lib/personas';

// GET /api/world/[worldId] — single world detail
// 1. Try KV for user-created worlds
// 2. Fall back to builtin story slug match
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ worldId: string }> },
) {
  const { worldId } = await params;

  // Try user-created world from KV
  const raw = await kvGet(`user-world:${worldId}`);
  if (raw) {
    const world = JSON.parse(raw) as UserWorld;
    return NextResponse.json({ world, type: 'user' });
  }

  // Fall back to builtin story slug
  try {
    const pack = getStoryPack(worldId);
    const card = storyToWorldCard(pack);
    return NextResponse.json({ world: card, type: 'builtin' });
  } catch {
    // not found in builtins either
  }

  return NextResponse.json({ error: 'World not found' }, { status: 404 });
}

// DELETE /api/world/[worldId] — delete a world (user-created or world instance)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ worldId: string }> },
) {
  const { worldId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const worldInstanceId = searchParams.get('worldInstanceId');

    // 1. Delete world instance via World SDK if worldInstanceId is provided
    if (worldInstanceId) {
      try {
        const env = getEnv();
        const world = await getWorld(env, worldInstanceId);
        await world.delete();
      } catch (err: any) {
        console.warn('[world/delete] World instance delete failed (may already be deleted):', err.message);
      }
    }

    // 2. Delete user-created world from KV if it exists
    const raw = await kvGet(`user-world:${worldId}`);
    if (raw) {
      await kvDelete(`user-world:${worldId}`);

      // Remove from index
      const indexRaw = await kvGet('user-worlds:index');
      if (indexRaw) {
        const index = JSON.parse(indexRaw) as Array<{ id: string }>;
        const filtered = index.filter((w) => w.id !== worldId);
        await kvPut('user-worlds:index', JSON.stringify(filtered));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[world/delete] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
