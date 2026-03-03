import { toNextJsHandler } from 'better-auth/next-js';
import { createAuth } from '@/lib/auth';

async function getAuth() {
  const { getCloudflareContext } = await import('@opennextjs/cloudflare');
  const ctx = await getCloudflareContext({ async: true });
  const db = (ctx.env as CloudflareEnv).AUTH_DB;
  if (!db) {
    throw new Error('AUTH_DB binding not available');
  }
  return createAuth(db);
}

export const { GET, POST } = (() => {
  // In CF Workers, we need per-request auth instance
  // Wrap toNextJsHandler to create fresh auth each request
  const handler = async (request: Request) => {
    const auth = await getAuth();
    const { GET: get, POST: post } = toNextJsHandler(auth);
    const method = request.method.toUpperCase();
    if (method === 'GET') return get(request);
    return post(request);
  };

  return { GET: handler, POST: handler };
})();
