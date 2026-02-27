import { NextResponse } from 'next/server';
import type { ConversationResponse } from '@/lib/types';
import { getEnv } from '@/lib/types';
import { getVillage } from '@/lib/personas';
import { generateConversationResponse } from '@/lib/narrator';
import { generateAppraisal } from '@/lib/appraisal';
import { DebugLog } from '@/lib/debug';

// Engine emotionCenters: 14 discrete labels only
const EMOTION_KO: Record<string, string> = {
  joy: '기쁨',
  excitement: '설렘',
  contentment: '만족',
  anger: '분노',
  fear: '두려움',
  sadness: '슬픔',
  anxiety: '불안',
  surprise: '놀라움',
  disgust: '혐오',
  trust: '신뢰',
  calm: '평온',
  shame: '수치심',
  guilt: '죄책감',
  numbness: '무감각',
};

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

    // Tick: advance simulation time by LLM-estimated narrative elapsed seconds
    const { estimatedElapsedSeconds, ...appraisalVector } = appraisal;
    if (estimatedElapsedSeconds >= 1) {
      await persona.tick(estimatedElapsedSeconds).catch((err: any) => {
        console.warn('[converse] tick failed (non-fatal):', err.message);
      });
    }

    await persona.interact('converse', {
      actor: 'yongjun',
      actorType: 'user',
      appraisal: appraisalVector,
      stimulusDescription,
    });

    // Read updated emotion state from engine (after appraisal applied)
    const updatedState = await persona.getState();
    const rawEmotion = (updatedState.emotion.discrete?.primary ?? '').toLowerCase().trim();
    const emotionLabel = EMOTION_KO[rawEmotion] ?? EMOTION_KO[rawEmotion.replace(/\s+/g, '_')] ?? '';
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
    return NextResponse.json({ error: err.message ?? 'Internal error', stack: err.stack?.slice(0, 500) }, { status: 500 });
  }
}
