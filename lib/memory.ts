/**
 * KV-based conversation summary (Tier 2 memory).
 *
 * When chat history exceeds a threshold, older messages are summarized
 * by gpt-4o-mini and stored in KV. The summary is prepended to the
 * system prompt on subsequent turns.
 *
 * KV key: summary:{roomId}:{npcId}
 */

import { engineModel, generateText } from './llm';
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

// ---- Summary ----

const SUMMARY_THRESHOLD = 20; // summarize when history exceeds this
const RECENT_KEEP = 20; // keep this many recent messages verbatim

interface SummaryData {
  summary: string;
  coveredUpTo: number; // timestamp of last summarized message
  updatedAt: number;
}

function summaryKey(roomId: string, npcId: string): string {
  return `summary:${roomId}:${npcId}`;
}

/** Load existing summary from KV */
export async function loadSummary(roomId: string, npcId: string): Promise<string> {
  const raw = await kvGet(summaryKey(roomId, npcId));
  if (!raw) return '';
  try {
    const data: SummaryData = JSON.parse(raw);
    return data.summary;
  } catch {
    return '';
  }
}

/**
 * If history is long enough, summarize older messages and store in KV.
 * Returns the summary (existing or newly generated).
 */
export async function updateSummaryIfNeeded(
  roomId: string,
  npcId: string,
  allHistory: ChatHistoryMessage[],
  env: Env,
): Promise<string> {
  if (allHistory.length <= SUMMARY_THRESHOLD) {
    // Not enough history to warrant summarization
    return loadSummary(roomId, npcId);
  }

  // Split: older messages to summarize, recent to keep
  const older = allHistory.slice(0, -RECENT_KEEP);
  const existingSummary = await loadSummary(roomId, npcId);

  // Build text to summarize
  const lines = older.map((m) => {
    if (m.role === 'user') return `유저: ${m.text}`;
    return `캐릭터: ${m.text}`;
  });

  const textToSummarize = existingSummary
    ? `[이전 요약]\n${existingSummary}\n\n[새로운 대화]\n${lines.join('\n')}`
    : lines.join('\n');

  try {
    const { text: summary } = await generateText({
      model: engineModel(env),
      system: '당신은 대화 요약 전문가입니다. 주어진 대화를 3-5문장으로 요약하세요. 핵심 사건, 감정 변화, 관계 진전을 중심으로. 한국어로 작성.',
      prompt: textToSummarize,
      maxOutputTokens: 300,
    });

    const data: SummaryData = {
      summary,
      coveredUpTo: Date.now(),
      updatedAt: Date.now(),
    };
    await kvPut(summaryKey(roomId, npcId), JSON.stringify(data));
    console.log(`[summary] updated for room=${roomId} npc=${npcId} (${summary.length} chars)`);
    return summary;
  } catch (err) {
    console.warn('[summary] generation failed (non-fatal):', (err as Error).message);
    return existingSummary;
  }
}
