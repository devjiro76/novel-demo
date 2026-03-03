import { NextResponse } from 'next/server';
import type { ConversationResponse } from '@/lib/types';
import { getEnv } from '@/lib/types';
import { getWorld } from '@/lib/personas';
import { generateConversationResponse } from '@/lib/narrator';
import { generateAppraisal } from '@/lib/appraisal';
import { DebugLog } from '@/lib/debug';
import { getStoryPack } from '@/lib/story-pack';
import { resolveEmotionLabel } from '@/lib/emotion';
import { rateLimitGuard } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const env = getEnv();
  const dbg = new DebugLog();

  try {
    const blocked = await rateLimitGuard(request);
    if (blocked) return blocked;

    const body = await request.json() as {
      slug?: string;
      worldId: string;
      characterId: string;
      userMessage: string;
      situation: string;
      chatHistory?: { role: 'user' | 'character'; text: string; action?: string; innerThought?: string }[];
    };
    const { slug, worldId, characterId, userMessage, situation, chatHistory } = body;
    const pack = getStoryPack(slug);

    if (!worldId || !characterId || !userMessage || !situation) {
      return NextResponse.json({ error: 'Missing worldId, characterId, userMessage, or situation' }, { status: 400 });
    }

    const world = await getWorld(env, worldId);

    dbg.add('converse_start', { characterId, userMessage: userMessage.slice(0, 80) });

    const stimulusDescription = `${pack.playerDisplayName}이 말했다: "${userMessage}"`;

    const [appraisal, conversationResult] = await Promise.all([
      dbg.time('converse_appraisal', { characterId }, () =>
        generateAppraisal(characterId, stimulusDescription, world, env),
      ),
      dbg.time('converse_narrate', { characterId }, () =>
        generateConversationResponse(characterId, situation, userMessage, world, env, pack, chatHistory),
      ),
    ]);

    const persona = world.persona(characterId);

    // Tick: advance simulation time by LLM-estimated narrative elapsed seconds
    const { estimatedElapsedSeconds, ...appraisalVector } = appraisal;
    if (estimatedElapsedSeconds >= 1) {
      await persona.tick(estimatedElapsedSeconds).catch((err: any) => {
        console.warn('[converse] tick failed (non-fatal):', err.message);
      });
    }

    await persona.interact('converse', {
      actor: pack.playerCharacterId,
      actorType: 'user',
      appraisal: appraisalVector,
      stimulusDescription,
    }).catch((err: any) => {
      console.warn('[converse] interact failed (non-fatal):', err.message);
    });

    // Read updated emotion state from engine (after appraisal applied)
    const updatedState = await persona.getState();
    const rawEmotion = (updatedState.emotion.discrete?.primary ?? '').toLowerCase().trim();
    const emotionLabel = resolveEmotionLabel(rawEmotion);
    const updatedVad = updatedState.emotion.vad;

    dbg.add('converse_result', {
      dialogue: conversationResult.dialogue.slice(0, 100),
      emotionLabel,
      vad: updatedVad,
      tickSeconds: estimatedElapsedSeconds,
    });

    const response: ConversationResponse = {
      ...conversationResult,
      emotion: {
        primary: emotionLabel,
        vad: updatedVad,
      },
    };

    return NextResponse.json({ ...response, _debug: dbg.finalize() });
  } catch (err: any) {
    console.error('[converse] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
