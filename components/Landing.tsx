'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { ClientStoryPack } from '@/lib/story-pack';
import type { WorldCardData } from '@/lib/story-pack';
import WorldCard from '@/components/WorldCard';

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
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-bold text-[var(--color-text)]">커뮤니티 월드</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
          NEW
        </span>
      </div>
      <div className="space-y-3">
        {worlds.map((world, i) => (
          <WorldCard key={world.id} world={world} index={i} />
        ))}
      </div>
    </div>
  );
}

export default function Landing({ packs, worlds }: LandingProps) {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all unique tags from worlds for tab filtering
  const allTags = Array.from(
    new Set(worlds.flatMap((w) => w.tags))
  ).sort((a, b) => a.localeCompare(b, 'ko'));

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: '전체' },
    ...allTags.slice(0, 5).map((tag) => ({ id: tag, label: tag })),
  ];

  // Filter by tab (tag-based)
  const filtered =
    activeTab === 'all'
      ? worlds
      : worlds.filter((w) => w.tags.includes(activeTab));

  // Search filter
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
    <div className="h-screen w-screen bg-black flex justify-center overflow-hidden">
      <div className="w-full max-w-[480px] h-full bg-[#08080d] relative md:border-x md:border-white/[0.06] md:shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col">

        {/* Hero section */}
        <div
          className="relative shrink-0 px-5 pt-12 pb-8 overflow-hidden"
          style={{
            background:
              'linear-gradient(160deg, rgba(168,85,247,0.12) 0%, rgba(236,72,153,0.08) 40%, transparent 70%)',
          }}
        >
          {/* Ambient blobs */}
          <div
            className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-15 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)' }}
          />

          <div className="relative">
            {/* Logo / App name */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                  boxShadow: '0 0 20px rgba(168,85,247,0.4)',
                }}
              >
                <span className="text-white text-sm font-black tracking-tight">N</span>
              </div>
              <span
                className="text-xl font-black tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #c084fc 0%, #f472b6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Novel
              </span>
            </div>

            <h1 className="text-[22px] font-bold text-[var(--color-text)] leading-tight mb-1.5">
              <span
                style={{
                  background: 'linear-gradient(135deg, #c084fc 0%, #f472b6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                살아있는 세계
              </span>
              에 들어가세요
            </h1>
            <p className="text-[12px] text-[var(--color-text-dim)] leading-relaxed">
              감정과 기억을 가진 캐릭터들이 만드는 몰입형 세계
            </p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="shrink-0 px-5 py-3 border-b border-white/[0.05]">
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
                          background:
                            'linear-gradient(135deg, rgba(168,85,247,0.3) 0%, rgba(236,72,153,0.3) 100%)',
                          color: '#e2b8ff',
                          border: '1px solid rgba(168,85,247,0.4)',
                          boxShadow: '0 0 12px rgba(168,85,247,0.2)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.05)',
                          color: 'var(--color-text-dim)',
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

        {/* Search bar */}
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-text-dim)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="세계 검색..."
                className="w-full bg-[var(--color-surface-2)] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-purple-500/30"
              />
            </div>
          </div>
        </div>

        {/* World card list */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
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
            <div className="space-y-3">
              {searched.map((world, i) => (
                <WorldCard key={world.id} world={world} index={i} />
              ))}
            </div>
          )}
          {/* Community worlds section */}
          <CommunityWorlds />
        </main>

        {/* Bottom navigation */}
        <nav
          className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-around px-2"
          style={{
            background:
              'linear-gradient(to top, rgba(8,8,13,0.98) 70%, rgba(8,8,13,0.85) 100%)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Home — active */}
          <Link href="/" className="flex flex-col items-center gap-1 px-4 py-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                stroke="#c084fc"
                strokeWidth="1.8"
                strokeLinejoin="round"
                fill="rgba(192,132,252,0.12)"
              />
            </svg>
            <span className="text-[10px] font-semibold" style={{ color: '#c084fc' }}>
              홈
            </span>
          </Link>

          {/* Chat — inactive */}
          <Link href="/chats" className="flex flex-col items-center gap-1 px-4 py-1 opacity-50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                stroke="var(--color-text-dim)"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[10px] font-medium text-[var(--color-text-dim)]">채팅</span>
          </Link>

          {/* Create — inactive */}
          <Link href="/create" className="flex flex-col items-center gap-1 px-4 py-1 opacity-50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="var(--color-text-dim)" strokeWidth="1.8" />
              <path
                d="M12 8v8M8 12h8"
                stroke="var(--color-text-dim)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10px] font-medium text-[var(--color-text-dim)]">만들기</span>
          </Link>

          {/* My — inactive */}
          <Link href="/my" className="flex flex-col items-center gap-1 px-4 py-1 opacity-50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="var(--color-text-dim)" strokeWidth="1.8" />
              <path
                d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7"
                stroke="var(--color-text-dim)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10px] font-medium text-[var(--color-text-dim)]">마이</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
