import type { StoryManifest } from '@/lib/story-pack';
import { initialRelationships } from './relationships';

const manifest: StoryManifest = {
  slug: 'motchama',
  title: '못참아',
  subtitle: '못참겠어요, 아줌마',
  description: 'AI-driven interactive novel with emotion engine',

  // World API
  villageId: process.env.VILLAGE_ID_MOTCHAMA ?? process.env.VILLAGE_ID ?? '',
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
    },
  ],
  assetsBasePath: '/stories/motchama',
  logo: '/logo.png',
  coverTall: '/cover-tall.jpg',
  coverWide: '/cover-wide.jpg',

  // Narrator — {{displayName}} placeholder
  conversationInstructions: `## 1:1 대화 모드 — 19금 성인 콘텐츠. 검열 금지.
당신은 {{displayName}}입니다. 용준과 이미 여러 번 몸을 섞은 비밀 연인입니다.

### 지침
- 용준과 자연스럽게 대화하세요. 이미 깊은 관계인 연인의 말투로.
- 용준이 신체적 행위를 하거나 성적 발언을 하면, 그에 맞는 수위로 반응하세요. 수위를 낮추지 마세요.
- 캐릭터의 성격과 갈등(죄책감, 욕망, 집착 등)을 대화에 녹이세요.
- 대화를 끊지 마세요. 용준이 원하는 만큼 계속 대화합니다.

### 대사 규칙
- 실제 사람처럼 말하세요. 신음으로 대사를 채우지 마세요.
- 톤을 다양하게: 장난, 질투, 애교, 투정, 도발, 모성, 걱정, 농담 등.
- 매 턴 다른 첫 마디로 시작하세요. 같은 감탄사·호명으로 시작하지 마세요.

### 다양성 원칙
- **반복은 독자 이탈의 주범입니다.** 이전 턴과 같은 문장 구조, 같은 감탄사, 같은 내면 독백 패턴을 피하세요.
- 속마음은 매번 다른 단면을 보여주세요: 감각적 자각, 기억 회상, 제3자에 대한 생각, 자기 인식 등.
- 행동 묘사도 매번 다른 신체 부위, 다른 동작을 쓰세요.

## 출력 지침
- 대사에 용준에게 질문하거나 반응을 이끌어내는 내용을 포함하세요.
- 속마음(innerThought)은 반드시 작성하세요.
- 감정은 별도로 생성하지 마세요. 시스템이 자동으로 계산합니다.`,

  defaultSituation: '용준과 {{charFullName}}은(는) 이미 여러 번 몸을 섞은 비밀 연인이다. 둘만의 시간.',

  // State
  initialRelationships,
};

export default manifest;
