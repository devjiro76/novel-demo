import { NextResponse } from 'next/server';
import type { ConversationResponse } from '@/lib/types';
import { getEnv } from '@/lib/types';
import { getVillage } from '@/lib/personas';
import { generateConversationResponse } from '@/lib/narrator';
import { generateAppraisal } from '@/lib/appraisal';
import { DebugLog } from '@/lib/debug';

export async function POST(request: Request) {
  const env = getEnv();
  const dbg = new DebugLog();

  try {
    const body = await request.json() as {
      characterId: string;
      userMessage: string;
      situation: string;
      chatHistory?: { role: 'user' | 'character'; text: string; action?: string; innerThought?: string }[];
    };
    const { characterId, userMessage, situation, chatHistory } = body;

    if (!characterId || !userMessage || !situation) {
      return NextResponse.json({ error: 'Missing characterId, userMessage, or situation' }, { status: 400 });
    }

    const village = await getVillage(env);

    dbg.add('converse_start', { characterId, userMessage: userMessage.slice(0, 80) });

    const stimulusDescription = `용준이 말했다: "${userMessage}"`;

    const [appraisal, conversationResult] = await Promise.all([
      dbg.time('converse_appraisal', { characterId }, () =>
        generateAppraisal(characterId, stimulusDescription, village, env),
      ),
      dbg.time('converse_narrate', { characterId }, () =>
        generateConversationResponse(characterId, situation, userMessage, village, env, chatHistory),
      ),
    ]);

    const persona = village.persona(characterId);
    await persona.interact('converse', {
      actor: 'yongjun',
      actorType: 'user',
      appraisal,
      stimulusDescription,
    });

    dbg.add('converse_result', {
      dialogue: conversationResult.dialogue.slice(0, 100),
      emotionLabel: conversationResult.emotion.primary,
    });

    const response: ConversationResponse = conversationResult;

    return NextResponse.json({ ...response, _debug: dbg.finalize() });
  } catch (err: any) {
    console.error('[converse] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error', stack: err.stack?.slice(0, 500) }, { status: 500 });
  }
}
