'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout';
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

function getRankMeta(index: number) {
  const rank = index + 1;
  const isTop3 = index < 3;
  const rankColor = RANK_COLORS[index] || 'var(--color-text-muted)';
  return { rank, isTop3, rankColor };
}

function RankBadge({ index }: { index: number }) {
  const { rank, isTop3, rankColor } = getRankMeta(index);
  const RankIcon = RANK_ICONS[index];
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
      style={{ background: isTop3 ? `${rankColor}15` : 'var(--color-surface-2)' }}
    >
      {isTop3 && RankIcon ? (
        <RankIcon className="h-6 w-6" style={{ color: rankColor }} />
      ) : (
        <span className="text-lg font-bold text-[var(--color-text-muted)]">{rank}</span>
      )}
    </div>
  );
}

function TopBadge({ rank, color }: { rank: number; color: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: `${color}20`, color }}
    >
      TOP {rank}
    </span>
  );
}

function RankItemWrapper({
  index,
  id,
  href,
  children,
}: {
  index: number;
  id: string;
  href: string;
  children: React.ReactNode;
}) {
  const { isTop3, rankColor } = getRankMeta(index);
  return (
    <Link
      href={href}
      key={id}
      className="group animate-slide-up flex items-center gap-4 rounded-2xl p-4 transition-all hover:bg-[var(--color-surface-hover)]"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${isTop3 ? `${rankColor}33` : 'rgba(255,255,255,0.06)'}`,
        animationDelay: `${index * 30}ms`,
      }}
    >
      {children}
    </Link>
  );
}

function CharacterRankItem({
  entry,
  index,
  stats,
}: {
  entry: CharacterRankEntry;
  index: number;
  stats: Record<string, { totalMessages: number }>;
}) {
  const { rank, isTop3, rankColor } = getRankMeta(index);
  const charStats = stats[entry.char.id];
  return (
    <RankItemWrapper
      index={index}
      id={entry.char.id}
      href={`/${entry.pack.slug}?char=${entry.char.id}`}
    >
      <RankBadge index={index} />
      <div
        className="size-14 shrink-0 overflow-hidden rounded-xl"
        style={{ border: `2px solid ${isTop3 ? rankColor : 'rgba(255,255,255,0.1)'}` }}
      >
        <img
          src={`${entry.pack.assetsBasePath}${entry.char.image}`}
          alt={entry.char.name}
          className="h-full w-full object-cover object-[50%_10%]"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">{entry.char.fullName}</span>
          {isTop3 && <TopBadge rank={rank} color={rankColor} />}
        </div>
        <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{entry.char.role}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{entry.pack.title}</p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className="text-xl font-bold"
          style={{ color: isTop3 ? rankColor : 'var(--color-text)' }}
        >
          {charStats?.totalMessages ?? 0}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">대화</p>
      </div>
    </RankItemWrapper>
  );
}

function WorldRankItem({ entry, index }: { entry: WorldRankEntry; index: number }) {
  const { rank, isTop3, rankColor } = getRankMeta(index);
  const firstChar = entry.world.characters.find((c) => c.role);
  const avatarBg = firstChar ? `rgba(${firstChar.glowRgb},0.2)` : 'var(--color-surface-2)';
  return (
    <RankItemWrapper index={index} id={entry.world.id} href={`/world/${entry.world.id}`}>
      <RankBadge index={index} />
      <div
        className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl"
        style={{
          background: avatarBg,
          border: `2px solid ${isTop3 ? rankColor : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        {firstChar?.image ? (
          <img src={firstChar.image} alt="" className="h-full w-full object-cover" />
        ) : (
          '🌏'
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">{entry.world.name}</span>
          {isTop3 && <TopBadge rank={rank} color={rankColor} />}
        </div>
        <p className="mt-0.5 line-clamp-1 text-sm text-[var(--color-text-secondary)]">
          {entry.world.description}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">{entry.characterCount}개 캐릭터</p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className="text-xl font-bold"
          style={{ color: isTop3 ? rankColor : 'var(--color-text)' }}
        >
          {entry.totalMessages}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">대화</p>
      </div>
    </RankItemWrapper>
  );
}

export default function RankingPage({ packs, worlds }: RankingPageProps) {
  const [rankType, setRankType] = useState<RankType>('characters');
  const [stats, setStats] = useState<Record<string, { totalMessages: number }>>({});

  useEffect(() => {
    const all = getAllCharacterStats();
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    return worlds
      .map((world) => {
        const worldChars = world.characters.filter((c) => c.role);
        let totalMessages = 0;
        worldChars.forEach((char) => {
          const charStats = stats[char.id];
          totalMessages += charStats?.totalMessages ?? 0;
        });
        return {
          type: 'world' as const,
          world,
          totalMessages,
          characterCount: worldChars.length,
        };
      })
      .sort((a, b) => b.totalMessages - a.totalMessages);
  }, [worlds, stats]);

  const typeToggle = (
    <div className="mb-6 flex gap-2">
      <button
        onClick={() => setRankType('worlds')}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
        style={{
          background: rankType === 'worlds' ? 'var(--color-surface)' : 'transparent',
          border: '1px solid rgba(255,255,255,0.06)',
          color: rankType === 'worlds' ? 'var(--color-text)' : 'var(--color-text-muted)',
        }}
      >
        <Globe className="h-4 w-4" />
        월드
      </button>
      <button
        onClick={() => setRankType('characters')}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
        style={{
          background: rankType === 'characters' ? 'var(--color-surface)' : 'transparent',
          border: '1px solid rgba(255,255,255,0.06)',
          color: rankType === 'characters' ? 'var(--color-text)' : 'var(--color-text-muted)',
        }}
      >
        <Users className="h-4 w-4" />
        캐릭터
      </button>
    </div>
  );

  const renderRankItem = (entry: RankEntry, index: number) => {
    if (entry.type === 'character') {
      return <CharacterRankItem entry={entry} index={index} stats={stats} />;
    }
    return <WorldRankItem entry={entry} index={index} />;
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
    <PageLayout title="인기 랭킹" subtitle="인기 있는 월드와 캐릭터" width="lg" showBackButton>
      {content}
    </PageLayout>
  );
}
