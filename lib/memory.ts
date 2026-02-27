/**
 * D1 + Vectorize + Workers AI episodic memory adapter for novel demo.
 *
 * Stores conversation episodes in D1 (structured recall) and Vectorize
 * (semantic recall via Workers AI embeddings).
 */

// ---- Cloudflare binding types (minimal, no @cloudflare/workers-types needed) ----

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}

export interface VectorizeIndex {
  upsert(vectors: { id: string; values: number[]; metadata?: Record<string, unknown> }[]): Promise<{ count: number }>;
  query(
    vector: number[],
    options: { topK: number; returnMetadata?: 'all' | 'indexed' | 'none'; filter?: Record<string, unknown> },
  ): Promise<{ matches: { id: string; score: number; metadata?: Record<string, unknown> }[] }>;
}

export interface AiBinding {
  run(model: string, input: { text: string[] }): Promise<{ data: number[][] }>;
}

// ---- Constants ----

const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';

// ---- Episode type (local, lighter than SDK) ----

export interface EpisodeRecord {
  id: string;
  roomId: string;
  npcId: string;
  timestamp: number;
  sourceEntity?: string;
  context: string;
  importance: number;
  emotionV: number;
  emotionA: number;
  emotionD: number;
}

// ---- Memory functions ----

export async function saveEpisode(
  db: D1Database,
  vectorize: VectorizeIndex | null,
  ai: AiBinding | null,
  episode: EpisodeRecord,
): Promise<void> {
  // D1 INSERT
  await db
    .prepare(
      `INSERT OR REPLACE INTO episodes (id, room_id, npc_id, timestamp, source_entity, context, importance, emotion_v, emotion_a, emotion_d)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      episode.id,
      episode.roomId,
      episode.npcId,
      episode.timestamp,
      episode.sourceEntity ?? null,
      episode.context,
      episode.importance,
      episode.emotionV,
      episode.emotionA,
      episode.emotionD,
    )
    .run();

  // Vectorize upsert (best-effort)
  if (vectorize && ai && episode.context) {
    try {
      const embedding = await embed(ai, episode.context);
      await vectorize.upsert([
        {
          id: episode.id,
          values: embedding,
          metadata: { room_id: episode.roomId, npc_id: episode.npcId },
        },
      ]);
    } catch (err) {
      console.warn('[memory] vectorize upsert failed (non-fatal):', (err as Error).message);
    }
  }
}

/**
 * Recall recent episodes by room + NPC (D1 SQL, time-ordered).
 */
export async function recall(
  db: D1Database,
  roomId: string,
  npcId: string,
  limit = 5,
  minImportance = 0,
): Promise<EpisodeRecord[]> {
  const { results } = await db
    .prepare(
      `SELECT id, room_id, npc_id, timestamp, source_entity, context, importance, emotion_v, emotion_a, emotion_d
       FROM episodes
       WHERE room_id = ? AND npc_id = ? AND importance >= ?
       ORDER BY timestamp DESC
       LIMIT ?`,
    )
    .bind(roomId, npcId, minImportance, limit)
    .all<Record<string, unknown>>();

  return results.map(rowToEpisode);
}

/**
 * Semantic recall: embed query → Vectorize search → hydrate from D1.
 */
export async function semanticRecall(
  db: D1Database,
  vectorize: VectorizeIndex,
  ai: AiBinding,
  query: string,
  roomId: string,
  npcId: string,
  topK = 3,
): Promise<EpisodeRecord[]> {
  const embedding = await embed(ai, query);

  const { matches } = await vectorize.query(embedding, {
    topK: topK * 2, // over-fetch for filtering
    returnMetadata: 'all',
    filter: { room_id: roomId, npc_id: npcId },
  });

  if (matches.length === 0) return [];

  const ids = matches.map((m) => m.id).slice(0, topK);

  // Hydrate from D1
  const placeholders = ids.map(() => '?').join(',');
  const { results } = await db
    .prepare(
      `SELECT id, room_id, npc_id, timestamp, source_entity, context, importance, emotion_v, emotion_a, emotion_d
       FROM episodes WHERE id IN (${placeholders})`,
    )
    .bind(...ids)
    .all<Record<string, unknown>>();

  // Preserve Vectorize ranking
  const idOrder = new Map(ids.map((id, i) => [id, i]));
  return results.map(rowToEpisode).sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));
}

/**
 * Get reflections for a room + NPC.
 */
export async function getReflections(
  db: D1Database,
  roomId: string,
  npcId: string,
  limit = 3,
): Promise<{ id: string; content: string; timestamp: number; triggerType: string }[]> {
  const { results } = await db
    .prepare(
      `SELECT id, content, timestamp, trigger_type
       FROM reflections
       WHERE room_id = ? AND npc_id = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
    )
    .bind(roomId, npcId, limit)
    .all<Record<string, unknown>>();

  return results.map((r) => ({
    id: r.id as string,
    content: r.content as string,
    timestamp: r.timestamp as number,
    triggerType: (r.trigger_type as string) ?? '',
  }));
}

// ---- Recall + format for prompt injection ----

/**
 * Recall episodic + semantic memories and format as a text block for the LLM prompt.
 */
export async function recallAndFormat(
  db: D1Database,
  vectorize: VectorizeIndex | null,
  ai: AiBinding | null,
  roomId: string,
  npcId: string,
  queryText: string,
): Promise<string> {
  const parts: string[] = [];

  // Episodic recall (always available via D1)
  const episodic = await recall(db, roomId, npcId, 5).catch(() => [] as EpisodeRecord[]);

  if (episodic.length > 0) {
    parts.push('Recent conversations:');
    for (const ep of episodic) {
      parts.push(
        `- [${new Date(ep.timestamp).toISOString()}] ${ep.sourceEntity ?? 'unknown'}: ${ep.context} (V:${ep.emotionV.toFixed(2)} A:${ep.emotionA.toFixed(2)} importance:${ep.importance.toFixed(2)})`,
      );
    }
  }

  // Semantic recall (requires Vectorize + AI)
  if (vectorize && ai) {
    const semantic = await semanticRecall(db, vectorize, ai, queryText, roomId, npcId, 3).catch(
      () => [] as EpisodeRecord[],
    );
    const episodicIds = new Set(episodic.map((e) => e.id));
    const unique = semantic.filter((e) => !episodicIds.has(e.id));

    if (unique.length > 0) {
      if (parts.length > 0) parts.push('');
      parts.push('Related past experiences:');
      for (const ep of unique) {
        parts.push(
          `- [${new Date(ep.timestamp).toISOString()}] ${ep.sourceEntity ?? 'unknown'}: ${ep.context} (importance:${ep.importance.toFixed(2)})`,
        );
      }
    }
  }

  // Reflections
  const reflections = await getReflections(db, roomId, npcId, 3).catch(() => []);
  if (reflections.length > 0) {
    if (parts.length > 0) parts.push('');
    parts.push('Your recent self-reflections:');
    for (const ref of reflections) {
      parts.push(`- ${ref.content}`);
    }
  }

  return parts.join('\n');
}

// ---- Helpers ----

async function embed(ai: AiBinding, text: string): Promise<number[]> {
  const result = await ai.run(EMBEDDING_MODEL, { text: [text] });
  return result.data[0];
}

function rowToEpisode(row: Record<string, unknown>): EpisodeRecord {
  return {
    id: row.id as string,
    roomId: row.room_id as string,
    npcId: row.npc_id as string,
    timestamp: row.timestamp as number,
    sourceEntity: (row.source_entity as string) ?? undefined,
    context: (row.context as string) ?? '',
    importance: row.importance as number,
    emotionV: row.emotion_v as number,
    emotionA: row.emotion_a as number,
    emotionD: row.emotion_d as number,
  };
}
