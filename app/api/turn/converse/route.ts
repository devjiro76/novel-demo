import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getEnv, type ConversationResponse } from '@/lib/types';
import { getWorld } from '@/lib/personas';
import { generateConversationResponse } from '@/lib/narrator';
import { generateAppraisal } from '@/lib/appraisal';
import { DebugLog } from '@/lib/debug';
import { getStoryPack } from '@/lib/story-pack';
import { resolveEmotionLabel } from '@/lib/emotion';
import { rateLimitGuard } from '@/lib/rate-limit';
import { parseBody, formatError } from '@/lib/api-utils';

const converseSchema = z.object({
  slug: z.string().max(100).optional(),
  worldId: z.string().min(1).max(200),
  characterId: z.string().min(1).max(200),
  userMessage: z.string().min(1).max(2000),
  situation: z.string().min(1).max(2000),
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'character']),
        text: z.string().max(2000),
        action: z.string().max(1000).optional(),
        innerThought: z.string().max(1000).optional(),
      }),
    )
    .optional(),
});

export async function POST(request: Request) {
  const env = getEnv();
  const dbg = new DebugLog();

  try {
    const blocked = await rateLimitGuard(request);
    if (blocked) return blocked;

    const parsed = await parseBody(request, converseSchema);
    if ('error' in parsed) return parsed.error;

    const { slug, worldId, characterId, userMessage, situation, chatHistory } = parsed.data;
    const pack = getStoryPack(slug);

    const world = await getWorld(env, worldId);

    dbg.add('converse_start', { characterId, userMessage: userMessage.slice(0, 80) });

    const stimulusDescription = `${pack.playerDisplayName}이 말했다: "${userMessage}"`;

    const [appraisal, conversationResult] = await Promise.all([
      dbg.time('converse_appraisal', { characterId }, () =>
        generateAppraisal(characterId, stimulusDescription, world, env),
      ),
      dbg.time('converse_narrate', { characterId }, () =>
        generateConversationResponse(
          characterId,
          situation,
          userMessage,
          world,
          env,
          pack,
          chatHistory,
        ),
      ),
    ]);

    const persona = world.persona(characterId);

    // Tick: advance simulation time by LLM-estimated narrative elapsed seconds
    const { estimatedElapsedSeconds, ...appraisalVector } = appraisal;
    if (estimatedElapsedSeconds >= 1) {
      await persona.tick(estimatedElapsedSeconds).catch((err: unknown) => {
        console.warn(
          '[converse] tick failed (non-fatal):',
          err instanceof Error ? err.message : err,
        );
      });
    }

    await persona
      .interact('converse', {
        actor: pack.playerCharacterId,
        actorType: 'user',
        appraisal: appraisalVector,
        stimulusDescription,
      })
      .catch((err: unknown) => {
        console.warn(
          '[converse] interact failed (non-fatal):',
          err instanceof Error ? err.message : err,
        );
      });

    // Read updated emotion state from engine (after appraisal applied)
    const updatedState = await persona.getState();
    const rawEmotion = (updatedState.emotion.label ?? '').toLowerCase().trim();
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
  } catch (err) {
    console.error('[converse] Error:', err);
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}
