/**
 * Novel API — Hono routes for the "못참아" interactive novel.
 *
 * Endpoints:
 *   POST /game/start   → Initialize game, return first situation
 *   POST /turn/next    → Generate next situation + choices
 *   POST /turn/choose  → Execute choice, return character reactions
 *   GET  /game/state   → Get current game state
 *   POST /game/reset   → Reset game
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, TurnNextResponse, TurnChooseResponse, GameStartResponse, CharacterStatus, EventSummary, ConversationResponse } from './types';
import { getVillage, getEvents } from './personas';
import { generateSituation } from './director';
import { generateReactions, generateConversationResponse } from './narrator';
import { generateAppraisal } from './appraisal';
import { createInitialState, saveState, loadState, deleteState, advanceTurn, addNarratorEvent, updateRelationships, seedRelationships, getRelationshipsAsAffinity, checkTierCrossing } from './state';
import { DebugLog } from './debug';

type HonoEnv = { Bindings: Env };

const app = new Hono<HonoEnv>();

// CORS for frontend
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://novel.pages.dev'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Game-ID'],
}));

// Helper: get game ID from header or body
function getGameId(c: any): string | null {
  return c.req.header('X-Game-ID') ?? null;
}

const DISPLAY_NAMES: Record<string, string> = {
  jeongsuk: '박정숙',
  eunhye: '장은혜',
  mina: '김미나',
  jeongjung: '장정중',
  deokhui: '장덕희',
};

// ============================================================
// POST /game/start
// ============================================================
app.post('/game/start', async (c) => {
  const env = c.env;
  const dbg = new DebugLog();
  const village = await getVillage(env);

  // Create new game
  const gameId = crypto.randomUUID();
  const state = createInitialState(gameId);

  // Seed initial relationships in the World API
  await seedRelationships(village);

  // Generate first situation
  const directorOutput = await dbg.time('director_call', {
    endpoint: '/game/start',
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

  // Build character statuses via WorldPersona handles
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

  // Save state
  await saveState(env.GAME_STATE, state);

  const response: GameStartResponse = {
    gameId,
    chapter: state.chapter,
    turnCount: state.turnCount,
    situation: directorOutput.situation,
    location: directorOutput.location,
    characters,
    choices: directorOutput.choices,
  };

  return c.json({ ...response, _debug: dbg.finalize() });
});

// ============================================================
// POST /turn/next
// ============================================================
app.post('/turn/next', async (c) => {
  const env = c.env;
  const dbg = new DebugLog();
  const gameId = getGameId(c);
  if (!gameId) return c.json({ error: 'Missing X-Game-ID header' }, 400);

  const state = await loadState(env.GAME_STATE, gameId);
  if (!state) return c.json({ error: 'Game not found' }, 404);

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

  // Build character statuses via WorldPersona handles
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

  return c.json({ ...response, _debug: dbg.finalize() });
});

// ============================================================
// POST /turn/choose
// ============================================================
app.post('/turn/choose', async (c) => {
  const env = c.env;
  const dbg = new DebugLog();
  const gameId = getGameId(c);
  if (!gameId) return c.json({ error: 'Missing X-Game-ID header' }, 400);

  const body = await c.req.json<{ choiceIndex: number; situation: string; choices: any[] }>();
  const { choiceIndex, situation, choices } = body;

  if (choiceIndex == null || !situation || !choices) {
    return c.json({ error: 'Missing choiceIndex, situation, or choices' }, 400);
  }

  const state = await loadState(env.GAME_STATE, gameId);
  if (!state) return c.json({ error: 'Game not found' }, 404);

  const choice = choices[choiceIndex];
  if (!choice) return c.json({ error: 'Invalid choiceIndex' }, 400);

  const village = await getVillage(env);

  dbg.add('turn_choose_start', {
    turn: state.turnCount + 1,
    chapter: state.chapter,
    choiceText: choice.text,
    targets: choice.targets.map((t: any) => `${t.characterId}:${t.actionLabel}`),
    narratorHistorySize: state.narratorHistory.length,
  });

  // 1. Appraise: dedicated LLM generates persona-specific appraisal per target
  const appraisals = new Map<string, import('@molroo-ai/world-sdk').AppraisalVector>();
  await Promise.all(
    (choice.targets as { characterId: string; actionLabel: string; stimulusDescription: string }[]).map(async (t) => {
      const appraisal = await dbg.time('appraisal_call', {
        characterId: t.characterId,
        stimulus: t.stimulusDescription?.slice(0, 80),
      }, () => generateAppraisal(t.characterId, t.stimulusDescription, village, env));
      appraisals.set(t.characterId, appraisal);
    }),
  );

  // 2. Perceive: feed appraisal to emotion engine via WorldPersona (parallel)
  await Promise.all(
    (choice.targets as { characterId: string; actionLabel: string; stimulusDescription: string }[]).map(async (t) => {
      const appraisal = appraisals.get(t.characterId);
      if (!appraisal) return;

      const persona = village.persona(t.characterId);
      await dbg.time('perceive_call', {
        characterId: t.characterId,
        actionLabel: t.actionLabel,
      }, () =>
        persona.interact(t.actionLabel, {
          actor: 'yongjun',
          actorType: 'user',
          appraisal,
          stimulusDescription: t.stimulusDescription,
        }),
      );
    }),
  );

  // 3. Narrate: LLM generates narrative based on UPDATED emotion state
  const reactions = await dbg.time('narrator_call', {
    characterCount: [...new Set(choice.targets.map((t: any) => t.characterId))].length,
    historyTurns: state.narratorHistory.length,
  }, () => generateReactions(choice, situation, state.narratorHistory, village, env));

  // Log each reaction for review
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

  // 4. Update relationships with appraisal-derived deltas
  const targetsWithAppraisal = (choice.targets as any[]).map((t: any) => ({
    characterId: t.characterId,
    actionLabel: t.actionLabel,
    appraisal: appraisals.get(t.characterId)!,
  })).filter((t) => t.appraisal);
  await updateRelationships(state, targetsWithAppraisal, village);

  // 5. Store narrator history (for LLM chat context — not the authoritative event log)
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
  await saveState(env.GAME_STATE, state);

  // 5. Get relationships from World API for the response
  const relationships = await getRelationshipsAsAffinity(village);

  // 6. Check tier crossing for 1:1 conversation trigger
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
      await saveState(env.GAME_STATE, state); // persist tiersCrossed update
      break; // only one conversation per turn
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

  return c.json({ ...response, _debug: dbg.finalize() });
});

// ============================================================
// POST /turn/converse — 1:1 free-text conversation
// ============================================================
app.post('/turn/converse', async (c) => {
  const env = c.env;
  const dbg = new DebugLog();
  const gameId = getGameId(c);
  if (!gameId) return c.json({ error: 'Missing X-Game-ID header' }, 400);

  const body = await c.req.json<{ characterId: string; userMessage: string; situation: string }>();
  const { characterId, userMessage, situation } = body;

  if (!characterId || !userMessage || !situation) {
    return c.json({ error: 'Missing characterId, userMessage, or situation' }, 400);
  }

  const state = await loadState(env.GAME_STATE, gameId);
  if (!state) return c.json({ error: 'Game not found' }, 404);

  const village = await getVillage(env);

  dbg.add('converse_start', { characterId, userMessage: userMessage.slice(0, 80) });

  // 1. Generate appraisal for the user's message
  const stimulusDescription = `용준이 말했다: "${userMessage}"`;
  const appraisal = await dbg.time('converse_appraisal', {
    characterId,
  }, () => generateAppraisal(characterId, stimulusDescription, village, env));

  // 2. Feed appraisal to emotion engine
  const persona = village.persona(characterId);
  await dbg.time('converse_perceive', {
    characterId,
  }, () =>
    persona.interact('converse', {
      actor: 'yongjun',
      actorType: 'user',
      appraisal,
      stimulusDescription,
    }),
  );

  // 3. Generate conversation response
  const conversationResult = await dbg.time('converse_narrate', {
    characterId,
  }, () => generateConversationResponse(
    characterId, situation, userMessage,
    state.narratorHistory, village, env,
  ));

  dbg.add('converse_result', {
    dialogue: conversationResult.dialogue.slice(0, 100),
    emotionLabel: conversationResult.emotion.primary,
    conversationOver: conversationResult.conversationOver,
  });

  const response: ConversationResponse = conversationResult;

  return c.json({ ...response, _debug: dbg.finalize() });
});

// ============================================================
// GET /game/state
// ============================================================
app.get('/game/state', async (c) => {
  const env = c.env;
  const gameId = getGameId(c);
  if (!gameId) return c.json({ error: 'Missing X-Game-ID header' }, 400);

  const state = await loadState(env.GAME_STATE, gameId);
  if (!state) return c.json({ error: 'Game not found' }, 404);

  const village = await getVillage(env);

  // Fetch relationships and recent events from World API
  const [relationships, eventsResult] = await Promise.all([
    getRelationshipsAsAffinity(village),
    getEvents(village, 5),
  ]);

  return c.json({
    gameId: state.gameId,
    chapter: state.chapter,
    turnCount: state.turnCount,
    relationships,
    tension: state.tension,
    recentEvents: eventsResult.events,
  });
});

// ============================================================
// POST /game/reset
// ============================================================
app.post('/game/reset', async (c) => {
  const env = c.env;
  const gameId = getGameId(c);
  if (!gameId) return c.json({ error: 'Missing X-Game-ID header' }, 400);

  await deleteState(env.GAME_STATE, gameId);
  return c.json({ ok: true });
});

// Health check
app.get('/', (c) => c.json({ name: 'novel-api', status: 'ok' }));

export default app;
