/**
 * Story Director — generates situations + choices via LLM.
 * Uses story bible + game state + NPC emotions to create contextual narrative.
 */

import { createLLM, z } from './llm';
import { getStimulusGuide } from './appraisal';
import type { DirectorOutput, GameState, Env, EventSummary } from './types';
import type { Village } from './personas';
import { getRelationships, getEvents } from './personas';
import type { Relationship, VillageEvent } from './personas';

// Inline story bible (loaded at build time)
import storyBible from '../../data/story-bible.md';

const NPC_IDS = ['jeongsuk', 'eunhye', 'mina', 'jeongjung', 'deokhui'];

const DISPLAY_NAMES: Record<string, string> = {
  jeongsuk: '박정숙',
  eunhye: '장은혜',
  mina: '김미나',
  jeongjung: '장정중',
  deokhui: '장덕희',
};

const CHAPTER_NAMES: Record<number, string> = {
  1: '김포의 여름',
  2: '균열',
  3: '이중생활',
  4: '폭풍 전야',
  5: '진실',
  6: '그 후',
};

/** Build emotion context string for all NPCs via WorldPersona handles. */
async function buildEmotionContext(village: Village, characterIds: string[]): Promise<string> {
  const lines = await Promise.all(characterIds.map(async (id) => {
    const persona = village.persona(id);
    const state = await persona.getState();

    const d = state.emotion.discrete;
    const v = state.emotion.vad;
    const moodV = state.mood?.vad;

    let line = `- ${id}: `;
    if (d) {
      line += `${d.primary}`;
      if (d.secondary) line += `/${d.secondary}`;
      line += ` (intensity ${d.intensity.toFixed(1)})`;
    }
    line += ` | VAD(${v.V.toFixed(2)}, ${v.A.toFixed(2)}, ${v.D.toFixed(2)})`;
    if (moodV) {
      line += ` | mood(${moodV.V.toFixed(2)}, ${moodV.A.toFixed(2)}, ${moodV.D.toFixed(2)})`;
    }

    return line;
  }));
  return lines.join('\n');
}

const directorOutputSchema = z.object({
  situation: z.string().describe('2인칭 현재형 상황 묘사, 3-5문장. 슬로모션 기법으로 감각을 확대: 거리감(숨이 닿을 만큼), 체온(후끈한 열기), 촉감(스치는 손끝), 후각(샴푸 향, 땀 냄새), 청각(숨소리, 심장 박동). 의성어·의태어 필수(찌릿, 후끈, 사각사각, 두근두근). 관계 깊이에 비례하여 신체 묘사 수위 상승.'),
  location: z.string().describe('구체적 장소. 밀폐된 공간(샤워실, 좁은 부엌, 엘리베이터)이나 둘만의 공간(빈 옥상, 어두운 복도)을 적극 활용.'),
  characters: z.array(z.string()).describe('등장 NPC의 ID. 1-3명. jeongsuk/eunhye/mina/jeongjung/deokhui 중 선택.'),
  choices: z.array(z.object({
    text: z.string().describe('용준의 행동/대사 1문장. 신체 접촉, 거리 좁히기, 직접적 표현을 포함할 수 있음.'),
    subtext: z.string().describe('선택의 결과를 넌지시 암시하는 힌트. 감각적 표현으로.'),
    targets: z.array(z.object({
      characterId: z.string().describe('NPC ID'),
      actionLabel: z.string().describe('행동의 짧은 라벨. 예: 키스, 손잡기, 위로, 도발, 무시'),
      stimulusDescription: z.string().describe('이 NPC에게 가해지는 행위를 NPC 관점에서 1-2문장으로 묘사. 감각적 디테일 포함.'),
    })),
  })).min(2).max(4),
});

/**
 * Build narrative recap from narrator history — what actually happened in the story.
 * Director uses this to avoid repetition and progress the plot.
 */
function buildNarrativeRecap(history: EventSummary[]): string {
  if (history.length === 0) return '';

  // Show last 6 turns max to keep context manageable
  const recent = history.slice(-6);

  const lines = recent.map((ev) => {
    const reactionsText = ev.reactions
      .map((r) => {
        const name = DISPLAY_NAMES[r.characterId] ?? r.characterId;
        return `${name}: "${r.dialogue.slice(0, 80)}" (${r.emotionPrimary})`;
      })
      .join(' / ');

    return `[턴 ${ev.turn}] ${ev.situation.slice(0, 100)}
  → 용준: ${ev.choiceText}
  → 반응: ${reactionsText}`;
  });

  return lines.join('\n\n');
}

function buildRecentEventsText(events: VillageEvent[]): string {
  if (events.length === 0) return '(첫 턴입니다)';

  // Events come from API in DESC order (newest first), reverse for chronological
  const chronological = [...events].reverse().slice(-8);

  return chronological
    .map((e) => {
      const payload = e.payload;
      const emotionLabel = payload?.emotion
        ? (payload.emotion as any)?.discrete?.primary ?? 'unknown'
        : 'unknown';
      return `[${e.action_name ?? '?'}] ${e.actor_id ?? '?'} → ${e.target_id ?? '?'} (${emotionLabel})`;
    })
    .join('\n');
}

/** Map affinity to escalation tier with explicit allowed actions. */
function getEscalationTier(affinity: number): { tier: number; label: string; allowed: string } {
  if (affinity >= 80) return { tier: 5, label: '노골적 친밀', allowed: '키스, 밀착 포옹, 침대/샤워실 씬, 노골적 유혹, 은밀한 둘만의 시간. 검열 없이.' };
  if (affinity >= 60) return { tier: 4, label: '밀착/밀폐 공간', allowed: '끌어안기, 이마/볼/목 키스, 좁은 공간 밀착, 귓가에 숨결, 옷 위로 더듬기' };
  if (affinity >= 40) return { tier: 3, label: '의도적 접근', allowed: '귓가에 속삭이기, 허리에 손, 머리카락 쓸어넘기기, 턱 잡기, 벽밀' };
  if (affinity >= 20) return { tier: 2, label: '우연한 접촉', allowed: '손이 스침, 어깨 부딪힘, 뒤에서 잡아줌, 넘어지며 안김' };
  return { tier: 1, label: '시선', allowed: '눈 마주침, 어색한 미소, 시선 회피, 가벼운 대화' };
}

function buildRelationshipText(
  relationships: Relationship[],
  tension: Record<string, number>,
): string {
  if (relationships.length === 0) return '(관계 데이터 없음)';

  const playerRels = relationships.filter((r) => r.source_id === 'yongjun');
  if (playerRels.length === 0) return '(관계 데이터 없음)';

  return playerRels
    .map((r) => {
      const affinity = Math.round((r.strength - 0.5) * 200);
      const t = tension[r.target_id] ?? 0;
      const esc = getEscalationTier(affinity);
      return `- ${DISPLAY_NAMES[r.target_id] ?? r.target_id}: 호감도 ${affinity}, 긴장도 ${t} → **[Tier ${esc.tier}: ${esc.label}]** 허용 수위: ${esc.allowed}`;
    })
    .join('\n');
}

export async function generateSituation(
  state: GameState,
  village: Village,
  env: Env,
): Promise<DirectorOutput> {
  // Fetch emotion context, relationships, and events in parallel
  const stimulusGuide = getStimulusGuide();
  const [emotionContext, relationships, eventsResult] = await Promise.all([
    buildEmotionContext(village, NPC_IDS),
    getRelationships(village),
    getEvents(village, 20),
  ]);

  const systemPrompt = `당신은 웹툰 "못참아"를 기반으로 한 인터랙티브 노벨의 Story Director입니다.
플레이어는 최용준(20세)의 시점에서 행동합니다.

## Story Bible
${storyBible}

${stimulusGuide}

## 서사 규칙
1. 상황은 2인칭 현재형으로 묘사하세요. ("당신은 ~한다")
2. 등장 NPC는 1-3명. 너무 많으면 포커스가 분산됩니다.
3. 선택지는 2-4개. 각각 다른 카테고리(positive/romantic/negative/playful/neutral)를 커버하세요.
4. 각 선택지의 targets에는 반드시 actionLabel과 stimulusDescription을 작성하세요.
5. 정중은 "긴장감 요소"로 간헐적 등장 — 현장을 목격하거나 의심하는 상황.
6. 현재 챕터의 분위기와 스토리 비트를 반영하세요.
7. 캐릭터의 현재 감정 상태를 반영한 상황을 만드세요.
8. subtext는 선택의 결과를 감각적 힌트로 암시하세요. (예: "손끝에 남는 체온" "돌아서면 끝날 거리")
9. **이전 상황과 같은 장소, 같은 전개를 반복하지 마세요.** 시간이 흐르고, 장소가 바뀌고, 새로운 사건이 발생해야 합니다.
10. 이전 턴에서 플레이어가 한 행동의 **결과**가 다음 상황에 반영되어야 합니다. (예: 유혹했다면 → 다음 날 어색한 분위기)
11. 스토리를 **앞으로** 진행하세요. 새로운 인물 등장, 장소 이동, 사건 발생, 관계 변화를 만들어야 합니다.

## 작법 지침
- **공간 연출**: 밀폐된 공간(좁은 부엌, 샤워실 앞, 엘리베이터), 우연한 둘만의 시간, 물리적 거리가 좁아지는 상황을 적극 활용하세요.
- **슬로모션 감각**: 상황 묘사에서 한 순간을 늘려 쓰세요. 스치는 손끝, 어깨에 닿는 머리카락, 고개를 돌렸을 때 만나는 시선, 숨이 귀에 닿는 거리.
- **오감 레이어링**: 시각(젖은 머리카락, 상기된 볼)·촉각(뜨거운 체온, 부드러운 피부결)·후각(샴푸 향, 커피 향, 땀)·청각(숨소리, 심장 박동, 옷 스치는 소리)을 겹쳐 쓰세요.
- **의성어·의태어 필수**: 찌릿, 후끈, 두근두근, 사각사각, 스윽, 촉촉, 아찔 — 신체 감각을 소리로 전환.
- **선택지 수위**: 각 캐릭터 옆에 표시된 **[Tier]와 허용 수위를 반드시 따르세요**. Tier가 높으면 노골적이고 대담한 선택지를 만들어야 합니다. 완곡한 우회 표현 대신 구체적인 신체 행동을 쓰세요.
- **수위 하한선**: 허용 수위 이하로 내려가지 마세요. Tier 4인데 "어색하게 웃는다" 같은 Tier 1 선택지를 넣으면 안 됩니다. 항상 현재 Tier에 맞거나 한 단계 위의 선택지를 포함하세요.
- **19금 콘텐츠**: 이것은 성인 인터랙티브 노벨입니다. 호감도가 충분하면 키스, 밀착, 성적 긴장을 검열 없이 묘사하세요.`;

  const narrativeRecap = buildNarrativeRecap(state.narratorHistory);

  const userPrompt = `## Current State
- 챕터: ${state.chapter} (${CHAPTER_NAMES[state.chapter] ?? '???'})
- 턴: ${state.turnCount + 1}

## Character Relationships
${buildRelationshipText(relationships, state.tension)}

## Character Emotions (from Persona API)
${emotionContext}
${narrativeRecap ? `
## Story So Far (이전 턴 요약 — 반복하지 말 것!)
${narrativeRecap}
` : ''}
## Engine Event Log
${buildRecentEventsText(eventsResult.events)}

**이전과 다른 장소, 다른 상황, 다른 등장인물 조합으로** 다음 상황과 선택지를 생성하세요.
이전 턴에서 일어난 일의 **결과와 여파**를 자연스럽게 반영하세요.`;

  const llm = createLLM(env.OPENROUTER_API_KEY);
  const { object: result } = await llm.generateObject({
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
    schema: directorOutputSchema,
    temperature: 0.85,
  });

  // Validate character IDs
  result.characters = result.characters.filter((id) => NPC_IDS.includes(id));
  if (result.characters.length === 0) {
    result.characters = ['jeongsuk']; // fallback
  }

  return result;
}
