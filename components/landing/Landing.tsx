'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import type { ClientStoryPack, WorldCardData } from '@/lib/story-pack';
import { AppContainer } from '@/components/layout/AppContainer';
import { SECTIONS } from '@/data/mock-contents';
import { HeroBanner } from './HeroBanner';
import { ContentSection } from './ContentSection';

interface LandingProps {
  packs: ClientStoryPack[];
  worlds: WorldCardData[];
}

export default function Landing({ packs: _packs, worlds: _worlds }: LandingProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AppContainer>
      {/* Header - Sticky within container */}
      <div className="sticky top-0 z-50 -mx-4 border-b border-white/[0.06] bg-black/80 px-4 py-3 backdrop-blur-md lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <span className="text-sm font-black text-white">N</span>
            </div>
            <span className="hidden text-lg font-bold text-white sm:block">Novel</span>
          </div>

          <div className="mx-4 max-w-md flex-1">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="콘텐츠 검색..."
                className="w-full rounded-full border border-gray-800 bg-gray-900 py-2 pr-4 pl-10 text-sm text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:outline-none"
              />
            </div>
          </div>

          <button className="rounded-full border border-purple-500/30 bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-400">
            로그인
          </button>
        </div>
      </div>

      <main>
        {/* Hero Banner */}
        <HeroBanner />

        {/* Category Tabs */}
        <section className="border-b border-white/[0.06] px-4 py-3">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {['전체', '월드', '단독', '로맨스', '판타지', '성인'].map((tab, i) => (
              <button
                key={tab}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  i === 0 ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 hover:text-white'
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
    </AppContainer>
  );
}
