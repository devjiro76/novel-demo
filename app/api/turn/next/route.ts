import { NextResponse } from 'next/server';
import type { CharacterStatus, TurnNextResponse } from '@/lib/types';
import { getEnv } from '@/lib/types';
import { getVillage } from '@/lib/personas';
import { generateSituation } from '@/lib/director';
import { loadState } from '@/lib/state';
import { DebugLog } from '@/lib/debug';
import { DISPLAY_NAMES } from '@/lib/display-names';

export async function POST(request: Request) {
  const env = getEnv();
  const dbg = new DebugLog();
  const gameId = request.headers.get('X-Game-ID');
  if (!gameId) return NextResponse.json({ error: 'Missing X-Game-ID header' }, { status: 400 });

  const state = await loadState(gameId);
  if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const village = await getVillage(env);

  const directorOutput = await dbg.time('director_call', {
    endpoint: '/turn/next',
    chapter: state.chapter,
    turn: state.turnCount,
  }, () => generateSituation(state, village, env));

  dbg.add('director_call', {
    situation: directorOutput.situation.slice(0, 120),
    location: directorOutput.location,
    characters: directorOutput.characters,
    choiceCount: directorOutput.choices.length,
    choices: directorOutput.choices.map((ch) => ({
      text: ch.text,
      targets: ch.targets.map((t) => `${t.characterId}:${t.actionLabel}`),
    })),
  });

  const characters: CharacterStatus[] = await Promise.all(
    directorOutput.characters.map(async (charId) => {
      const persona = village.persona(charId);
      const s = await persona.getState();
      const d = s.emotion.discrete;
      const v = s.emotion.vad;
      const parts: string[] = [];
      if (d) {
        parts.push(`${d.primary}(${d.intensity.toFixed(1)})`);
        if (d.secondary) parts.push(`+${d.secondary}`);
      }
      parts.push(`V:${v.V.toFixed(2)} A:${v.A.toFixed(2)} D:${v.D.toFixed(2)}`);
      return {
        characterId: charId,
        displayName: DISPLAY_NAMES[charId] ?? charId,
        emotionLabel: parts.join(' '),
        mood: 'neutral',
      };
    }),
  );

  const response: TurnNextResponse = {
    situation: directorOutput.situation,
    location: directorOutput.location,
    characters,
    choices: directorOutput.choices,
    chapter: state.chapter,
    turnCount: state.turnCount,
  };

  return NextResponse.json({ ...response, _debug: dbg.finalize() });
}
