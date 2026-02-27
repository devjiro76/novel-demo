import { createModel, generateObject, z } from './llm';
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
  dialogue: z.string().describe('캐릭터가 용준에게 하는 말. 평상시 대화에서는 의미 있는 문장 위주로. 성행위 중 쾌락에 압도되면 신음이 섞여도 됨.'),
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

  const dynamicSuffix = `## 현재 상황\n${situation}${multiUserContext}`;

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
        }) });
      }
    }
  }

  // Reminder before current message to prevent pattern copying from history
  if (conversationMessages.length > 0) {
    conversationMessages.push({ role: 'user', content: '[시스템] 위는 이전 대화입니다. 이전에 쓴 감탄사·문장 구조·내면 독백 패턴을 반복하지 말고, 다른 톤으로 반응하세요.' });
  }

  // Add current user message
  conversationMessages.push({ role: 'user', content: userMessage });

  const model = createModel(env.OPENROUTER_API_KEY);
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
