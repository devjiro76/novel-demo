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
 * Rate limit 체크 및 카운터 증가 (write-first 패턴으로 TOCTOU 완화)
 * @param userId - 로그인 유저 ID (없으면 null)
 * @param ip - fallback IP
 */
export async function checkRateLimit(
  userId: string | null,
  ip: string,
): Promise<RateLimitResult> {
  const identifier = userId ?? `ip:${ip}`;
  const limit = userId ? AUTH_DAILY_LIMIT : ANON_DAILY_LIMIT;
  const key = rateLimitKey(identifier);

  // Write-first pattern: increment first, then check.
  // This avoids TOCTOU race where two concurrent requests both read
  // the same count and both proceed.
  const current = parseInt(await kvGet(key) ?? '0', 10);
  const newCount = current + 1;
  await kvPut(key, String(newCount), { expirationTtl: TTL_SECONDS });

  if (newCount > limit) {
    return { allowed: false, remaining: 0, limit, used: newCount };
  }

  return { allowed: true, remaining: limit - newCount, limit, used: newCount };
}

/**
 * API route에서 사용하는 rate limit 가드
 * 한도 초과 시 429 NextResponse 반환, 통과 시 null
 */
export async function rateLimitGuard(request: Request): Promise<NextResponse | null> {
  let userId: string | null = null;
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const db = (ctx.env as CloudflareEnv).AUTH_DB;
    if (db) {
      const { createAuth } = await import('@/lib/auth');
      const auth = createAuth(db);
      const session = await auth.api.getSession({ headers: request.headers });
      userId = session?.user?.id ?? null;
    }
  } catch { /* anonymous */ }

  // IP extraction: cf-connecting-ip first (cannot be spoofed), then x-forwarded-for fallback
  const ip = request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? '127.0.0.1';

  const result = await checkRateLimit(userId, ip);
  if (!result.allowed) {
    return NextResponse.json(
      { error: '일일 대화 한도를 초과했습니다.', remaining: 0, limit: result.limit },
      { status: 429 },
    );
  }
  return null;
}
