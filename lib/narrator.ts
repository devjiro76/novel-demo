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

  // — Dynamic block (changes per request) —
  const dynamicParts = [pc.emotion, pc.mood, pc.goals, pc.self, pc.narrative]
    .filter(Boolean);
  if (dynamicParts.length) {
    prompt += '\n\n## 현재 내면 상태\n' + dynamicParts.join('\n');
  }
  if (dynamicSuffix) prompt += '\n\n' + dynamicSuffix;

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
  kbContext?: string,
  memoryBlock?: string,
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

  const staticInstructions = pack.conversationInstructions.replace(/\{\{displayName\}\}/g, displayName);

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

  let dynamicSuffix = `## 현재 상황\n${situation}${multiUserContext}`;

  if (memoryBlock) {
    dynamicSuffix += `\n\n## 이전 대화 요약\n${memoryBlock}`;
  }

  if (kbContext) {
    dynamicSuffix += `\n\n## 원작 전개 방향\n${kbContext}\n\n### 활용 지시\n- 이 장면들의 **전개 방향, 감정 곡선, 캐릭터 간 역학**을 이번 응답에 반영하세요.\n- 원작에서 다음에 일어나는 일을 자연스럽게 암시하거나 유도하세요.\n- 대사를 그대로 인용하지 말고, 현재 상황과 캐릭터 상태에 맞게 재해석하세요.`;
  }

  // 서사 진행 지시: KB 유무에 관계없이 항상 포함
  dynamicSuffix += '\n\n## 서사 진행 (필수)\n- 매 턴 장면이 **실제로 진행**되어야 합니다. 같은 자세·동작·위치에 머무르지 마세요.\n- 유저가 요구하는 행동이 있으면 캐릭터답게 응하거나 거부하되, **장면을 앞으로 밀어야** 합니다.\n- 위협만 반복하거나 같은 신체 접촉을 반복하는 것은 금지합니다.';

  const systemPrompt = buildSystemPrompt(
    promptCtx, speakingStyle, staticInstructions,
    dynamicSuffix,
  );

  // Build conversation messages from chat history
  const conversationMessages: { role: 'user' | 'assistant'; content: string }[] = [];

  if (chatHistory && chatHistory.length > 0) {
    // Keep last 20 messages to avoid context overflow
    const recent = chatHistory.slice(-20);
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

  // Reminder before current message to prevent pattern copying from history
  if (conversationMessages.length > 0) {
    const recentNpc = (chatHistory ?? []).filter(m => m.role === 'character').slice(-5);
    const usedStarters = recentNpc.map(m => m.text.split(/[.!?\n]/)[0]?.trim().slice(0, 15)).filter(Boolean);
    const usedThoughts = recentNpc.map(m => (m.innerThought ?? '').split(/[.!?\n]/)[0]?.trim().slice(0, 15)).filter(Boolean);
    // 행동 패턴에서 반복되는 동사구 추출
    const usedActions = recentNpc
      .map(m => (m.action ?? '').match(/(움켜쥐|잡아|누르|응시|씹|깨물|끌어당[기겨]|밀어|돌[리려]|쳐다보)/g))
      .flat()
      .filter(Boolean);
    const actionSet = [...new Set(usedActions)];

    let antiRepMsg = '[시스템] 반복 금지 — 이전 대화와 완전히 다른 응답을 생성하세요.\n';
    if (usedStarters.length)
      antiRepMsg += `- 금지된 대사 첫 마디: ${usedStarters.map(s => `"${s}…"`).join(', ')} → 완전히 다른 표현으로 시작\n`;
    if (usedThoughts.length)
      antiRepMsg += `- 금지된 속마음 패턴: ${usedThoughts.map(s => `"${s}…"`).join(', ')} → 다른 관점(감각, 미래 계획, 과거 기억, 신체 반응)으로\n`;
    if (actionSet.length)
      antiRepMsg += `- 금지된 행동 동사: ${actionSet.map(s => `"${s}"`).join(', ')} → 이 동작들을 쓰지 말고 새로운 신체 묘사를 사용\n`;
    antiRepMsg += '- 위협/경고만 반복하지 말 것. 장면을 실질적으로 다음 단계로 진행하세요.';

    conversationMessages.push({ role: 'user', content: antiRepMsg });
  }

  // Add current user message
  conversationMessages.push({ role: 'user', content: userMessage });

  const model = primaryModel(env);
  const { object } = await generateObject({
    model,
    schema: conversationOutputSchema,
    system: systemPrompt,
    messages: conversationMessages,
    temperature: 0.9,
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
