/**
 * Shared KV access layer — Cloudflare KV with in-memory fallback for local dev.
 */

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
