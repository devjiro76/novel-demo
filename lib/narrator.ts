import { primaryModel, generateObject, z } from './llm';
import type { ConversationResponse, Env } from './types';
import type { Village } from './personas';
import type { StoryManifest } from './story-pack';

/**
 * Reorder promptContext fields for prompt caching:
 * static (identity, relationships, speakingStyle, instructions) first,
 * dynamic (emotion, mood, goals, self, narrative, situation) last.
 */
function buildSystemPrompt(
  promptCtx: { systemPrompt: string; promptContext: Record<string, string> },
  speakingStyle: string | null | undefined,
  staticInstructions: string,
  dynamicSuffix: string,
): string {
  const pc = promptCtx.promptContext;

  // Extract relationships from assembled systemPrompt
  const relMatch = promptCtx.systemPrompt.match(/\n(## Relationships[\s\S]*)$/);
  const relationships = relMatch?.[1] ?? '';

  // — Static block (cacheable prefix) —
  let prompt = pc.identity ?? promptCtx.systemPrompt;
  if (relationships) prompt += '\n\n' + relationships;
  if (speakingStyle) prompt += '\n\n## 말투 가이드\n' + speakingStyle;
  prompt += '\n\n' + staticInstructions;

  // — Dynamic block (changes per request, broad → narrow) —
  if (dynamicSuffix) prompt += '\n\n' + dynamicSuffix;
  const dynamicParts = [pc.emotion, pc.mood, pc.goals, pc.self, pc.narrative]
    .filter(Boolean);
  if (dynamicParts.length) {
    prompt += '\n\n## 현재 내면 상태\n' + dynamicParts.join('\n');
  }

  return prompt;
}

// ---- 1:1 Conversation ----

const conversationOutputSchema = z.object({
  action: z.string().describe('3인칭 행동/신체 묘사. 감각 묘사 풍부하게. 평상시 2-3문장, 감정적 동요 시 4-6문장.'),
  dialogue: z.string().describe('캐릭터가 용준에게 하는 말. 평상시 2-3문장 이상. 성행위 중에는 신음과 야한 말을 섞어 3-5문장 이상 길게. 쾌락에 솔직한 반응, 야한 단어 사용을 주저하지 말 것.'),
  innerThought: z.string().describe('겉으로 안 드러내는 속마음. 갈등, 욕망, 두려움 등 내면의 생각. 반드시 1문장 이상 작성.'),
});

export interface ChatHistoryMessage {
  role: 'user' | 'character';
  text: string;
  action?: string;
  innerThought?: string;
}

interface PlayerContext {
  playerId: string;
  displayName: string;
  characterId: string;
}

export async function generateConversationResponse(
  characterId: string,
  situation: string,
  userMessage: string,
  village: Village,
  env: Env,
  pack: StoryManifest,
  chatHistory?: ChatHistoryMessage[],
  senderPlayer?: PlayerContext,
  allPlayers?: PlayerContext[],
  memoryBlock?: string,
  longMemory?: string,
): Promise<ConversationResponse> {
  const displayName = pack.displayNames[characterId] ?? characterId;

  const persona = village.persona(characterId);
  const viewerCharId = senderPlayer?.characterId ?? pack.playerCharacterId;
  const [promptCtx, state, speakingStyle] = await Promise.all([
    persona.getPromptContext(viewerCharId),
    persona.getState(),
    persona.getSpeakingStyle(),
  ]);

  const vad = state.emotion.vad;

  const staticInstructions = pack.conversationInstructions.replace(/\{\{displayName\}\}/g, displayName)
    + '\n\n## 서사 진행 (필수)\n- 매 턴 장면이 **실제로 진행**되어야 합니다. 같은 자세·동작·위치에 머무르지 마세요.\n- 유저가 요구하는 행동이 있으면 캐릭터답게 응하거나 거부하되, **장면을 앞으로 밀어야** 합니다.\n- 위협만 반복하거나 같은 신체 접촉을 반복하는 것은 금지합니다.';

  // Build multi-user context block if multiple players exist
  let multiUserContext = '';
  if (allPlayers && allPlayers.length > 0) {
    const playerLines = allPlayers.map((p) => {
      const role = pack.displayNames[p.characterId] ?? p.characterId;
      const isSender = senderPlayer && p.playerId === senderPlayer.playerId;
      return `- ${p.displayName} (${role})${isSender ? ' [지금 말을 건 사람]' : ''}`;
    });
    multiUserContext = `\n\n## 현재 대화방 참여자\n${playerLines.join('\n')}`;
  }

  // Dynamic suffix: broadest context → narrowest context
  let dynamicSuffix = '';

  if (longMemory) {
    dynamicSuffix += `## 장기 기억 (모든 대화에서 누적된 핵심 사실)\n${longMemory}`;
  }

  if (memoryBlock) {
    if (dynamicSuffix) dynamicSuffix += '\n\n';
    dynamicSuffix += `## 이전 대화 요약\n${memoryBlock}`;
  }

  if (dynamicSuffix) dynamicSuffix += '\n\n';
  dynamicSuffix += `## 현재 상황\n${situation}${multiUserContext}`;

  const systemPrompt = buildSystemPrompt(
    promptCtx, speakingStyle, staticInstructions,
    dynamicSuffix,
  );

  // Build conversation messages from chat history (keep window small — summary handles older context)
  const conversationMessages: { role: 'user' | 'assistant'; content: string }[] = [];

  if (chatHistory && chatHistory.length > 0) {
    const recent = chatHistory.slice(-15);
    for (const msg of recent) {
      if (msg.role === 'user') {
        conversationMessages.push({ role: 'user', content: msg.text });
      } else {
        conversationMessages.push({ role: 'assistant', content: JSON.stringify({
          action: msg.action ?? '',
          dialogue: msg.text,
          innerThought: msg.innerThought ?? '',
        }) });
      }
    }
  }

  // Anti-repetition: feed last 3 NPC responses so LLM avoids alternating patterns
  const recentNpcs = (chatHistory ?? []).filter(m => m.role === 'character').slice(-3);
  if (recentNpcs.length > 0) {
    const forbidden = recentNpcs.map((m, i) =>
      `[${i + 1}] 대사: "${m.text}" / 행동: "${m.action ?? ''}" / 속마음: "${m.innerThought ?? ''}"`,
    ).join('\n');
    conversationMessages.push({ role: 'user', content:
      `[시스템] 아래는 최근 ${recentNpcs.length}개의 내 응답입니다. 이 응답들과 겹치는 표현·문장 구조·감탄사 패턴·감정 흐름을 절대 반복하지 마세요.\n`
      + `${forbidden}\n`
      + `→ 완전히 새로운 대사, 새로운 행동, 새로운 관점의 속마음으로 응답하세요. 장면을 다음 단계로 진행하세요.`,
    });
  }

  // Add current user message
  conversationMessages.push({ role: 'user', content: userMessage });

  const model = primaryModel(env);
  const timeout = AbortSignal.timeout(60_000);
  const { object } = await generateObject({
    model,
    schema: conversationOutputSchema,
    system: systemPrompt,
    messages: conversationMessages,
    temperature: 0.9,
    abortSignal: timeout,
  });

  return {
    characterId,
    displayName,
    dialogue: object.dialogue,
    action: object.action,
    innerThought: object.innerThought,
    emotion: {
      primary: '', // Will be filled by route after persona.interact()
      vad,
    },
    conversationOver: false,
  };
}
