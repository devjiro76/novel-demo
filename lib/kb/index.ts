import { embedQuery } from './embeddings';
import { loadIndex, search, formatForPrompt } from './vector-store';

/**
 * Search the knowledge base for relevant chunks.
 * Returns a formatted string ready for prompt injection, or empty string if no KB available.
 */
export async function searchKB(
  storySlug: string,
  queryText: string,
  apiKey: string,
  topK: number = 3,
  baseURL?: string,
): Promise<string> {
  const index = loadIndex(storySlug);
  if (!index) return '';

  const queryEmbedding = await embedQuery(queryText, apiKey, baseURL);
  const results = search(index, queryEmbedding, topK);
  return formatForPrompt(results);
}

export type { KBChunk, KBIndex, KBSearchResult } from './types';
