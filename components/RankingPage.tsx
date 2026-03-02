'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { PageLayout, PageCard } from '@/components/layout';
import { Trophy, Medal, Award, Users, Globe } from 'lucide-react';
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

  const typeToggle = (
    <div className="flex gap-2 mb-6">
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
    </div>
  );

  const renderRankItem = (entry: RankEntry, index: number) => {
    const rank = index + 1;
    const isTop3 = index < 3;
    const RankIcon = RANK_ICONS[index];
    const rankColor = RANK_COLORS[index] || 'var(--color-text-muted)';

    const rankBadge = (
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
    );

    if (entry.type === 'character') {
      const charStats = stats[entry.char.id];
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
          {rankBadge}
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
    } else {
      const firstChar = entry.world.characters.find(c => c.role);
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
          {rankBadge}
          <div 
            className="size-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-2xl"
            style={{ 
              background: firstChar ? `rgba(${firstChar.glowRgb},0.2)` : 'var(--color-surface-2)',
              border: `2px solid ${isTop3 ? rankColor : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {firstChar?.image ? (
              <img src={firstChar.image} alt="" className="w-full h-full object-cover" />
            ) : '🌏'}
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
  };

  const currentRankings = rankType === 'characters' ? characterRankings : worldRankings;

  const content = (
    <>
      {typeToggle}
      {currentRankings.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-[var(--color-text-muted)]">
            {rankType === 'worlds' ? '월드가 없습니다.' : '캐릭터가 없습니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentRankings.map((entry, index) => renderRankItem(entry, index))}
        </div>
      )}
    </>
  );

  return (
    <PageLayout 
      title="인기 랭킹" 
      subtitle="인기 있는 월드와 캐릭터" 
      width="lg"
      showBackButton
    >
      {content}
    </PageLayout>
  );
}
