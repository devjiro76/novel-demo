import { NextResponse } from 'next/server';
import { getRoom, createRoomWithId, ensurePlayer, addMessage, getMessages } from '@/lib/room-store';
import { getEnv } from '@/lib/types';
import { getVillage } from '@/lib/personas';
import { generateConversationResponse } from '@/lib/narrator';
import { generateAppraisal } from '@/lib/appraisal';
import { getStoryPack } from '@/lib/story-pack';
import type { RoomMessage } from '@/lib/room';

const EMOTION_KO: Record<string, string> = {
  joy: '기쁨', excitement: '설렘', contentment: '만족', anger: '분노',
  fear: '두려움', sadness: '슬픔', anxiety: '불안', surprise: '놀라움',
  disgust: '혐오', trust: '신뢰', calm: '평온', shame: '수치심',
  guilt: '죄책감', numbness: '무감각',
};

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

    // 2. Generate NPC response
    const pack = getStoryPack(room.slug);
    const village = await getVillage(env, room.villageId);
    const npcId = room.npcCharacterId;
    const npcDisplayName = pack.displayNames[npcId] ?? npcId;

    // Re-read messages (includes the player message we just added)
    const allMessages = await getMessages(roomId);
    const chatHistory = buildChatHistory(allMessages, npcId);

    // Re-read room for latest players
    const freshRoom = await getRoom(roomId);
    const allPlayers = freshRoom?.players ?? [];
    const senderPlayer = { playerId: player.playerId, displayName: player.displayName, characterId: player.characterId };

    const situation = pack.defaultSituation.replace(
      /\{\{charFullName\}\}/g,
      pack.characters.find((c) => c.id === npcId)?.fullName ?? npcDisplayName,
    );

    const stimulusDescription = `${player.displayName}이(가) 말했다: "${text.trim()}"`;

    const [appraisal, conversationResult] = await Promise.all([
      generateAppraisal(npcId, stimulusDescription, village, env, player.characterId),
      generateConversationResponse(
        npcId, situation, text.trim(), village, env, pack, chatHistory,
        senderPlayer, allPlayers,
      ),
    ]);

    const persona = village.persona(npcId);

    const { estimatedElapsedSeconds, ...appraisalVector } = appraisal;
    if (estimatedElapsedSeconds >= 1) {
      await persona.tick(estimatedElapsedSeconds).catch((err: any) => {
        console.warn('[room/message] tick failed (non-fatal):', err.message);
      });
    }

    await persona.interact('converse', {
      actor: player.characterId,
      actorType: 'user',
      appraisal: appraisalVector,
      stimulusDescription,
    }).catch((err: any) => {
      console.warn('[room/message] interact failed (non-fatal):', err.message);
    });

    const updatedState = await persona.getState();
    const rawEmotion = (updatedState.emotion.discrete?.primary ?? '').toLowerCase().trim();
    const emotionLabel = EMOTION_KO[rawEmotion] ?? EMOTION_KO[rawEmotion.replace(/\s+/g, '_')] ?? '';

    // 3. Add NPC response message
    const npcMsg = await addMessage(roomId, {
      sender: { type: 'npc', id: npcId, name: npcDisplayName },
      text: conversationResult.dialogue,
      action: conversationResult.action,
      innerThought: conversationResult.innerThought,
      emotion: emotionLabel,
    });

    return NextResponse.json({ ok: true, playerMessage: playerMsg, npcMessage: npcMsg });
  } catch (err: any) {
    console.error('[room/message] Error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}

/** Convert room messages to chat history format for narrator */
function buildChatHistory(messages: RoomMessage[], npcCharacterId: string) {
  const recent = messages.slice(-30);
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
