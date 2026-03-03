/// <reference types="@cloudflare/workers-types" />

// Extend CloudflareEnv with our custom bindings
interface CloudflareEnv {
  ROOM_KV: KVNamespace;
  AUTH_DB: D1Database;
}
