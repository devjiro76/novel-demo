'use client';

import { useState, useEffect } from 'react';
import type { ClientStoryPack } from '@/lib/story-pack';
import type { WorldCardData } from '@/lib/story-pack';
import CharacterCard from '@/components/CharacterCard';

interface LandingProps {
  packs: ClientStoryPack[];
  worlds: WorldCardData[];
}

type TabId = 'all' | string;

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
    <section className="mt-6">
      <div className="flex items-center gap-2 mb-3 px-4">
        <h2 className="text-base font-bold text-[var(--color-text)]">커뮤니티 월드</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
          NEW
        </span>
      </div>
      {worlds.map((world) => (
        <WorldSection key={world.id} world={world} />
      ))}
    </section>
  );
}

/** A single world section: title + horizontal character carousel */
function WorldSection({ world }: { world: WorldCardData }) {
  const slug = world.slug ?? world.id;
  const npcChars = world.characters.filter(c => c.role);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between px-4 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🌏</span>
          <h3 className="text-sm font-bold text-[var(--color-text)] truncate">{world.name}</h3>
        </div>
        <span className="text-[11px] text-[var(--color-text-dim)] shrink-0">{npcChars.length}캐릭터</span>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
        {npcChars.map((char) => (
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
          />
        ))}
      </div>
    </section>
  );
}

export default function Landing({ packs, worlds }: LandingProps) {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const allTags = Array.from(
    new Set(worlds.flatMap((w) => w.tags))
  ).sort((a, b) => a.localeCompare(b, 'ko'));

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: '전체' },
    ...allTags.slice(0, 5).map((tag) => ({ id: tag, label: tag })),
  ];

  const filtered =
    activeTab === 'all'
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

  return (
    <div className="h-screen w-screen bg-[var(--color-bg)] flex justify-center overflow-hidden">
      <div className="w-full max-w-2xl h-full bg-[var(--color-bg)] relative md:border-x md:border-[var(--color-border-subtle)] md:shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col overflow-y-auto">

        {/* Simple header */}
        <header className="shrink-0 px-4 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'var(--color-brand-gradient)',
                boxShadow: '0 0 20px rgba(168,85,247,0.4)',
              }}
            >
              <span className="text-white text-sm font-black tracking-tight">N</span>
            </div>
            <span
              className="text-xl font-black tracking-tight"
              style={{
                background: 'var(--color-brand-gradient-text)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Novel
            </span>
          </div>

          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="size-9 rounded-xl flex items-center justify-center text-[var(--color-text-dim)] hover:text-white/60 hover:bg-white/[0.06] transition-colors"
            aria-label="검색"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </header>

        {/* Search (inline, toggled) */}
        {searchOpen && (
          <div className="shrink-0 px-4 pb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="캐릭터, 세계 검색..."
              autoFocus
              className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-purple-500/30"
            />
          </div>
        )}

        {/* Category tabs */}
        <div className="shrink-0 px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="shrink-0 px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 active:scale-95"
                  style={
                    isActive
                      ? {
                          background: 'linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(236,72,153,0.3) 100%)',
                          color: '#e2b8ff',
                          border: '1px solid rgba(168,85,247,0.4)',
                          boxShadow: '0 0 12px rgba(168,85,247,0.2)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--color-text-dim)',
                          border: '1px solid var(--color-border-subtle)',
                        }
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* World sections (character carousel per world) */}
        <main className="flex-1 overflow-y-auto pb-24">
          {searched.length === 0 && searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-[var(--color-text-dim)] text-sm">
                &apos;{searchQuery}&apos; 검색 결과 없음
              </p>
            </div>
          ) : searched.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-[var(--color-text-dim)] text-sm">세계가 없습니다.</p>
            </div>
          ) : (
            searched.map((world) => (
              <WorldSection key={world.id} world={world} />
            ))
          )}

          <CommunityWorlds />
        </main>

        {/* Spacer for fixed BottomNav */}
        <div className="shrink-0 h-16" />
      </div>
    </div>
  );
}
