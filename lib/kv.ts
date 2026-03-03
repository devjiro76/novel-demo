/**
 * Shared KV access layer — Cloudflare KV with in-memory fallback for local dev.
 */

let _kvCache: KVNamespace | null | undefined;

async function getKV(): Promise<KVNamespace | null> {
  if (_kvCache !== undefined) return _kvCache;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = await Promise.race([
      getCloudflareContext({ async: true }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 500)),
    ]);
    _kvCache = (ctx.env as CloudflareEnv).ROOM_KV ?? null;
  } catch {
    _kvCache = null;
  }
  return _kvCache ?? null;
}

const memStore = new Map<string, string>();

export async function kvGet(key: string): Promise<string | null> {
  const kv = await getKV();
  if (kv) return kv.get(key);
  return memStore.get(key) ?? null;
}

export async function kvPut(
  key: string,
  value: string,
  opts?: { expirationTtl?: number },
): Promise<void> {
  const kv = await getKV();
  if (kv) return kv.put(key, value, opts);
  memStore.set(key, value);
}

export async function kvDelete(key: string): Promise<void> {
  const kv = await getKV();
  if (kv) return kv.delete(key);
  memStore.delete(key);
}
