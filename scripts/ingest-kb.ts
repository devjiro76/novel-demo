import * as fs from 'fs';
import * as path from 'path';
import { chunkStory } from '../lib/kb/chunker';
import { embedBatch } from '../lib/kb/embeddings';
import type { KBIndex } from '../lib/kb/types';

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: npx tsx scripts/ingest-kb.ts <story-slug>');
    process.exit(1);
  }

  const apiKey = process.env.EMBEDDING_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) {
    console.error('EMBEDDING_API_KEY or LLM_API_KEY environment variable required');
    process.exit(1);
  }
  const baseURL = process.env.EMBEDDING_BASE_URL || 'https://openrouter.ai/api/v1';

  console.log(`\n=== Ingesting KB for "${slug}" ===\n`);

  // 1. Chunk all docx files
  const chunks = await chunkStory(slug);
  if (chunks.length === 0) {
    console.error('No chunks generated. Check that docx files exist and contain #N scene markers.');
    process.exit(1);
  }

  // 2. Generate embeddings
  console.log(`\nGenerating embeddings for ${chunks.length} chunks...`);
  const texts = chunks.map((c) => c.text);
  const embeddings = await embedBatch(texts, apiKey, baseURL, (done, total) => {
    console.log(`  ${done}/${total} embeddings done`);
  });

  // 3. Build index
  const index: KBIndex = {
    storySlug: slug,
    model: 'text-embedding-3-small',
    dimensions: embeddings[0]?.length ?? 1536,
    chunks: chunks.map((c, i) => ({
      ...c,
      embedding: embeddings[i],
    })),
    createdAt: new Date().toISOString(),
  };

  // 4. Save to file
  const outDir = path.join(process.cwd(), 'data', 'kb');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug}-vectors.json`);
  fs.writeFileSync(outPath, JSON.stringify(index));

  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  console.log(`\nSaved to ${outPath} (${sizeMB} MB)`);
  console.log(`  ${index.chunks.length} chunks, ${index.dimensions} dimensions`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
