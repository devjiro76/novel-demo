# Novel - Interactive Novel with AI Emotion Engine

AI 기반 인터랙티브 노벨 앱. 룸에서 NPC와 대화하며 스토리를 진행한다.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **UI**: Tailwind CSS 4 + shadcn/ui (new-york style, zinc base) + Lucide icons
- **AI**: AI SDK (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`) + `@molroo-io/sdk/world`
- **Deploy**: Cloudflare Workers via OpenNext (`opennextjs-cloudflare`)
- **Storage**: Cloudflare KV (`ROOM_KV`)
- **Domain**: novel.molroo.io

## Project Structure

```
app/                    # Next.js App Router
  api/                  # API routes
    game/start/         # 게임 시작
    room/               # 룸 CRUD, join, invite, kick, message
    turn/converse/      # NPC 대화 턴
  [slug]/page.tsx       # 스토리별 페이지
  page.tsx              # 스토리 선택 화면
components/
  chat/                 # 채팅 UI 컴포넌트
  ui/                   # shadcn/ui 컴포넌트
  GameClient.tsx        # 메인 게임 클라이언트
  StorySelector.tsx     # 스토리 선택
  RoleSelectScreen.tsx  # 역할 선택
data/
  personas.json         # NPC 페르소나 정의
  actions.json          # 행동 정의
  story-bible.md        # 스토리 설정
lib/
  llm.ts                # LLM 호출 래퍼
  emotion.ts            # 감정 엔진
  memory.ts             # 메모리 시스템
  room.ts / room-store.ts  # 룸 관리
  narrator.ts           # 내레이터
  session.ts            # 세션 관리
  story-pack.ts         # 스토리 팩 로더
  api-client.ts         # 클라이언트 API 호출
hooks/                  # React hooks
stories/                # 스토리 데이터
```

## Commands

```bash
npm run dev          # 개발 서버 (Turbopack)
npm run build        # Next.js 빌드
npm run build:cf     # Cloudflare 빌드
npm run deploy       # Cloudflare 배포
npm run preview      # 로컬 Cloudflare 미리보기
```

## Conventions

- 한국어 UI (lang="ko")
- shadcn/ui 컴포넌트는 `components/ui/`에 위치
- API route는 `app/api/` 하위에 REST 구조
- 환경변수는 `.env.local` (로컬) 또는 `wrangler.jsonc` vars (Cloudflare)
- Path alias: `@/` → 프로젝트 루트
- `.env.local`, `.dev.vars`는 커밋하지 않음
