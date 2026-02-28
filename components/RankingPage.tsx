'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { Trophy, Medal, Award } from 'lucide-react';
import type { ClientStoryPack } from '@/lib/story-pack';
import { getAllCharacterStats } from '@/lib/character-stats';

interface RankingPageProps {
  packs: ClientStoryPack[];
}

interface RankedEntry {
  pack: ClientStoryPack;
  char: ClientStoryPack['characters'][number];
  totalMessages: number;
}

const RANK_ICONS = [Trophy, Medal, Award];
const RANK_COLORS = ['#fbbf24', '#94a3b8', '#cd7f32'];

export default function RankingPage({ packs }: RankingPageProps) {
  const isDesktop = useIsDesktop();
  const [stats, setStats] = useState<Record<string, { totalMessages: number }>>({});

  useEffect(() => {
    const all = getAllCharacterStats();
    setStats(all);
  }, []);

  const rankedCharacters = useMemo<RankedEntry[]>(() => {
    const entries: RankedEntry[] = [];
    for (const pack of packs) {
      for (const char of pack.characters) {
        const charStats = stats[char.id];
        entries.push({
          pack,
          char,
          totalMessages: charStats?.totalMessages ?? 0,
        });
      }
    }
    return entries.sort((a, b) => b.totalMessages - a.totalMessages);
  }, [packs, stats]);

  if (isDesktop) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-black text-gradient">인기 랭킹</h1>
            <p className="text-[var(--color-text-secondary)] mt-2">가장 많은 대화를 나눈 캐릭터</p>
          </header>

          <main>
            {rankedCharacters.length === 0 ? (
              <div 
                className="flex items-center justify-center py-20 rounded-2xl"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p className="text-[var(--color-text-muted)]">캐릭터가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankedCharacters.map((entry, i) => {
                  const charStats = stats[entry.char.id];
                  const rank = i + 1;
                  const isTop3 = i < 3;
                  const RankIcon = RANK_ICONS[i];
                  const rankColor = RANK_COLORS[i] || 'var(--color-text-muted)';

                  return (
                    <Link
                      href={`/${entry.pack.slug}?char=${entry.char.id}`}
                      key={entry.char.id}
                      className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-[var(--color-surface-hover)] group animate-slide-up"
                      style={{
                        background: 'var(--color-surface)',
                        border: `1px solid ${isTop3 ? `${rankColor}33` : 'rgba(255,255,255,0.06)'}`,
                        animationDelay: `${i * 30}ms`,
                      }}
                    >
                      {/* Rank */}
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ 
                          background: isTop3 ? `${rankColor}15` : 'var(--color-surface-2)',
                        }}
                      >
                        {isTop3 && RankIcon ? (
                          <RankIcon className="w-6 h-6" style={{ color: rankColor }} />
                        ) : (
                          <span className="text-lg font-bold text-[var(--color-text-muted)]">
                            {rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div 
                        className="size-14 rounded-xl overflow-hidden shrink-0"
                        style={{ 
                          border: `2px solid ${isTop3 ? rankColor : 'rgba(255,255,255,0.1)'}`,
                        }}
                      >
                        <img
                          src={`${entry.pack.assetsBasePath}${entry.char.image}`}
                          alt={entry.char.name}
                          className="w-full h-full object-cover object-[50%_10%]"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">{entry.char.fullName}</span>
                          {isTop3 && (
                            <span 
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ 
                                background: `${rankColor}20`,
                                color: rankColor,
                              }}
                            >
                              TOP {rank}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                          {entry.char.role}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {entry.pack.title}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold" style={{ color: isTop3 ? rankColor : 'var(--color-text)' }}>
                          {charStats?.totalMessages ?? 0}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">대화</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="min-h-screen">
      <header className="px-5 pt-10 pb-4">
        <Link href="/" className="text-[10px] text-[var(--color-text-dim)]">
          ← 홈
        </Link>
        <h1 className="text-2xl font-bold mt-2">인기 캐릭터</h1>
        <p className="text-[11px] text-[var(--color-text-dim)] mt-1">
          가장 많은 대화를 나눈 캐릭터
        </p>
      </header>

      <main className="px-5 pb-8">
        {rankedCharacters.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-[13px] text-[var(--color-text-dim)]">캐릭터가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {rankedCharacters.map((entry, i) => {
              const charStats = stats[entry.char.id];
              const rankColor = RANK_COLORS[i] || 'var(--color-text-dim)';

              return (
                <Link
                  href={`/${entry.pack.slug}?char=${entry.char.id}`}
                  key={entry.char.id}
                  className="flex items-center gap-3 py-3 border-b border-white/[0.04]"
                >
                  {/* Rank */}
                  <span
                    className="w-8 text-center text-lg font-black shrink-0"
                    style={{ color: rankColor }}
                  >
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  <div className="size-12 rounded-full overflow-hidden shrink-0">
                    <img
                      src={`${entry.pack.assetsBasePath}${entry.char.image}`}
                      alt={entry.char.name}
                      className="w-full h-full object-cover object-[50%_10%]"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold">{entry.char.fullName}</span>
                    <span className="text-[11px] text-[var(--color-text-dim)] ml-2">
                      {entry.char.role}
                    </span>
                  </div>

                  {/* Stats */}
                  <span className="text-[11px] text-[var(--color-text-dim)] shrink-0">
                    {charStats?.totalMessages ?? 0}회
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
