import { createOpenAI } from '@ai-sdk/openai';
import { embed, embedMany } from 'ai';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 50;

function createEmbeddingModel(apiKey: string, baseURL?: string) {
  const provider = createOpenAI({
    apiKey,
    baseURL: baseURL ?? 'https://openrouter.ai/api/v1',
  });
  return provider.textEmbeddingModel(EMBEDDING_MODEL);
}

/** Embed a single query text */
export async function embedQuery(text: string, apiKey: string, baseURL?: string): Promise<number[]> {
  const model = createEmbeddingModel(apiKey, baseURL);
  const { embedding } = await embed({ model, value: text });
  return embedding;
}

/** Embed multiple texts in batches with rate limit handling */
export async function embedBatch(
  texts: string[],
  apiKey: string,
  baseURL?: string,
  onProgress?: (done: number, total: number) => void,
): Promise<number[][]> {
  const model = createEmbeddingModel(apiKey, baseURL);
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const { embeddings } = await embedMany({ model, values: batch });
    results.push(...embeddings);
    onProgress?.(Math.min(i + BATCH_SIZE, texts.length), texts.length);

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return results;
}
