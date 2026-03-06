# saeksi-io Production-Grade Refactor Plan

## Current State Analysis

### What Exists
- **Framework**: Next.js 15 (App Router, Turbopack) + Cloudflare Workers via OpenNext
- **UI**: Tailwind CSS 4 + shadcn/ui (new-york, zinc) + Lucide icons
- **Design Tokens**: Comprehensive CSS custom properties in `app/globals.css` (colors, spacing, typography, shadows, z-index, animation)
- **AI**: AI SDK (`ai`, `@ai-sdk/openai`) + `@molroo-io/sdk/world`
- **Auth**: Better Auth
- **Validation**: Zod (v4) for env + types in `lib/types.ts`
- **Storage**: Cloudflare KV (`ROOM_KV`)
- **TypeScript**: strict mode enabled

### What's Missing
- **ESLint**: None (ref: `apps/katalk-persona/eslint.config.js` exists as template)
- **Prettier**: None
- **Test Framework**: None (no vitest/jest config, no test files)
- **Component Tests**: Zero coverage
- **Architecture**: Flat `lib/` with 25 files, mixed server/client concerns
- **Mock Data**: Hardcoded in components (`Landing.tsx:16-145`)

---

## Requirements Summary

프로덕션급 코드 품질을 확보하면서 MVP 심플함을 유지:
1. ESLint + Prettier로 코드 일관성 강제
2. Vitest + Testing Library로 TDD 기반 개발 환경
3. 아키텍처 정리 (관심사 분리, 복잡도 관리)
4. Design System 정리 (shadcn + Tailwind 토큰 통합)
5. 유지보수성 향상 (타입 안전성, 모듈화)

---

## Phase 1: Tooling Foundation (ESLint + Prettier)

### Task 1.1: ESLint Flat Config 설정
- **File**: `eslint.config.mjs` (신규)
- **Base**: `katalk-persona/eslint.config.js` 참고하되 Next.js용으로 조정
- **Packages**: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `@next/eslint-plugin-next`, `eslint-plugin-import-x`
- **Rules**:
  - `complexity: ['error', { max: 10 }]` — 순환 복잡도 제한
  - `max-depth: ['error', { max: 4 }]`
  - `max-lines-per-function: ['warn', { max: 60 }]` (tsx: 100)
  - `max-params: ['warn', { max: 4 }]`
  - `no-console: ['warn', { allow: ['warn', 'error'] }]`
  - `@typescript-eslint/no-unused-vars: ['error', { argsIgnorePattern: '^_' }]`
  - `@typescript-eslint/no-explicit-any: 'error'`
  - `import-x/order` — import 순서 강제
- **Ignores**: `node_modules`, `.next`, `.open-next`, `components/ui` (shadcn generated)
- **Acceptance Criteria**: `npx eslint .` 실행 시 설정 파일 파싱 성공

### Task 1.2: Prettier 설정
- **File**: `.prettierrc.json` (신규)
- **Config**:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "trailingComma": "all",
    "printWidth": 100,
    "tabWidth": 2,
    "plugins": ["prettier-plugin-tailwindcss"]
  }
  ```
- **File**: `.prettierignore` (신규) — `node_modules`, `.next`, `.open-next`, `components/ui`
- **Packages**: `prettier`, `prettier-plugin-tailwindcss`, `eslint-config-prettier`
- **Acceptance Criteria**: `npx prettier --check .` 실행 가능

### Task 1.3: package.json scripts 추가
```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "typecheck": "tsc --noEmit"
}
```
- **Acceptance Criteria**: `npm run lint`, `npm run format:check`, `npm run typecheck` 모두 실행 가능

---

## Phase 2: Testing Infrastructure (Vitest + TDD)

### Task 2.1: Vitest 설정
- **File**: `vitest.config.ts` (신규)
- **Packages**: `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- **Config**:
  - `environment: 'jsdom'` (component tests)
  - `globals: true`
  - Path aliases: `@/` → `./*`
  - Coverage: `provider: 'v8'`, `include: ['lib/**', 'components/**', 'hooks/**']`
  - `setupFiles: ['./vitest.setup.ts']`
- **File**: `vitest.setup.ts` — `@testing-library/jest-dom` matchers import
- **Acceptance Criteria**: `npx vitest run` 실행 시 0 test suites, 0 failures

### Task 2.2: 핵심 lib 유닛 테스트 (TDD 시작점)
테스트 가능한 순수 함수부터 시작:

| Test File | Target | Tests |
|-----------|--------|-------|
| `lib/__tests__/emotion.test.ts` | `lib/emotion.ts` | `resolveEmotionLabel()` — 정상 키, 대소문자, 공백 포함, 미등록 키 |
| `lib/__tests__/sanitize.test.ts` | `lib/sanitize.ts` | XSS 방어, 빈 문자열, 특수문자 |
| `lib/__tests__/types.test.ts` | `lib/types.ts` | `getEnv()` — 유효 env, 누락 env 에러, 기본값 |
| `lib/__tests__/rate-limit.test.ts` | `lib/rate-limit.ts` | 제한 초과, 윈도우 리셋 |
| `lib/__tests__/character-stats.test.ts` | `lib/character-stats.ts` | 통계 조회/업데이트 |

- **Acceptance Criteria**: 최소 15개 테스트 케이스, 모두 PASS
- **package.json**: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:coverage": "vitest run --coverage"`

### Task 2.3: Component 테스트 기반
- `components/__tests__/CharacterCard.test.tsx` — 렌더링, props 전달, 링크 href
- `components/__tests__/BottomNav.test.tsx` — 활성 탭 표시, 게임 중 숨김
- **Acceptance Criteria**: 컴포넌트 테스트 최소 5개 PASS

---

## Phase 3: Architecture Refactor (관심사 분리)

### Task 3.1: lib/ 디렉토리 구조화
현재 flat한 25개 파일을 도메인별로 정리:

```
lib/
  ai/              # LLM, 감정엔진, 내레이터
    llm.ts          ← lib/llm.ts
    emotion.ts      ← lib/emotion.ts
    emotion-color.ts ← lib/emotion-color.ts
    appraisal.ts    ← lib/appraisal.ts
    narrator.ts     ← lib/narrator.ts
    memory.ts       ← lib/memory.ts
  room/            # 룸 시스템
    types.ts        ← lib/room.ts (타입만)
    room-store.ts   ← lib/room-store.ts
  auth/            # 인증
    auth.ts         ← lib/auth.ts
    auth-client.ts  ← lib/auth-client.ts
    session.ts      ← lib/session.ts
  infra/           # 인프라/유틸
    kv.ts           ← lib/kv.ts
    rate-limit.ts   ← lib/rate-limit.ts
    fetch-utils.ts  ← lib/fetch-utils.ts
    api-utils.ts    ← lib/api-utils.ts
    debug.ts        ← lib/debug.ts
  content/         # 콘텐츠/스토리
    story-pack.ts   ← lib/story-pack.ts
    personas.ts     ← lib/personas.ts
    character-stats.ts ← lib/character-stats.ts
  env.ts           ← lib/types.ts (getEnv + Env 타입)
  types.ts         ← lib/types.ts (도메인 타입: UserCharacter, UserWorld 등)
  utils.ts         ← lib/utils.ts (cn 등 유틸)
  colors.ts        ← lib/colors.ts
  sanitize.ts      ← lib/sanitize.ts
  api-client.ts    ← lib/api-client.ts (클라이언트)
  api-client-room.ts ← lib/api-client-room.ts
```

- **방법**: barrel export (`index.ts`)로 기존 import 호환성 유지
- **Acceptance Criteria**: `npm run typecheck` PASS, 기존 import 모두 동작

### Task 3.2: Mock 데이터 분리
- `Landing.tsx`의 `MOCK_CONTENTS` (130줄) → `data/mock-contents.ts`로 이동
- 컴포넌트는 props로만 데이터 수신
- **Acceptance Criteria**: Landing 컴포넌트에 하드코딩된 데이터 0개

### Task 3.3: 컴포넌트 복잡도 분해
현재 `Landing.tsx` (468줄)에 4개 컴포넌트가 한 파일에 있음:
- `HeroBanner` → `components/landing/HeroBanner.tsx`
- `ContentSection` → `components/landing/ContentSection.tsx`
- `ContentCard` → `components/landing/ContentCard.tsx`
- `Landing` → `components/landing/Landing.tsx` (조합만)

같은 패턴 적용:
- `RankingPage.tsx` (258줄) — 랭킹 아이템 렌더링 분리
- **Acceptance Criteria**: 모든 컴포넌트 파일 100줄 이하 (TSX 기준), ESLint complexity 통과

---

## Phase 4: Design System 정리

### Task 4.1: Tailwind 커스텀 유틸리티 정리
`globals.css`의 `@layer utilities` 섹션 (155줄)에서:
- Tailwind v4 내장 기능과 중복되는 것 제거 (`line-clamp-*`, `aspect-*`)
- 나머지 커스텀 유틸리티는 유지 (animation, glass, gradient 등)
- **Acceptance Criteria**: 중복 유틸리티 제거, 기존 사용처 모두 동작

### Task 4.2: CSS Variable → Tailwind Theme 통합
현재 `:root`에 커스텀 프로퍼티 + `@theme inline`에 shadcn 토큰이 분리됨:
- `@theme inline` 블록에 Novel 커스텀 토큰도 통합
- Tailwind 클래스로 직접 사용 가능하게 (`bg-surface`, `text-text-secondary` 등)
- 인라인 `style={{}}` 사용 최소화
- **Acceptance Criteria**: `var(--color-surface)` → `bg-surface` 같은 Tailwind 클래스로 대체 가능

### Task 4.3: shadcn 컴포넌트 활용도 검증
현재 shadcn/ui 설치되어 있으나 활용이 부족:
- `components/ui/` 에 있는 컴포넌트 목록 확인
- 커스텀 버튼/인풋 → shadcn Button/Input으로 통일
- **Acceptance Criteria**: 일관된 컴포넌트 사용 패턴

---

## Phase 5: CI-Ready Scripts & Pre-commit

### Task 5.1: package.json 통합 스크립트
```json
{
  "check": "npm run typecheck && npm run lint && npm run format:check && npm run test"
}
```

### Task 5.2: (Optional) lint-staged + husky
- `lint-staged`: `*.{ts,tsx}` → `eslint --fix`, `prettier --write`
- 커밋 전 자동 검사
- **Acceptance Criteria**: `git commit` 시 lint-staged 실행

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| lib/ 리팩토링 시 import 경로 깨짐 | 빌드 실패 | barrel export + tsconfig paths 활용, `typecheck` 반복 검증 |
| ESLint 규칙 적용 시 대량 에러 | 개발 블로킹 | Phase 1에서 `--fix`로 자동 수정 가능한 것 먼저 처리, 나머지 warn |
| Tailwind v4 + shadcn 토큰 충돌 | 스타일 깨짐 | 토큰 통합 전후 시각적 비교 (dev server) |
| Vitest + Next.js App Router 호환성 | 테스트 실행 실패 | 순수 함수 테스트 먼저, RSC 컴포넌트는 별도 환경 |

---

## Verification Steps

1. `npm run typecheck` — 0 errors
2. `npm run lint` — 0 errors (warnings OK for Phase 1)
3. `npm run format:check` — 0 formatting issues
4. `npm run test` — all tests PASS
5. `npm run dev` — dev server 정상 기동
6. `npm run build` — production build 성공
7. 각 Phase 완료 시 위 6개 모두 통과 확인

---

## Execution Order

```
Phase 1 (Tooling)  ──→  Phase 2 (Testing)  ──→  Phase 3 (Architecture)
                                                       ↓
                                              Phase 4 (Design System)
                                                       ↓
                                              Phase 5 (CI Scripts)
```

Phase 1-2는 기존 코드 변경 없이 추가만. Phase 3-4에서 리팩토링 시작.
각 Phase는 독립적으로 커밋 가능한 단위.

---

## Acceptance Criteria Summary

- [ ] ESLint flat config 작동 (`eslint.config.mjs`)
- [ ] Prettier 설정 작동 (`.prettierrc.json`)
- [ ] `npm run lint` / `npm run format:check` / `npm run typecheck` 모두 실행 가능
- [ ] Vitest 설정 완료 (`vitest.config.ts`)
- [ ] 최소 20개 테스트 (lib 15 + component 5) 모두 PASS
- [ ] lib/ 도메인별 디렉토리 구조 정리 완료
- [ ] 모든 컴포넌트 파일 100줄 이하
- [ ] Mock 데이터 컴포넌트에서 분리
- [ ] CSS 토큰 중복 제거 및 Tailwind theme 통합
- [ ] `npm run build` 성공
