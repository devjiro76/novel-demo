/**
 * 3-Tier Memory System (OpenClaw-inspired)
 *
 * Tier 1 (Short-term): Recent 50 messages sent as chat history — handled by narrator.ts
 * Tier 2 (Medium-term): Rolling conversation summary per room — KV summary:{roomId}:{npcId}
 * Tier 3 (Long-term): Persistent core facts per NPC across all rooms — KV long-memory:{npcId}
 *
 * Tier 2+3 are updated together when chat exceeds 50 turns.
 * Gemini 2.5 Flash generates both summary and long-term fact extraction in one call.
 */

import { primaryModel, generateText, z, generateObject } from './llm';
import type { Env } from './types';
import type { ChatHistoryMessage } from './narrator';

// ---- KV access (same pattern as room-store.ts) ----

async function getKV(): Promise<KVNamespace | null> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    return (ctx.env as any).ROOM_KV ?? null;
  } catch {
    return null;
  }
}

const memStore = new Map<string, string>();

async function kvGet(key: string): Promise<string | null> {
  const kv = await getKV();
  if (kv) return kv.get(key);
  return memStore.get(key) ?? null;
}

async function kvPut(key: string, value: string): Promise<void> {
  const kv = await getKV();
  if (kv) return kv.put(key, value);
  memStore.set(key, value);
}

// ---- Tier 2: Medium-term (Room conversation summary) ----

const SUMMARY_THRESHOLD = 50;
const RECENT_KEEP = 50;

interface SummaryData {
  summary: string;
  coveredUpTo: number;
  updatedAt: number;
}

function summaryKey(roomId: string, npcId: string): string {
  return `summary:${roomId}:${npcId}`;
}

export async function loadSummary(roomId: string, npcId: string): Promise<string> {
  const raw = await kvGet(summaryKey(roomId, npcId));
  if (!raw) return '';
  try {
    return (JSON.parse(raw) as SummaryData).summary;
  } catch {
    return '';
  }
}

// ---- Tier 3: Long-term (Persistent NPC facts) ----

const MAX_LONG_MEMORY_FACTS = 20;

interface LongMemoryData {
  facts: string[];
  updatedAt: number;
}

function longMemoryKey(npcId: string): string {
  return `long-memory:${npcId}`;
}

/** Load long-term memory — always called, every turn */
export async function loadLongMemory(npcId: string): Promise<string> {
  const raw = await kvGet(longMemoryKey(npcId));
  if (!raw) return '';
  try {
    const data: LongMemoryData = JSON.parse(raw);
    return data.facts.map((f, i) => `${i + 1}. ${f}`).join('\n');
  } catch {
    return '';
  }
}

async function saveLongMemory(npcId: string, facts: string[]): Promise<void> {
  const data: LongMemoryData = {
    facts: facts.slice(-MAX_LONG_MEMORY_FACTS),
    updatedAt: Date.now(),
  };
  await kvPut(longMemoryKey(npcId), JSON.stringify(data));
}

// ---- Update Tier 2 + 3 together ----

/**
 * When history exceeds threshold:
 * 1. Summarize older messages → Tier 2 (KV summary)
 * 2. Extract lasting facts → merge into Tier 3 (KV long-memory)
 */
export async function updateSummaryIfNeeded(
  roomId: string,
  npcId: string,
  allHistory: ChatHistoryMessage[],
  env: Env,
): Promise<string> {
  if (allHistory.length <= SUMMARY_THRESHOLD) {
    return loadSummary(roomId, npcId);
  }

  const older = allHistory.slice(0, -RECENT_KEEP);
  const existingSummary = await loadSummary(roomId, npcId);

  const lines = older.map((m) => {
    if (m.role === 'user') return `유저: ${m.text}`;
    return `캐릭터: ${m.text}`;
  });

  const textToSummarize = existingSummary
    ? `[이전 요약]\n${existingSummary}\n\n[새로운 대화]\n${lines.join('\n')}`
    : lines.join('\n');

  // Load existing long-term facts for context
  const existingLongRaw = await kvGet(longMemoryKey(npcId));
  const existingFacts: string[] = existingLongRaw
    ? (JSON.parse(existingLongRaw) as LongMemoryData).facts
    : [];

  try {
    const { object } = await generateObject({
      model: primaryModel(env),
      schema: z.object({
        summary: z.string().describe('대화 요약. 3-5문장. 핵심 사건, 감정 변화, 관계 진전 중심.'),
        newFacts: z.array(z.string()).describe(
          '이 대화에서 새로 발견된, 장기적으로 기억할 만한 사실들. '
          + '예: "용준과 정숙의 관계가 시작됨", "미나는 용준에게 질투를 느낌". '
          + '이미 알려진 사실은 제외. 새로운 것만. 없으면 빈 배열.',
        ),
      }),
      system: `당신은 소설 캐릭터의 기억을 관리하는 시스템입니다.
주어진 대화를 분석하여:
1. 대화 요약 (3-5문장)
2. 장기 기억으로 저장할 새로운 사실 추출

기존에 이미 알고 있는 사실:
${existingFacts.length > 0 ? existingFacts.map((f, i) => `${i + 1}. ${f}`).join('\n') : '(없음)'}

중복되는 사실은 newFacts에 넣지 마세요. 한국어로 작성.`,
      prompt: textToSummarize,
      maxOutputTokens: 500,
    });

    // Save Tier 2: summary
    const summaryData: SummaryData = {
      summary: object.summary,
      coveredUpTo: Date.now(),
      updatedAt: Date.now(),
    };
    await kvPut(summaryKey(roomId, npcId), JSON.stringify(summaryData));

    // Save Tier 3: merge new facts
    if (object.newFacts.length > 0) {
      const merged = [...existingFacts, ...object.newFacts];
      await saveLongMemory(npcId, merged);
      console.log(`[long-memory] npc=${npcId} +${object.newFacts.length} facts (total ${merged.length})`);
    }

    console.log(`[summary] room=${roomId} npc=${npcId} (${object.summary.length} chars)`);
    return object.summary;
  } catch (err) {
    console.warn('[memory] update failed (non-fatal):', (err as Error).message);
    return existingSummary;
  }
}
