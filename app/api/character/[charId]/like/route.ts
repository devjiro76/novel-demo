import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvPut } from '@/lib/kv';

// POST /api/character/:charId/like
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ charId: string }> }
) {
  const { charId } = await params;
  const likesKey = `character-likes:${charId}`;

  const raw = await kvGet(likesKey);
  const currentLikes = raw ? parseInt(raw, 10) : 0;
  const newLikes = currentLikes + 1;

  await kvPut(likesKey, String(newLikes));

  return NextResponse.json({ ok: true, likes: newLikes });
}

// GET /api/character/:charId/like
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ charId: string }> }
) {
  const { charId } = await params;
  const likesKey = `character-likes:${charId}`;
  const raw = await kvGet(likesKey);
  const likes = raw ? parseInt(raw, 10) : 0;

  return NextResponse.json({ ok: true, likes });
}
