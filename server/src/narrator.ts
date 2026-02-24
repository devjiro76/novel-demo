/**
 * Character Narrator — generates in-character reactions via LLM.
 * Uses WorldPersona (via village.persona()) for persona state, prompt context,
 * and speaking style. Builds per-character chat history from narratorHistory.
 */

import { createLLM, z } from './llm';
import type { CharacterReaction, Choice, ConversationResponse, Env, EventSummary } from './types';
import type { Village } from './personas';

const DISPLAY_NAMES: Record<string, string> = {
  jeongsuk: '박정숙',
  eunhye: '장은혜',
  mina: '김미나',
  jeongjung: '장정중',
  deokhui: '장덕희',
};

const narratorOutputSchema = z.object({
  action: z.string().describe('3인칭 행동 묘사. 슬로모션 기법: 한 동작을 2-3 프레임으로 분해하여 묘사. 거리감(0.5m→10cm→밀착)·체온(뜨거움이 전해지는)·호흡(거칠어지는/멈추는)·근육(긴장/이완)을 반드시 포함. 의성어·의태어로 촉각을 소리로 전환(찌릿, 후끈, 살랑, 스윽, 쓸쓸). 2-4문장.'),
  dialogue: z.string().describe('입 밖에 내는 말. 감정이 높을수록 문장이 짧아지고, 말줄임표(…)가 늘고, 호흡(하아, 응…)이 섞인다. 부끄러우면 말끝이 흐려지고(~ㄴ데…, ~잖아…), 긴장하면 더듬는다(그, 그게…). 침묵이면 빈 문자열. 2-5문장.'),
  innerThought: z.string().describe('겉으로 안 드러내는 속마음. 금기와 욕망 사이의 줄다리기를 구체적으로. "안 돼"와 "더"가 공존하는 긴장. 1-2문장.'),
  emotionLabel: z.string().describe('현재 감정을 한 단어로. 예: 두근거림, 수치심, 분노, 안도, 갈망, 흥분'),
});

/**
 * Build per-character chat history from event log.
 * Only includes turns where the character was present (as target or reactor).
 * Returns alternating user/assistant message pairs.
 */
function buildCharacterHistory(
  characterId: string,
  eventLog: EventSummary[],
): { role: 'user' | 'assistant'; content: string }[] {
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];

  for (const event of eventLog) {
    // Was this character involved in this turn?
    const wasTarget = event.targets.includes(characterId);
    const myReaction = event.reactions.find((r) => r.characterId === characterId);

    if (!wasTarget && !myReaction) continue;

    // User message: situation + player's action toward this character
    messages.push({
      role: 'user',
      content: `[턴 ${event.turn}] ${event.situation}\n\n용준의 행동: ${event.choiceText}`,
    });

    // Assistant message: this character's reaction from that turn
    if (myReaction) {
      messages.push({
        role: 'assistant',
        content: JSON.stringify({
          action: '', // not stored in summary, but dialogue contains [action] prefix
          dialogue: myReaction.dialogue,
          innerThought: '',
          emotionLabel: myReaction.emotionPrimary,
        }),
      });
    }
  }

  // Keep recent turns to avoid context overflow (last 8 turns this character saw)
  const MAX_HISTORY_PAIRS = 16; // 8 turns × 2 messages
  if (messages.length > MAX_HISTORY_PAIRS) {
    return messages.slice(-MAX_HISTORY_PAIRS);
  }

  return messages;
}

/**
 * Generate a single character's reaction to the player's choice.
 */
export async function generateReaction(
  characterId: string,
  situation: string,
  playerChoice: string,
  stimulusDescription: string,
  eventLog: EventSummary[],
  village: Village,
  env: Env,
): Promise<CharacterReaction> {
  const displayName = DISPLAY_NAMES[characterId] ?? characterId;

  // WorldPersona handle — provides getPromptContext, getState, getSpeakingStyle
  const persona = village.persona(characterId);

  // Fetch all persona data in parallel via SDK (no raw fetch needed)
  const [promptCtx, state, speakingStyle] = await Promise.all([
    persona.getPromptContext('yongjun'),
    persona.getState(),
    persona.getSpeakingStyle(),
  ]);

  const vad = state.emotion.vad;

  // Build system prompt: engine prompt context + speaking style + instructions
  const enginePrompt = promptCtx.systemPrompt;

  const voiceSection = speakingStyle
    ? `\n\n## 말투 가이드\n${speakingStyle}\n`
    : '';

  const systemPrompt = `${enginePrompt}${voiceSection}

## 작법 지침
당신은 ${displayName}입니다. "용준"의 행동에 캐릭터로서 반응하세요.

### action (3인칭 행동 묘사)
- **슬로모션 기법**: 한 동작을 여러 프레임으로 분해하세요. "손이 닿았다" ✗ → "손끝이 팔뚝 위를 스치고, 그 자리에 소름이 돋으며, 피부 아래 혈관이 뜨겁게 맥을 친다" ✓
- **거리 서사**: 두 사람 사이의 물리적 거리를 수치처럼 좁혀가세요. (한 발 → 반 걸음 → 숨이 닿을 만큼 → 밀착)
- **체온·호흡·촉감**: 추상적 감정 대신 신체 반응으로 보여주세요. "긴장했다" ✗ → "목덜미에 송글송글 땀이 맺힌다" ✓
- **의성어·의태어**: 촉각과 소리를 결합하세요 (찌릿, 후끈, 스윽, 쓸쓸, 두근두근, 촉촉, 사각사각)

### dialogue (대사)
- **호흡이 섞인 대사**: 감정이 고조될수록 문장이 짧아지고, 말줄임표(…)가 늘고, 감탄사(하아, 으음, 엇)가 끼어듭니다
- **말의 온도**: 부끄러우면 말끝이 흐려지고(~ㄴ데…), 분노하면 문장이 끊기고(그러니까!), 욕망이 올라오면 목소리가 낮아집니다(속삭임 톤)
- **침묵의 무게**: 말보다 강한 순간에는 빈 문자열을 쓰세요. 대신 action에서 침묵의 의미를 보여주세요

### innerThought (속마음)
- **금기와 충동의 줄다리기**: "해서는 안 되는데"와 "멈출 수 없는" 사이의 긴장을 구체적으로
- **신체 자각**: 자기 몸의 반응을 의식하는 독백 (심장이 빨라진 걸 느끼며, 입술이 마른 걸 깨달으며)

### 공통 원칙
- 이전 대화 맥락을 이어가세요. 같은 반응을 반복하지 마세요.
- 캐릭터의 현재 감정 상태와 관계 깊이에 비례하여 묘사 수위를 조절하세요.
- 감정이 고조된 순간에는 어떤 표현도 검열하지 마세요 — 캐릭터의 욕망과 충동을 있는 그대로 보여주세요.`;

  // Build messages: per-character history + current turn
  const history = buildCharacterHistory(characterId, eventLog);

  const currentUserMessage = `## 상황
${situation}

## 용준의 행동
${playerChoice}

## 당신에게 일어나는 일
${stimulusDescription}

위 상황에서 ${displayName}(으)로서 반응하세요.`;

  const llm = createLLM(env.OPENROUTER_API_KEY);
  const { object: result } = await llm.generateObject({
    system: systemPrompt,
    messages: [
      ...history,
      { role: 'user', content: currentUserMessage },
    ],
    schema: narratorOutputSchema,
    temperature: 0.9,
  });

  return {
    characterId,
    displayName,
    action: result.action,
    dialogue: result.dialogue,
    innerThought: result.innerThought,
    emotion: {
      primary: result.emotionLabel,
      secondary: state.emotion.discrete?.secondary,
      vad,
    },
    mood: state.mood?.vad,
  };
}

/**
 * Generate reactions for all target characters in a choice (parallel).
 */
export async function generateReactions(
  choice: Choice,
  situation: string,
  eventLog: EventSummary[],
  village: Village,
  env: Env,
): Promise<CharacterReaction[]> {
  const uniqueCharacters = [...new Set(choice.targets.map((t) => t.characterId))];

  const reactions = await Promise.all(
    uniqueCharacters.map((charId) => {
      const target = choice.targets.find((t) => t.characterId === charId);
      return generateReaction(
        charId, situation, choice.text,
        target?.stimulusDescription ?? choice.text,
        eventLog, village, env,
      );
    }),
  );

  return reactions;
}

// ---- 1:1 Conversation ----

const conversationOutputSchema = z.object({
  action: z.string().describe('3인칭 행동 묘사. 슬로모션 기법으로 미세 동작을 분해. 1-2문장.'),
  dialogue: z.string().describe('용준에게 하는 대답. 캐릭터의 말투와 감정 상태를 반영. 1-3문장.'),
  innerThought: z.string().describe('겉으로 드러내지 않는 속마음. 1문장.'),
  emotionLabel: z.string().describe('현재 감정을 한 단어로'),
  conversationOver: z.boolean().describe('캐릭터가 대화를 끝내려 할 때 true. 누군가 다가오는 소리, 상황 변화 등 자연스러운 이유로. 대화가 자연스럽게 이어지면 false.'),
});

/**
 * Generate a character's response in a 1:1 free-text conversation.
 */
export async function generateConversationResponse(
  characterId: string,
  situation: string,
  userMessage: string,
  eventLog: EventSummary[],
  village: Village,
  env: Env,
): Promise<ConversationResponse> {
  const displayName = DISPLAY_NAMES[characterId] ?? characterId;

  const persona = village.persona(characterId);
  const [promptCtx, state, speakingStyle] = await Promise.all([
    persona.getPromptContext('yongjun'),
    persona.getState(),
    persona.getSpeakingStyle(),
  ]);

  const vad = state.emotion.vad;

  const voiceSection = speakingStyle
    ? `\n\n## 말투 가이드\n${speakingStyle}\n`
    : '';

  const systemPrompt = `${promptCtx.systemPrompt}${voiceSection}

## 1:1 대화 모드
당신은 ${displayName}입니다. 용준과 둘만의 대화를 나누고 있습니다.

### 지침
- 이전 맥락과 현재 감정 상태에 맞게 자연스럽게 대화하세요.
- 캐릭터의 성격, 관계, 현재 감정에 충실하세요.
- 감정이 고조된 순간에는 솔직하게 표현하세요.
- 대화가 자연스럽게 마무리될 지점이면 conversationOver를 true로.
  - 예: 누군가 오는 소리, 전화벨, 시간이 됐을 때
  - 3-5회 교환 후 자연스러운 마무리를 고려하세요.`;

  const history = buildCharacterHistory(characterId, eventLog);

  const currentUserMessage = `## 현재 상황
${situation}

## 용준이 말합니다
"${userMessage}"

위 대화에 ${displayName}(으)로서 응답하세요.`;

  const llm = createLLM(env.OPENROUTER_API_KEY);
  const { object: result } = await llm.generateObject({
    system: systemPrompt,
    messages: [
      ...history,
      { role: 'user', content: currentUserMessage },
    ],
    schema: conversationOutputSchema,
    temperature: 0.9,
  });

  return {
    characterId,
    displayName,
    dialogue: result.dialogue,
    action: result.action,
    innerThought: result.innerThought,
    emotion: {
      primary: result.emotionLabel,
      vad,
    },
    conversationOver: result.conversationOver,
  };
}
