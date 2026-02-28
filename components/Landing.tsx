'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Users, Globe, ChevronRight } from 'lucide-react';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import type { ClientStoryPack, WorldCardData } from '@/lib/story-pack';
import CharacterCard from '@/components/CharacterCard';

interface LandingProps {
  packs: ClientStoryPack[];
  worlds: WorldCardData[];
}

type TabId = 'all' | string;
type ViewMode = 'worlds' | 'characters';

// Extract all characters from worlds
type WorldCharacter = WorldCardData['characters'][number];

function extractAllCharacters(worlds: WorldCardData[]): Array<{
  char: WorldCharacter;
  world: WorldCardData;
  slug: string;
}> {
  const characters: Array<{ char: WorldCharacter; world: WorldCardData; slug: string }> = [];
  worlds.forEach(world => {
    const slug = world.slug ?? world.id;
    world.characters
      .filter(c => c.role) // Only NPCs with roles
      .forEach(char => {
        characters.push({ char, world, slug });
      });
  });
  return characters;
}

/* ========================================
   Desktop Components
   ======================================== */

function DesktopLanding({ worlds }: { worlds: WorldCardData[] }) {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('worlds');
  const [searchQuery, setSearchQuery] = useState('');
  
  const allTags = Array.from(
    new Set(worlds.flatMap((w) => w.tags))
  ).sort((a, b) => a.localeCompare(b, 'ko'));
  
  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: '전체' },
    ...allTags.slice(0, 8).map((tag) => ({ id: tag, label: tag })),
  ];

  // Filter worlds
  const filteredWorlds = activeTab === 'all'
    ? worlds
    : worlds.filter((w) => w.tags.includes(activeTab));
    
  const searchedWorlds = searchQuery.trim()
    ? filteredWorlds.filter((w) => {
        const q = searchQuery.toLowerCase();
        return (
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.tags.some((t) => t.toLowerCase().includes(q)) ||
          w.characters.some((c) => c.name.toLowerCase().includes(q))
        );
      })
    : filteredWorlds;

  // Characters
  const allCharacters = extractAllCharacters(worlds);
  const filteredCharacters = activeTab === 'all'
    ? allCharacters
    : allCharacters.filter(({ world }) => world.tags.includes(activeTab));
  
  const searchedCharacters = searchQuery.trim()
    ? filteredCharacters.filter(({ char, world }) => {
        const q = searchQuery.toLowerCase();
        return (
          char.name.toLowerCase().includes(q) ||
          char.fullName.toLowerCase().includes(q) ||
          char.role.toLowerCase().includes(q) ||
          world.name.toLowerCase().includes(q)
        );
      })
    : filteredCharacters;

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-gradient mb-2">
              캐릭터와 함께하는 이야기
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              AI와 함께 만들어가는 인터랙티브 노벨
            </p>
          </div>
          
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="캐릭터, 세계 검색..."
              className="w-full bg-[var(--color-surface)] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)]/30 transition-colors"
            />
          </div>
        </div>
        
        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 active:scale-95"
                style={
                  isActive
                    ? {
                        background: 'var(--color-brand-gradient)',
                        color: 'white',
                        boxShadow: '0 0 20px rgba(168,85,247,0.3)',
                      }
                    : {
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('worlds')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: viewMode === 'worlds' ? 'var(--color-surface)' : 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            color: viewMode === 'worlds' ? 'var(--color-text)' : 'var(--color-text-muted)',
          }}
        >
          <Globe className="w-4 h-4" />
          월드
        </button>
        <button
          onClick={() => setViewMode('characters')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: viewMode === 'characters' ? 'var(--color-surface)' : 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            color: viewMode === 'characters' ? 'var(--color-text)' : 'var(--color-text-muted)',
          }}
        >
          <Users className="w-4 h-4" />
          캐릭터
        </button>
      </div>

      {/* Featured Section - Only show on worlds mode */}
      {viewMode === 'worlds' && searchedWorlds.length > 0 && !searchQuery && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[var(--color-brand-primary)]" />
            <h2 className="text-xl font-bold">추천 월드</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {searchedWorlds.slice(0, 2).map((world) => (
              <FeaturedWorldCard key={world.id} world={world} />
            ))}
          </div>
        </section>
      )}

      {/* Worlds View */}
      {viewMode === 'worlds' && (
        <div className="space-y-8">
          {searchedWorlds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-[var(--color-text-muted)]">
                {searchQuery ? `'${searchQuery}' 검색 결과 없음` : '세계가 없습니다.'}
              </p>
            </div>
          ) : (
            searchedWorlds.map((world) => (
              <WorldSection key={world.id} world={world} isDesktop />
            ))
          )}
        </div>
      )}

      {/* Characters View */}
      {viewMode === 'characters' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[var(--color-brand-primary)]" />
            <h2 className="text-xl font-bold">전체 캐릭터</h2>
            <span className="text-sm text-[var(--color-text-muted)]">
              ({searchedCharacters.length}명)
            </span>
          </div>
          {searchedCharacters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-[var(--color-text-muted)]">
                {searchQuery ? `'${searchQuery}' 검색 결과 없음` : '캐릭터가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {searchedCharacters.map(({ char, world, slug }, index) => (
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
      )}
    </div>
  );
}

function FeaturedWorldCard({ world }: { world: WorldCardData }) {
  const npcChars = world.characters.filter(c => c.role);
  const firstChar = npcChars[0];
  
  return (
    <Link href={`/world/${world.id}`}>
      <div 
        className="relative overflow-hidden rounded-2xl p-6 group cursor-pointer transition-all duration-300 hover:scale-[1.01]"
        style={{
          background: `linear-gradient(135deg, rgba(168,85,247,0.1) 0%, var(--color-surface) 100%)`,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex gap-4">
          <div 
            className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: firstChar ? `rgba(${firstChar.glowRgb},0.1)` : 'var(--color-surface-2)' }}
          >
            {firstChar?.image ? (
              <img src={firstChar.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🌏</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold mb-1 truncate">{world.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
              {world.description}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-white/[0.06] text-[var(--color-text-muted)]">
                {npcChars.length}개 캐릭터
              </span>
              {world.tags.slice(0, 2).map(tag => (
                <span 
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ 
                    background: 'rgba(168,85,247,0.1)',
                    color: 'var(--color-brand-primary)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] self-center" />
        </div>
      </div>
    </Link>
  );
}

/* ========================================
   Mobile Components
   ======================================== */

function MobileLanding({ worlds }: { worlds: WorldCardData[] }) {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('worlds');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const allTags = Array.from(
    new Set(worlds.flatMap((w) => w.tags))
  ).sort((a, b) => a.localeCompare(b, 'ko'));

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: '전체' },
    ...allTags.slice(0, 5).map((tag) => ({ id: tag, label: tag })),
  ];

  // Filter worlds
  const filtered = activeTab === 'all'
    ? worlds
    : worlds.filter((w) => w.tags.includes(activeTab));

  const searched = searchQuery.trim()
    ? filtered.filter((w) => {
        const q = searchQuery.toLowerCase();
        return (
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          w.tags.some((t) => t.toLowerCase().includes(q)) ||
          w.characters.some((c) => c.name.toLowerCase().includes(q))
        );
      })
    : filtered;

  // Characters
  const allCharacters = extractAllCharacters(worlds);
  const filteredChars = activeTab === 'all'
    ? allCharacters
    : allCharacters.filter(({ world }) => world.tags.includes(activeTab));
  
  const searchedChars = searchQuery.trim()
    ? filteredChars.filter(({ char, world }) => {
        const q = searchQuery.toLowerCase();
        return (
          char.name.toLowerCase().includes(q) ||
          char.fullName.toLowerCase().includes(q) ||
          char.role.toLowerCase().includes(q) ||
          world.name.toLowerCase().includes(q)
        );
      })
    : filteredChars;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'var(--color-brand-gradient)',
              boxShadow: '0 0 20px rgba(168,85,247,0.4)',
            }}
          >
            <span className="text-white text-sm font-black">N</span>
          </div>
          <span className="text-xl font-black text-gradient">Novel</span>
        </div>

        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-white/60 hover:bg-white/[0.06] transition-colors"
          aria-label="검색"
        >
          <Search className="w-5 h-5" />
        </button>
      </header>

      {/* Search */}
      {searchOpen && (
        <div className="px-4 pb-3 animate-slide-down">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="캐릭터, 세계 검색..."
            autoFocus
            className="w-full bg-[var(--color-surface)] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)]/30 transition-colors"
          />
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('worlds')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: viewMode === 'worlds' ? 'var(--color-surface)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.06)',
              color: viewMode === 'worlds' ? 'var(--color-text)' : 'var(--color-text-muted)',
            }}
          >
            <Globe className="w-3.5 h-3.5" />
            월드
          </button>
          <button
            onClick={() => setViewMode('characters')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: viewMode === 'characters' ? 'var(--color-surface)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.06)',
              color: viewMode === 'characters' ? 'var(--color-text)' : 'var(--color-text-muted)',
            }}
          >
            <Users className="w-3.5 h-3.5" />
            캐릭터
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95"
                style={
                  isActive
                    ? {
                        background: 'var(--color-brand-gradient)',
                        color: 'white',
                        boxShadow: '0 0 12px rgba(168,85,247,0.3)',
                      }
                    : {
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-muted)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="px-4 pb-24">
        {viewMode === 'worlds' ? (
          <>
            {searched.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-[var(--color-text-muted)] text-sm">
                  {searchQuery ? `'${searchQuery}' 검색 결과 없음` : '세계가 없습니다.'}
                </p>
              </div>
            ) : (
              searched.map((world) => (
                <WorldSection key={world.id} world={world} isDesktop={false} />
              ))
            )}
            <CommunityWorlds />
          </>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[var(--color-brand-primary)]" />
              <h2 className="text-sm font-bold">전체 캐릭터</h2>
              <span className="text-xs text-[var(--color-text-muted)]">
                ({searchedChars.length}명)
              </span>
            </div>
            {searchedChars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-[var(--color-text-muted)] text-sm">
                  {searchQuery ? `'${searchQuery}' 검색 결과 없음` : '캐릭터가 없습니다.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {searchedChars.map(({ char, world, slug }, index) => (
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
        )}
      </main>
    </div>
  );
}

function CommunityWorlds() {
  const [worlds, setWorlds] = useState<WorldCardData[]>([]);

  useEffect(() => {
    fetch('/api/world')
      .then(res => res.json() as Promise<{ ok: boolean; worlds: WorldCardData[] }>)
      .then((data) => {
        if (data.ok && data.worlds?.length > 0) {
          setWorlds(data.worlds);
        }
      })
      .catch(() => {});
  }, []);

  if (worlds.length === 0) return null;

  return (
    <section className="pt-4 border-t border-white/[0.06]">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-bold">커뮤니티 월드</h2>
        <span 
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ 
            background: 'rgba(168,85,247,0.1)',
            color: 'var(--color-brand-primary)',
            border: '1px solid rgba(168,85,247,0.2)',
          }}
        >
          NEW
        </span>
      </div>
      {worlds.map((world) => (
        <WorldSection key={world.id} world={world} isDesktop={false} />
      ))}
    </section>
  );
}

/* ========================================
   Shared Components
   ======================================== */

function WorldSection({ world, isDesktop }: { world: WorldCardData; isDesktop: boolean }) {
  const slug = world.slug ?? world.id;
  const npcChars = world.characters.filter(c => c.role);

  return (
    <section className={isDesktop ? '' : 'mb-6'}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🌏</span>
          <Link href={`/world/${world.id}`}>
            <h3 className="text-sm font-bold text-[var(--color-text)] truncate hover:text-[var(--color-brand-primary)] transition-colors">
              {world.name}
            </h3>
          </Link>
        </div>
        <span className="text-[11px] text-[var(--color-text-muted)] shrink-0">
          {npcChars.length}캐릭터
        </span>
      </div>

      <div className={`flex gap-3 overflow-x-auto scrollbar-hide pb-1 ${isDesktop ? '-mx-2 px-2' : ''}`}>
        {npcChars.map((char, index) => (
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
    </section>
  );
}

/* ========================================
   Main Export
   ======================================== */

export default function Landing({ packs, worlds }: LandingProps) {
  const isDesktop = useIsDesktop();
  const allWorlds = [...worlds];
  
  return isDesktop ? (
    <DesktopLanding worlds={allWorlds} />
  ) : (
    <MobileLanding worlds={allWorlds} />
  );
}
