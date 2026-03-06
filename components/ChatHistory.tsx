'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppContainer, PageHeader } from '@/components/layout/AppContainer';
import { MessageSquare, ChevronRight, Trash2 } from 'lucide-react';
import type { ClientStoryPack, CharacterMeta } from '@/lib/story-pack';
import { deleteRoomAPI } from '@/lib/api-client-room';
import { clearSession } from '@/lib/session';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface ChatHistoryProps {
  packs: ClientStoryPack[];
}

interface SessionEntry {
  slug: string;
  npcId: string;
  roomId: string;
  worldId: string;
  char: CharacterMeta;
  pack: ClientStoryPack;
}

export default function ChatHistory({ packs }: ChatHistoryProps) {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const entries: SessionEntry[] = [];
    for (const pack of packs) {
      try {
        const storageKey = `novel:${pack.slug}`;
        const raw = localStorage.getItem(`${storageKey}:session`);
        if (raw) {
          const session = JSON.parse(raw);
          const char = pack.characters.find((c) => c.id === session.npcId);
          if (char) {
            entries.push({
              slug: pack.slug,
              npcId: session.npcId,
              roomId: session.roomId,
              worldId: session.worldId,
              char,
              pack,
            });
          }
        }
      } catch {
        /* ignored */
      }
    }
    setSessions(entries);
  }, [packs]);

  const handleDeleteSession = useCallback(async (entry: SessionEntry) => {
    const key = `${entry.slug}-${entry.npcId}`;
    setDeletingId(key);
    try {
      await deleteRoomAPI(entry.roomId);
      const storageKey = `novel:${entry.slug}`;
      clearSession(storageKey);
      try {
        localStorage.removeItem(`${storageKey}:worldId`);
      } catch {
        /* ignored */
      }
      setSessions((prev) =>
        prev.filter((s) => !(s.slug === entry.slug && s.npcId === entry.npcId)),
      );
      toast.success('대화가 삭제되었습니다');
    } catch {
      toast.error('삭제에 실패했습니다');
    } finally {
      setDeletingId(null);
    }
  }, []);

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'var(--color-surface)' }}
      >
        <MessageSquare className="h-8 w-8 text-[var(--color-text-muted)]" />
      </div>
      <p className="text-[var(--color-text-secondary)]">아직 대화 기록이 없어요</p>
      <Link
        href="/"
        className="mt-4 rounded-xl px-6 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
        style={{ background: 'var(--color-brand-gradient)' }}
      >
        캐릭터를 만나러 가기 →
      </Link>
    </div>
  );

  const sessionList = (
    <div className="space-y-3">
      {sessions.map((entry, index) => {
        const key = `${entry.slug}-${entry.npcId}`;
        const isDeleting = deletingId === key;
        return (
          <div
            key={key}
            className="group animate-slide-up relative flex items-center gap-4 rounded-2xl p-4 transition-all"
            style={{
              background: 'var(--color-surface)',
              border: `1px solid rgba(${entry.char.glowRgb},0.1)`,
              animationDelay: `${index * 50}ms`,
              opacity: isDeleting ? 0.5 : undefined,
            }}
          >
            <Link
              href={`/${entry.slug}?room=${entry.roomId}&v=${entry.worldId}&npc=${entry.npcId}`}
              className="flex min-w-0 flex-1 items-center gap-4 transition-opacity hover:opacity-80"
            >
              {/* Avatar */}
              <div
                className="size-14 shrink-0 overflow-hidden rounded-xl"
                style={{ border: `2px solid rgba(${entry.char.glowRgb},0.3)` }}
              >
                <img
                  src={`${entry.pack.assetsBasePath}${entry.char.image}`}
                  alt={entry.char.name}
                  className="h-full w-full object-cover object-[50%_10%]"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold" style={{ color: entry.char.glow }}>
                    {entry.char.fullName}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{entry.char.age}세</span>
                </div>
                <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                  {entry.char.role}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">{entry.pack.title}</p>
              </div>

              {/* Arrow */}
              <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text)]" />
            </Link>

            {/* Delete button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={isDeleting}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white/20 transition-colors hover:bg-red-400/10 hover:text-red-400"
                  aria-label="대화 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>대화를 삭제할까요?</AlertDialogTitle>
                  <AlertDialogDescription className="text-[var(--color-text-muted)]">
                    {entry.char.fullName}와의 모든 대화 내용이 삭제됩니다. 이 작업은 되돌릴 수
                    없어요.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteSession(entry)}
                    className="bg-destructive hover:bg-destructive/90 rounded-xl text-white"
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      })}
    </div>
  );

  return (
    <AppContainer>
      <PageHeader title="내 대화" subtitle="이전 대화를 이어가세요" />
      {sessions.length === 0 ? emptyState : sessionList}
    </AppContainer>
  );
}
