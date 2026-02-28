import { NextResponse } from 'next/server';
import { getRoom, createRoomWithId, ensurePlayer, addMessage, getMessages } from '@/lib/room-store';
import { getEnv } from '@/lib/types';
import { getVillage } from '@/lib/personas';
import { generateConversationResponse } from '@/lib/narrator';
import { generateAppraisal } from '@/lib/appraisal';
import { getStoryPack } from '@/lib/story-pack';
import { updateSummaryIfNeeded, loadLongMemory } from '@/lib/memory';
import type { RoomMessage } from '@/lib/room';
import { resolveEmotionLabel } from '@/lib/emotion';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  const env = getEnv();

  try {
    const body = await request.json() as {
      playerId: string;
      text: string;
      slug?: string;
      villageId?: string;
      npcCharacterId?: string;
      displayName?: string;
      characterId?: string;
      targetNpcId?: string;
    };

    const { playerId, text } = body;
    if (!playerId || !text?.trim()) {
      return NextResponse.json({ error: 'Missing playerId or text' }, { status: 400 });
    }

    // Ensure room exists (re-create if server lost state)
    let room = await getRoom(roomId);
    if (!room && body.slug && body.villageId && body.npcCharacterId) {
      await createRoomWithId(roomId, {
        slug: body.slug,
        villageId: body.villageId,
        npcCharacterId: body.npcCharacterId,
      });
      room = await getRoom(roomId);
    }
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Ensure player exists
    let player = room.players.find((p) => p.playerId === playerId) ?? null;
    if (!player && body.displayName && body.characterId) {
      player = await ensurePlayer(roomId, playerId, {
        displayName: body.displayName,
        characterId: body.characterId,
      });
    }
    if (!player) {
      return NextResponse.json({ error: 'Player not in room' }, { status: 403 });
    }

    // 1. Add player message
    const playerMsg = await addMessage(roomId, {
      sender: { type: 'player', id: playerId, name: player.displayName },
      text: text.trim(),
    });
    if (!playerMsg) {
      return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
    }

    // 2. Generate NPC response(s)
    const pack = getStoryPack(room.slug);
    const village = await getVillage(env, room.villageId);
    const npcCharacterIds: string[] = (room as any).npcCharacterIds ?? [room.npcCharacterId];

    // Determine responding NPCs: explicit target → single, otherwise → all active NPCs
    const respondingNpcIds = (body.targetNpcId && npcCharacterIds.includes(body.targetNpcId))
      ? [body.targetNpcId]
      : npcCharacterIds;

    // Re-read messages & room (shared context)
    const allMessages = await getMessages(roomId);
    const freshRoom = await getRoom(roomId);
    const allPlayers = freshRoom?.players ?? [];
    const senderPlayer = { playerId: player.playerId, displayName: player.displayName, characterId: player.characterId };
    // Strip @mention from text for NPC prompt (keep in stored message)
    const npcText = text.trim().replace(/^@\S+\s*/, '').trim() || text.trim();
    const stimulusDescription = `${player.displayName}이(가) 말했다: "${npcText}"`;

    // Generate all NPC responses in parallel
    const npcMessages = await Promise.all(
      respondingNpcIds.map((npcId) =>
        generateNpcResponse({
          roomId, npcId, pack, village, env, allMessages,
          allPlayers, senderPlayer, stimulusDescription, playerText: npcText, player,
        }).catch((err) => {
          console.error(`[room/message] NPC ${npcId} response failed:`, err);
          return null;
        })
      )
    );

    const validMessages = npcMessages.filter((m): m is RoomMessage => m !== null);

    return NextResponse.json({
      ok: true,
      playerMessage: playerMsg,
      npcMessage: validMessages[0] ?? null,
      npcMessages: validMessages,
    });
  } catch (err: any) {
    console.error('[room/message] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}

/** Generate a single NPC's response */
async function generateNpcResponse(ctx: {
  roomId: string;
  npcId: string;
  pack: ReturnType<typeof getStoryPack>;
  village: Awaited<ReturnType<typeof getVillage>>;
  env: ReturnType<typeof getEnv>;
  allMessages: RoomMessage[];
  allPlayers: { playerId: string; displayName: string; characterId: string }[];
  senderPlayer: { playerId: string; displayName: string; characterId: string };
  stimulusDescription: string;
  playerText: string;
  player: { playerId: string; displayName: string; characterId: string };
}): Promise<RoomMessage | null> {
  const { roomId, npcId, pack, village, env, allMessages, allPlayers, senderPlayer, stimulusDescription, playerText, player } = ctx;
  const npcDisplayName = pack.displayNames[npcId] ?? npcId;
  const chatHistory = buildChatHistory(allMessages, npcId);

  const situation = pack.defaultSituation.replace(
    /\{\{charFullName\}\}/g,
    pack.characters.find((c) => c.id === npcId)?.fullName ?? npcDisplayName,
  );

  const [summary, longMemory] = await Promise.all([
    updateSummaryIfNeeded(roomId, npcId, chatHistory, env).catch((err) => {
      console.warn(`[room/message] summary failed for ${npcId} (non-fatal):`, (err as Error).message);
      return '';
    }),
    loadLongMemory(npcId).catch(() => ''),
  ]);

  const [appraisal, conversationResult] = await Promise.all([
    generateAppraisal(npcId, stimulusDescription, village, env, player.characterId),
    generateConversationResponse(
      npcId, situation, playerText, village, env, pack, chatHistory,
      senderPlayer, allPlayers, summary, longMemory,
    ),
  ]);

  const persona = village.persona(npcId);
  const { estimatedElapsedSeconds, ...appraisalVector } = appraisal;
  if (estimatedElapsedSeconds >= 1) {
    await persona.tick(estimatedElapsedSeconds).catch((err: any) => {
      console.warn(`[room/message] tick failed for ${npcId} (non-fatal):`, err.message);
    });
  }

  let rawEmotion = '';
  try {
    const interactResult = await persona.interact('converse', {
      actor: player.characterId,
      actorType: 'user',
      appraisal: appraisalVector,
      stimulusDescription,
    });
    rawEmotion = (interactResult?.emotion?.discrete?.primary ?? '').toLowerCase().trim();
  } catch (err: any) {
    console.warn(`[room/message] interact failed for ${npcId} (non-fatal):`, err.message);
    try {
      const fallbackState = await persona.getState();
      rawEmotion = (fallbackState.emotion.discrete?.primary ?? '').toLowerCase().trim();
    } catch { /* keep empty */ }
  }
  const emotionLabel = resolveEmotionLabel(rawEmotion);

  return addMessage(roomId, {
    sender: { type: 'npc', id: npcId, name: npcDisplayName },
    text: conversationResult.dialogue,
    action: conversationResult.action,
    innerThought: conversationResult.innerThought,
    emotion: emotionLabel,
  });
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
