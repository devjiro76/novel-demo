'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { Trophy, Medal, Award, Users, Globe, ChevronRight } from 'lucide-react';
import type { ClientStoryPack, WorldCardData } from '@/lib/story-pack';
import { getAllCharacterStats } from '@/lib/character-stats';

interface RankingPageProps {
  packs: ClientStoryPack[];
  worlds: WorldCardData[];
}

interface CharacterRankEntry {
  type: 'character';
  pack: ClientStoryPack;
  char: ClientStoryPack['characters'][number];
  totalMessages: number;
}

interface WorldRankEntry {
  type: 'world';
  world: WorldCardData;
  totalMessages: number;
  characterCount: number;
}

type RankEntry = CharacterRankEntry | WorldRankEntry;
type RankType = 'characters' | 'worlds';

const RANK_ICONS = [Trophy, Medal, Award];
const RANK_COLORS = ['#fbbf24', '#94a3b8', '#cd7f32'];

export default function RankingPage({ packs, worlds }: RankingPageProps) {
  const isDesktop = useIsDesktop();
  const [rankType, setRankType] = useState<RankType>('characters');
  const [stats, setStats] = useState<Record<string, { totalMessages: number }>>({});

  useEffect(() => {
    const all = getAllCharacterStats();
    setStats(all);
  }, []);

  // Character rankings
  const characterRankings = useMemo<CharacterRankEntry[]>(() => {
    const entries: CharacterRankEntry[] = [];
    for (const pack of packs) {
      for (const char of pack.characters) {
        const charStats = stats[char.id];
        entries.push({
          type: 'character',
          pack,
          char,
          totalMessages: charStats?.totalMessages ?? 0,
        });
      }
    }
    return entries.sort((a, b) => b.totalMessages - a.totalMessages);
  }, [packs, stats]);

  // World rankings
  const worldRankings = useMemo<WorldRankEntry[]>(() => {
    return worlds.map(world => {
      const worldChars = world.characters.filter(c => c.role);
      let totalMessages = 0;
      worldChars.forEach(char => {
        const charStats = stats[char.id];
        totalMessages += charStats?.totalMessages ?? 0;
      });
      return {
        type: 'world' as const,
        world,
        totalMessages,
        characterCount: worldChars.length,
      };
    }).sort((a, b) => b.totalMessages - a.totalMessages);
  }, [worlds, stats]);

  const header = (
    <header className={isDesktop ? 'mb-8' : 'px-5 pt-10 pb-4'}>
      {isDesktop ? (
        <>
          <h1 className="text-3xl font-black text-gradient">인기 랭킹</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">인기 있는 캐릭터와 월드</p>
        </>
      ) : (
        <>
          <Link href="/" className="text-[10px] text-[var(--color-text-dim)]">← 홈</Link>
          <h1 className="text-2xl font-bold mt-2">인기 랭킹</h1>
          <p className="text-[11px] text-[var(--color-text-dim)] mt-1">인기 있는 캐릭터와 월드</p>
        </>
      )}
    </header>
  );

  const typeToggle = (
    <div className={`flex gap-2 ${isDesktop ? 'mb-6' : 'px-5 mb-4'}`}>
      <button
        onClick={() => setRankType('characters')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
        style={{
          background: rankType === 'characters' ? 'var(--color-surface)' : 'transparent',
          border: '1px solid rgba(255,255,255,0.06)',
          color: rankType === 'characters' ? 'var(--color-text)' : 'var(--color-text-muted)',
        }}
      >
        <Users className="w-4 h-4" />
        캐릭터
      </button>
      <button
        onClick={() => setRankType('worlds')}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
        style={{
          background: rankType === 'worlds' ? 'var(--color-surface)' : 'transparent',
          border: '1px solid rgba(255,255,255,0.06)',
          color: rankType === 'worlds' ? 'var(--color-text)' : 'var(--color-text-muted)',
        }}
      >
        <Globe className="w-4 h-4" />
        월드
      </button>
    </div>
  );

  const renderCharacterRank = (entry: CharacterRankEntry, index: number) => {
    const charStats = stats[entry.char.id];
    const rank = index + 1;
    const isTop3 = index < 3;
    const RankIcon = RANK_ICONS[index];
    const rankColor = RANK_COLORS[index] || 'var(--color-text-muted)';

    if (isDesktop) {
      return (
        <Link
          href={`/${entry.pack.slug}?char=${entry.char.id}`}
          key={entry.char.id}
          className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-[var(--color-surface-hover)] group animate-slide-up"
          style={{
            background: 'var(--color-surface)',
            border: `1px solid ${isTop3 ? `${rankColor}33` : 'rgba(255,255,255,0.06)'}`,
            animationDelay: `${index * 30}ms`,
          }}
        >
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: isTop3 ? `${rankColor}15` : 'var(--color-surface-2)' }}
          >
            {isTop3 && RankIcon ? (
              <RankIcon className="w-6 h-6" style={{ color: rankColor }} />
            ) : (
              <span className="text-lg font-bold text-[var(--color-text-muted)]">{rank}</span>
            )}
          </div>

          <div 
            className="size-14 rounded-xl overflow-hidden shrink-0"
            style={{ border: `2px solid ${isTop3 ? rankColor : 'rgba(255,255,255,0.1)'}` }}
          >
            <img
              src={`${entry.pack.assetsBasePath}${entry.char.image}`}
              alt={entry.char.name}
              className="w-full h-full object-cover object-[50%_10%]"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">{entry.char.fullName}</span>
              {isTop3 && (
                <span 
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${rankColor}20`, color: rankColor }}
                >
                  TOP {rank}
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{entry.char.role}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{entry.pack.title}</p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xl font-bold" style={{ color: isTop3 ? rankColor : 'var(--color-text)' }}>
              {charStats?.totalMessages ?? 0}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">대화</p>
          </div>
        </Link>
      );
    }

    // Mobile
    return (
      <Link
        href={`/${entry.pack.slug}?char=${entry.char.id}`}
        key={entry.char.id}
        className="flex items-center gap-3 py-3 border-b border-white/[0.04]"
      >
        <span className="w-8 text-center text-lg font-black shrink-0" style={{ color: rankColor }}>
          {rank}
        </span>
        <div className="size-12 rounded-full overflow-hidden shrink-0">
          <img
            src={`${entry.pack.assetsBasePath}${entry.char.image}`}
            alt={entry.char.name}
            className="w-full h-full object-cover object-[50%_10%]"
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold">{entry.char.fullName}</span>
          <span className="text-[11px] text-[var(--color-text-dim)] ml-2">{entry.char.role}</span>
        </div>
        <span className="text-[11px] text-[var(--color-text-dim)] shrink-0">
          {charStats?.totalMessages ?? 0}회
        </span>
      </Link>
    );
  };

  const renderWorldRank = (entry: WorldRankEntry, index: number) => {
    const rank = index + 1;
    const isTop3 = index < 3;
    const RankIcon = RANK_ICONS[index];
    const rankColor = RANK_COLORS[index] || 'var(--color-text-muted)';
    const firstChar = entry.world.characters.find(c => c.role);

    if (isDesktop) {
      return (
        <Link
          href={`/world/${entry.world.id}`}
          key={entry.world.id}
          className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-[var(--color-surface-hover)] group animate-slide-up"
          style={{
            background: 'var(--color-surface)',
            border: `1px solid ${isTop3 ? `${rankColor}33` : 'rgba(255,255,255,0.06)'}`,
            animationDelay: `${index * 30}ms`,
          }}
        >
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: isTop3 ? `${rankColor}15` : 'var(--color-surface-2)' }}
          >
            {isTop3 && RankIcon ? (
              <RankIcon className="w-6 h-6" style={{ color: rankColor }} />
            ) : (
              <span className="text-lg font-bold text-[var(--color-text-muted)]">{rank}</span>
            )}
          </div>

          <div 
            className="size-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-2xl"
            style={{ 
              background: firstChar ? `rgba(${firstChar.glowRgb},0.2)` : 'var(--color-surface-2)',
              border: `2px solid ${isTop3 ? rankColor : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {firstChar?.image ? (
              <img src={firstChar.image} alt="" className="w-full h-full object-cover" />
            ) : (
              '🌏'
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">{entry.world.name}</span>
              {isTop3 && (
                <span 
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${rankColor}20`, color: rankColor }}
                >
                  TOP {rank}
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">
              {entry.world.description}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {entry.characterCount}개 캐릭터
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xl font-bold" style={{ color: isTop3 ? rankColor : 'var(--color-text)' }}>
              {entry.totalMessages}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">대화</p>
          </div>
        </Link>
      );
    }

    // Mobile
    return (
      <Link
        href={`/world/${entry.world.id}`}
        key={entry.world.id}
        className="flex items-center gap-3 py-3 border-b border-white/[0.04]"
      >
        <span className="w-8 text-center text-lg font-black shrink-0" style={{ color: rankColor }}>
          {rank}
        </span>
        <div 
          className="size-12 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: firstChar ? `rgba(${firstChar.glowRgb},0.2)` : 'var(--color-surface-2)' }}
        >
          {firstChar?.image ? (
            <img src={firstChar.image} alt="" className="w-full h-full object-cover" />
          ) : (
            '🌏'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold">{entry.world.name}</span>
          <span className="text-[11px] text-[var(--color-text-dim)] ml-2">
            {entry.characterCount}캐릭터
          </span>
        </div>
        <span className="text-[11px] text-[var(--color-text-dim)] shrink-0">
          {entry.totalMessages}회
        </span>
      </Link>
    );
  };

  const currentRankings = rankType === 'characters' ? characterRankings : worldRankings;

  const content = (
    <main className={isDesktop ? '' : 'px-5 pb-8'}>
      {currentRankings.length === 0 ? (
        <div className={isDesktop 
          ? 'flex items-center justify-center py-20 rounded-2xl' 
          : 'flex items-center justify-center h-40'
        } style={isDesktop ? {
          background: 'var(--color-surface)',
          border: '1px solid rgba(255,255,255,0.06)',
        } : {}}>
          <p className="text-[var(--color-text-muted)]">
            {rankType === 'characters' ? '캐릭터가 없습니다.' : '월드가 없습니다.'}
          </p>
        </div>
      ) : (
        <div className={isDesktop ? 'space-y-3' : 'space-y-1'}>
          {currentRankings.map((entry, index) => 
            entry.type === 'character' 
              ? renderCharacterRank(entry, index)
              : renderWorldRank(entry, index)
          )}
        </div>
      )}
    </main>
  );

  // Desktop Layout
  if (isDesktop) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto">
          {header}
          {typeToggle}
          {content}
        </div>
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="min-h-screen">
      {header}
      {typeToggle}
      {content}
    </div>
  );
}
