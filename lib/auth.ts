import { betterAuth } from 'better-auth';
import { D1Dialect } from 'kysely-d1';

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required');
}

/**
 * Per-request BetterAuth 인스턴스 팩토리 (kv.ts 패턴 참고)
 * CF Workers에서는 request마다 D1 바인딩이 달라지므로 매번 생성
 */
export function createAuth(db: D1Database) {
  const isProduction = process.env.NODE_ENV === 'production';

  return betterAuth({
    database: {
      dialect: new D1Dialect({ database: db }),
      type: 'sqlite',
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 24 hours
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    rateLimit: {
      window: 60,
      max: 10,
    },
    advanced: {
      cookiePrefix: 'novel',
      useSecureCookies: isProduction,
    },
    // TODO: 소셜 로그인 (Google, Kakao)
    // socialProviders: {
    //   google: {
    //     clientId: process.env.GOOGLE_CLIENT_ID!,
    //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   },
    // },
  });
}

export type Auth = ReturnType<typeof createAuth>;
