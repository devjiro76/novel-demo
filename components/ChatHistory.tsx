'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageLayout, PageCard } from '@/components/layout';
import { MessageSquare, ChevronRight } from 'lucide-react';
import type { ClientStoryPack, CharacterMeta } from '@/lib/story-pack';

interface ChatHistoryProps {
  packs: ClientStoryPack[];
}

interface SessionEntry {
  slug: string;
  npcId: string;
  roomId: string;
  villageId: string;
  char: CharacterMeta;
  pack: ClientStoryPack;
}

export default function ChatHistory({ packs }: ChatHistoryProps) {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);

  useEffect(() => {
    const entries: SessionEntry[] = [];
    for (const pack of packs) {
      try {
        const storageKey = `novel:${pack.slug}`;
        const raw = localStorage.getItem(`${storageKey}:session`);
        if (raw) {
          const session = JSON.parse(raw);
          const char = pack.characters.find(c => c.id === session.npcId);
          if (char) {
            entries.push({
              slug: pack.slug,
              npcId: session.npcId,
              roomId: session.roomId,
              villageId: session.villageId,
              char,
              pack,
            });
          }
        }
      } catch {}
    }
    setSessions(entries);
  }, [packs]);

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--color-surface)' }}
      >
        <MessageSquare className="w-8 h-8 text-[var(--color-text-muted)]" />
      </div>
      <p className="text-[var(--color-text-secondary)]">아직 대화 기록이 없어요</p>
      <Link 
        href="/" 
        className="mt-4 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
        style={{ background: 'var(--color-brand-gradient)' }}
      >
        캐릭터를 만나러 가기 →
      </Link>
    </div>
  );

  const sessionList = (
    <div className="space-y-3">
      {sessions.map((entry, index) => (
        <Link
          key={`${entry.slug}-${entry.npcId}`}
          href={`/${entry.slug}?room=${entry.roomId}&v=${entry.villageId}&npc=${entry.npcId}`}
          className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-[var(--color-surface-hover)] group animate-slide-up"
          style={{
            background: 'var(--color-surface)',
            border: `1px solid rgba(${entry.char.glowRgb},0.1)`,
            animationDelay: `${index * 50}ms`,
          }}
        >
          {/* Avatar */}
          <div 
            className="size-14 rounded-xl overflow-hidden shrink-0"
            style={{ border: `2px solid rgba(${entry.char.glowRgb},0.3)` }}
          >
            <img
              src={`${entry.pack.assetsBasePath}${entry.char.image}`}
              alt={entry.char.name}
              className="w-full h-full object-cover object-[50%_10%]"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold" style={{ color: entry.char.glow }}>
                {entry.char.fullName}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {entry.char.age}세
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
              {entry.char.role}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {entry.pack.title}
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors shrink-0" />
        </Link>
      ))}
    </div>
  );

  return (
    <PageLayout 
      title="내 대화" 
      subtitle="이전 대화를 이어가세요" 
      width="md"
      showBackButton
    >
      {sessions.length === 0 ? emptyState : sessionList}
    </PageLayout>
  );
}
