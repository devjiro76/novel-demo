'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { Search, Filter, TrendingUp, Clock, Sparkles, ChevronRight } from 'lucide-react';
import type { WorldCardData } from '@/lib/story-pack';
import CharacterCard from '@/components/CharacterCard';

interface ExplorePageProps {
  worlds: WorldCardData[];
}

type SortOption = 'popular' | 'recent' | 'name';
type FilterOption = 'all' | string;

type WorldCharacter = WorldCardData['characters'][number];

export default function ExplorePage({ worlds }: ExplorePageProps) {
  const isDesktop = useIsDesktop();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [selectedTag, setSelectedTag] = useState<FilterOption>('all');

  // Extract all tags
  const allTags = Array.from(
    new Set(worlds.flatMap((w) => w.tags))
  ).sort((a, b) => a.localeCompare(b, 'ko'));

  // Extract all characters
  const allCharacters: Array<{ char: WorldCharacter; world: WorldCardData; slug: string }> = worlds.flatMap(world => 
    world.characters
      .filter(c => c.role)
      .map(char => ({
        char,
        world,
        slug: world.slug ?? world.id,
      }))
  );

  // Filter and sort characters
  let filteredCharacters = allCharacters;
  
  if (selectedTag !== 'all') {
    filteredCharacters = filteredCharacters.filter(({ world }) => 
      world.tags.includes(selectedTag)
    );
  }
  
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredCharacters = filteredCharacters.filter(({ char, world }) =>
      char.name.toLowerCase().includes(q) ||
      char.fullName.toLowerCase().includes(q) ||
      char.role.toLowerCase().includes(q) ||
      world.name.toLowerCase().includes(q)
    );
  }

  // Sort
  const sortedCharacters = [...filteredCharacters].sort((a, b) => {
    if (sortBy === 'name') return a.char.name.localeCompare(b.char.name, 'ko');
    if (sortBy === 'recent') return b.char.age - a.char.age;
    return 0; // popular - random for now
  });

  const header = (
    <header className={isDesktop ? 'mb-8' : 'px-4 pt-10 pb-4'}>
      {isDesktop ? (
        <>
          <h1 className="text-3xl font-black text-gradient">탐색</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">다양한 캐릭터를 발견하세요</p>
        </>
      ) : (
        <>
          <Link href="/" className="text-[10px] text-[var(--color-text-dim)]">← 홈</Link>
          <h1 className="text-2xl font-bold mt-2">탐색</h1>
          <p className="text-[11px] text-[var(--color-text-dim)] mt-1">다양한 캐릭터를 발견하세요</p>
        </>
      )}
    </header>
  );

  const searchBar = (
    <div className={isDesktop ? 'mb-6' : 'px-4 mb-4'}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="캐릭터 검색..."
          className="w-full bg-[var(--color-surface)] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)]/30 transition-colors"
        />
      </div>
    </div>
  );

  const filterSection = (
    <div className={`flex gap-2 overflow-x-auto scrollbar-hide pb-2 ${isDesktop ? 'mb-6' : 'px-4 mb-4'}`}>
      <button
        onClick={() => setSelectedTag('all')}
        className="shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all"
        style={{
          background: selectedTag === 'all' ? 'var(--color-brand-gradient)' : 'var(--color-surface)',
          color: selectedTag === 'all' ? 'white' : 'var(--color-text-secondary)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        전체
      </button>
      {allTags.map(tag => (
        <button
          key={tag}
          onClick={() => setSelectedTag(tag)}
          className="shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all"
          style={{
            background: selectedTag === tag ? 'var(--color-brand-gradient)' : 'var(--color-surface)',
            color: selectedTag === tag ? 'white' : 'var(--color-text-secondary)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );

  const sortSection = (
    <div className={`flex items-center gap-2 ${isDesktop ? 'mb-6' : 'px-4 mb-4'}`}>
      <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
      <div className="flex gap-2">
        {[
          { key: 'popular', label: '인기순', icon: TrendingUp },
          { key: 'recent', label: '최신순', icon: Clock },
          { key: 'name', label: '이름순', icon: Sparkles },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSortBy(key as SortOption)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: sortBy === key ? 'var(--color-surface-2)' : 'transparent',
              color: sortBy === key ? 'var(--color-text)' : 'var(--color-text-muted)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const characterGrid = (
    <div className={isDesktop ? '' : 'px-4'}>
      {sortedCharacters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-[var(--color-text-muted)]">
            {searchQuery ? `'${searchQuery}' 검색 결과 없음` : '캐릭터가 없습니다.'}
          </p>
        </div>
      ) : (
        <div className={isDesktop ? 'flex flex-wrap gap-4' : 'flex flex-wrap gap-3'}>
          {sortedCharacters.map(({ char, world, slug }, index) => (
            <CharacterCard
              key={char.id}
              charId={char.id}
              name={char.name}
              fullName={char.fullName}
              role={char.role}
              age={char.age}
              image={char.image}
              glow={char.glow}
              glowRgb={char.glowRgb}
              slug={slug}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Desktop Layout
  if (isDesktop) {
    return (
      <div className="min-h-screen p-8">
        {header}
        {searchBar}
        {filterSection}
        {sortSection}
        {characterGrid}
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="min-h-screen pb-24">
      {header}
      {searchBar}
      {filterSection}
      {sortSection}
      {characterGrid}
    </div>
  );
}
