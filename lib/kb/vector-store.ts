import * as fs from 'fs';
import * as path from 'path';
import type { KBIndex, KBSearchResult } from './types';

/** In-memory cache of loaded indices */
const indexCache = new Map<string, KBIndex>();

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Load index from JSON file, with in-memory caching */
export function loadIndex(storySlug: string): KBIndex | null {
  const cached = indexCache.get(storySlug);
  if (cached) return cached;

  const filePath = path.join(process.cwd(), 'data', 'kb', `${storySlug}-vectors.json`);
  if (!fs.existsSync(filePath)) return null;

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as KBIndex;
  indexCache.set(storySlug, data);
  return data;
}

/** Search for top-k most similar chunks */
export function search(
  index: KBIndex,
  queryEmbedding: number[],
  topK: number = 3,
): KBSearchResult[] {
  const scored = index.chunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/** Format search results for LLM prompt injection */
export function formatForPrompt(results: KBSearchResult[]): string {
  if (results.length === 0) return '';

  return results
    .map((r, i) => {
      const ep = r.chunk.episodeNum > 0 ? `${r.chunk.episodeNum}화` : '';
      const header = [ep, r.chunk.sceneRange].filter(Boolean).join(' ');
      return `[${i + 1}] ${header}\n${r.chunk.text}`;
    })
    .join('\n\n');
}
