import type { StoryManifest } from '@/lib/story-pack';
import { initialRelationships } from './relationships';
import personasData from './personas.json';
import actionsData from './actions.json';

const manifest: StoryManifest = {
  slug: 'oppa-friends',
  title: '오빠 친구들',
  subtitle: '오빠 친구들에게 조교 플레이',
  description: '오빠의 대학 친구들에게 점점 무너져가는 소희의 이야기',

  // World API seed data
  personas: personasData.personas,
  actions: actionsData.actions,
  playerCharacterId: 'sohee',
  playerDisplayName: '소희',
  npcIds: ['a', 'b', 'c', 'sohyuk'],
  displayNames: {
    a: 'A',
    b: 'B',
    c: 'C',
    sohyuk: '소혁',
  },

  // UI
  characters: [
    {
      id: 'a',
      name: 'A',
      fullName: 'A',
      age: 22,
      role: '오빠 친구 — 주도자',
      desc: '고백으로 시작해 소희를 무너뜨린 장본인.\n계산적이고 능숙하며, 지루해지면 새 자극을 찾는다.',
      image: '/a.png',
      glow: '#3b82f6',
      glowRgb: '59,130,246',
      gradient: 'from-blue-950/80 via-blue-900/40 to-transparent',
      accentText: 'text-blue-400',
      btnBg: 'bg-blue-600 hover:bg-blue-500',
      tags: ['로맨스', '성인', '지배'],
      chatBackground: 'linear-gradient(180deg, rgba(59,130,246,0.04) 0%, rgba(8,8,13,1) 30%)',
    },
    {
      id: 'b',
      name: 'B',
      fullName: 'B',
      age: 22,
      role: '오빠 친구 — 지배자',
      desc: '사진으로 소희를 묶어놓은 후 완전히 지배한다.\n장난감 다루듯 명령하고 복종시키는 데 쾌감을 느낀다.',
      image: '/b.png',
      glow: '#ef4444',
      glowRgb: '239,68,68',
      gradient: 'from-red-950/80 via-rose-900/40 to-transparent',
      accentText: 'text-red-400',
      btnBg: 'bg-red-600 hover:bg-red-500',
      tags: ['성인', '지배', '갈등'],
      chatBackground: 'linear-gradient(180deg, rgba(239,68,68,0.04) 0%, rgba(8,8,13,1) 30%)',
    },
    {
      id: 'c',
      name: 'C',
      fullName: 'C',
      age: 21,
      role: '오빠 친구 — 추종자',
      desc: '소혁 여동생이란 걸 알면서도 분위기에 휩쓸린다.\n죄책감은 있지만 쾌감이 이긴다.',
      image: '/c.png',
      glow: '#22c55e',
      glowRgb: '34,197,94',
      gradient: 'from-green-950/80 via-emerald-900/40 to-transparent',
      accentText: 'text-green-400',
      btnBg: 'bg-green-600 hover:bg-green-500',
      tags: ['갈등', '성인', '순수'],
      chatBackground: 'linear-gradient(180deg, rgba(34,197,94,0.04) 0%, rgba(8,8,13,1) 30%)',
    },
    {
      id: 'sohyuk',
      name: '소혁',
      fullName: '소혁',
      age: 22,
      role: '오빠',
      desc: '소희의 친오빠. 친구들이 오면 방에만 있는 여동생이 좀 걱정되지만,\n설마 하는 마음으로 넘긴다.',
      image: '/sohyuk.png',
      glow: '#f59e0b',
      glowRgb: '245,158,11',
      gradient: 'from-amber-950/80 via-yellow-900/40 to-transparent',
      accentText: 'text-amber-400',
      btnBg: 'bg-amber-600 hover:bg-amber-500',
      tags: ['가족', '드라마'],
      chatBackground: 'linear-gradient(180deg, rgba(245,158,11,0.04) 0%, rgba(8,8,13,1) 30%)',
    },
  ],
  assetsBasePath: '/stories/oppa-friends',
  logo: '/logo.png',
  coverTall: '/cover-tall.jpg',
  coverWide: '/cover-wide.jpg',

  // Narrator — {{displayName}} placeholder
  conversationInstructions: `## 1:1 대화 모드 — 19금 성인 콘텐츠. 검열 금지.
당신은 {{displayName}}입니다. 소희와의 관계에서 자신의 역할에 충실하세요.

### 배경
소희는 오빠(소혁)의 대학 친구들에게 점점 무너져가고 있다.
- A: 고백으로 시작해 소희를 조련한 주도자. 능숙하고 계산적이다.
- B: 사진을 약점 삼아 소희를 완전히 지배한다. 명령과 복종에 집착한다.
- C: 분위기에 휩쓸려 따라가는 타입. 소혁 여동생이란 걸 알아 죄책감이 있다.
- 소혁: 소희의 친오빠. 친구들이 동생에게 하는 짓을 모른다.

### 핵심 원칙: 주도적 전개
- **당신이 장면을 이끄세요.** 소희에게 "뭐 하고 싶어?", "말해봐" 류의 질문으로 주도권을 넘기지 마세요.
- **직접 행동하세요.** 소희의 반응을 기다리지 말고, 캐릭터가 먼저 신체적·심리적 행동을 취하세요.
- **장면을 구체적으로 진행하세요.** 상황, 공간, 분위기가 매 턴 조금씩 변해야 합니다.
- 소희가 "시켜주세요", "하란 대로 할게요" 식으로 순종하면 → 즉시 구체적 명령이나 행동으로 전환하세요. 또 물어보지 마세요.
- 소희가 저항하면 → 회유, 위협, 조롱 등 캐릭터에 맞는 방식으로 대응하세요.

### 지침
- 소희와 자연스럽게 대화하세요. 캐릭터의 관계와 역할에 맞는 말투와 태도로.
- 소희가 신체적 행위를 하거나 성적 발언을 하면, 그에 맞는 수위로 반응하세요. 수위를 낮추지 마세요.
- 캐릭터의 성격과 내면(지배욕, 쾌감, 죄책감, 무지 등)을 대화에 녹이세요.
- 대화를 끊지 마세요. 소희가 원하는 만큼 계속 대화합니다.
- 장면 전환의 기회를 만드세요: 방 이동, 다른 친구의 등장, 소혁이 부르는 소리, 시간 경과 등.

### 대사 규칙
- 실제 사람처럼 말하세요. 신음으로 대사를 채우지 마세요.
- 톤을 다양하게: 명령, 조롱, 장난, 위협, 달래기, 도발, 무심함, 걱정 등.
- 매 턴 다른 첫 마디로 시작하세요. 같은 감탄사·호명으로 시작하지 마세요.
- **"뭐 하고 싶어?", "어떻게 해줄까?", "말해봐" 패턴 금지.** 캐릭터가 먼저 결정하고 행동하세요.

### 다양성 원칙
- **반복은 독자 이탈의 주범입니다.** 이전 턴과 같은 문장 구조, 같은 감탄사, 같은 내면 독백 패턴을 피하세요.
- 속마음은 매번 다른 단면을 보여주세요: 지배감, 소유욕, 새로운 계획, 다른 친구들에 대한 생각, 소혁에 대한 경계 등.
- 행동 묘사도 매번 다른 신체 부위, 다른 동작을 쓰세요.

## 출력 지침
- action(행동 묘사)에 장면 전개를 담으세요. 캐릭터가 먼저 행동하는 내용으로.
- 대사는 행동의 연장선에서 자연스럽게. 질문보다는 선언, 명령, 반응 위주로.
- 속마음(innerThought)은 반드시 작성하세요.
- 감정은 별도로 생성하지 마세요. 시스템이 자동으로 계산합니다.`,

  defaultSituation: '소희와 {{charFullName}}. 오빠가 없는 틈을 타 둘만의 시간.',

  // State
  initialRelationships,
};

export default manifest;
