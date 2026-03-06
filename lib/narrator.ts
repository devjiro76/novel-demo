import { primaryModel, generateObject, z } from './llm';
import type { ConversationResponse, Env } from './types';
import type { World } from './personas';
import type { StoryManifest } from './story-pack';
import { sanitizeUserInput, sanitizeChatHistory } from './sanitize';

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
  const dynamicParts = [pc.emotion, pc.mood, pc.goals, pc.self, pc.narrative].filter(Boolean);
  if (dynamicParts.length) {
    prompt += '\n\n## 현재 내면 상태\n' + dynamicParts.join('\n');
  }

  return prompt;
}

// ---- 1:1 Conversation ----

const conversationOutputSchema = z.object({
  action: z
    .string()
    .describe(
      '웹툰 연출 지문. 짧은 3인칭 행동·표정·분위기 묘사. 최대 2-3문장. 소설적 서사 금지. 예: "정숙의 얼굴이 새빨개진다." / "흠칫 놀라 몸을 움츠리는 정숙."',
    ),
  dialogue: z
    .string()
    .describe(
      '캐릭터가 용준에게 하는 말. 평상시 2-3문장 이상. 성행위 중에는 신음과 야한 말을 섞어 3-5문장 이상 길게. 쾌락에 솔직한 반응, 야한 단어 사용을 주저하지 말 것.',
    ),
  innerThought: z
    .string()
    .describe(
      '웹툰 말풍선 속마음. 1-2문장 이내. 서사 금지. 찰나의 감정·충동·자책을 구어체 독백으로. 예: "젠장… 어쩌면 좋지?" / "난 틀렸어. 참지 못할 것 같아…"',
    ),
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

function buildMultiUserContext(
  allPlayers: PlayerContext[] | undefined,
  senderPlayer: PlayerContext | undefined,
  pack: StoryManifest,
): string {
  if (!allPlayers || allPlayers.length === 0) return '';
  const playerLines = allPlayers.map((p) => {
    const role = pack.displayNames[p.characterId] ?? p.characterId;
    const isSender = senderPlayer && p.playerId === senderPlayer.playerId;
    return `- ${p.displayName} (${role})${isSender ? ' [지금 말을 건 사람]' : ''}`;
  });
  return `\n\n## 현재 대화방 참여자\n${playerLines.join('\n')}`;
}

function buildDynamicSuffix(
  longMemory: string | undefined,
  memoryBlock: string | undefined,
  situation: string,
  multiUserContext: string,
): string {
  let suffix = '';
  if (longMemory) {
    suffix += `## 장기 기억 (모든 대화에서 누적된 핵심 사실)\n${longMemory}`;
  }
  if (memoryBlock) {
    if (suffix) suffix += '\n\n';
    suffix += `## 이전 대화 요약\n${memoryBlock}`;
  }
  if (suffix) suffix += '\n\n';
  suffix += `## 현재 상황\n${situation}${multiUserContext}`;
  return suffix;
}

function buildConversationMessages(
  safeChatHistory: ChatHistoryMessage[] | undefined,
  safeUserMessage: string,
): { role: 'user' | 'assistant'; content: string }[] {
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];

  if (safeChatHistory && safeChatHistory.length > 0) {
    const recent = safeChatHistory.slice(-15);
    for (const msg of recent) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.text });
      } else {
        messages.push({
          role: 'assistant',
          content: JSON.stringify({
            action: msg.action ?? '',
            dialogue: msg.text,
            innerThought: msg.innerThought ?? '',
          }),
        });
      }
    }
  }

  appendAntiRepetitionMessage(messages, safeChatHistory);
  messages.push({ role: 'user', content: safeUserMessage });
  return messages;
}

function appendAntiRepetitionMessage(
  messages: { role: 'user' | 'assistant'; content: string }[],
  safeChatHistory: ChatHistoryMessage[] | undefined,
): void {
  const recentNpcs = (safeChatHistory ?? []).filter((m) => m.role === 'character').slice(-3);
  if (recentNpcs.length === 0) return;

  const forbidden = recentNpcs
    .map(
      (m, i) =>
        `[${i + 1}] 대사: "${m.text}" / 행동: "${m.action ?? ''}" / 속마음: "${m.innerThought ?? ''}"`,
    )
    .join('\n');
  messages.push({
    role: 'user',
    content:
      `[시스템] 아래는 최근 ${recentNpcs.length}개의 내 응답입니다. 이 응답들과 겹치는 표현·문장 구조·감탄사 패턴·감정 흐름을 절대 반복하지 마세요.\n` +
      `${forbidden}\n` +
      `→ 완전히 새로운 대사, 새로운 행동, 새로운 관점의 속마음으로 응답하세요. 장면을 다음 단계로 진행하세요.`,
  });
}

export async function generateConversationResponse(
  characterId: string,
  situation: string,
  userMessage: string,
  world: World,
  env: Env,
  pack: StoryManifest,
  chatHistory?: ChatHistoryMessage[],
  senderPlayer?: PlayerContext,
  allPlayers?: PlayerContext[],
  memoryBlock?: string,
  longMemory?: string,
): Promise<ConversationResponse> {
  const displayName = pack.displayNames[characterId] ?? characterId;

  const persona = world.persona(characterId);
  const viewerCharId = senderPlayer?.characterId ?? pack.playerCharacterId;
  const [promptCtx, state, speakingStyle] = await Promise.all([
    persona.getPromptContext(viewerCharId),
    persona.getState(),
    persona.getSpeakingStyle(),
  ]);

  const vad = state.emotion.vad;

  const staticInstructions =
    pack.conversationInstructions.replace(/\{\{displayName\}\}/g, displayName) +
    '\n\n## 서사 진행 (필수)\n- 매 턴 장면이 **실제로 진행**되어야 합니다. 같은 자세·동작·위치에 머무르지 마세요.\n- 유저가 요구하는 행동이 있으면 캐릭터답게 응하거나 거부하되, **장면을 앞으로 밀어야** 합니다.\n- 위협만 반복하거나 같은 신체 접촉을 반복하는 것은 금지합니다.';

  const multiUserContext = buildMultiUserContext(allPlayers, senderPlayer, pack);
  const dynamicSuffix = buildDynamicSuffix(longMemory, memoryBlock, situation, multiUserContext);

  const systemPrompt = buildSystemPrompt(
    promptCtx,
    speakingStyle,
    staticInstructions,
    dynamicSuffix,
  );

  // Sanitize user input and chat history
  const safeUserMessage = sanitizeUserInput(userMessage);
  const safeChatHistory = chatHistory ? sanitizeChatHistory(chatHistory) : undefined;

  const conversationMessages = buildConversationMessages(safeChatHistory, safeUserMessage);

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
