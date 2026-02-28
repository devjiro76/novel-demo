'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
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

export default function RankingPage({ packs }: RankingPageProps) {
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

  return (
    <div className="h-screen w-screen bg-black flex justify-center">
      <div className="w-full max-w-[480px] h-full bg-[#08080d] flex flex-col">
        <header className="px-5 pt-10 pb-4">
          <Link href="/" className="text-[10px] text-[var(--color-text-dim)]">
            &larr; 홈
          </Link>
          <h1 className="text-2xl font-bold mt-2">인기 캐릭터</h1>
          <p className="text-[11px] text-[var(--color-text-dim)] mt-1">
            가장 많은 대화를 나눈 캐릭터
          </p>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-8">
          {rankedCharacters.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-[13px] text-[var(--color-text-dim)]">캐릭터가 없습니다.</p>
            </div>
          ) : (
            rankedCharacters.map((entry, i) => {
              const charStats = stats[entry.char.id];
              const rankColor =
                i === 0
                  ? '#fbbf24'
                  : i === 1
                    ? '#94a3b8'
                    : i === 2
                      ? '#cd7f32'
                      : 'var(--color-text-dim)';

              return (
                <Link
                  href={`/${entry.pack.slug}?char=${entry.char.id}`}
                  key={entry.char.id}
                  className="flex items-center gap-3 py-3 border-b border-white/[0.04]"
                >
                  {/* 순위 번호 */}
                  <span
                    className="w-8 text-center text-lg font-black shrink-0"
                    style={{ color: rankColor }}
                  >
                    {i + 1}
                  </span>

                  {/* 아바타 */}
                  <div className="size-12 rounded-full overflow-hidden shrink-0">
                    <img
                      src={`${entry.pack.assetsBasePath}${entry.char.image}`}
                      alt={entry.char.name}
                      className="w-full h-full object-cover object-[50%_10%]"
                    />
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold">{entry.char.fullName}</span>
                    <span className="text-[11px] text-[var(--color-text-dim)] ml-2">
                      {entry.char.role}
                    </span>
                  </div>

                  {/* 통계 */}
                  <span className="text-[11px] text-[var(--color-text-dim)] shrink-0">
                    {charStats?.totalMessages ?? 0}회
                  </span>
                </Link>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
