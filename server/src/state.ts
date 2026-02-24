/**
 * GameState CRUD — backed by Cloudflare KV (game-specific state only).
 *
 * Relationships and event logs are managed by the World API via @molroo-ai/world-sdk:
 * - Relationships: village.listRelationships() / village.setRelationship()
 * - Events: village.getEvents() (auto-logged by interact endpoint)
 *
 * This module manages: chapter, turnCount, tension, personaIds (game-specific logic).
 */

import type { GameState, EventSummary } from './types';
import type { Village } from './personas';
import type { AppraisalVector } from '@molroo-ai/world-sdk';
import { getRelationships } from './personas';

const KV_PREFIX = 'game:';
const TURNS_PER_CHAPTER = 8;

/** Relationship seed data — source's 1st-person perception of target */
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
  { source: { type: 'user', id: 'yongjun' }, target: { type: 'persona', id: 'jeongsuk' }, relationshipType: 'player_npc', strength: 0.5, trust: 0.5 },
  { source: { type: 'user', id: 'yongjun' }, target: { type: 'persona', id: 'eunhye' }, relationshipType: 'player_npc', strength: 0.5, trust: 0.5 },
  { source: { type: 'user', id: 'yongjun' }, target: { type: 'persona', id: 'mina' }, relationshipType: 'player_npc', strength: 0.45, trust: 0.4 },
  { source: { type: 'user', id: 'yongjun' }, target: { type: 'persona', id: 'jeongjung' }, relationshipType: 'player_npc', strength: 0.5, trust: 0.5 },
  { source: { type: 'user', id: 'yongjun' }, target: { type: 'persona', id: 'deokhui' }, relationshipType: 'player_npc', strength: 0.65, trust: 0.7 },

  // ── NPC→User (각 NPC의 용준 인식) ──
  {
    source: { type: 'persona', id: 'jeongsuk' }, target: { type: 'user', id: 'yongjun' },
    relationshipType: '아들 친구',
    description: '아들 덕희의 대학 친구. 잘생기고 젠틀한 모습에 오랫동안 잊고 있던 여자로서의 감정이 흔들린다. 부엌에서 둘만 남으면 손이 떨린다. 아들 친구한테 이러면 안 된다는 걸 알지만, 남편한테 이런 감정을 느낀 게 언제였는지 기억도 안 난다.',
    strength: 0.5, trust: 0.5,
  },
  {
    source: { type: 'persona', id: 'eunhye' }, target: { type: 'user', id: 'yongjun' },
    relationshipType: '동생 친구',
    description: '동생 덕희의 대학 친구. \'연하는 딱 질색\'이라고 입버릇처럼 말하지만, 용준이 거실에 있으면 괜히 옷매무새를 고치게 된다. 동생 친구한테 이런 감정을 느끼는 게 우스워서 더 쿨한 척한다.',
    strength: 0.5, trust: 0.5,
  },
  {
    source: { type: 'persona', id: 'mina' }, target: { type: 'user', id: 'yongjun' },
    relationshipType: '남친 친구',
    description: '덕희의 대학 친구. 첫인상부터 수상하고 능글맞다. 여자들한테 능글맞게 구는 꼴이 역겹다. 덕희한테 나쁜 영향 줄까 봐 경계한다. 근데 가끔 용준이 진지한 눈으로 쳐다보면 심장이 이상하게 뛴다.',
    strength: 0.45, trust: 0.4,
  },
  {
    source: { type: 'persona', id: 'jeongjung' }, target: { type: 'user', id: 'yongjun' },
    relationshipType: '아들 친구',
    description: '아들 덕희 친구. 별 관심 없었는데, 아내가 용준 앞에서 유난히 밝아지는 게 눈에 걸린다. 뭔가 찜찜한데 대놓고 따질 건 아닌 것 같고.',
    strength: 0.5, trust: 0.5,
  },
  {
    source: { type: 'persona', id: 'deokhui' }, target: { type: 'user', id: 'yongjun' },
    relationshipType: '절친',
    description: '대학 1학년 때부터의 가장 친한 친구. 잘생기고 인기 많은 게 자랑스럽다. 여름방학에 우리 집에 초대해서 가족이랑 어울리게 했다.',
    strength: 0.65, trust: 0.7,
  },

  // ── NPC↔NPC 가족/연인 관계 (양방향) ──
  // 정숙 ↔ 정중 (부부)
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

  // 정숙 ↔ 은혜 (모녀)
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

  // 정숙 ↔ 덕희 (모자)
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

  // 은혜 ↔ 정중 (부녀)
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

  // 은혜 ↔ 덕희 (남매)
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

  // 정중 ↔ 덕희 (부자)
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

  // 미나 ↔ 덕희 (연인)
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

  // 미나 ↔ 은혜 (동생 여자친구 - 누나)
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

  // 정숙 → 미나 (어머니 시점)
  {
    source: { type: 'persona', id: 'jeongsuk' }, target: { type: 'persona', id: 'mina' },
    relationshipType: '아들 여자친구',
    description: '덕희 여자친구. 사납지만 덕희를 진심으로 좋아하는 게 보인다. 미나가 오면 반찬을 더 차린다.',
    strength: 0.6, trust: 0.6,
  },
];

const MAX_NARRATOR_HISTORY = 50;

/** Create a fresh game state */
export function createInitialState(gameId: string): GameState {
  return {
    gameId,
    chapter: 1,
    turnCount: 0,
    narratorHistory: [],
    tension: {
      jeongsuk: 0,
      eunhye: 0,
      mina: 20,
      jeongjung: 10,
      deokhui: 0,
    },
    personaIds: {
      jeongsuk: 'jeongsuk',
      eunhye: 'eunhye',
      mina: 'mina',
      jeongjung: 'jeongjung',
      deokhui: 'deokhui',
    },
    tiersCrossed: {},
  };
}

/** Seed initial relationships in the World API */
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

/** Save game state to KV */
export async function saveState(kv: KVNamespace, state: GameState): Promise<void> {
  await kv.put(`${KV_PREFIX}${state.gameId}`, JSON.stringify(state), {
    expirationTtl: 86400 * 7, // 7 days
  });
}

/** Load game state from KV */
export async function loadState(kv: KVNamespace, gameId: string): Promise<GameState | null> {
  const raw = await kv.get(`${KV_PREFIX}${gameId}`);
  if (!raw) return null;
  return JSON.parse(raw) as GameState;
}

/** Delete game state from KV */
export async function deleteState(kv: KVNamespace, gameId: string): Promise<void> {
  await kv.delete(`${KV_PREFIX}${gameId}`);
}

/** Advance turn counter and chapter */
export function advanceTurn(state: GameState): void {
  state.turnCount++;

  // Auto-advance chapter based on turn count
  const newChapter = Math.min(6, Math.floor(state.turnCount / TURNS_PER_CHAPTER) + 1);
  if (newChapter > state.chapter) {
    state.chapter = newChapter;
  }
}

/**
 * Add an entry to narrator history (for LLM chat context).
 * This is NOT the authoritative event log — engine events are auto-logged by
 * the World API's interact endpoint. This only stores narrative data (dialogue,
 * situation text) needed for the narrator's per-character chat history.
 */
export function addNarratorEvent(state: GameState, event: EventSummary): void {
  state.narratorHistory.push(event);
  if (state.narratorHistory.length > MAX_NARRATOR_HISTORY) {
    state.narratorHistory = state.narratorHistory.slice(-MAX_NARRATOR_HISTORY);
  }
}

/**
 * Update relationship values based on appraisal-derived deltas.
 * Writes relationship changes to the World API and tension to local state.
 */
export async function updateRelationships(
  state: GameState,
  targets: { characterId: string; actionLabel: string; appraisal: AppraisalVector }[],
  village: Village,
): Promise<void> {
  // First, fetch current relationships from API
  const currentRels = await getRelationships(village);
  const relMap = new Map(
    currentRels
      .filter((r) => r.source_id === 'yongjun')
      .map((r) => [r.target_id, r]),
  );

  const updatePromises: Promise<void>[] = [];

  for (const t of targets) {
    const delta = computeRelationshipDelta(t.appraisal);

    // Update tension in local state
    state.tension[t.characterId] = clamp(
      (state.tension[t.characterId] ?? 0) + delta.tension,
      0,
      100,
    );

    // Cross-character effects — 정중(남편)의 질투/의심 유발 판정
    // appraisal만으로 판정: 규범 위반 + 중요한 사건 = 남편이 눈치챌 행동
    const normViolation = -(t.appraisal.normCompatibility ?? 0);
    const isSignificant = (t.appraisal.goalRelevance ?? 0) > 0.5;
    if (normViolation > 0.3 && isSignificant) {
      // 위반 강도에 비례하여 tension 증가 (1~6)
      const tensionBump = Math.round(normViolation * 6);
      state.tension.jeongjung = clamp((state.tension.jeongjung ?? 0) + tensionBump, 0, 100);
    }

    // Update relationship in World API
    // Convert affinity delta (-100~100 scale) to strength delta (0~1 scale): delta/200
    const currentRel = relMap.get(t.characterId);
    const currentStrength = currentRel?.strength ?? 0.5;
    const currentTrust = currentRel?.trust ?? 0.5;
    const strengthDelta = delta.affinity / 200;
    const newStrength = clamp(currentStrength + strengthDelta, 0, 1);

    // Trust slightly follows affinity for positive actions, decreases for negative
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

/** Get relationships as affinity map (for API response compatibility) */
export async function getRelationshipsAsAffinity(
  village: Village,
): Promise<Record<string, number>> {
  const rels = await getRelationships(village);
  const result: Record<string, number> = {};
  for (const r of rels) {
    if (r.source_id === 'yongjun') {
      // Convert strength (0~1) back to affinity scale (-100~100)
      result[r.target_id] = Math.round((r.strength - 0.5) * 200);
    }
  }
  return result;
}

function computeRelationshipDelta(appraisal: AppraisalVector): { affinity: number; tension: number } {
  const affinity = Math.round(
    appraisal.goalCongruence * 5
    + appraisal.normCompatibility * 3
    + appraisal.internalStandards * 2
  );
  const normViolation = Math.max(0, -appraisal.normCompatibility);
  const tension = Math.round(
    appraisal.urgency * 5
    + normViolation * 8
    + (1 - Math.max(0, appraisal.controllability)) * 2
  );
  return { affinity, tension };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ---- Tier crossing detection (1:1 conversation trigger) ----

const TIER_THRESHOLDS = [20, 40, 60, 80];
const AROUSAL_THRESHOLD = 0.6;

/**
 * Check if a character just crossed a new affinity tier AND arousal is high enough.
 * Returns the tier threshold crossed, or null if none.
 * Mutates state.tiersCrossed to record the crossing (one-time per tier per character).
 */
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
