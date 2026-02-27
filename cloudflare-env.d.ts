/// <reference types="@cloudflare/workers-types" />

// Extend CloudflareEnv with our custom KV binding
interface CloudflareEnv {
  ROOM_KV?: KVNamespace;
}
