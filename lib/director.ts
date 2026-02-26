import { readFileSync } from 'fs';
import { join } from 'path';
import { createModel, generateObject, z } from './llm';
import { generateText } from 'ai';
import type { DirectorOutput, GameState, Env, EventSummary } from './types';
import type { Village } from './personas';
import { getRelationships, getEvents } from './personas';
import type { Relationship, VillageEvent } from './personas';

const storyBible = readFileSync(join(process.cwd(), 'data/story-bible.md'), 'utf-8');

const NPC_IDS = ['jeongsuk', 'eunhye', 'mina', 'jeongjung', 'deokhui'];

const DISPLAY_NAMES: Record<string, string> = {
  jeongsuk: '박정숙',
  eunhye: '장은혜',
  mina: '김미나',
  jeongjung: '장정중',
  deokhui: '장덕희',
};

const CHAPTER_NAMES: Record<number, string> = {
  1: '이중생활',
  2: '균열',
  3: '폭풍 전야',
  4: '진실',
  5: '그 후',
};

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

const choicesSchema = z.object({
  choices: z.array(z.object({
    text: z.string().describe('용준의 행동/대사 1문장'),
    subtext: z.string().describe('선택의 결과를 넌지시 암시하는 힌트'),
    targets: z.array(z.object({
      characterId: z.string().describe('NPC ID'),
      actionLabel: z.string().describe('행동의 짧은 라벨. 예: 키스, 손잡기, 위로, 도발, 무시'),
    })),
  })),
});

function buildNarrativeRecap(history: EventSummary[]): string {
  if (history.length === 0) return '';

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

function getEscalationTier(affinity: number): { tier: number; label: string; allowed: string } {
  if (affinity >= 90) return { tier: 6, label: '섹스', allowed: '성행위, 옷 벗기기, 삽입, 체위 변경, 절정. 신음소리, 체액, 피부가 부딪히는 소리까지 묘사. 검열 금지.' };
  if (affinity >= 80) return { tier: 5, label: '노골적 애무', allowed: '딥키스, 가슴 만지기, 옷 속으로 손 넣기, 허벅지 쓸기, 목·쇄골·가슴 키스, 속옷 위로/아래로 더듬기, 샤워실·침대 씬. 신체 반응(숨소리, 신음, 몸 떨림) 구체적으로.' };
  if (affinity >= 60) return { tier: 4, label: '키스·밀착', allowed: '입술 키스, 혀 넣기, 벽밀 후 키스, 밀착 포옹, 허리·엉덩이에 손, 귓가에 숨결, 목 키스' };
  if (affinity >= 40) return { tier: 3, label: '의도적 접근', allowed: '귓가에 속삭이기, 허리에 손, 머리카락 쓸어넘기기, 턱 잡기, 벽밀, 이마 키스' };
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
  const [emotionContext, relationships, eventsResult] = await Promise.all([
    buildEmotionContext(village, NPC_IDS),
    getRelationships(village),
    getEvents(village, 20),
  ]);

  const systemPrompt = `당신은 웹툰 "못참아"를 기반으로 한 인터랙티브 노벨의 Story Director입니다.
플레이어는 최용준(20세)의 시점에서 행동합니다.

## Story Bible
${storyBible}

## 서사 규칙
1. 상황은 2인칭 현재형으로 묘사하세요. ("당신은 ~한다")
2. 등장 NPC는 1-3명. 너무 많으면 포커스가 분산됩니다.
3. 선택지는 2-4개. 각각 다른 카테고리(positive/romantic/negative/playful/neutral)를 커버하세요.
4. 각 선택지의 targets에는 반드시 actionLabel을 작성하세요.
5. 정중은 "긴장감 요소"로 간헐적 등장 — 현장을 목격하거나 의심하는 상황.
6. 현재 챕터의 분위기와 스토리 비트를 반영하세요.
7. 캐릭터의 현재 감정 상태를 반영한 상황을 만드세요.
8. subtext는 선택의 결과를 감각적 힌트로 암시하세요. (예: "손끝에 남는 체온" "돌아서면 끝날 거리")
9. **이전 상황과 같은 장소, 같은 전개를 반복하지 마세요.** 시간이 흐르고, 장소가 바뀌고, 새로운 사건이 발생해야 합니다.
10. 이전 턴에서 플레이어가 한 행동의 **결과**가 다음 상황에 반영되어야 합니다. (예: 유혹했다면 → 다음 날 어색한 분위기)
11. 스토리를 **앞으로** 진행하세요. 새로운 인물 등장, 장소 이동, 사건 발생, 관계 변화를 만들어야 합니다.

## 작법 지침 — 이것은 성인(19금) 인터랙티브 노벨입니다. 검열하지 마세요.
- **Tier에 맞는 수위**: 각 캐릭터의 Tier를 반드시 확인하고, 해당 Tier의 허용 행위를 선택지에 **직접적으로** 포함하세요.
  - Tier 5(노골적 애무): 가슴을 만진다, 옷 속으로 손을 넣는다, 허벅지를 쓸어올린다, 목/쇄골에 키스한다 — 이런 구체적 행위를 쓰세요.
  - Tier 6(섹스): 옷을 벗긴다, 침대로 이끈다, 몸을 겹친다, 안에 넣는다 — 완곡하게 돌려 말하지 마세요.
- **수위 하한선**: Tier 5-6인데 "어깨에 손을 올린다" "귓가에 속삭인다" 같은 Tier 2-3 수준은 **금지**입니다. 이미 몸을 섞은 사이입니다. 선택지 최소 1개는 반드시 현재 Tier의 최대 수위여야 합니다.
- **신체 묘사**: 추상적 감정("두근거린다") 대신 구체적 신체 반응을 쓰세요. 숨이 거칠어진다, 젖꼭지가 서다, 허벅지 사이가 뜨거워진다, 아랫배가 당긴다.
- **오감 레이어링**: 시각(벗겨진 어깨, 상기된 피부, 땀방울)·촉각(뜨거운 체온, 부드러운 피부결, 젖은 감촉)·후각(땀, 체취, 샴푸)·청각(신음, 거친 숨, 옷 벗는 소리, 침대 삐걱).
- **공간 연출**: 밀폐 공간(부엌, 샤워실, 침실, 좁은 복도)에서의 밀착. 언제든 누군가 올 수 있다는 긴장감.
- **선택지 스펙트럼**: 최소 하나는 가장 대담한(Tier 최대), 하나는 감정적/관계적, 하나는 위험 회피.`;

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

  const model = createModel(env.OPENROUTER_API_KEY);

  // Phase 1: Generate situation text (generateText — faster, streamable)
  const situationPrompt = systemPrompt + `\n\n## 출력 형식
아래 3개 섹션만 출력하세요. 선택지, 추가 설명, 마크다운 등 다른 내용은 절대 추가하지 마세요.

[장소]
(구체적 장소 한 줄)

[등장인물]
(NPC ID를 쉼표로. jeongsuk/eunhye/mina/jeongjung/deokhui 중 1-3명)

[상황]
(2인칭 현재형 상황 묘사 3-5문장)

**위 3개 섹션 이후에는 아무것도 출력하지 마세요.**`;

  const { text: situationText } = await generateText({
    model,
    system: situationPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    temperature: 0.85,
  });

  // Parse situation text
  const locationMatch = situationText.match(/\[장소\]\s*\n([\s\S]*?)(?=\n\[)/);
  const charactersMatch = situationText.match(/\[등장인물\]\s*\n([\s\S]*?)(?=\n\[)/);
  const situationMatch = situationText.match(/\[상황\]\s*\n([\s\S]*?)(?=\n\*\*|\n##|\n---|\n\[|$)/);

  const location = locationMatch?.[1]?.trim() ?? '거실';
  const characters = (charactersMatch?.[1]?.trim() ?? 'eunhye')
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((id) => NPC_IDS.includes(id));
  if (characters.length === 0) characters.push('eunhye');
  const situation = situationMatch?.[1]?.trim() ?? situationText;

  // Phase 2: Generate choices (generateObject — needs structured data)
  const { object: choicesResult } = await generateObject({
    model,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
      { role: 'assistant', content: situationText },
      { role: 'user', content: `위 상황에 맞는 선택지를 2-4개 생성하세요. 등장인물: ${characters.join(', ')}. 각각 다른 카테고리(positive/romantic/negative/playful/neutral)를 커버하세요.` },
    ],
    schema: choicesSchema,
    temperature: 0.85,
  });

  return {
    situation,
    location,
    characters,
    choices: choicesResult.choices,
  };
}
