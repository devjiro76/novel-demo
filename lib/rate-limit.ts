import { NextResponse } from 'next/server';
import { kvGet, kvPut } from './kv';

const ANON_DAILY_LIMIT = 5;
const AUTH_DAILY_LIMIT = 30;
const TTL_SECONDS = 86400; // 24h

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function rateLimitKey(identifier: string): string {
  return `ratelimit:${identifier}:${todayKey()}`;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
}

/**
 * Rate limit 체크 및 카운터 증가.
 * 주의: Cloudflare KV는 atomic increment를 지원하지 않으므로
 * 동시 요청 시 제한을 약간 초과할 수 있음 (best-effort).
 * 정확한 제한이 필요하면 Durable Objects 사용 권장.
 * @param userId - 로그인 유저 ID (없으면 null)
 * @param ip - fallback IP
 */
export async function checkRateLimit(userId: string | null, ip: string): Promise<RateLimitResult> {
  const identifier = userId ?? `ip:${ip}`;
  const limit = userId ? AUTH_DAILY_LIMIT : ANON_DAILY_LIMIT;
  const key = rateLimitKey(identifier);

  const current = parseInt((await kvGet(key)) ?? '0', 10);
  const newCount = current + 1;
  await kvPut(key, String(newCount), { expirationTtl: TTL_SECONDS });

  if (newCount > limit) {
    return { allowed: false, remaining: 0, limit, used: newCount };
  }

  return { allowed: true, remaining: limit - newCount, limit, used: newCount };
}

async function resolveUserId(request: Request): Promise<string | null> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const db = (ctx.env as CloudflareEnv).AUTH_DB;
    if (!db) return null;
    const { createAuth } = await import('@/lib/auth');
    const auth = createAuth(db);
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

function extractIp(request: Request): string {
  // cf-connecting-ip is set by Cloudflare and cannot be spoofed
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // x-forwarded-for is spoofable; only trust in development
  if (process.env.NODE_ENV !== 'production') {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  }

  return '0.0.0.0';
}

/**
 * API route에서 사용하는 rate limit 가드
 * 한도 초과 시 429 NextResponse 반환, 통과 시 null
 */
export async function rateLimitGuard(request: Request): Promise<NextResponse | null> {
  const userId = await resolveUserId(request);
  const ip = extractIp(request);
  const result = await checkRateLimit(userId, ip);
  if (!result.allowed) {
    return NextResponse.json(
      { error: '일일 대화 한도를 초과했습니다.', remaining: 0, limit: result.limit },
      { status: 429 },
    );
  }
  return null;
}
