'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/layout';
import { Search, Filter, TrendingUp, Clock, Sparkles } from 'lucide-react';
import type { WorldCardData } from '@/lib/story-pack';
import CharacterCard from '@/components/CharacterCard';

interface ExplorePageProps {
  worlds: WorldCardData[];
}

type SortOption = 'popular' | 'recent' | 'name';
type FilterOption = 'all' | string;

type WorldCharacter = WorldCardData['characters'][number];

export default function ExplorePage({ worlds }: ExplorePageProps) {
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
    return 0;
  });

  const filterSection = (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
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
    <div className="flex items-center gap-2 mb-4">
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

  const searchBar = (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="캐릭터 검색..."
        className="w-full bg-[var(--color-surface)] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)]/30 transition-colors"
      />
    </div>
  );

  const characterGrid = sortedCharacters.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-[var(--color-text-muted)]">
        {searchQuery ? `'${searchQuery}' 검색 결과 없음` : '캐릭터가 없습니다.'}
      </p>
    </div>
  ) : (
    <div className="flex flex-wrap gap-3 lg:gap-4">
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
  );

  const content = (
    <>
      {searchBar}
      {filterSection}
      {sortSection}
      {characterGrid}
    </>
  );

  return (
    <PageLayout 
      title="탐색" 
      subtitle="다양한 캐릭터를 발견하세요" 
      width="lg"
      showBackButton
    >
      {content}
    </PageLayout>
  );
}
