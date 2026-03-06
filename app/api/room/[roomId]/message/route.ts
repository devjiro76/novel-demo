import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRoom, createRoomWithId, ensurePlayer, addMessage, getMessages } from '@/lib/room-store';
import { getEnv, type EmotionDetail } from '@/lib/types';
import { getWorld } from '@/lib/personas';
import { generateConversationResponse } from '@/lib/narrator';
import { generateAppraisal } from '@/lib/appraisal';
import type { AppraisalVector } from '@molroo-io/sdk/world';
import { getStoryPack } from '@/lib/story-pack';
import { updateSummaryIfNeeded, loadLongMemory } from '@/lib/memory';
import type { RoomMessage } from '@/lib/room';
import { resolveEmotionLabel } from '@/lib/emotion';
import { rateLimitGuard } from '@/lib/rate-limit';
import { parseBody, formatError } from '@/lib/api-utils';
import { sanitizeUserInput } from '@/lib/sanitize';

const messageSchema = z.object({
  playerId: z.string().min(1).max(200),
  text: z.string().min(1).max(2000),
  slug: z.string().max(100).optional(),
  worldId: z.string().max(200).optional(),
  npcCharacterId: z.string().max(200).optional(),
  displayName: z.string().max(50).optional(),
  characterId: z.string().max(200).optional(),
  targetNpcId: z.string().max(200).optional(),
});

type MessageBody = z.infer<typeof messageSchema>;

async function ensureRoom(roomId: string, body: MessageBody) {
  let room = await getRoom(roomId);
  if (!room && body.slug && body.worldId && body.npcCharacterId) {
    await createRoomWithId(roomId, {
      slug: body.slug,
      worldId: body.worldId,
      npcCharacterId: body.npcCharacterId,
    });
    room = await getRoom(roomId);
  }
  return room;
}

async function ensurePlayerInRoom(
  roomId: string,
  playerId: string,
  room: Awaited<ReturnType<typeof getRoom>>,
  body: MessageBody,
) {
  let player = room!.players.find((p) => p.playerId === playerId) ?? null;
  if (!player && body.displayName && body.characterId) {
    player = await ensurePlayer(roomId, playerId, {
      displayName: body.displayName,
      characterId: body.characterId,
    });
  }
  return player;
}

function buildRespondingNpcIds(body: MessageBody, npcCharacterIds: string[]) {
  if (body.targetNpcId && npcCharacterIds.includes(body.targetNpcId)) {
    return [body.targetNpcId];
  }
  return npcCharacterIds;
}

async function processMessage(roomId: string, env: ReturnType<typeof getEnv>, body: MessageBody) {
  const { playerId, text } = body;

  const room = await ensureRoom(roomId, body);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const player = await ensurePlayerInRoom(roomId, playerId, room, body);
  if (!player) return NextResponse.json({ error: 'Player not in room' }, { status: 403 });

  const playerMsg = await addMessage(roomId, {
    sender: { type: 'player', id: playerId, name: player.displayName },
    text: text.trim(),
  });
  if (!playerMsg) return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });

  const npcMessages = await generateAllNpcResponses(roomId, env, room, body, player, text);
  const validMessages = npcMessages.filter((m): m is RoomMessage => m !== null);

  return NextResponse.json({
    ok: true,
    playerMessage: playerMsg,
    npcMessage: validMessages[0] ?? null,
    npcMessages: validMessages,
  });
}

async function generateAllNpcResponses(
  roomId: string,
  env: ReturnType<typeof getEnv>,
  room: NonNullable<Awaited<ReturnType<typeof getRoom>>>,
  body: MessageBody,
  player: { playerId: string; displayName: string; characterId: string },
  text: string,
) {
  const pack = getStoryPack(room.slug);
  const world = await getWorld(env, room.worldId);
  const npcCharacterIds: string[] = room.npcCharacterIds ?? [room.npcCharacterId];
  const respondingNpcIds = buildRespondingNpcIds(body, npcCharacterIds);

  const allMessages = await getMessages(roomId);
  const freshRoom = await getRoom(roomId);
  const allPlayers = freshRoom?.players ?? [];
  const senderPlayer = {
    playerId: player.playerId,
    displayName: player.displayName,
    characterId: player.characterId,
  };
  const npcText =
    text
      .trim()
      .replace(/^@\S+\s*/, '')
      .trim() || text.trim();
  const stimulusDescription = `${sanitizeUserInput(player.displayName)}이(가) 말했다: "${sanitizeUserInput(npcText)}"`;


  return Promise.all(
    respondingNpcIds.map((npcId) =>
      generateNpcResponse({
        roomId,
        npcId,
        pack,
        world,
        env,
        allMessages,
        allPlayers,
        senderPlayer,
        stimulusDescription,
        playerText: npcText,
        player,
      }).catch((err) => {
        console.error(`[room/message] NPC ${npcId} response failed:`, err);
        return null;
      }),
    ),
  );
}

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const env = getEnv();

  try {
    const blocked = await rateLimitGuard(request);
    if (blocked) return blocked;

    const parsed = await parseBody(request, messageSchema);
    if ('error' in parsed) return parsed.error;

    return processMessage(roomId, env, parsed.data);
  } catch (err) {
    console.error('[room/message] Error:', err);
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}

/** Generate a single NPC's response */
async function generateNpcResponse(ctx: {
  roomId: string;
  npcId: string;
  pack: ReturnType<typeof getStoryPack>;
  world: Awaited<ReturnType<typeof getWorld>>;
  env: ReturnType<typeof getEnv>;
  allMessages: RoomMessage[];
  allPlayers: { playerId: string; displayName: string; characterId: string }[];
  senderPlayer: { playerId: string; displayName: string; characterId: string };
  stimulusDescription: string;
  playerText: string;
  player: { playerId: string; displayName: string; characterId: string };
}): Promise<RoomMessage | null> {
  const {
    roomId,
    npcId,
    pack,
    world,
    env,
    allMessages,
    allPlayers,
    senderPlayer,
    stimulusDescription,
    playerText,
    player,
  } = ctx;
  const npcDisplayName = pack.displayNames[npcId] ?? npcId;
  const chatHistory = buildChatHistory(allMessages, npcId);

  const situation = pack.defaultSituation.replace(
    /\{\{charFullName\}\}/g,
    pack.characters.find((c) => c.id === npcId)?.fullName ?? npcDisplayName,
  );

  const [summary, longMemory] = await Promise.all([
    updateSummaryIfNeeded(roomId, npcId, chatHistory, env).catch((err) => {
      console.warn(
        `[room/message] summary failed for ${npcId} (non-fatal):`,
        err instanceof Error ? err.message : err,
      );
      return '';
    }),
    loadLongMemory(roomId, npcId).catch(() => ''),
  ]);

  const [appraisal, conversationResult] = await Promise.all([
    generateAppraisal(npcId, stimulusDescription, world, env, player.characterId),
    generateConversationResponse(
      npcId,
      situation,
      playerText,
      world,
      env,
      pack,
      chatHistory,
      senderPlayer,
      allPlayers,
      summary,
      longMemory,
    ),
  ]);

  const persona = world.persona(npcId);
  const { estimatedElapsedSeconds, ...appraisalVector } = appraisal;
  if (estimatedElapsedSeconds >= 1) {
    await persona.tick(estimatedElapsedSeconds).catch((err: unknown) => {
      console.warn(
        `[room/message] tick failed for ${npcId} (non-fatal):`,
        err instanceof Error ? err.message : err,
      );
    });
  }

  const relationshipBefore = await getRelationship(persona, player.characterId);
  const { rawEmotion, emotionDetail } = await runInteract(
    persona,
    npcId,
    player,
    appraisalVector,
    stimulusDescription,
  );
  const emotionLabel = resolveEmotionLabel(rawEmotion);
  const relationshipDelta = await computeRelationshipDelta(
    persona,
    player.characterId,
    relationshipBefore,
  );

  return addMessage(roomId, {
    sender: { type: 'npc', id: npcId, name: npcDisplayName },
    text: conversationResult.dialogue,
    action: conversationResult.action,
    innerThought: conversationResult.innerThought,
    emotion: emotionLabel,
    emotionDetail,
    relationshipDelta,
  });
}

type PersonaLike = Awaited<ReturnType<Awaited<ReturnType<typeof getWorld>>['persona']>>;

async function getRelationship(
  persona: PersonaLike,
  characterId: string,
): Promise<{ trust: number; strength: number } | undefined> {
  try {
    const rel = await (
      persona as unknown as {
        getRelationship(id: string): Promise<{ trust: number; strength: number } | null>;
      }
    ).getRelationship(characterId);
    if (rel) return { trust: rel.trust, strength: rel.strength };
  } catch {
    /* ignored */
  }
  return undefined;
}

function buildEmotionDetail(
  emotion: { vad: { V: number; A: number; D: number }; label: string; secondary_label?: string | null; intensity: number } | null | undefined,
): EmotionDetail | undefined {
  if (!emotion?.vad) return undefined;
  return {
    primary: emotion.label.toLowerCase().trim(),
    secondary: emotion.secondary_label?.toLowerCase().trim() || undefined,
    vad: { V: emotion.vad.V ?? 0, A: emotion.vad.A ?? 0, D: emotion.vad.D ?? 0 },
    intensity: emotion.intensity,
  };
}

async function runInteract(
  persona: PersonaLike,
  npcId: string,
  player: { playerId: string; displayName: string; characterId: string },
  appraisalVector: AppraisalVector,
  stimulusDescription: string,
): Promise<{ rawEmotion: string; emotionDetail: EmotionDetail | undefined }> {
  try {
    const interactResult = await persona.interact('converse', {
      actor: player.characterId,
      actorType: 'user',
      appraisal: appraisalVector,
      stimulusDescription,
    });
    const emotion = interactResult?.emotion;
    const rawEmotion = (emotion?.label ?? '').toLowerCase().trim();
    const emotionDetail = buildEmotionDetail(emotion);
    return { rawEmotion, emotionDetail };
  } catch (err) {
    console.warn(
      `[room/message] interact failed for ${npcId} (non-fatal):`,
      err instanceof Error ? err.message : err,
    );
    return { rawEmotion: await getFallbackEmotion(persona), emotionDetail: undefined };
  }
}

async function getFallbackEmotion(persona: PersonaLike): Promise<string> {
  try {
    const fallbackState = await persona.getState();
    return (fallbackState.emotion.label ?? '').toLowerCase().trim();
  } catch {
    return '';
  }
}

async function computeRelationshipDelta(
  persona: PersonaLike,
  characterId: string,
  before: { trust: number; strength: number } | undefined,
): Promise<{ trust: number; strength: number } | undefined> {
  if (!before) return undefined;
  try {
    const relAfter = await (
      persona as unknown as {
        getRelationship(id: string): Promise<{ trust: number; strength: number } | null>;
      }
    ).getRelationship(characterId);
    if (relAfter) {
      const dt = relAfter.trust - before.trust;
      const ds = relAfter.strength - before.strength;
      if (Math.abs(dt) > 0.001 || Math.abs(ds) > 0.001) {
        return { trust: dt, strength: ds };
      }
    }
  } catch {
    /* ignored */
  }
  return undefined;
}

/** Convert room messages to chat history format for narrator */
function buildChatHistory(messages: RoomMessage[], npcCharacterId: string) {
  const recent = messages.slice(-50);
  return recent.map((m) => {
    if (m.sender.type === 'system') {
      return { role: 'user' as const, text: `[시스템] ${m.text}` };
    }
    if (m.sender.type === 'npc' && m.sender.id === npcCharacterId) {
      return {
        role: 'character' as const,
        text: m.text,
        action: m.action,
        innerThought: m.innerThought,
      };
    }
    const senderName = m.sender.type === 'player' ? m.sender.name : 'unknown';
    return { role: 'user' as const, text: `[${senderName}] ${m.text}` };
  });
}
