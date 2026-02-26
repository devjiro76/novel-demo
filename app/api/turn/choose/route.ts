import { NextResponse } from 'next/server';
import type { EventSummary, TurnChooseResponse } from '@/lib/types';
import { getEnv } from '@/lib/types';
import { getVillage } from '@/lib/personas';
import { generateReactions } from '@/lib/narrator';
import { generateAppraisal, generateStimulus } from '@/lib/appraisal';
import { loadState, saveState, advanceTurn, addNarratorEvent, updateRelationships, getRelationshipsAsAffinity, checkTierCrossing } from '@/lib/state';
import { DebugLog } from '@/lib/debug';
import { DISPLAY_NAMES } from '@/lib/display-names';
import type { AppraisalVector } from '@molroo-ai/world-sdk';

export async function POST(request: Request) {
  const env = getEnv();
  const dbg = new DebugLog();
  const gameId = request.headers.get('X-Game-ID');
  if (!gameId) return NextResponse.json({ error: 'Missing X-Game-ID header' }, { status: 400 });

  const body = await request.json() as { choiceIndex: number; situation: string; choices: any[] };
  const { choiceIndex, situation, choices } = body;

  if (choiceIndex == null || !situation || !choices) {
    return NextResponse.json({ error: 'Missing choiceIndex, situation, or choices' }, { status: 400 });
  }

  const state = await loadState(gameId);
  if (!state) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

  const choice = choices[choiceIndex];
  if (!choice) return NextResponse.json({ error: 'Invalid choiceIndex' }, { status: 400 });

  const village = await getVillage(env);

  dbg.add('turn_choose_start', {
    turn: state.turnCount + 1,
    chapter: state.chapter,
    choiceText: choice.text,
    targets: choice.targets.map((t: any) => `${t.characterId}:${t.actionLabel}`),
    narratorHistorySize: state.narratorHistory.length,
  });

  // 1. Generate stimulus + Appraise (parallel per target)
  const targets = choice.targets as { characterId: string; actionLabel: string; stimulusDescription?: string }[];
  const stimuli = new Map<string, string>();
  const appraisals = new Map<string, AppraisalVector>();

  await Promise.all(
    targets.map(async (t) => {
      // Generate stimulus if not provided by director
      const stimulus = t.stimulusDescription || await dbg.time('stimulus_gen', {
        characterId: t.characterId,
      }, () => generateStimulus(t.characterId, situation, choice.text, t.actionLabel, env));
      stimuli.set(t.characterId, stimulus);

      const appraisal = await dbg.time('appraisal_call', {
        characterId: t.characterId,
        stimulus: stimulus.slice(0, 80),
      }, () => generateAppraisal(t.characterId, stimulus, village, env));
      appraisals.set(t.characterId, appraisal);
    }),
  );

  // 2. Perceive (parallel per target)
  await Promise.all(
    targets.map(async (t) => {
      const appraisal = appraisals.get(t.characterId);
      if (!appraisal) return;

      const stimulus = stimuli.get(t.characterId) ?? t.actionLabel;
      const persona = village.persona(t.characterId);
      await dbg.time('perceive_call', {
        characterId: t.characterId,
        actionLabel: t.actionLabel,
      }, () =>
        persona.interact(t.actionLabel, {
          actor: 'yongjun',
          actorType: 'user',
          appraisal,
          stimulusDescription: stimulus,
        }),
      );
    }),
  );

  // Enrich choice targets with generated stimuli for narrator
  for (const t of targets) {
    if (!t.stimulusDescription) {
      t.stimulusDescription = stimuli.get(t.characterId);
    }
  }

  // 3. Narrate + Update relationships (independent, run in parallel)
  const targetsWithAppraisal = (choice.targets as any[]).map((t: any) => ({
    characterId: t.characterId,
    actionLabel: t.actionLabel,
    appraisal: appraisals.get(t.characterId)!,
  })).filter((t) => t.appraisal);

  const [reactions] = await Promise.all([
    dbg.time('narrator_call', {
      characterCount: [...new Set(choice.targets.map((t: any) => t.characterId))].length,
      historyTurns: state.narratorHistory.length,
    }, () => generateReactions(choice, situation, state.narratorHistory, village, env)),
    dbg.time('update_relationships', {
      targetCount: targetsWithAppraisal.length,
    }, () => updateRelationships(state, targetsWithAppraisal, village)),
  ]);

  for (const r of reactions) {
    dbg.add('narrator_call', {
      characterId: r.characterId,
      displayName: r.displayName,
      action: r.action,
      dialogue: r.dialogue,
      innerThought: r.innerThought,
      emotionLabel: r.emotion.primary,
      vad: r.emotion.vad,
    });
  }

  // 4. Store narrator history
  const eventSummary: EventSummary = {
    turn: state.turnCount + 1,
    situation: situation.slice(0, 200),
    choiceText: choice.text,
    actionLabel: choice.targets[0]?.actionLabel ?? 'unknown',
    targets: choice.targets.map((t: any) => t.characterId),
    reactions: reactions.map((r) => ({
      characterId: r.characterId,
      dialogue: r.action ? `[${r.action}] ${r.dialogue}` : r.dialogue,
      emotionPrimary: r.emotion.primary,
      valenceChange: 0,
    })),
  };

  addNarratorEvent(state, eventSummary);
  advanceTurn(state);
  await saveState(state);

  // 5. Get relationships
  const relationships = await getRelationshipsAsAffinity(village);

  // 6. Check tier crossing
  let conversationAvailable: TurnChooseResponse['conversationAvailable'] = undefined;
  const uniqueTargetIds = [...new Set((choice.targets as any[]).map((t: any) => t.characterId))];
  for (const charId of uniqueTargetIds) {
    const affinity = relationships[charId] ?? 0;
    const persona = village.persona(charId);
    const personaState = await persona.getState();
    const arousal = personaState.emotion.vad.A;
    const tierCrossed = checkTierCrossing(state, charId, affinity, arousal);
    if (tierCrossed !== null) {
      conversationAvailable = {
        characterId: charId,
        displayName: DISPLAY_NAMES[charId] ?? charId,
        tierCrossed,
        arousal,
      };
      await saveState(state);
      break;
    }
  }

  const response: TurnChooseResponse = {
    choiceText: choice.text,
    reactions,
    chapter: state.chapter,
    turnCount: state.turnCount,
    relationships,
    conversationAvailable,
  };

  return NextResponse.json({ ...response, _debug: dbg.finalize() });
}
