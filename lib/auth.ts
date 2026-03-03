import { betterAuth } from 'better-auth';
import { D1Dialect } from 'kysely-d1';

/**
 * Per-request BetterAuth 인스턴스 팩토리 (kv.ts 패턴 참고)
 * CF Workers에서는 request마다 D1 바인딩이 달라지므로 매번 생성
 */
export function createAuth(db: D1Database) {
  return betterAuth({
    database: {
      dialect: new D1Dialect({ database: db }),
      type: 'sqlite',
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
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
