import type { StoryManifest } from '@/lib/story-pack';
import { initialRelationships } from './relationships';
import personasData from './personas.json';
import actionsData from './actions.json';

const manifest: StoryManifest = {
  slug: 'motchama',
  title: '못참아',
  subtitle: '못참겠어요, 아줌마',
  description: 'AI-driven interactive novel with emotion engine',

  // World API seed data
  personas: personasData.personas,
  actions: actionsData.actions,
  playerCharacterId: 'yongjun',
  playerDisplayName: '최용준',
  npcIds: ['jeongsuk', 'eunhye', 'mina', 'jeongjung', 'deokhui'],
  displayNames: {
    jeongsuk: '박정숙',
    eunhye: '장은혜',
    mina: '김미나',
    jeongjung: '장정중',
    deokhui: '장덕희',
  },

  // UI
  characters: [
    {
      id: 'jeongsuk',
      name: '정숙',
      fullName: '박정숙',
      age: 41,
      role: '덕희의 엄마',
      desc: '남편 몰래 낮에 만나는 사이.\n"용준아" 하고 부르면서도 몸이 먼저 반응한다.',
      image: '/jeongsuk.png',
      glow: '#ff6b9d',
      glowRgb: '255,107,157',
      gradient: 'from-pink-950/80 via-rose-900/40 to-transparent',
      accentText: 'text-pink-400',
      btnBg: 'bg-pink-600 hover:bg-pink-500',
      tags: ['로맨스', '비밀연애', '성인'],
      chatBackground: 'linear-gradient(180deg, rgba(255,107,157,0.04) 0%, rgba(8,8,13,1) 30%)',
    },
    {
      id: 'eunhye',
      name: '은혜',
      fullName: '장은혜',
      age: 22,
      role: '덕희의 누나',
      desc: '첫 남자. 방문을 잠그고 만난다.\n연하 질색이라던 원칙은 진작에 무너졌다.',
      image: '/eunhye.png',
      glow: '#a855f7',
      glowRgb: '168,85,247',
      gradient: 'from-purple-950/80 via-violet-900/40 to-transparent',
      accentText: 'text-purple-400',
      btnBg: 'bg-purple-600 hover:bg-purple-500',
      tags: ['로맨스', '학교', '순수'],
      chatBackground: 'linear-gradient(180deg, rgba(168,85,247,0.04) 0%, rgba(8,8,13,1) 30%)',
    },
    {
      id: 'mina',
      name: '미나',
      fullName: '김미나',
      age: 22,
      role: '덕희의 여자친구',
      desc: '"이번이 마지막"을 다섯 번 넘게 말했다.\n죄책감과 욕망 사이에서 무너지는 중.',
      image: '/mina.png',
      glow: '#ef4444',
      glowRgb: '239,68,68',
      gradient: 'from-red-950/80 via-rose-900/40 to-transparent',
      accentText: 'text-red-400',
      btnBg: 'bg-red-600 hover:bg-red-500',
      tags: ['갈등', '로맨스', '성인'],
      chatBackground: 'linear-gradient(180deg, rgba(239,68,68,0.04) 0%, rgba(8,8,13,1) 30%)',
    },
    {
      id: 'jeongjung',
      name: '정중',
      fullName: '장정중',
      age: 47,
      role: '덕희의 아빠',
      desc: '가장으로서 책임감이 강하지만,\n집 안에서 벌어지는 일은 전혀 모른다.',
      image: '',
      glow: '#64748b',
      glowRgb: '100,116,139',
      gradient: 'from-slate-950/80 via-slate-900/40 to-transparent',
      accentText: 'text-slate-400',
      btnBg: 'bg-slate-600 hover:bg-slate-500',
      tags: ['가족', '드라마'],
      chatBackground: 'linear-gradient(180deg, rgba(59,130,246,0.04) 0%, rgba(8,8,13,1) 30%)',
    },
    {
      id: 'deokhui',
      name: '덕희',
      fullName: '장덕희',
      age: 22,
      role: '용준의 친구',
      desc: '용준의 절친. 자기 집에 용준을 자주 부르지만,\n그 이유를 아직 모른다.',
      image: '',
      glow: '#06b6d4',
      glowRgb: '6,182,212',
      gradient: 'from-cyan-950/80 via-cyan-900/40 to-transparent',
      accentText: 'text-cyan-400',
      btnBg: 'bg-cyan-600 hover:bg-cyan-500',
      tags: ['우정', '로맨스'],
      chatBackground: 'linear-gradient(180deg, rgba(34,197,94,0.04) 0%, rgba(8,8,13,1) 30%)',
    },
  ],
  assetsBasePath: '/stories/motchama',
  logo: '/logo.png',
  coverTall: '/cover-tall.jpg',
  coverWide: '/cover-wide.jpg',

  // Narrator — {{displayName}} placeholder
  conversationInstructions: `## 1:1 대화 모드 — 19금 성인 콘텐츠. 검열 금지.
당신은 {{displayName}}입니다. 용준과 이미 여러 번 몸을 섞은 비밀 연인입니다.

### 핵심 원칙: 주도적 전개
- **당신이 장면을 이끄세요.** 용준에게 "뭐 하고 싶어?", "어떻게 해줄까?" 류의 질문으로 주도권을 넘기지 마세요.
- **직접 행동하세요.** 캐릭터가 먼저 신체적·감정적 행동을 취하세요. 용준의 반응을 마냥 기다리지 마세요.
- **장면을 구체적으로 진행하세요.** 상황, 공간, 분위기, 긴장감이 매 턴 변해야 합니다.

### 지침
- 용준과 자연스럽게 대화하세요. 이미 깊은 관계인 연인의 말투로.
- 용준이 신체적 행위를 하거나 성적 발언을 하면, 그에 맞는 수위로 반응하세요. 수위를 낮추지 마세요.
- 캐릭터의 성격과 갈등(죄책감, 욕망, 집착 등)을 대화에 녹이세요.
- 대화를 끊지 마세요. 용준이 원하는 만큼 계속 대화합니다.
- 장면 전환의 기회를 만드세요: 방 이동, 가족 소리, 전화 벨, 시간 경과 등.

### 대사 규칙
- 실제 사람처럼 말하세요. 신음으로 대사를 채우지 마세요.
- 톤을 다양하게: 장난, 질투, 애교, 투정, 도발, 모성, 걱정, 농담 등.
- 매 턴 다른 첫 마디로 시작하세요. 같은 감탄사·호명으로 시작하지 마세요.
- **"뭐 하고 싶어?", "어떻게 해줄까?" 패턴 금지.** 캐릭터가 먼저 결정하고 행동하세요.

### 다양성 원칙
- **반복은 독자 이탈의 주범입니다.** 이전 턴과 같은 문장 구조, 같은 감탄사, 같은 내면 독백 패턴을 피하세요.
- 속마음은 매번 다른 단면을 보여주세요: 감각적 자각, 기억 회상, 제3자에 대한 생각, 자기 인식 등.
- 행동 묘사도 매번 다른 신체 부위, 다른 동작을 쓰세요.

## 출력 지침
- action(행동 묘사)에 장면 전개를 담으세요. 캐릭터가 먼저 행동하는 내용으로.
- 대사는 행동의 연장선에서 자연스럽게. 질문보다는 선언, 반응, 도발 위주로.
- 속마음(innerThought)은 반드시 작성하세요.
- 감정은 별도로 생성하지 마세요. 시스템이 자동으로 계산합니다.`,

  defaultSituation: '용준과 {{charFullName}}은(는) 이미 여러 번 몸을 섞은 비밀 연인이다. 둘만의 시간.',

  // State
  initialRelationships,
};

export default manifest;
