import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { kvGet, kvPut } from '@/lib/kv';
import { parseBody, formatError } from '@/lib/api-utils';

const CHARACTERS_INDEX_KEY = 'user-characters:index';

const createCharacterSchema = z.object({
  name: z.string().min(1).max(50),
  fullName: z.string().min(1).max(100),
  age: z.number().int().min(1).max(200).optional().default(20),
  role: z.string().min(1).max(200),
  desc: z.string().min(1).max(1000),
  personality: z.string().min(1).max(2000),
  speakingStyle: z.string().max(2000).optional().default(''),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  isPublic: z.boolean().optional().default(true),
  isAdult: z.boolean().optional().default(false),
  glow: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color')
    .optional()
    .default('#a855f7'),
});

// GET /api/character — list all public characters
export async function GET() {
  const raw = await kvGet(CHARACTERS_INDEX_KEY);
  const index: string[] = raw ? JSON.parse(raw) : [];

  const characters = [];
  for (const id of index.slice(-50)) {
    // latest 50
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
  try {
    const parsed = await parseBody(req, createCharacterSchema);
    if ('error' in parsed) return parsed.error;

    const body = parsed.data;
    const id = crypto.randomUUID();
    const character = {
      id,
      name: body.name,
      fullName: body.fullName,
      age: body.age,
      role: body.role,
      desc: body.desc,
      personality: body.personality,
      speakingStyle: body.speakingStyle,
      tags: body.tags,
      isPublic: body.isPublic,
      isAdult: body.isAdult,
      glow: body.glow,
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
  } catch (err) {
    console.error('[character/create] Error:', err);
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}
