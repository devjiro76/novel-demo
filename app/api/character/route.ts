import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvPut } from '@/lib/kv';

const CHARACTERS_INDEX_KEY = 'user-characters:index';

// GET /api/character — list all public characters
export async function GET() {
  const raw = await kvGet(CHARACTERS_INDEX_KEY);
  const index: string[] = raw ? JSON.parse(raw) : [];

  const characters = [];
  for (const id of index.slice(-50)) { // latest 50
    const data = await kvGet(`user-character:${id}`);
    if (data) {
      const char = JSON.parse(data);
      if (char.isPublic) characters.push(char);
    }
  }

  return NextResponse.json({ ok: true, characters: characters.reverse() });
}

// POST /api/character — create new character
export async function POST(req: NextRequest) {
  const body = await req.json() as Record<string, unknown>;
  const { name, fullName, age, role, desc, personality, speakingStyle, tags, isPublic, isAdult, glow } = body as {
    name?: string; fullName?: string; age?: number; role?: string; desc?: string;
    personality?: string; speakingStyle?: string; tags?: string[];
    isPublic?: boolean; isAdult?: boolean; glow?: string;
  };

  if (!name || !fullName || !role || !desc || !personality) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const character = {
    id, name, fullName, age: age || 20, role, desc,
    personality, speakingStyle: speakingStyle || '',
    tags: tags || [], isPublic: isPublic ?? true, isAdult: isAdult ?? false,
    glow: glow || '#a855f7',
    createdAt: Date.now(),
  };

  // Save character
  await kvPut(`user-character:${id}`, JSON.stringify(character));

  // Update index
  const rawIndex = await kvGet(CHARACTERS_INDEX_KEY);
  const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
  index.push(id);
  await kvPut(CHARACTERS_INDEX_KEY, JSON.stringify(index));

  return NextResponse.json({ ok: true, character });
}
