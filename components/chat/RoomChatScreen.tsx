'use client';

import React from 'react';
import type { ClientStoryPack, CharacterMeta } from '@/lib/story-pack';
import type { RoomMessage } from '@/lib/room';
import { RoomMessageBubble, CharAvatar } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MentionInput } from './MentionInput';
import { RelationshipIndicator } from './RelationshipIndicator';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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

type Character = CharacterMeta;

function InviteNpcMenu({
  pack,
  activeNpcIds,
  onInvite,
}: {
  pack: ClientStoryPack;
  activeNpcIds: string[];
  onInvite: (charId: string) => void;
}) {
  const invitable = pack.characters.filter((c) => !activeNpcIds.includes(c.id));
  if (invitable.length === 0) return null;
  return (
    <>
      <p className="px-3 pt-1.5 pb-1 text-[10px] text-white/30">NPC 초대</p>
      {invitable.map((char) => (
        <button
          key={char.id}
          onClick={() => onInvite(char.id)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
        >
          <CharAvatar char={char} size={24} imageSrc={`${pack.assetsBasePath}${char.image}`} />
          <span className={`text-xs ${char.accentText}`}>{char.fullName}</span>
        </button>
      ))}
      <div className="my-1 border-t border-white/[0.06]" />
    </>
  );
}

function ChatAvatarGroup({
  activeChars,
  npcChar,
  pack,
}: {
  activeChars: Character[];
  npcChar: Character;
  pack: ClientStoryPack;
}) {
  if (activeChars.length <= 1) {
    return (
      <CharAvatar char={npcChar} size={36} imageSrc={`${pack.assetsBasePath}${npcChar.image}`} />
    );
  }
  return (
    <div className="flex -space-x-2">
      {activeChars.slice(0, 3).map((c) => (
        <CharAvatar key={c.id} char={c} size={28} imageSrc={`${pack.assetsBasePath}${c.image}`} />
      ))}
    </div>
  );
}

function ChatHeaderTitle({
  activeChars,
  npcChar,
  playerCount,
  primaryNpcId,
  pack,
  onKickNpc,
}: {
  activeChars: Character[];
  npcChar: Character;
  playerCount: number;
  primaryNpcId: string;
  pack: ClientStoryPack;
  onKickNpc: (charId: string) => void;
}) {
  if (activeChars.length <= 1) {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`truncate text-sm font-bold ${npcChar.accentText}`}>
          {npcChar.fullName}
        </span>
        <span className="shrink-0 text-[10px] text-[var(--color-text-dim)]">·{playerCount}명</span>
      </div>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-white/90 transition-colors hover:text-white">
            {activeChars.map((c) => c.name).join(', ')}
          </span>
          <span className="shrink-0 text-[10px] text-[var(--color-text-dim)]">
            ·{playerCount}명
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-56 border-white/[0.08] bg-[var(--color-surface)] p-2"
      >
        <p className="px-2 py-1.5 text-[11px] text-white/40">참여 중인 캐릭터</p>
        {activeChars.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
            <CharAvatar char={c} size={24} imageSrc={`${pack.assetsBasePath}${c.image}`} />
            <span className={`flex-1 text-sm ${c.accentText}`}>{c.name}</span>
            {c.id !== primaryNpcId && (
              <button
                onClick={() => onKickNpc(c.id)}
                className="rounded px-1.5 py-0.5 text-[10px] text-red-400/60 transition-colors hover:bg-red-400/10 hover:text-red-400"
              >
                내보내기
              </button>
            )}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function EmptyMessages({
  loading,
  npcChar,
  pack,
}: {
  loading: boolean | undefined;
  npcChar: Character;
  pack: ClientStoryPack;
}) {
  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center opacity-50">
        <CharAvatar char={npcChar} size={56} imageSrc={`${pack.assetsBasePath}${npcChar.image}`} />
        <Spinner className="mt-4 size-5" style={{ color: npcChar.glow }} />
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center opacity-50">
      <CharAvatar char={npcChar} size={56} imageSrc={`${pack.assetsBasePath}${npcChar.image}`} />
      <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-dim)]">
        {npcChar.fullName}에게 말을 걸어보세요.
      </p>
    </div>
  );
}

function ChatInputBar({
  npcChar,
  pack,
  input,
  sending,
  activeNpcIds,
  mentionNpcChars,
  inputRef,
  onInputChange,
  onSend,
  onInvite,
  onMentionSelect,
  handleKeyDown,
}: {
  npcChar: Character;
  pack: ClientStoryPack;
  input: string;
  sending: boolean;
  activeNpcIds: string[];
  mentionNpcChars: Character[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onInvite: (charId: string) => void;
  onMentionSelect: (charId: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const inputTrimmed = input.trim();
  return (
    <div className="mx-auto flex max-w-3xl gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled={sending}
            className="size-10 shrink-0 rounded-2xl border-white/[0.06] text-white/40 hover:text-white/70"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-52 border-white/[0.08] bg-[#12121a] p-1.5"
        >
          <InviteNpcMenu pack={pack} activeNpcIds={activeNpcIds} onInvite={onInvite} />
          <button
            onClick={() => toast.info('음성 대화 기능은 준비 중이에요')}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-white/60 transition-colors hover:bg-white/[0.06]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
            음성 대화 <span className="ml-auto text-[10px] text-white/30">준비 중</span>
          </button>
          <button
            onClick={() => toast.info('이미지 생성 기능은 준비 중이에요')}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-white/60 transition-colors hover:bg-white/[0.06]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            이미지 생성 <span className="ml-auto text-[10px] text-white/30">준비 중</span>
          </button>
        </PopoverContent>
      </Popover>
      <MentionInput
        ref={inputRef}
        value={input}
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        onMentionSelect={onMentionSelect}
        npcChars={mentionNpcChars}
        disabled={sending}
        placeholder={
          mentionNpcChars.length > 0 ? '@이름으로 대상 지정...' : '대사 또는 (행동)을 입력하세요...'
        }
        className="h-auto min-w-0 rounded-2xl border-white/[0.06] bg-[var(--color-surface-2)] px-4 py-3 pr-6 text-base placeholder:text-[var(--color-text-dim)]"
        style={{
          borderColor: inputTrimmed ? `rgba(${npcChar.glowRgb},0.3)` : undefined,
          boxShadow: inputTrimmed ? `0 0 15px rgba(${npcChar.glowRgb},0.05)` : undefined,
        }}
      />
      <Button
        onClick={onSend}
        disabled={sending || !inputTrimmed}
        className={`h-auto rounded-2xl px-5 py-3 ${npcChar.btnBg} text-sm font-medium active:scale-95`}
        style={{
          boxShadow: !sending && inputTrimmed ? `0 0 20px rgba(${npcChar.glowRgb},0.2)` : undefined,
        }}
      >
        전송
      </Button>
    </div>
  );
}

function TypingIndicators({
  sending,
  respondingNpcId,
  npcChar,
  activeChars,
  npcChars,
  assetsBasePath,
}: {
  sending: boolean;
  respondingNpcId: string | null;
  npcChar: Character;
  activeChars: Character[];
  npcChars: Map<string, Character>;
  assetsBasePath: string;
}) {
  if (!sending) return null;
  const respondingChars = respondingNpcId
    ? [npcChars.get(respondingNpcId) ?? npcChar]
    : activeChars;
  return (
    <>
      {respondingChars.map((c) => (
        <TypingIndicator key={c.id} char={c} assetsBasePath={assetsBasePath} />
      ))}
    </>
  );
}

export function RoomChatScreen({
  npcChar,
  pack,
  messages,
  sending,
  input,
  onInputChange,
  onSend,
  onBack,
  onShare,
  onDeleteRoom,
  playerCount,
  myPlayerId,
  inputRef,
  scrollRef,
  loading,
  activeNpcIds,
  npcChars,
  onInvite,
  onKickNpc,
  onMentionSelect,
  respondingNpcId,
  primaryNpcId,
  roomId,
}: {
  npcChar: Character;
  pack: ClientStoryPack;
  messages: RoomMessage[];
  sending: boolean;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onBack: () => void;
  onShare: () => void;
  onDeleteRoom: () => void;
  playerCount: number;
  myPlayerId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  loading?: boolean;
  activeNpcIds: string[];
  npcChars: Map<string, Character>;
  onInvite: (charId: string) => void;
  onKickNpc: (charId: string) => void;
  onMentionSelect: (charId: string) => void;
  respondingNpcId: string | null;
  primaryNpcId: string;
  roomId: string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  const activeChars = activeNpcIds.map((id) => npcChars.get(id)).filter((c): c is Character => !!c);
  const mentionNpcChars = activeChars.length > 1 ? activeChars : [];

  return (
    <div className="flex h-full flex-col">
      <header
        className="slide-down flex items-center gap-3 px-4 py-3"
        style={{
          background: `linear-gradient(180deg, rgba(${npcChar.glowRgb},0.06), transparent)`,
          borderBottom: `1px solid rgba(${npcChar.glowRgb},0.08)`,
        }}
      >
        <button
          onClick={onBack}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80 lg:hidden"
          aria-label="홈으로"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <ChatAvatarGroup activeChars={activeChars} npcChar={npcChar} pack={pack} />
        <div className="min-w-0 flex-1">
          <ChatHeaderTitle
            activeChars={activeChars}
            npcChar={npcChar}
            playerCount={playerCount}
            primaryNpcId={primaryNpcId}
            pack={pack}
            onKickNpc={onKickNpc}
          />
        </div>
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80"
                aria-label="더보기"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 border-white/[0.08] bg-[var(--color-surface)]"
            >
              {activeNpcIds.length === 1 && (
                <DropdownMenuItem className="gap-2 text-xs" onSelect={(e) => e.preventDefault()}>
                  <RelationshipIndicator
                    roomId={roomId}
                    npcId={primaryNpcId}
                    glowRgb={npcChar.glowRgb}
                    glow={npcChar.glow}
                  />
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="gap-2 text-xs" onSelect={onShare}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                초대하기
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="gap-2 text-xs text-red-400 focus:text-red-400">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  나가기
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>방을 삭제할까요?</AlertDialogTitle>
              <AlertDialogDescription className="text-[var(--color-text-muted)]">
                이 방의 모든 대화 내용이 삭제됩니다. 이 작업은 되돌릴 수 없어요.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDeleteRoom}
                className="bg-destructive hover:bg-destructive/90 rounded-xl text-white"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <EmptyMessages loading={loading} npcChar={npcChar} pack={pack} />
          )}
          {messages.map((msg) => (
            <RoomMessageBubble
              key={msg.id}
              msg={msg}
              npcChar={npcChar}
              npcChars={npcChars}
              myPlayerId={myPlayerId}
              assetsBasePath={pack.assetsBasePath}
            />
          ))}
          <TypingIndicators
            sending={sending}
            respondingNpcId={respondingNpcId}
            npcChar={npcChar}
            activeChars={activeChars}
            npcChars={npcChars}
            assetsBasePath={pack.assetsBasePath}
          />
        </div>
      </div>

      <div
        className="px-4 py-3"
        style={{
          background: `linear-gradient(0deg, rgba(${npcChar.glowRgb},0.03), transparent)`,
          borderTop: `1px solid rgba(${npcChar.glowRgb},0.06)`,
        }}
      >
        {messages.length === 0 && (
          <p className="mb-2 text-center text-[10px] text-[var(--color-text-dim)] opacity-60">
            대사 외에 <span className="text-white/50">(행동)</span>{' '}
            <span className="text-white/50">(시간이동)</span>{' '}
            <span className="text-white/50">(전개방향)</span> 도 괄호로 지정할 수 있어요
          </p>
        )}
        <ChatInputBar
          npcChar={npcChar}
          pack={pack}
          input={input}
          sending={sending}
          activeNpcIds={activeNpcIds}
          mentionNpcChars={mentionNpcChars}
          inputRef={inputRef}
          onInputChange={onInputChange}
          onSend={onSend}
          onInvite={onInvite}
          onMentionSelect={onMentionSelect}
          handleKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
