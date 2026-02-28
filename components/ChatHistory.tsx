'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

  return (
    <div className="h-screen w-screen bg-black flex justify-center">
      <div className="w-full max-w-[480px] h-full bg-[#08080d] flex flex-col">
        <header className="px-5 pt-10 pb-4">
          <Link href="/" className="text-[10px] text-[var(--color-text-dim)] hover:text-white/60 transition-colors">
            ← 홈
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-2">내 대화</h1>
          <p className="text-[11px] text-[var(--color-text-dim)] mt-1">이전 대화를 이어가세요</p>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-8">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <p className="text-[var(--color-text-dim)] text-sm">아직 대화 기록이 없어요</p>
              <Link href="/" className="mt-3 text-purple-400 text-sm hover:text-purple-300 transition-colors">
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                       className="text-[var(--color-text-dim)] group-hover:text-white/60 transition-colors shrink-0"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* Bottom nav — "채팅" active */}
        <nav
          className="shrink-0 h-16 flex items-center justify-around px-2"
          style={{
            background: 'linear-gradient(to top, rgba(8,8,13,0.98) 70%, rgba(8,8,13,0.85) 100%)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Link href="/" className="flex flex-col items-center gap-1 px-4 py-1 opacity-50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                stroke="var(--color-text-dim)" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] font-medium text-[var(--color-text-dim)]">홈</span>
          </Link>

          <Link href="/chats" className="flex flex-col items-center gap-1 px-4 py-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                stroke="#c084fc" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(192,132,252,0.12)" />
            </svg>
            <span className="text-[10px] font-semibold" style={{ color: '#c084fc' }}>채팅</span>
          </Link>

          <Link href="/create" className="flex flex-col items-center gap-1 px-4 py-1 opacity-50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="var(--color-text-dim)" strokeWidth="1.8" />
              <path d="M12 8v8M8 12h8" stroke="var(--color-text-dim)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] font-medium text-[var(--color-text-dim)]">만들기</span>
          </Link>

          <Link href="/" className="flex flex-col items-center gap-1 px-4 py-1 opacity-50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="var(--color-text-dim)" strokeWidth="1.8" />
              <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7"
                stroke="var(--color-text-dim)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] font-medium text-[var(--color-text-dim)]">마이</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
