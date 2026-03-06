import { NextResponse } from 'next/server';
import { createAuth } from '@/lib/auth';
import { formatError } from '@/lib/api-utils';

/**
 * 임시 마이그레이션 엔드포인트 — 배포 후 1회 호출하여 DB 테이블 생성
 * POST /api/auth/migrate
 */
export async function POST(request: Request) {
  try {
    // 시크릿 보호 — Authorization 헤더로 BETTER_AUTH_SECRET 필요
    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret || authHeader !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const db = (ctx.env as CloudflareEnv).AUTH_DB;
    if (!db) {
      return NextResponse.json({ error: 'AUTH_DB not available' }, { status: 500 });
    }

    const auth = createAuth(db);

    // BetterAuth의 마이그레이션 실행
    // @ts-expect-error - internal API for migration
    if (typeof auth.api?.['migrate'] === 'function') {
      // @ts-expect-error -- internal migration API not in public types
      await auth.api.migrate();
    } else {
      // Fallback: 직접 테이블 생성
      const statements = [
        `CREATE TABLE IF NOT EXISTS "user" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL UNIQUE,
          "emailVerified" INTEGER NOT NULL DEFAULT 0,
          "image" TEXT,
          "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
          "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS "session" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "expiresAt" TEXT NOT NULL,
          "token" TEXT NOT NULL UNIQUE,
          "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
          "updatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "userId" TEXT NOT NULL REFERENCES "user"("id")
        )`,
        `CREATE TABLE IF NOT EXISTS "account" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "accountId" TEXT NOT NULL,
          "providerId" TEXT NOT NULL,
          "userId" TEXT NOT NULL REFERENCES "user"("id"),
          "accessToken" TEXT,
          "refreshToken" TEXT,
          "idToken" TEXT,
          "accessTokenExpiresAt" TEXT,
          "refreshTokenExpiresAt" TEXT,
          "scope" TEXT,
          "password" TEXT,
          "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
          "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS "verification" (
          "id" TEXT PRIMARY KEY NOT NULL,
          "identifier" TEXT NOT NULL,
          "value" TEXT NOT NULL,
          "expiresAt" TEXT NOT NULL,
          "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
          "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
      ];

      for (const sql of statements) {
        await db.prepare(sql).run();
      }
    }

    return NextResponse.json({ ok: true, message: 'Migration completed' });
  } catch (err) {
    console.error('[auth/migrate] Error:', err);
    return NextResponse.json({ error: formatError(err) }, { status: 500 });
  }
}
