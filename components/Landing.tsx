'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Heart, Users, Sparkles } from 'lucide-react';
import type { ClientStoryPack, WorldCardData } from '@/lib/story-pack';

interface LandingProps {
  packs: ClientStoryPack[];
  worlds: WorldCardData[];
}

// 목업 데이터 - 월드 중심
const MOCK_BANNERS = [
  {
    id: '1',
    title: '새로운 월드가 열립니다',
    subtitle: 'AI와 함께 만드는 무한한 이야기',
    badge: 'NEW',
    color: 'from-purple-600/80 to-pink-900/80',
  },
  {
    id: '2', 
    title: '이번 주 인기 월드',
    subtitle: '가장 많은 사랑을 받은 세계관',
    badge: 'HOT',
    color: 'from-orange-600/80 to-red-900/80',
  },
];

const MOCK_WORLDS = [
  {
    id: 'w1',
    name: '고등학교 로맨스',
    description: '설렘 가득한 청춘의 한 페이지. 첫사랑의 순간을 함께하세요.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
    characters: [
      { name: '김민경', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
      { name: '최수아', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop' },
      { name: '박지연', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
    ],
    likes: 12500,
    members: 3400,
    tags: ['#순애', '#학원', '#청춘'],
    author: '@로맨스작가',
    badge: 'HOT',
  },
  {
    id: 'w2',
    name: '대학 캠퍼스',
    description: '어른이 되어가는 과정, 그 속에서 만나는 특별한 인연들.',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop',
    characters: [
      { name: '윤서하', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop' },
      { name: '김준호', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
    ],
    likes: 8900,
    members: 2100,
    tags: ['#순애', '#선후배', '#성장'],
    author: '@캠퍼스작가',
    badge: 'N',
  },
  {
    id: 'w3',
    name: '서울 오피스',
    description: '바쁜 일상 속에서 피어나는 사내 연애. 직장인들의 현실 로맨스.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
    characters: [
      { name: '박채원', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
      { name: '이과장', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
      { name: '김대리', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
      { name: '정팀장', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
    ],
    likes: 15600,
    members: 5200,
    tags: ['#성인', '#사내연애', '#오피스'],
    author: '@현실주의작가',
    badge: 'HOT',
  },
  {
    id: 'w4',
    name: '스타트업',
    description: '꿈을 향해 달리는 청춘들. 성공과 사랑, 둘 다 잡을 수 있을까?',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
    characters: [
      { name: '이지은', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' },
      { name: '최CTO', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
    ],
    likes: 6700,
    members: 1800,
    tags: ['#순애', '#동료', '#IT'],
    author: '@테크작가',
    badge: 'N',
  },
  {
    id: 'w5',
    name: '재벌가',
    description: '화려한 삶 뒤에 숨겨진 외로움. 그녀와의 특별한 인연이 시작된다.',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop',
    characters: [
      { name: '정유미', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop' },
      { name: '김비서', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
    ],
    likes: 22100,
    members: 6700,
    tags: ['#성인', '#금수저', '#드라마'],
    author: '@드라마작가',
    badge: 'HOT',
  },
  {
    id: 'w6',
    name: '연예계',
    description: '빛나는 무대 뒤에 숨겨진 진짜 모습. 당신만이 알 수 있는 그녀의 이야기.',
    image: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop',
    characters: [
      { name: '송아린', image: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop' },
      { name: '매니저', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
      { name: '감독', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
    ],
    likes: 34200,
    members: 8900,
    tags: ['#아이돌', '#연예계', '#스캔들'],
    author: '@연예작가',
    badge: 'HOT',
  },
  {
    id: 'w7',
    name: '판타지 왕국',
    description: '마법과 용사가 공존하는 세계. 당신만의 전설을 써내려가세요.',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=800&fit=crop',
    characters: [
      { name: '엘프공주', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
      { name: '기사', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
      { name: '마법사', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
    ],
    likes: 18900,
    members: 4300,
    tags: ['#판타지', '#마법', '#모험'],
    author: '@판타지작가',
    badge: 'HOT',
  },
  {
    id: 'w8',
    name: '좀비 아포칼립스',
    description: '종말의 세계, 살아남기 위한 선택. 인간성을 지킬 수 있을까?',
    image: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=600&h=800&fit=crop',
    characters: [
      { name: '생존자', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
      { name: '의사', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop' },
    ],
    likes: 15400,
    members: 3200,
    tags: ['#아포칼립스', '#생존', '#액션'],
    author: '@스릴러작가',
    badge: 'HOT',
  },
];

const MOCK_SECTIONS = [
  {
    title: '🔥 인기 월드',
    worlds: MOCK_WORLDS.slice(0, 5),
  },
  {
    title: '💕 로맨스 월드',
    worlds: MOCK_WORLDS.filter(w => w.tags.some(t => t.includes('순애') || t.includes('성인'))).slice(0, 5),
  },
  {
    title: '⚔️ 판타지/액션',
    worlds: MOCK_WORLDS.filter(w => w.tags.some(t => t.includes('판타지') || t.includes('아포칼립스'))).slice(0, 5),
  },
  {
    title: '✨ 신규 월드',
    worlds: MOCK_WORLDS.filter(w => w.badge === 'N').slice(0, 5),
  },
];

export default function Landing({ packs, worlds }: LandingProps) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % MOCK_BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/[0.06]">
        <div className="px-4 h-14 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-sm font-black">N</span>
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">Novel</span>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="월드 검색..."
                className="w-full bg-gray-900 border border-gray-800 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <button className="px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium border border-purple-500/30">
            로그인
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Banner */}
        <section className="relative px-4 py-4">
          <div className="relative rounded-2xl overflow-hidden aspect-[3/1] md:aspect-[4/1]">
            {MOCK_BANNERS.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentBanner ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${banner.color}`} />
                <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12">
                  <span className="inline-block w-fit px-2 py-1 rounded bg-white/20 text-white text-xs font-bold mb-2 backdrop-blur-sm">
                    {banner.badge}
                  </span>
                  <h2 className="text-xl md:text-3xl font-black text-white mb-1">
                    {banner.title}
                  </h2>
                  <p className="text-sm md:text-base text-white/80">
                    {banner.subtitle}
                  </p>
                </div>
              </div>
            ))}
            <div className="absolute bottom-3 right-4 text-xs text-white/80">
              {currentBanner + 1} / {MOCK_BANNERS.length}
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="px-4 py-2 border-b border-white/[0.06]">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {['홈', '신작', '랭킹', '로맨스', '판타지', '성인'].map((tab, i) => (
              <button
                key={tab}
                className={`whitespace-nowrap pb-2 text-sm font-medium transition-colors relative ${
                  i === 0 ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab}
                {i === 0 && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />}
              </button>
            ))}
          </div>
        </section>

        {/* World Sections */}
        {MOCK_SECTIONS.map((section, index) => (
          <WorldSection key={index} title={section.title} worlds={section.worlds} />
        ))}

        <div className="h-20" />
      </main>
    </div>
  );
}

// World Section
function WorldSection({ title, worlds }: { title: string; worlds: typeof MOCK_WORLDS }) {
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = (el: HTMLDivElement) => {
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef) {
      scrollRef.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-6">
      <div className="px-4 flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <button className="text-sm text-gray-500 hover:text-white">더 보기</button>
          <div className="flex gap-1">
            <button
              onClick={() => scroll('left')}
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                canScrollLeft ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-600'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                canScrollRight ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-600'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={setScrollRef}
        onScroll={e => checkScroll(e.currentTarget)}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2"
      >
        {worlds.map((world, index) => (
          <WorldCard key={world.id} world={world} index={index} />
        ))}
      </div>
    </section>
  );
}

// World Card
function WorldCard({ world, index }: { world: typeof MOCK_WORLDS[0]; index: number }) {
  const formatNumber = (num: number) => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}천`;
    return num.toString();
  };

  return (
    <Link href={`/world/${world.id}`} className="group flex-shrink-0 w-[200px] md:w-[240px]">
      {/* Image */}
      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-900 mb-3">
        <img
          src={world.image}
          alt={world.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badge */}
        <div className="absolute top-2 left-2">
          <span className="px-1.5 py-0.5 rounded bg-black/50 text-white text-[10px] font-bold">
            {world.badge}
          </span>
        </div>

        {/* Like button */}
        <div className="absolute top-2 right-2">
          <button className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center hover:bg-pink-500/50 transition-colors">
            <Heart className="w-3 h-3 text-white" />
          </button>
        </div>

        {/* Character avatars */}
        <div className="absolute bottom-2 left-2 flex -space-x-1.5">
          {world.characters.slice(0, 3).map((char, i) => (
            <div key={i} className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-black">
              <img src={char.image} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {world.characters.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-black/70 flex items-center justify-center text-[9px] text-white ring-2 ring-black">
              +{world.characters.length - 3}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 text-white/80 text-[10px]">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {formatNumber(world.members)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {formatNumber(world.likes)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white truncate group-hover:text-pink-400">
          {world.name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2">{world.description}</p>
        
        <div className="flex flex-wrap gap-1.5 pt-1">
          {world.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] text-gray-600">{tag}</span>
          ))}
        </div>
        
        <p className="text-[10px] text-gray-600">{world.author}</p>
      </div>
    </Link>
  );
}
