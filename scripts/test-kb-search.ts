import { searchKB } from '../lib/kb';

async function main() {
  const apiKey = (process.env.EMBEDDING_API_KEY || process.env.LLM_API_KEY)!;
  const baseURL = process.env.EMBEDDING_BASE_URL || 'https://openrouter.ai/api/v1';
  const query = process.argv[2] || '정숙이 화내는 장면';

  console.log(`Query: "${query}"\n`);
  const result = await searchKB('motchama', query, apiKey, 3, baseURL);
  console.log(result || '(no results)');
}

main().catch(console.error);
