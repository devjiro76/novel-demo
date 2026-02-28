import { NextResponse } from 'next/server';
import { kvGet } from '@/lib/kv';
import type { UserWorld } from '@/lib/types';
import { getStoryPack, storyToWorldCard } from '@/lib/story-pack';

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
