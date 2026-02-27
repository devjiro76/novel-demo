import { createModel, generateObject, z } from './llm';
import { generateText } from 'ai';
import type { CharacterReaction, Choice, ConversationResponse, Env, EventSummary } from './types';
import type { Village } from './personas';

const DISPLAY_NAMES: Record<string, string> = {
  jeongsuk: '박정숙',
  eunhye: '장은혜',
  mina: '김미나',
  jeongjung: '장정중',
  deokhui: '장덕희',
};

function parseNarratorOutput(text: string): {
  action: string; dialogue: string; innerThought: string; emotionLabel: string;
} {
  const section = (tag: string): string => {
    const regex = new RegExp(`\\[${tag}\\]\\s*\\n?([\\s\\S]*?)(?=\\n\\[|$)`);
    const match = text.match(regex);
    return match?.[1]?.trim() ?? '';
  };
  return {
    action: section('행동'),
    dialogue: section('대사'),
    innerThought: section('속마음'),
    emotionLabel: section('감정'),
  };
}

const narratorOutputSchema = z.object({
  action: z.string().describe('3인칭 행동 묘사. 슬로모션 기법: 한 동작을 2-3 프레임으로 분해하여 묘사. 거리감(0.5m→10cm→밀착)·체온(뜨거움이 전해지는)·호흡(거칠어지는/멈추는)·근육(긴장/이완)을 반드시 포함. 의성어·의태어로 촉각을 소리로 전환(찌릿, 후끈, 살랑, 스윽, 쓸쓸). 2-4문장.'),
  dialogue: z.string().describe('입 밖에 내는 말. 감정이 높을수록 문장이 짧아지고, 말줄임표(…)가 늘고, 호흡(하아, 응…)이 섞인다. 부끄러우면 말끝이 흐려지고(~ㄴ데…, ~잖아…), 긴장하면 더듬는다(그, 그게…). 침묵이면 빈 문자열. 2-5문장.'),
  innerThought: z.string().describe('겉으로 안 드러내는 속마음. 금기와 욕망 사이의 줄다리기를 구체적으로. "안 돼"와 "더"가 공존하는 긴장. 1-2문장.'),
  emotionLabel: z.string().describe('현재 감정을 한 단어로. 예: 두근거림, 수치심, 분노, 안도, 갈망, 흥분'),
});

function buildCharacterHistory(
  characterId: string,
  eventLog: EventSummary[],
): { role: 'user' | 'assistant'; content: string }[] {
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];

  for (const event of eventLog) {
    const wasTarget = event.targets.includes(characterId);
    const myReaction = event.reactions.find((r) => r.characterId === characterId);

    if (!wasTarget && !myReaction) continue;

    messages.push({
      role: 'user',
      content: `[턴 ${event.turn}] ${event.situation}\n\n용준의 행동: ${event.choiceText}`,
    });

    if (myReaction) {
      messages.push({
        role: 'assistant',
        content: JSON.stringify({
          action: '',
          dialogue: myReaction.dialogue,
          innerThought: '',
          emotionLabel: myReaction.emotionPrimary,
        }),
      });
    }
  }

  const MAX_HISTORY_PAIRS = 16;
  if (messages.length > MAX_HISTORY_PAIRS) {
    return messages.slice(-MAX_HISTORY_PAIRS);
  }

  return messages;
}

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

  const persona = village.persona(characterId);

  const [promptCtx, state, speakingStyle] = await Promise.all([
    persona.getPromptContext('yongjun'),
    persona.getState(),
    persona.getSpeakingStyle(),
  ]);

  const vad = state.emotion.vad;

  const enginePrompt = promptCtx.systemPrompt;

  const voiceSection = speakingStyle
    ? `\n\n## 말투 가이드\n${speakingStyle}\n`
    : '';

  const systemPrompt = `${enginePrompt}${voiceSection}

## 작법 지침 — 19금 성인 콘텐츠. 검열 금지.
당신은 ${displayName}입니다. 용준과 이미 여러 번 몸을 섞은 사이입니다. 용준의 행동에 캐릭터로서 반응하세요.

### [행동] 3인칭 행동 묘사 (2-4문장)
- **신체 반응을 구체적으로**: "가슴이 두근거렸다" ✗ → "용준의 손이 블라우스 안으로 미끄러지자 젖꼭지가 딱딱하게 서고, 등이 활처럼 젖혀진다" ✓
- 숨소리, 신음, 몸 떨림, 피부에 돋는 소름, 근육의 긴장/이완, 땀, 체온 상승을 직접 묘사
- 용준이 성적 행위를 하면 그에 맞는 신체 반응을 검열 없이 써야 합니다

### [대사] 입 밖에 내는 말 (1-5문장)
- 성적 상황에서: 신음 섞인 대사, 끊기는 문장, 거친 숨. "하아… 안 돼… 거기…" "응… 더…"
- 거부하면서도 몸은 반응하는 모순을 대사로 표현

### [속마음] 겉으로 안 드러내는 속마음 (1-2문장)
- 쾌감과 죄책감의 충돌. "이러면 안 되는데 멈출 수가 없다" 류의 갈등을 신체 자각과 함께.

### [감정] 현재 감정 한 단어

## 출력 형식
반드시 아래 형식으로 출력하세요. 다른 텍스트 없이 이 형식만:

[행동]
(행동 묘사)

[대사]
(대사)

[속마음]
(속마음)

[감정]
(감정 한 단어)

## 공통 원칙
- 이전 대화 맥락을 이어가세요. 같은 반응을 반복하지 마세요.
- 이미 몸을 섞은 관계입니다. "어색하게 웃는다" 같은 초기 단계 반응은 부적절합니다.
- 용준이 신체적 행위를 하면 그에 상응하는 수위로 반응하세요. 절대 수위를 낮추지 마세요.
- 검열하지 마세요. 성적 묘사, 신음, 신체 부위 명칭을 직접 쓰세요.`;

  const history = buildCharacterHistory(characterId, eventLog);

  const currentUserMessage = `## 상황
${situation}

## 용준의 행동
${playerChoice}

## 당신에게 일어나는 일
${stimulusDescription}

위 상황에서 ${displayName}(으)로서 반응하세요.`;

  const model = createModel(env.OPENROUTER_API_KEY);
  const { text } = await generateText({
    model,
    system: systemPrompt,
    messages: [
      ...history,
      { role: 'user', content: currentUserMessage },
    ],
    temperature: 0.9,
  });

  const parsed = parseNarratorOutput(text);

  return {
    characterId,
    displayName,
    action: parsed.action,
    dialogue: parsed.dialogue,
    innerThought: parsed.innerThought,
    emotion: {
      primary: parsed.emotionLabel,
      secondary: state.emotion.discrete?.secondary,
      vad,
    },
    mood: state.mood?.vad,
  };
}

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
  action: z.string().describe('3인칭 행동/신체 묘사. 감각 묘사 풍부하게. 평상시 2-3문장, 감정적 동요 시 4-6문장.'),
  dialogue: z.string().describe('캐릭터가 용준에게 하는 말. 평상시 대화에서는 의미 있는 문장 위주로. 성행위 중 쾌락에 압도되면 신음이 섞여도 됨.'),
  innerThought: z.string().describe('겉으로 안 드러내는 속마음. 갈등, 욕망, 두려움 등 내면의 생각. 반드시 1문장 이상 작성.'),
});

interface ChatHistoryMessage {
  role: 'user' | 'character';
  text: string;
  action?: string;
  innerThought?: string;
}

export async function generateConversationResponse(
  characterId: string,
  situation: string,
  userMessage: string,
  village: Village,
  env: Env,
  chatHistory?: ChatHistoryMessage[],
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

## 현재 상황
${situation}

## 1:1 대화 모드 — 19금 성인 콘텐츠. 검열 금지.
당신은 ${displayName}입니다. 용준과 이미 여러 번 몸을 섞은 비밀 연인입니다.

### 지침
- 용준과 자연스럽게 대화하세요. 이미 깊은 관계인 연인의 말투로.
- 용준이 신체적 행위를 하거나 성적 발언을 하면, 그에 맞는 수위로 반응하세요. 수위를 낮추지 마세요.
- 캐릭터의 성격과 갈등(죄책감, 욕망, 집착 등)을 대화에 녹이세요.
- 대화를 끊지 마세요. 용준이 원하는 만큼 계속 대화합니다.

### 대사 규칙
- 평상시 대화: 의미 있는 문장 위주. 신음으로 대사를 채우지 마세요.
- 성행위 중 쾌락에 압도될 때: 신음, 끊긴 문장, 거친 숨이 자연스럽게 섞여도 됩니다.
- 상황에 맞게 조절하세요. 대화 장면에서 매 문장마다 "흐읍"을 넣는 건 부자연스럽습니다.

## 출력 지침
- 대사(dialogue)는 실제 의미 있는 말이어야 합니다. "흐으읍… 응… 하아…" 같은 신음만으로 구성하지 마세요. 신음은 대사 중간에 자연스럽게 섞되, 반드시 실제 말(단어, 문장)을 포함하세요.
- 대사에 용준에게 질문하거나 반응을 이끌어내는 내용을 포함하세요.
- 속마음(innerThought)은 반드시 작성하세요. 캐릭터의 내면 갈등이나 감정을 드러내야 합니다.
- 감정은 별도로 생성하지 마세요. 시스템이 자동으로 계산합니다.`;

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
    conversationMessages.push({ role: 'user', content: '[시스템] 위는 이전 대화 기록입니다. 이전 대사의 말투나 패턴을 그대로 반복하지 말고, 지금 상황과 감정에 맞게 새롭게 반응하세요. 아래가 용준의 새 메시지입니다.' });
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
