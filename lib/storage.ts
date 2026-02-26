/**
 * Key-value storage abstraction.
 * Local: in-memory Map (globalThis persistent across hot reloads)
 * Production (Cloudflare): swap to KVStorage
 */

export interface KVStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

// ---- In-memory implementation (local dev) ----

class MemoryStore implements KVStore {
  private map: Map<string, string>;

  constructor() {
    this.map = (globalThis as any).__novelGameStore ??= new Map<string, string>();
  }

  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }
}

// ---- Cloudflare KV implementation (production) ----
// Uncomment and configure when deploying to Cloudflare Workers.
//
// class CloudflareKVStore implements KVStore {
//   private kv: KVNamespace;
//
//   constructor(kv: KVNamespace) {
//     this.kv = kv;
//   }
//
//   async get(key: string): Promise<string | null> {
//     return this.kv.get(key);
//   }
//
//   async set(key: string, value: string): Promise<void> {
//     await this.kv.put(key, value);
//   }
//
//   async delete(key: string): Promise<void> {
//     await this.kv.delete(key);
//   }
// }

// ---- Factory ----

let _store: KVStore | null = null;

export function getStore(): KVStore {
  if (!_store) {
    _store = new MemoryStore();
  }
  return _store;
}

/** Override the default store (e.g. for Cloudflare KV injection) */
export function setStore(store: KVStore): void {
  _store = store;
}
