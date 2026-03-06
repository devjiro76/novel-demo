import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvPut } from '@/lib/kv';
import { rateLimitGuard } from '@/lib/rate-limit';

// POST /api/character/:charId/like
export async function POST(req: NextRequest, { params }: { params: Promise<{ charId: string }> }) {
  const blocked = await rateLimitGuard(req);
  if (blocked) return blocked;

  const { charId } = await params;

  if (!charId || charId.length > 200) {
    return NextResponse.json({ error: 'Invalid charId' }, { status: 400 });
  }

  const likesKey = `character-likes:${charId}`;

  const raw = await kvGet(likesKey);
  const currentLikes = raw ? parseInt(raw, 10) : 0;
  const newLikes = currentLikes + 1;

  await kvPut(likesKey, String(newLikes));

  return NextResponse.json({ ok: true, likes: newLikes });
}

// GET /api/character/:charId/like
export async function GET(_req: NextRequest, { params }: { params: Promise<{ charId: string }> }) {
  const { charId } = await params;

  if (!charId || charId.length > 200) {
    return NextResponse.json({ error: 'Invalid charId' }, { status: 400 });
  }

  const likesKey = `character-likes:${charId}`;
  const raw = await kvGet(likesKey);
  const likes = raw ? parseInt(raw, 10) : 0;

  return NextResponse.json({ ok: true, likes });
}
