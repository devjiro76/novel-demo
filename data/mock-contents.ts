export interface MockContent {
  id: string;
  type: 'world' | 'solo';
  title: string;
  description: string;
  image: string;
  characters: { name: string; image: string }[];
  likes: number;
  chats: number;
  tags: string[];
  author: string;
  badge: string;
}

export const MOCK_CONTENTS: MockContent[] = [
  // 월드 (다중 캐릭터)
  {
    id: 'w1',
    type: 'world',
    title: '고등학교 로맨스',
    description: '설렘 가득한 청춘의 한 페이지',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
    characters: [
      {
        name: '김민경',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
      },
      {
        name: '최수아',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop',
      },
      {
        name: '박지연',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      },
      {
        name: '이정훈',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      },
    ],
    likes: 12500,
    chats: 45000,
    tags: ['#순애', '#학원'],
    author: '@로맨스작가',
    badge: 'HOT',
  },
  // 단독 (1인)
  {
    id: 's1',
    type: 'solo',
    title: '윤서하',
    description: '무심한 듯 다정한 선배',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
    characters: [
      {
        name: '윤서하',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop',
      },
    ],
    likes: 8900,
    chats: 32000,
    tags: ['#순애', '#선후배'],
    author: '@감성작가',
    badge: 'N',
  },
  // 월드
  {
    id: 'w2',
    type: 'world',
    title: '서울 오피스',
    description: '바쁜 일상 속 사내 연애',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
    characters: [
      {
        name: '박채원',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      },
      {
        name: '이과장',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      },
      {
        name: '김대리',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      },
    ],
    likes: 15600,
    chats: 52000,
    tags: ['#성인', '#오피스'],
    author: '@현실주의작가',
    badge: 'HOT',
  },
  // 단독
  {
    id: 's2',
    type: 'solo',
    title: '이지은',
    description: '귀여운 후배 개발자',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
    characters: [
      {
        name: '이지은',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
      },
    ],
    likes: 6700,
    chats: 18000,
    tags: ['#순애', '#IT'],
    author: '@테크작가',
    badge: 'N',
  },
  // 월드
  {
    id: 'w3',
    type: 'world',
    title: '재벌가',
    description: '화려한 삶 뒤 숨겨진 외로움',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop',
    characters: [
      {
        name: '정유미',
        image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop',
      },
      {
        name: '김비서',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      },
    ],
    likes: 22100,
    chats: 67000,
    tags: ['#성인', '#금수저'],
    author: '@드라마작가',
    badge: 'HOT',
  },
  // 단독
  {
    id: 's3',
    type: 'solo',
    title: '송아린',
    description: '천진난만한 아이돌',
    image: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop',
    characters: [
      {
        name: '송아린',
        image: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop',
      },
    ],
    likes: 34200,
    chats: 89000,
    tags: ['#아이돌', '#연예계'],
    author: '@연예작가',
    badge: 'HOT',
  },
  // 월드
  {
    id: 'w4',
    type: 'world',
    title: '판타지 왕국',
    description: '마법과 용사의 전설',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=800&fit=crop',
    characters: [
      {
        name: '엘프공주',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      },
      {
        name: '기사',
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
      },
      {
        name: '마법사',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      },
      {
        name: '용병',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      },
    ],
    likes: 18900,
    chats: 43000,
    tags: ['#판타지', '#모험'],
    author: '@판타지작가',
    badge: 'HOT',
  },
  // 단독
  {
    id: 's4',
    type: 'solo',
    title: '임수정',
    description: '은둔형 외톨이',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    characters: [
      {
        name: '임수정',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      },
    ],
    likes: 7800,
    chats: 21000,
    tags: ['#힐링', '#위로'],
    author: '@위로해요',
    badge: 'N',
  },
];

export const SECTIONS = [
  { title: '🔥 인기 콘텐츠', contents: MOCK_CONTENTS.slice(0, 5) },
  {
    title: '💕 로맨스',
    contents: MOCK_CONTENTS.filter((c) =>
      c.tags.some((t) => t.includes('순애') || t.includes('성인')),
    ),
  },
  { title: '✨ 신규', contents: MOCK_CONTENTS.filter((c) => c.badge === 'N') },
];
