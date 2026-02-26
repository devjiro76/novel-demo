/**
 * GameState CRUD — in-memory store (replaces Cloudflare KV).
 *
 * Relationships and event logs are managed by the World API via @molroo-ai/world-sdk.
 * This module manages: chapter, turnCount, tension, personaIds (game-specific logic).
 */

import type { GameState, EventSummary } from './types';
import type { Village } from './personas';
import type { AppraisalVector } from '@molroo-ai/world-sdk';
import { getRelationships } from './personas';
import { getStore } from './storage';
const TURNS_PER_CHAPTER = 8;

interface RelSeed {
  source: { type: 'user' | 'persona'; id: string };
  target: { type: 'user' | 'persona'; id: string };
  relationshipType: string;
  description?: string;
  strength: number;
  trust: number;
}

const INITIAL_RELATIONSHIPS: RelSeed[] = [
  // ── User→NPC (용준의 인식) ──
  { source: { type: 'user', id: 'yongjun' }, target: { type: 'persona', id: 'jeongsuk' }, relationshipType: 'player_npc', strength: 0.92, trust: 0.85 },
  { source: { type: 'user', id: 'yongjun' }, target: { type: 'persona', id: 'eunhye' }, relationshipType: 'player_npc', strength: 0.90, trust: 0.85 },
  { source: { type: 'user', id: 'yongjun' }, target: { type: 'persona', id: 'mina' }, relationshipType: 'player_npc', strength: 0.88, trust: 0.70 },
  { source: { type: 'user', id: 'yongjun' }, target: { type: 'persona', id: 'jeongjung' }, relationshipType: 'player_npc', strength: 0.45, trust: 0.35 },
  { source: { type: 'user', id: 'yongjun' }, target: { type: 'persona', id: 'deokhui' }, relationshipType: 'player_npc', strength: 0.65, trust: 0.7 },

  // ── NPC→User (각 NPC의 용준 인식) ──
  {
    source: { type: 'persona', id: 'jeongsuk' }, target: { type: 'user', id: 'yongjun' },
    relationshipType: '비밀 연인',
    description: '아들 친구이자 비밀 연인. 이미 여러 번 몸을 섞었다. 20년 만에 느끼는 여자로서의 쾌감에 중독되었다. 용준이 "정숙씨"라고 부르면 온몸이 달아오른다. 이러면 안 된다는 건 아는데, 용준 없이는 이제 못 견딘다. 남편과 아이들 눈을 피하는 게 점점 힘들다.',
    strength: 0.92, trust: 0.85,
  },
  {
    source: { type: 'persona', id: 'eunhye' }, target: { type: 'user', id: 'yongjun' },
    relationshipType: '비밀 연인',
    description: '동생 친구이자 첫 남자. 내가 먼저 키스했다. 연하는 질색이라던 원칙이 무색하게, 용준이 방에 오면 문을 잠그고 안긴다. 처음 느끼는 연애 감정, 처음 느끼는 신체적 쾌감에 온통 빠져 있다. 용준이 나만 보면 좋겠는데, 가끔 다른 여자랑 가까이하면 속이 뒤집힌다.',
    strength: 0.90, trust: 0.85,
  },
  {
    source: { type: 'persona', id: 'mina' }, target: { type: 'user', id: 'yongjun' },
    relationshipType: '금지된 관계',
    description: '덕희의 친구이자 금지된 상대. 가장 오래 버텼지만 결국 무너졌다. "이번이 마지막"을 다섯 번 넘게 말했다. 덕희를 사랑하는데 용준의 손길에 몸이 반응하는 자신이 역겹다. 용준을 밀치면서도 잡힌 손목을 뿌리치지 못한다. 죄책감이 임계점에 가깝다.',
    strength: 0.88, trust: 0.70,
  },
  {
    source: { type: 'persona', id: 'jeongjung' }, target: { type: 'user', id: 'yongjun' },
    relationshipType: '아들 친구',
    description: '아들 덕희 친구. 최근 뭔가 이상하다. 아내가 요즘 유난히 기분이 좋고, 딸이 문을 잠그는 횟수가 늘었다. 미나도 용준을 보면 어색하게 시선을 피한다. 확신은 없지만 찜찜하다.',
    strength: 0.45, trust: 0.35,
  },
  {
    source: { type: 'persona', id: 'deokhui' }, target: { type: 'user', id: 'yongjun' },
    relationshipType: '절친',
    description: '대학 1학년 때부터의 가장 친한 친구. 잘생기고 인기 많은 게 자랑스럽다. 우리 가족이랑도 잘 어울리고, 미나도 처음엔 경계했는데 요즘은 괜찮은 것 같다.',
    strength: 0.65, trust: 0.7,
  },

  // ── NPC↔NPC 가족/연인 관계 (양방향) ──
  {
    source: { type: 'persona', id: 'jeongsuk' }, target: { type: 'persona', id: 'jeongjung' },
    relationshipType: '남편',
    description: '결혼 20년차. 소원한 관계. 대화도 스킨십도 거의 없다. 원망보단 체념에 가깝다.',
    strength: 0.35, trust: 0.3,
  },
  {
    source: { type: 'persona', id: 'jeongjung' }, target: { type: 'persona', id: 'jeongsuk' },
    relationshipType: '아내',
    description: '소원한 관계. 가볍게 타박은 하지만 진지한 대화는 회피한다. 아내의 외로움에 대한 책임이 있지만 직면하지 않는다.',
    strength: 0.35, trust: 0.3,
  },
  {
    source: { type: 'persona', id: 'jeongsuk' }, target: { type: 'persona', id: 'eunhye' },
    relationshipType: '딸',
    description: '서로 챙기고 의지하는 사이. 은혜한테만은 좋은 엄마이고 싶다. 은혜가 눈치챌까 봐 더 조심한다.',
    strength: 0.85, trust: 0.8,
  },
  {
    source: { type: 'persona', id: 'eunhye' }, target: { type: 'persona', id: 'jeongsuk' },
    relationshipType: '엄마',
    description: '서로 챙기고 수다 떠는 사이. 나를 가장 이해해주는 사람. 근데 요즘 엄마가 좀 이상하다… 기분이 좋아 보이는데 뭔가 감추는 느낌.',
    strength: 0.85, trust: 0.8,
  },
  {
    source: { type: 'persona', id: 'jeongsuk' }, target: { type: 'persona', id: 'deokhui' },
    relationshipType: '아들',
    description: '어리버리하지만 순수한 아이. 덕희가 상처받을까 가장 두렵다.',
    strength: 0.85, trust: 0.85,
  },
  {
    source: { type: 'persona', id: 'deokhui' }, target: { type: 'persona', id: 'jeongsuk' },
    relationshipType: '엄마',
    description: '따뜻한 엄마. 반찬 잘 만들어주시고 잔소리도 하지만 사랑이 느껴진다.',
    strength: 0.85, trust: 0.85,
  },
  {
    source: { type: 'persona', id: 'eunhye' }, target: { type: 'persona', id: 'jeongjung' },
    relationshipType: '아빠',
    description: '과묵하고 존재감 낮지만 나쁜 사람은 아니다.',
    strength: 0.6, trust: 0.6,
  },
  {
    source: { type: 'persona', id: 'jeongjung' }, target: { type: 'persona', id: 'eunhye' },
    relationshipType: '딸',
    description: '혈기왕성한 딸. 속으로 대견하다.',
    strength: 0.7, trust: 0.7,
  },
  {
    source: { type: 'persona', id: 'eunhye' }, target: { type: 'persona', id: 'deokhui' },
    relationshipType: '남동생',
    description: '어리버리한 동생. 장난 섞인 독설을 해도 결국 챙기게 된다.',
    strength: 0.75, trust: 0.75,
  },
  {
    source: { type: 'persona', id: 'deokhui' }, target: { type: 'persona', id: 'eunhye' },
    relationshipType: '누나',
    description: '장난 섞인 독설을 하지만 결국 챙겨주는 누나. 심부름 시키는 게 일상.',
    strength: 0.75, trust: 0.75,
  },
  {
    source: { type: 'persona', id: 'jeongjung' }, target: { type: 'persona', id: 'deokhui' },
    relationshipType: '아들',
    description: '어리버리하지만 순수한 아들. 아들의 행복이 자존심보다 중요하다.',
    strength: 0.7, trust: 0.7,
  },
  {
    source: { type: 'persona', id: 'deokhui' }, target: { type: 'persona', id: 'jeongjung' },
    relationshipType: '아빠',
    description: '과묵한 아빠. 존재감 낮지만 편의점에서 소주 한 잔 따라주며 위로하는 따뜻한 면도 있다.',
    strength: 0.7, trust: 0.7,
  },
  {
    source: { type: 'persona', id: 'mina' }, target: { type: 'persona', id: 'deokhui' },
    relationshipType: '남자친구',
    description: '어린 시절 친구에서 연인으로 발전. 곰돌이 같다. 못생겼지만 허세 없고 진심인 게 좋다. 덕희와의 사랑을 지키는 게 가장 중요하다.',
    strength: 0.9, trust: 0.9,
  },
  {
    source: { type: 'persona', id: 'deokhui' }, target: { type: 'persona', id: 'mina' },
    relationshipType: '여자친구',
    description: '어릴 때부터 같은 동네 친구에서 연인. 미나가 세상에서 제일 예쁘고 멋있다. 태권도 유단자라 무섭지만 그게 좋다.',
    strength: 0.9, trust: 0.9,
  },
  {
    source: { type: 'persona', id: 'mina' }, target: { type: 'persona', id: 'eunhye' },
    relationshipType: '남친 누나',
    description: '덕희 누나. 성격 시원시원하고 미대 특유의 자유분방함. 언니-동생처럼 편하게 지낸다.',
    strength: 0.65, trust: 0.65,
  },
  {
    source: { type: 'persona', id: 'eunhye' }, target: { type: 'persona', id: 'mina' },
    relationshipType: '동생 여자친구',
    description: '동생 여자친구. 성격 불같지만 의리 있고 동생을 진심으로 아끼는 게 보여서 호감.',
    strength: 0.65, trust: 0.65,
  },
  {
    source: { type: 'persona', id: 'jeongsuk' }, target: { type: 'persona', id: 'mina' },
    relationshipType: '아들 여자친구',
    description: '덕희 여자친구. 사납지만 덕희를 진심으로 좋아하는 게 보인다. 미나가 오면 반찬을 더 차린다.',
    strength: 0.6, trust: 0.6,
  },
];

const MAX_NARRATOR_HISTORY = 50;

export function createInitialState(gameId: string): GameState {
  return {
    gameId,
    chapter: 1,
    turnCount: 0,
    narratorHistory: [],
    tension: {
      jeongsuk: 40,
      eunhye: 30,
      mina: 55,
      jeongjung: 35,
      deokhui: 0,
    },
    personaIds: {
      jeongsuk: 'jeongsuk',
      eunhye: 'eunhye',
      mina: 'mina',
      jeongjung: 'jeongjung',
      deokhui: 'deokhui',
    },
    tiersCrossed: {
      jeongsuk: [20, 40, 60, 80],
      eunhye: [20, 40, 60, 80],
      mina: [20, 40, 60, 80],
    },
  };
}

export async function seedRelationships(village: Village): Promise<void> {
  const promises = INITIAL_RELATIONSHIPS.map((rel) =>
    village.setRelationship({
      source: rel.source,
      target: rel.target,
      relationshipType: rel.relationshipType,
      description: rel.description,
      strength: rel.strength,
      trust: rel.trust,
    }),
  );
  await Promise.all(promises);
}

export async function saveState(state: GameState): Promise<void> {
  await getStore().set(`game:${state.gameId}`, JSON.stringify(state));
}

export async function loadState(gameId: string): Promise<GameState | null> {
  const raw = await getStore().get(`game:${gameId}`);
  if (!raw) return null;
  return JSON.parse(raw) as GameState;
}

export async function deleteState(gameId: string): Promise<void> {
  await getStore().delete(`game:${gameId}`);
}

export function advanceTurn(state: GameState): void {
  state.turnCount++;
  const newChapter = Math.min(6, Math.floor(state.turnCount / TURNS_PER_CHAPTER) + 1);
  if (newChapter > state.chapter) {
    state.chapter = newChapter;
  }
}

export function addNarratorEvent(state: GameState, event: EventSummary): void {
  state.narratorHistory.push(event);
  if (state.narratorHistory.length > MAX_NARRATOR_HISTORY) {
    state.narratorHistory = state.narratorHistory.slice(-MAX_NARRATOR_HISTORY);
  }
}

export async function updateRelationships(
  state: GameState,
  targets: { characterId: string; actionLabel: string; appraisal: AppraisalVector }[],
  village: Village,
): Promise<void> {
  const currentRels = await getRelationships(village);
  const relMap = new Map(
    currentRels
      .filter((r) => r.source_id === 'yongjun')
      .map((r) => [r.target_id, r]),
  );

  const updatePromises: Promise<void>[] = [];

  for (const t of targets) {
    const delta = computeRelationshipDelta(t.appraisal, t.actionLabel);

    state.tension[t.characterId] = clamp(
      (state.tension[t.characterId] ?? 0) + delta.tension,
      0,
      100,
    );

    const normViolation = -(t.appraisal.normCompatibility ?? 0);
    const isSignificant = (t.appraisal.goalRelevance ?? 0) > 0.5;
    if (normViolation > 0.3 && isSignificant) {
      const tensionBump = Math.round(normViolation * 6);
      state.tension.jeongjung = clamp((state.tension.jeongjung ?? 0) + tensionBump, 0, 100);
    }

    const currentRel = relMap.get(t.characterId);
    const currentStrength = currentRel?.strength ?? 0.5;
    const currentTrust = currentRel?.trust ?? 0.5;
    const strengthDelta = delta.affinity / 200;
    const newStrength = clamp(currentStrength + strengthDelta, 0, 1);

    const trustDelta = delta.affinity > 0 ? 0.02 : delta.affinity < 0 ? -0.03 : 0;
    const newTrust = clamp(currentTrust + trustDelta, 0, 1);

    updatePromises.push(
      village.setRelationship({
        source: { type: 'user', id: 'yongjun' },
        target: { type: 'persona', id: t.characterId },
        relationshipType: 'player_npc',
        strength: newStrength,
        trust: newTrust,
      }),
    );
  }

  await Promise.all(updatePromises);
}

export async function getRelationshipsAsAffinity(
  village: Village,
): Promise<Record<string, number>> {
  const rels = await getRelationships(village);
  const result: Record<string, number> = {};
  for (const r of rels) {
    if (r.source_id === 'yongjun') {
      result[r.target_id] = Math.round((r.strength - 0.5) * 200);
    }
  }
  return result;
}

const ACTION_KINDNESS: Record<string, number> = {
  care: 5,      comfort: 5,     protect: 5,    charm: 4,
  flirt: 3,     seduce: 3,      touch: 3,      confess: 4,
  tease: 1,     joke: 2,
  distance: -2, ignore: -4,     provoke: -4,   confront: -3, manipulate: -5,
  submit: 0,
};

function computeRelationshipDelta(appraisal: AppraisalVector, actionLabel: string): { affinity: number; tension: number } {
  const kindness = ACTION_KINDNESS[actionLabel] ?? 0;
  const congruenceBonus = Math.round(appraisal.goalCongruence * 3);
  const affinity = kindness + congruenceBonus;

  const normViolation = Math.max(0, -appraisal.normCompatibility);
  const standardsViolation = Math.max(0, -appraisal.internalStandards);
  const tension = Math.round(
    normViolation * 8
    + standardsViolation * 4
    + appraisal.urgency * 3
    + (1 - Math.max(0, appraisal.controllability)) * 2
  );
  return { affinity, tension };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ---- Tier crossing detection ----

const TIER_THRESHOLDS = [20, 40, 60, 80];
const AROUSAL_THRESHOLD = 0.6;

export function checkTierCrossing(
  state: GameState,
  characterId: string,
  affinity: number,
  arousal: number,
): number | null {
  const crossed = state.tiersCrossed[characterId] ?? [];
  for (const tier of TIER_THRESHOLDS) {
    if (affinity >= tier && !crossed.includes(tier) && arousal > AROUSAL_THRESHOLD) {
      state.tiersCrossed[characterId] = [...crossed, tier];
      return tier;
    }
  }
  return null;
}
