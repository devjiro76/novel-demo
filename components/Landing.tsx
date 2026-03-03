'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Heart, Users } from 'lucide-react';
import type { ClientStoryPack, WorldCardData } from '@/lib/story-pack';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Heart, Users } from 'lucide-react';
import type { ClientStoryPack, WorldCardData } from '@/lib/story-pack';

interface LandingProps {
  packs: ClientStoryPack[];
  worlds: WorldCardData[];
}

// 목업 데이터 - 통합 콘텐츠 (단독 + 월드)
const MOCK_CONTENTS = [
  // 월드 (다중 캐릭터)
  {
    id: 'w1',
    type: 'world' as const,
    title: '고등학교 로맨스',
    description: '설렘 가득한 청춘의 한 페이지',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
    characters: [
      { name: '김민경', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
      { name: '최수아', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop' },
      { name: '박지연', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
      { name: '이정훈', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
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
    type: 'solo' as const,
    title: '윤서하',
    description: '무심한 듯 다정한 선배',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
    characters: [{ name: '윤서하', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop' }],
    likes: 8900,
    chats: 32000,
    tags: ['#순애', '#선후배'],
    author: '@감성작가',
    badge: 'N',
  },
  // 월드
  {
    id: 'w2',
    type: 'world' as const,
    title: '서울 오피스',
    description: '바쁜 일상 속 사내 연애',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
    characters: [
      { name: '박채원', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
      { name: '이과장', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
      { name: '김대리', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
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
    type: 'solo' as const,
    title: '이지은',
    description: '귀여운 후배 개발자',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
    characters: [{ name: '이지은', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop' }],
    likes: 6700,
    chats: 18000,
    tags: ['#순애', '#IT'],
    author: '@테크작가',
    badge: 'N',
  },
  // 월드
  {
    id: 'w3',
    type: 'world' as const,
    title: '재벌가',
    description: '화려한 삶 뒤 숨겨진 외로움',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop',
    characters: [
      { name: '정유미', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop' },
      { name: '김비서', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
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
    type: 'solo' as const,
    title: '송아린',
    description: '천진난만한 아이돌',
    image: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop',
    characters: [{ name: '송아린', image: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop' }],
    likes: 34200,
    chats: 89000,
    tags: ['#아이돌', '#연예계'],
    author: '@연예작가',
    badge: 'HOT',
  },
  // 월드
  {
    id: 'w4',
    type: 'world' as const,
    title: '판타지 왕국',
    description: '마법과 용사의 전설',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=800&fit=crop',
    characters: [
      { name: '엘프공주', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
      { name: '기사', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop' },
      { name: '마법사', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
      { name: '용병', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
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
    type: 'solo' as const,
    title: '임수정',
    description: '은둔형 외톨이',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    characters: [{ name: '임수정', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' }],
    likes: 7800,
    chats: 21000,
    tags: ['#힐링', '#위로'],
    author: '@위로해요',
    badge: 'N',
  },
];

const SECTIONS = [
  { title: '🔥 인기 콘텐츠', contents: MOCK_CONTENTS.slice(0, 5) },
  { title: '💕 로맨스', contents: MOCK_CONTENTS.filter(c => c.tags.some(t => t.includes('순애') || t.includes('성인'))) },
  { title: '✨ 신규', contents: MOCK_CONTENTS.filter(c => c.badge === 'N') },
];

export default function Landing({ packs, worlds }: LandingProps) {
  const [searchQuery, setSearchQuery] = useState('');

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
                placeholder="콘텐츠 검색..."
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
        {/* Hero Banner */}
        <HeroBanner />

        {/* Category Tabs */}
        <section className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {['전체', '월드', '단독', '로맨스', '판타지', '성인'].map((tab, i) => (
              <button
                key={tab}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  i === 0
                    ? 'bg-white text-black'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        {/* Content Sections */}
        {SECTIONS.map((section, index) => (
          <ContentSection key={index} title={section.title} contents={section.contents} />
        ))}

        <div className="h-20" />
      </main>
    </div>
  );
}

// Hero Banner
function HeroBanner() {
  const [current, setCurrent] = useState(0);
  
  const banners = [
    {
      id: 1,
      title: '새로운 월드가 열립니다',
      subtitle: 'AI와 함께 만드는 무한한 이야기',
      badge: 'NEW',
      gradient: 'from-purple-600/90 via-pink-600/80 to-orange-500/80',
    },
    {
      id: 2,
      title: '이번 주 인기 콘텐츠',
      subtitle: '가장 많은 사랑을 받은 세계관',
      badge: 'HOT',
      gradient: 'from-orange-600/90 via-red-600/80 to-pink-600/80',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <section className="px-4 py-4">
      <div className="relative rounded-2xl overflow-hidden aspect-[3/1] md:aspect-[4/1]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient}`} />
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10">
              <span className="inline-block w-fit px-2 py-0.5 rounded bg-white/20 text-white text-[10px] font-bold mb-2 backdrop-blur-sm">
                {banner.badge}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white mb-1">
                {banner.title}
              </h2>
              <p className="text-sm text-white/80">
                {banner.subtitle}
              </p>
            </div>
          </div>
        ))}
        
        {/* Indicator */}
        <div className="absolute bottom-3 right-4 text-xs text-white/70">
          {current + 1} / {banners.length}
        </div>
      </div>
    </section>
  );
}

// Content Section
function ContentSection({
  title,
  contents,
}: {
  title: string;
  contents: typeof MOCK_CONTENTS;
}) {
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = (el: HTMLDivElement) => {
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef) {
      scrollRef.scrollBy({ left: direction === 'left' ? -280 : 280, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-5">
      {/* Section Header */}
      <div className="px-4 flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <button className="text-xs text-gray-500 hover:text-white">더 보기</button>
          <div className="flex gap-1">
            <button
              onClick={() => scroll('left')}
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                canScrollLeft ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-600'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                canScrollRight ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-600'
              }`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div
        ref={setScrollRef}
        onScroll={e => checkScroll(e.currentTarget)}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2"
      >
        {contents.map((content, index) => (
          <ContentCard key={content.id} content={content} index={index} />
        ))}
      </div>
    </section>
  );
}

// Unified Content Card
function ContentCard({
  content,
  index,
}: {
  content: typeof MOCK_CONTENTS[0];
  index: number;
}) {
  const formatNumber = (num: number) => {
    if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}천`;
    return num.toString();
  };

  const isWorld = content.type === 'world';

  return (
    <Link
      href={`/${content.type}/${content.id}`}
      className="group flex-shrink-0 w-[160px] md:w-[180px]"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-900 mb-2.5">
        <img
          src={content.image}
          alt={content.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Type Badge */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm ${
              isWorld
                ? 'bg-purple-500/80 text-white'
                : 'bg-white/20 text-white'
            }`}
          >
            {isWorld ? '월드' : '단독'}
          </span>
          {content.badge && (
            <span className="px-1.5 py-0.5 rounded bg-pink-500/80 text-white text-[10px] font-bold">
              {content.badge}
            </span>
          )}
        </div>

        {/* Like Button */}
        <div className="absolute top-2 right-2">
          <button className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center hover:bg-pink-500/50 transition-colors">
            <Heart className="w-3 h-3 text-white" />
          </button>
        </div>

        {/* For World: Character Avatars - Larger & Prominent */}
        {isWorld && content.characters.length > 1 && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-end justify-between">
              <div className="flex -space-x-2">
                {content.characters.slice(0, 3).map((char, i) => (
                  <div
                    key={i}
                    className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-black/50 shadow-lg group-hover:scale-110 transition-transform"
                    style={{ zIndex: content.characters.length - i }}
                    title={char.name}
                  >
                    <img
                      src={char.image}
                      alt={char.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
                {content.characters.length > 3 && (
                  <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center ring-2 ring-black/50 text-white text-xs font-medium">
                    +{content.characters.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 text-white/70 text-[10px]">
          {isWorld && (
            <span className="flex items-center gap-0.5">
              <Users className="w-3 h-3" />
              {content.characters.length}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Heart className="w-3 h-3" />
            {formatNumber(content.likes)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-0.5">
        <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-400 transition-colors">
          {content.title}
        </h3>
        <p className="text-xs text-gray-500 truncate">{content.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {content.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[9px] text-gray-600">
              {tag}
            </span>
          ))}
        </div>

        <p className="text-[10px] text-gray-700 pt-0.5">{content.author}</p>
      </div>
    </Link>
  );
}
