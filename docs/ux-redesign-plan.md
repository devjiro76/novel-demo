# UX 동선 재설계 + SDK 가치 시각화

> 작성일: 2026-03-01
> 상태: 플랜 확정, 구현 대기

## 배경 및 문제점

### 현재 상태
- Novel 앱은 Molroo World SDK(Village, Persona, 감정엔진, 관계 어프레이절) 기반 인터랙티브 노벨
- "World-First" 재설계를 했으나, 실제로는 **예쁜 캐릭터 채팅앱에 관계도 SVG만 얹은 수준**
- SDK의 핵심 마법(감정 변화, 관계 진화, NPC 상호영향)이 UX에 전혀 드러나지 않음

### 핵심 문제 6가지

| # | 문제 | 현재 | 목표 |
|---|------|------|------|
| 1 | 진입 뎁스 | 4탭 (홈→WorldDetail→RoleSelect→채팅) | 1-2탭 |
| 2 | 단일 캐릭터 | 미지원 (모든 것이 "월드" 전제) | 단일/멀티 공존 |
| 3 | WorldWizard | SDK 무관 장식 데이터 (로어, 태그, 테마색) | SDK 핵심 입력 (Big5, 관계) |
| 4 | SDK 시각화 | 정적 이모지, 관계 변화 미표시 | 감정 글로우 + 관계 알림 |
| 5 | 뒤로가기 | 채팅→"상대 고르기" (의미없는 중간 단계) | 채팅→홈 |
| 6 | PC 반응형 | max-480px 고정 | 반응형 breakpoint |

### 팀 토론 결정 사항

4인 가상 팀(CEO/기획자/창의가/분석가) 토론 + 투표 결과:

| 항목 | 결정 | 투표 |
|------|------|------|
| 홈화면 | 캐릭터 중심 + 월드 그룹핑 | 3:1 |
| WorldDetail | 간소화 (관계도 제거, 캐릭터+CTA만) | 3:1 |
| 진입 동선 | **1탭 진입** | 4:0 |
| RoleSelect | **삭제** | 4:0 |
| WorldWizard | SDK 입력 중심 재설계 | 3:1 |
| SDK 시각화 | **아바타 글로우 + 관계 변화 알림** | 4:0 |

### BabeChat 벤치마크 (경쟁사 분석)

BabeChat.ai PC/모바일 분석 결과:
- **진입 뎁스**: 2탭 (카드 클릭 → 채팅)
- **홈 구성**: 가로 캐러셀 × 여러 섹션 (높은 콘텐츠 밀도)
- **카드 정보**: 이미지 + 플레이수 + 태그 + 설명
- **하단 탭**: 홈/채팅/생성/마이 (4탭)
- **PC**: 좌측 사이드바 + 넓은 그리드

**BabeChat에 없는 우리만의 무기:**
- 감정 엔진 (대화에 따라 감정 변화)
- 관계 동적 진화 (trust/strength)
- 멀티 NPC 월드 (한 세계에 여러 캐릭터)
- NPC 간 상호 영향

### Molroo World SDK 실제 사용 현황

SDK는 **감정 시뮬레이션 전용**으로만 사용 중:

| SDK 메서드 | 용도 | 현재 사용 |
|------------|------|----------|
| `World.createVillage()` | 월드 생성 | O |
| `village.addPersona()` | NPC 등록 | O |
| `village.setRelationship()` | 관계 시딩 | O |
| `persona.getPromptContext()` | 시스템 프롬프트 | O |
| `persona.getState()` | 감정 상태 읽기 | O |
| `persona.interact()` | **감정 업데이트** (핵심) | O |
| `persona.tick()` | 시간 경과 | O |
| `village.listRelationships()` | 관계 조회 | X (미사용) |
| `village.getEvents()` | 이벤트 조회 | X (미사용) |

**`persona.interact()` 반환값**: `{ emotion: { discrete: {primary, secondary}, vad: {V,A,D}, intensity } }`
→ 이 데이터가 UX에 이모지 하나로만 표시되고 있음. 글로우/알림으로 강화 필요.

---

## 아키텍처: 현재 vs 목표

### 현재 동선
```
홈(Landing)
  └─ WorldCard 클릭 → /world/{slug} (WorldDetail)
       └─ "세계 탐험하기" → /{slug} (GameClient)
            └─ title → loading → select → profile → roleSelect → chat
                                 (6단계)
```

### 목표 동선
```
홈(Landing)
  └─ CharacterCard 탭 → /{slug}?char={charId} (GameClient)
       └─ title → loading → chat
                  (3단계)

  └─ 월드 섹션 "더보기" → /world/{slug} (WorldDetail 간소화)
       └─ CharacterCard 탭 → /{slug}?char={charId}
```

### GameClient 상태머신 변경

```
현재 Phase:  title | loading | select | profile | roleSelect | chat
목표 Phase:  title | loading | select | chat

- profile: 삭제 (캐릭터 정보는 홈 카드에서 이미 봄)
- roleSelect: 삭제 (자동으로 playerDisplayName + playerCharacterId 사용)
- select: 조건부 유지 (char 미지정 + 멀티캐릭터일 때만)
```

---

## Phase 1: GameClient 상태머신 단순화 — 1탭 진입

### 변경 사항

**`components/GameClient.tsx`** (1029줄, 메인 게임 상태머신):

1. **Phase 타입 축소**
   ```typescript
   // 변경 전
   type Phase = 'title' | 'loading' | 'select' | 'profile' | 'roleSelect' | 'chat';
   // 변경 후
   type Phase = 'title' | 'loading' | 'select' | 'chat';
   ```

2. **`initialCharId` prop 추가**
   ```typescript
   interface GameClientProps {
     pack: ClientStoryPack;
     initialCharId?: string;  // URL ?char= 에서 전달
   }
   ```

3. **handleStart 통합** — startGame + createRoom을 한 번에
   ```
   현재: handleStart → title→loading→select→(유저 선택)→profile→roleSelect→(확인)→chat
   변경: handleStart(charId) → title→loading→chat (createRoom까지 자동)
   ```

4. **select 조건부**
   - `initialCharId` 있으면: select 건너뛰기 → 바로 title→loading→chat
   - `initialCharId` 없고 캐릭터 1명: 자동 선택 → title→loading→chat
   - `initialCharId` 없고 캐릭터 여러 명: select 표시 → 카드 탭 → 바로 createRoom→chat

5. **handleBack 변경**
   ```typescript
   // 변경 전: setPhase('select') or setPhase('title')
   // 변경 후:
   const handleBack = () => {
     router.push('/');  // 항상 홈으로
   };
   ```

6. **RoleSelect 관련 코드 제거**
   - `RoleSelectScreen` import 제거
   - `handleRoleConfirm` → `handleStartChat`으로 통합
   - 자동으로 `pack.playerDisplayName`, `pack.playerCharacterId` 사용

**`app/[slug]/page.tsx`**:
```typescript
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ char?: string }>;
}
// GameClient에 initialCharId={searchParams.char} 전달
```

### 영향받는 함수/코드 위치

- `GameClient.tsx:24` — Phase 타입 정의
- `GameClient.tsx:~400-450` — handleStart, handleSelect 함수
- `GameClient.tsx:~500-550` — handleRoleConfirm 함수 (삭제/통합)
- `GameClient.tsx:~600-650` — handleBack 함수
- `GameClient.tsx:960-1020` — 렌더 분기 (profile, roleSelect 케이스 제거)

---

## Phase 2: 홈 화면 — 캐릭터 중심 + 가로 캐러셀

### 와이어프레임

```
┌─────────────────────────────────────────┐
│ [N] Novel                    [🔍]       │ ← 심플 헤더
├─────────────────────────────────────────┤
│                                         │
│ 🌏 못참아                       5캐릭터 │ ← 월드 = 섹션 헤더
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│ │img │ │img │ │img │ │img │ │img │   │ ← 가로 스크롤
│ │정숙 │ │은혜 │ │미나 │ │정중 │ │덕희 │   │    CharacterCard
│ │엄마 │ │누나 │ │여친 │ │아빠 │ │주인공│  │
│ └────┘ └────┘ └────┘ └────┘ └────┘   │
│                                         │
│ 🌏 오빠 친구들                  4캐릭터 │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│ │img │ │img │ │img │ │img │          │
│ └────┘ └────┘ └────┘ └────┘          │
│                                         │
│ ✨ 커뮤니티 월드                        │
│ (유저 생성 월드 목록)                    │
│                                         │
├─────────────────────────────────────────┤
│ [홈]   [채팅]   [만들기]   [마이]       │ ← BottomNav (공통)
└─────────────────────────────────────────┘
```

### CharacterCard 컴포넌트 사양

```
┌──────────┐
│  (이미지)  │  width: 120px, aspect-ratio: 3/4
│           │  object-fit: cover, rounded-2xl
├──────────┤
│ 정숙      │  text-xs font-bold
│ 덕희의 엄마│  text-[10px] glow 색
│ 41세      │  text-[10px] dim
└──────────┘
  glow 테두리 (캐릭터 색상, 1px)
```

- **탭 동작**: `router.push('/{slug}?char={charId}')`
- 이미지 없으면: 이니셜 + glow 배경색
- 플레이어 캐릭터 제외 (NPC만 표시)

### 변경 사항

**NEW `components/CharacterCard.tsx`**:
- props: `{ char: CharacterMeta, slug: string, assetsBasePath: string }`
- 세로형 이미지 카드
- onClick → `/{slug}?char={char.id}`

**`components/Landing.tsx`** — 전면 재작성:
- Hero 섹션: 로고 + "감정과 기억을 가진 캐릭터들" 한 줄
- 각 월드(StoryManifest)가 1개 섹션 → 섹션 헤더(월드 이름) + CharacterCard 가로 스크롤
- HeroRelationGraph 제거
- WorldCard 사용 안함 → CharacterCard로 교체
- CommunityWorlds 섹션 유지 (하단)
- 검색바: 상단 아이콘 → 토글 인라인
- 탭 필터 유지

**`lib/story-pack.ts`**:
- `getAllWorldCards()` 유지 (WorldDetail 용)
- 각 WorldCardData의 characters에 `slug` 정보 포함되어 있음 (기존 구조 활용)

**`components/WorldCard.tsx`** — deprecated (import하는 곳 제거)

---

## Phase 3: WorldDetail 간소화

### 변경 사항

**현재 섹션**: 태그 + 제목 + 설명 + 캐릭터로스터(가로 스크롤 CharacterCard) + 관계도(SVG 320x320) + 세계관(lore) + CTA
**목표 섹션**: 태그 + 제목 + 설명 + **CharacterCard 그리드** + CTA

**`components/WorldDetail.tsx`**:

1. **삭제할 섹션**:
   - `RelationshipGraph` 컴포넌트 및 관계도 섹션 (lines 56-184, 362-397)
   - 세계관(lore) 섹션 (lines 399-417)
   - `npcRelationshipsFrom()`, `userWorldRelationships()` 헬퍼 (lines 232-255)

2. **변경할 섹션**:
   - 캐릭터 로스터: 기존 `CharacterCard` (로컬) → `CharacterCard` (공통 컴포넌트) 교체
   - 각 카드에 onClick → `/{slug}?char={charId}` (1탭 진입)
   - 하단 CTA: "세계 탐험하기" → "대화 시작하기"

---

## Phase 4: SDK 감정/관계 시각화 — 채팅 UX 핵심

### 4.1 아바타 감정 글로우

`persona.interact()` 결과: `{ emotion: { discrete: {primary: 'joy'}, intensity: 0.7 } }`

이 데이터로 아바타 주변 글로우를 실시간 변경:

| 감정 | 글로우 색 | CSS 효과 |
|------|----------|----------|
| joy (기쁨) | `#fbbf24` (warm gold) | 밝은 glow, 넓은 spread |
| sadness (슬픔) | `#60a5fa` (cool blue) | 어두운 glow, 좁은 spread |
| anger (분노) | `#ef4444` (hot red) | 강한 pulse animation |
| surprise (놀람) | `#facc15` (bright yellow) | flash transition |
| fear (두려움) | `#7c3aed` (dark violet) | 약한 흔들림 |
| disgust (혐오) | `#84cc16` (sickly green) | 낮은 opacity |
| neutral (기본) | 캐릭터 기본 glow | 정상 |

**NEW `lib/emotion-color.ts`**:
```typescript
export function emotionToGlow(emotion?: string, intensity?: number): { color: string; spread: number } {
  // 감정명 → { color, spread } 반환
  // intensity (0-1) → spread 크기 조절
}
```

**`components/chat/MessageBubble.tsx`** — `CharAvatar` 수정:
- `emotionDetail` prop에서 감정 읽기
- `box-shadow` → `emotionToGlow()` 결과로 동적 변경
- CSS `transition: box-shadow 0.5s ease` 으로 부드럽게

### 4.2 관계 변화 알림 (시스템 메시지)

**`app/api/room/[roomId]/message/route.ts`** 변경:
```
현재 flow:
  userMessage → appraisal → persona.interact() → emotion 반환

추가:
  persona.interact() 전: 현재 관계값 저장
  persona.interact() 후: 새 관계값 비교
  delta > 임계치(0.05): relationshipDelta를 응답에 포함
```

**`lib/room.ts`** — RoomMessage 타입 확장:
```typescript
interface RoomMessage {
  // ... 기존 필드
  relationshipDelta?: {
    npcName: string;
    trust: number;     // +/- delta
    strength: number;  // +/- delta
  };
}
```

**`components/chat/MessageBubble.tsx`** — 관계 알림 렌더:
- `relationshipDelta` 존재 + 임계치 초과 시 시스템 메시지 삽입
- 디자인: 중앙 정렬 pill, 하트 이모지, 캐릭터 glow 색

---

## Phase 5: WorldWizard SDK 입력 중심 재설계

### 현재 vs 변경

| 현재 | SDK 관련? | 변경 |
|------|-----------|------|
| Step 1: 이름, 설명, 로어, 태그, 테마색, 성인토글 | 테마색만 | Step 1: 상황 한 줄 + 성인토글 |
| Step 2: 캐릭터 (이름/역할/성격 텍스트/말투/glow) | 부분적 | Step 2: 이름/나이/역할 + **Big5 슬라이더** + 말투 프리셋 |
| Step 3: 관계 (유형/strength/trust) | **핵심** | Step 3: 관계 프리셋 + 슬라이더 (유지+개선) |
| Step 4: 리뷰 | - | **삭제** |

### Big5 성격 슬라이더 ↔ SDK 매핑

| 유저 라벨 | SDK 필드 | 슬라이더 |
|-----------|----------|----------|
| "내성적 ↔ 외향적" | Extraversion (E) | 0.0 ↔ 1.0 |
| "감정적 ↔ 이성적" | Neuroticism (N) | 1.0 ↔ 0.0 (역수) |
| "자유로운 ↔ 계획적" | Conscientiousness (C) | 0.0 ↔ 1.0 |
| "경쟁적 ↔ 협조적" | Agreeableness (A) | 0.0 ↔ 1.0 |
| "보수적 ↔ 개방적" | Openness (O) | 0.0 ↔ 1.0 |

### 관계 유형 프리셋

| 프리셋 | relationshipType | 기본 strength | 기본 trust |
|--------|-----------------|--------------|-----------|
| 연인 | lover | 0.9 | 0.8 |
| 친구 | friend | 0.7 | 0.7 |
| 라이벌 | rival | 0.6 | 0.3 |
| 가족 | family | 0.8 | 0.7 |
| 상사/부하 | hierarchy | 0.5 | 0.5 |
| 비밀 관계 | secret | 0.7 | 0.4 |

### 변경 사항

**`components/WorldWizard.tsx`** — 전면 재작성:
- Step 1: 상황 textarea + Switch(성인)
- Step 2: 캐릭터 카드 (이름/나이/역할 input + Big5 슬라이더 5개 + 말투 Select)
- Step 3: 관계 (프리셋 버튼 + strength/trust 슬라이더 + 그래프 프리뷰)
- 리뷰 단계 삭제 → Step 3에서 바로 "만들기" 버튼

---

## Phase 6: PC 반응형

### Breakpoint

| 범위 | 레이아웃 |
|------|----------|
| < 640px (모바일) | 현재와 동일, full width |
| 640-1024px (태블릿) | 중앙 정렬 max-w-xl, 카드 확대 |
| > 1024px (데스크탑) | 중앙 정렬 max-w-2xl, 2열 그리드 가능 |

### 변경 사항

**`components/GameClient.tsx`**:
- `max-w-[480px]` → `max-w-xl md:max-w-2xl`

**`components/Landing.tsx`**:
- 카드 크기: 모바일 w-28, md: w-36, lg: w-40
- 섹션 레이아웃: 모바일 가로 스크롤, lg: 그리드도 가능

---

## 실행 순서

| 우선순위 | Phase | 작업 | 수정 파일 |
|---------|-------|------|-----------|
| **P1** | Phase 1 | GameClient 상태머신 단순화 + 1탭 진입 | `GameClient.tsx`, `app/[slug]/page.tsx` |
| **P2** | Phase 2 | CharacterCard + Landing 캐러셀 | NEW `CharacterCard.tsx`, `Landing.tsx`, `story-pack.ts` |
| **P3** | Phase 3 | WorldDetail 간소화 | `WorldDetail.tsx` |
| **P4** | Phase 4 | 감정 글로우 + 관계 알림 | NEW `emotion-color.ts`, `MessageBubble.tsx`, `message/route.ts`, `room.ts` |
| **P5** | Phase 5 | WorldWizard SDK 재설계 | `WorldWizard.tsx` |
| **P6** | Phase 6 | PC 반응형 | `GameClient.tsx`, `Landing.tsx` |

---

## 검증 체크리스트

- [ ] 홈 → 캐릭터 카드 탭 → `/{slug}?char={charId}` → 타이틀 → 시작 → 바로 채팅
- [ ] 단일 캐릭터 스토리: select 화면 없이 자동 진입
- [ ] 멀티 캐릭터 (char 미지정): select 표시 → 카드 탭 → 바로 chat
- [ ] 뒤로가기: 채팅 → 홈 (중간 단계 없음)
- [ ] 세션 복원: 기존 세션 시 바로 chat
- [ ] 감정 글로우: 대화 후 아바타 주변 색상 변화 확인
- [ ] 관계 알림: trust/strength 변화 시 시스템 메시지 표시
- [ ] WorldWizard: Big5 슬라이더 3단계 완주
- [ ] PC (768px+): 넓은 레이아웃, 카드 확대
- [ ] `npm run build` 통과

---

## 참고: 기존 코드 구조

### 핵심 파일
- `components/GameClient.tsx` (1029줄) — 메인 게임 상태머신
- `components/Landing.tsx` — 홈 페이지
- `components/WorldDetail.tsx` — 월드 상세
- `components/WorldWizard.tsx` — 월드 생성 위자드
- `components/chat/MessageBubble.tsx` — 메시지 렌더링
- `lib/story-pack.ts` — 스토리 데이터 변환
- `lib/room.ts` — 룸/메시지 타입
- `app/api/room/[roomId]/message/route.ts` — 메시지 API

### 공통 컴포넌트 (이미 존재)
- `components/BottomNav.tsx` — 하단 네비게이션 (layout.tsx에 포함)
- `components/ui/switch.tsx` — shadcn Switch
- `lib/colors.ts` — hexToRgb 유틸
- `lib/emotion.ts` — 감정 엔진 (커스텀 LLM 어프레이절)
- `lib/api-client.ts`, `lib/api-client-room.ts` — API 클라이언트

### GameClient 내부 함수 (수정 필요)
- `handleStart()` (~L400) — startGame API 호출
- `handleSelect(char)` (~L430) — 캐릭터 선택 → profile로 이동
- `handleRoleConfirm(name, charId)` (~L500) — createRoom → chat 이동
- `handleBack()` (~L600) — 이전 phase로 이동
- 렌더 분기 (~L960-1020) — phase별 컴포넌트 렌더링
