'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useIsDesktop } from '@/hooks/useMediaQuery';
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
  lastMessage?: string;
  timestamp?: number;
}

export default function ChatHistory({ packs }: ChatHistoryProps) {
  const isDesktop = useIsDesktop();
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

  if (isDesktop) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-black text-gradient">내 대화</h1>
            <p className="text-[var(--color-text-secondary)] mt-2">이전 대화를 이어가세요</p>
          </header>

          <main>
            {sessions.length === 0 ? (
              <div 
                className="flex flex-col items-center justify-center py-20 text-center rounded-2xl"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-surface-2)' }}
                >
                  <MessageSquare className="w-8 h-8 text-[var(--color-text-muted)]" />
                </div>
                <p className="text-[var(--color-text-secondary)]">아직 대화 기록이 없어요</p>
                <Link 
                  href="/" 
                  className="mt-4 px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
                  style={{ 
                    background: 'var(--color-brand-gradient)',
                    color: 'white',
                  }}
                >
                  캐릭터를 만나러 가기 →
                </Link>
              </div>
            ) : (
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
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {entry.pack.title}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors shrink-0" />
                  </Link>
                ))}
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
        <Link href="/" className="text-[10px] text-[var(--color-text-dim)] hover:text-white/60 transition-colors">
          ← 홈
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">내 대화</h1>
        <p className="text-[11px] text-[var(--color-text-dim)] mt-1">이전 대화를 이어가세요</p>
      </header>

      <main className="px-5 pb-8">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <p className="text-[var(--color-text-dim)] text-sm">아직 대화 기록이 없어요</p>
            <Link href="/" className="mt-3 text-sm transition-colors" style={{ color: 'var(--color-brand-primary)' }}>
              캐릭터를 만나러 가기 →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((entry) => (
              <Link
                key={`${entry.slug}-${entry.npcId}`}
                href={`/${entry.slug}?room=${entry.roomId}&v=${entry.villageId}&npc=${entry.npcId}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03] group"
                style={{
                  border: `1px solid rgba(${entry.char.glowRgb},0.08)`,
                }}
              >
                {/* Avatar */}
                <div className="size-12 rounded-full overflow-hidden shrink-0 border border-white/[0.06]">
                  <img
                    src={`${entry.pack.assetsBasePath}${entry.char.image}`}
                    alt={entry.char.name}
                    className="w-full h-full object-cover object-[50%_10%]"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-sm font-bold ${entry.char.accentText}`}>
                      {entry.char.fullName}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-dim)] mt-0.5 truncate">
                    {entry.char.role} · {entry.pack.title}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-[var(--color-text-dim)] group-hover:text-white/60 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
