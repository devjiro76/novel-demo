'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ClientStoryPack, CharacterMeta } from '@/lib/story-pack';
import { startGame } from '@/lib/api-client';
import { createRoomAPI, joinRoomAPI, sendRoomMessage, inviteNpcAPI, kickNpcAPI, deleteRoomAPI } from '@/lib/api-client-room';
import type { RoomMessage } from '@/lib/room';
import { saveSession, loadSession, clearSession } from '@/lib/session';
import { useRoomPolling } from '@/hooks/useRoomPolling';
import { RoomMessageBubble, CharAvatar } from './chat/MessageBubble';
import { TypingIndicator } from './chat/TypingIndicator';
import { InviteNpcPopover } from './chat/InviteNpcPopover';
import { MentionInput } from './chat/MentionInput';
import { RelationshipIndicator } from './chat/RelationshipIndicator';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogFooter, AlertDialogTitle,
  AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

type Phase = 'title' | 'loading' | 'select' | 'chat';
type Character = CharacterMeta;

function TitleScreen({ pack, onStart, loading }: { pack: ClientStoryPack; onStart: () => void; loading: boolean }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-end relative overflow-hidden">
      <div className="absolute inset-0">
        <picture>
          <source media="(min-width: 768px)" srcSet={`${pack.assetsBasePath}${pack.coverWide}`} />
          <img src={`${pack.assetsBasePath}${pack.coverTall}`} alt="" className="absolute inset-0 w-full h-full object-cover object-center opacity-40 blur-[2px] md:scale-110 md:opacity-50" />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/60 to-[var(--color-bg)]/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/80 via-transparent to-[var(--color-bg)]" />
      </div>
      <Link href="/" className="absolute top-5 left-5 z-20 text-sm text-white/30 hover:text-white/60 transition-colors p-2 lg:hidden">← 다른 이야기</Link>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full bg-pink-500/8 blur-[80px] breathe pointer-events-none" />
      <div className="relative z-10 text-center pb-20 px-6 slide-up">
        <img src={`${pack.assetsBasePath}${pack.logo}`} alt={pack.subtitle ?? pack.title} className="w-[280px] max-w-[80vw] mx-auto mb-8 drop-shadow-lg" />
        <p className="text-[12px] text-white/30 mb-8 leading-relaxed">당신은 <span className="text-pink-300/60 font-semibold">{pack.playerDisplayName}</span>입니다.</p>
        <Button onClick={onStart} disabled={loading} size="lg" className="relative px-12 py-4 h-auto rounded-2xl text-sm font-bold tracking-wide active:scale-95 overflow-hidden group" style={{ background: 'var(--color-brand-gradient)', boxShadow: '0 0 30px rgba(168,85,247,0.3), 0 4px 20px rgba(0,0,0,0.3)' }}>
          <span className="relative z-10">{loading ? <><Spinner className="size-4 inline mr-2" />준비 중...</> : '시작하기'}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </Button>
      </div>
    </div>
  );
}

function SelectCharacterCard({ char, pack, chatCount, onClick, delay, selecting }: { char: Character; pack: ClientStoryPack; chatCount: number; onClick: () => void; delay: number; selecting?: boolean }) {
  return (
    <button onClick={onClick} disabled={selecting} className="w-full text-left rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] group relative disabled:opacity-60" style={{ animationDelay: `${delay}ms`, animation: `slideUp 0.5s ease-out ${delay}ms both`, background: `linear-gradient(135deg, rgba(${char.glowRgb},0.06), rgba(${char.glowRgb},0.02))`, border: `1px solid rgba(${char.glowRgb},0.12)` }}>
      <div className="flex">
        <div className="relative w-24 shrink-0 overflow-hidden">
          <img src={`${pack.assetsBasePath}${char.image}`} alt={char.name} className="absolute inset-0 w-full h-full object-cover object-[50%_12%]" />
          <div className={`absolute inset-0 bg-gradient-to-r ${char.gradient}`} />
        </div>
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={`text-base font-bold ${char.accentText}`}>{char.fullName}</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{char.age}세</span>
          </div>
          <p className="text-[11px] text-[var(--color-text-dim)] mb-2">{char.role}</p>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line line-clamp-2">{char.desc}</p>
          {chatCount > 0 && (<div className="flex items-center gap-1 mt-2"><div className="w-1.5 h-1.5 rounded-full" style={{ background: char.glow, opacity: 0.5 }} /><p className="text-[10px] text-[var(--color-text-dim)]">{chatCount}개의 대화</p></div>)}
        </div>
      </div>
      {selecting && (<div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] rounded-2xl"><Spinner className="size-5" style={{ color: char.glow }} /></div>)}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ boxShadow: `inset 0 0 40px rgba(${char.glowRgb},0.05)` }} />
    </button>
  );
}

function SelectScreen({ pack, chatCounts, onSelect, selectingCharId }: { pack: ClientStoryPack; chatCounts: Record<string, number>; onSelect: (char: Character) => void; selectingCharId: string | null }) {
  return (
    <div className="h-full flex flex-col">
      <header className="px-5 pt-8 pb-5 lg:px-8 lg:pt-10">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-[10px] text-[var(--color-text-dim)] hover:text-white/60 transition-colors mb-2 block">← 홈으로</Link>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">누구에게 갈까?</h2>
          <p className="text-[11px] text-[var(--color-text-dim)] mt-1 tracking-wide">비밀은 지켜줄게.</p>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-5 pb-8 lg:px-8">
        <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-3">
          {pack.characters.map((char, i) => (
            <SelectCharacterCard key={char.id} char={char} pack={pack} chatCount={chatCounts[char.id] ?? 0} onClick={() => onSelect(char)} delay={i * 100} selecting={selectingCharId === char.id} />
          ))}
        </div>
      </main>
    </div>
  );
}

function RoomChatScreen({ npcChar, pack, messages, sending, input, onInputChange, onSend, onBack, onShare, onDeleteRoom, playerCount, myPlayerId, inputRef, scrollRef, loading, activeNpcIds, npcChars, onInvite, onKickNpc, onMentionSelect, respondingNpcId, primaryNpcId, roomId }: { npcChar: Character; pack: ClientStoryPack; messages: RoomMessage[]; sending: boolean; input: string; onInputChange: (v: string) => void; onSend: () => void; onBack: () => void; onShare: () => void; onDeleteRoom: () => void; playerCount: number; myPlayerId: string; inputRef: React.RefObject<HTMLInputElement | null>; scrollRef: React.RefObject<HTMLDivElement | null>; loading?: boolean; activeNpcIds: string[]; npcChars: Map<string, Character>; onInvite: (charId: string) => void; onKickNpc: (charId: string) => void; onMentionSelect: (charId: string) => void; respondingNpcId: string | null; primaryNpcId: string; roomId: string }) {
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } };
  const activeChars = activeNpcIds.map((id) => npcChars.get(id)).filter((c): c is Character => !!c);
  const mentionNpcChars = activeChars.length > 1 ? activeChars : [];

  return (
    <div className="h-full flex flex-col">
      <header className="px-4 py-3 flex items-center gap-3 slide-down" style={{ background: `linear-gradient(180deg, rgba(${npcChar.glowRgb},0.06), transparent)`, borderBottom: `1px solid rgba(${npcChar.glowRgb},0.08)` }}>
        <button onClick={onBack} className="shrink-0 size-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors lg:hidden" aria-label="홈으로">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        {activeChars.length <= 1 ? (
          <CharAvatar char={npcChar} size={36} imageSrc={`${pack.assetsBasePath}${npcChar.image}`} />
        ) : (
          <div className="flex -space-x-2">{activeChars.slice(0, 3).map((c) => (<CharAvatar key={c.id} char={c} size={28} imageSrc={`${pack.assetsBasePath}${c.image}`} />))}</div>
        )}
        <div className="flex-1 min-w-0">
          {activeChars.length <= 1 ? (
            <><span className={`text-sm font-bold ${npcChar.accentText}`}>{npcChar.fullName}</span><span className="text-[10px] text-[var(--color-text-dim)] ml-2">{npcChar.role}</span></>
          ) : (
            <Popover>
              <PopoverTrigger asChild><button className="text-sm font-bold text-white/90 hover:text-white transition-colors">{activeChars.map((c) => c.name).join(', ')}</button></PopoverTrigger>
              <PopoverContent side="bottom" align="start" className="w-56 p-2 bg-[var(--color-surface)] border-white/[0.08]">
                <p className="text-[11px] text-white/40 px-2 py-1.5">참여 중인 캐릭터</p>
                {activeChars.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                    <CharAvatar char={c} size={24} imageSrc={`${pack.assetsBasePath}${c.image}`} />
                    <span className={`flex-1 text-sm ${c.accentText}`}>{c.name}</span>
                    {c.id !== primaryNpcId && (<button onClick={() => onKickNpc(c.id)} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded hover:bg-red-400/10">내보내기</button>)}
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          )}
          <Badge variant="outline" className="ml-2 text-[10px] font-normal border-white/[0.08] gap-1">
            <span className="inline-block size-1.5 rounded-full animate-pulse" style={{ background: npcChar.glow }} />{playerCount}명
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {activeNpcIds.length === 1 && (<RelationshipIndicator roomId={roomId} npcId={primaryNpcId} glowRgb={npcChar.glowRgb} glow={npcChar.glow} />)}
          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="xs" onClick={onShare} className="text-[10px] text-[var(--color-text-dim)] hover:text-white/60 border-white/[0.06]">초대</Button></TooltipTrigger><TooltipContent>초대 링크 복사</TooltipContent></Tooltip>
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="xs" className="text-[10px] text-red-400/60 hover:text-red-400 border-white/[0.06] hover:border-red-400/30">나가기</Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>방 삭제 및 나가기</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>방을 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription className="text-[var(--color-text-muted)]">
                  이 방의 모든 대화 내용이 삭제됩니다. 이 작업은 되돌릴 수 없어요.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
                <AlertDialogAction onClick={onDeleteRoom} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">삭제</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-3xl mx-auto space-y-6">
        {loading && messages.length === 0 && (<div className="flex flex-col items-center justify-center h-full text-center px-8 opacity-50"><CharAvatar char={npcChar} size={56} imageSrc={`${pack.assetsBasePath}${npcChar.image}`} /><Spinner className="size-5 mt-4" style={{ color: npcChar.glow }} /></div>)}
        {!loading && messages.length === 0 && (<div className="flex flex-col items-center justify-center h-full text-center px-8 opacity-50"><CharAvatar char={npcChar} size={56} imageSrc={`${pack.assetsBasePath}${npcChar.image}`} /><p className="text-xs text-[var(--color-text-dim)] mt-4 leading-relaxed">{npcChar.fullName}에게 말을 걸어보세요.</p></div>)}
        {messages.map((msg) => (<RoomMessageBubble key={msg.id} msg={msg} npcChar={npcChar} npcChars={npcChars} myPlayerId={myPlayerId} assetsBasePath={pack.assetsBasePath} />))}
        {sending && (() => { const respondingChars = respondingNpcId ? [npcChars.get(respondingNpcId) ?? npcChar] : activeChars; return respondingChars.map((c) => (<TypingIndicator key={c.id} char={c} assetsBasePath={pack.assetsBasePath} />)); })()}
        </div>
      </div>

      <div className="px-4 py-3" style={{ background: `linear-gradient(0deg, rgba(${npcChar.glowRgb},0.03), transparent)`, borderTop: `1px solid rgba(${npcChar.glowRgb},0.06)` }}>
        {messages.length === 0 && (<p className="text-[10px] text-[var(--color-text-dim)] text-center mb-2 opacity-60">대사 외에 <span className="text-white/50">(행동)</span> <span className="text-white/50">(시간이동)</span> <span className="text-white/50">(전개방향)</span> 도 괄호로 지정할 수 있어요</p>)}
        <div className="flex gap-2 max-w-3xl mx-auto">
          <InviteNpcPopover pack={pack} activeNpcIds={activeNpcIds} onInvite={onInvite} disabled={sending} />
          <MentionInput ref={inputRef} value={input} onChange={onInputChange} onKeyDown={handleKeyDown} onMentionSelect={onMentionSelect} npcChars={mentionNpcChars} disabled={sending} placeholder={mentionNpcChars.length > 0 ? "@이름으로 대상 지정..." : "대사 또는 (행동)을 입력하세요..."} className="rounded-2xl bg-[var(--color-surface-2)] border-white/[0.06] px-4 pr-6 py-3 h-auto text-base placeholder:text-[var(--color-text-dim)] min-w-0" style={{ borderColor: input.trim() ? `rgba(${npcChar.glowRgb},0.3)` : undefined, boxShadow: input.trim() ? `0 0 15px rgba(${npcChar.glowRgb},0.05)` : undefined }} />
          <button type="button" onClick={() => toast.info('음성 대화 기능은 준비 중이에요')} className="shrink-0 size-9 rounded-xl bg-[var(--color-surface-2)] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/60 transition-colors" aria-label="음성 메시지"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg></button>
          <button type="button" onClick={() => toast.info('이미지 생성 기능은 준비 중이에요')} className="shrink-0 size-9 rounded-xl bg-[var(--color-surface-2)] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/60 transition-colors" aria-label="이미지 생성"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg></button>
          <Button onClick={onSend} disabled={sending || !input.trim()} className={`px-5 py-3 h-auto rounded-2xl ${npcChar.btnBg} text-sm font-medium active:scale-95`} style={{ boxShadow: !sending && input.trim() ? `0 0 20px rgba(${npcChar.glowRgb},0.2)` : undefined }}>전송</Button>
        </div>
      </div>
    </div>
  );
}

// ---- Main ----
export default function GameClient({ pack, initialCharId }: { pack: ClientStoryPack; initialCharId?: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('title');
  const [worldId, setWorldId] = useState<string | null>(null);
  const [activeChar, setActiveChar] = useState<Character | null>(null);
  const [chatCounts] = useState<Record<string, number>>({});
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatReady, setChatReady] = useState(false);
  const [selectingCharId, setSelectingCharId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [myDisplayName, setMyDisplayName] = useState<string | null>(null);
  const [myCharacterId, setMyCharacterId] = useState<string | null>(null);
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]);
  const [playerCount, setPlayerCount] = useState(1);
  const [activeNpcIds, setActiveNpcIds] = useState<string[]>([]);
  const [targetNpcId, setTargetNpcId] = useState<string | null>(null);
  const [respondingNpcId, setRespondingNpcId] = useState<string | null>(null);
  const storageKey = `novel:${pack.slug}`;

  const autoChar = useMemo(() => {
    if (initialCharId) return pack.characters.find((c) => c.id === initialCharId) ?? null;
    if (pack.characters.length === 1) return pack.characters[0];
    return null;
  }, [initialCharId, pack.characters]);

  const npcCharsMap = useMemo(() => {
    const map = new Map<string, Character>();
    for (const id of activeNpcIds) { const c = pack.characters.find((ch) => ch.id === id); if (c) map.set(id, c); }
    return map;
  }, [activeNpcIds, pack.characters]);

  const handleCreateRoom = useCallback(async (vid: string, char: Character) => {
    const displayName = pack.playerDisplayName;
    const characterId = pack.playerCharacterId;
    const result = await createRoomAPI({ slug: pack.slug, worldId: vid, npcCharacterId: char.id, player: { displayName, characterId } });
    setRoomId(result.roomId); setPlayerId(result.playerId); setMyDisplayName(displayName); setMyCharacterId(characterId);
    setRoomMessages([]); setPlayerCount(1); setActiveNpcIds([char.id]);
    saveSession(storageKey, { roomId: result.roomId, playerId: result.playerId, npcId: char.id, worldId: vid, displayName, characterId });
    const url = new URL(window.location.href); url.searchParams.set('room', result.roomId); url.searchParams.set('v', vid); url.searchParams.set('npc', char.id); url.searchParams.set('char', char.id);
    window.history.replaceState({}, '', url.toString());
    setChatReady(true); setPhase('chat');
  }, [pack.slug, pack.playerDisplayName, pack.playerCharacterId, storageKey]);

  const restoreSession = useCallback(async (session: NonNullable<ReturnType<typeof loadSession>>, char: Character) => {
    setActiveChar(char); setWorldId(session.worldId); setMyDisplayName(session.displayName); setMyCharacterId(session.characterId);
    setRoomId(session.roomId); setPlayerId(session.playerId); setPhase('chat');
    const url = new URL(window.location.href); url.searchParams.set('room', session.roomId); url.searchParams.set('v', session.worldId); url.searchParams.set('npc', session.npcId);
    window.history.replaceState({}, '', url.toString());
    try {
      const result = await joinRoomAPI({ roomId: session.roomId, playerId: session.playerId, displayName: session.displayName, characterId: session.characterId, slug: pack.slug, worldId: session.worldId, npcCharacterId: session.npcId });
      setRoomMessages(result.messages); setPlayerCount(result.room.players.length); setActiveNpcIds(result.room.npcCharacterIds ?? [session.npcId]); setChatReady(true);
    } catch { setChatReady(true); }
  }, [pack.slug]);

  useEffect(() => {
    const session = loadSession(storageKey);
    if (session) {
      // initialCharId가 명시되었고 기존 세션과 다르면 → 기존 worldId로 새 캐릭터 방 생성
      if (initialCharId && session.npcId !== initialCharId) {
        const newChar = pack.characters.find((c) => c.id === initialCharId);
        if (newChar) {
          setActiveChar(newChar); setWorldId(session.worldId); setPhase('loading');
          handleCreateRoom(session.worldId, newChar).catch(() => setPhase('title'));
          return;
        }
      } else {
        const char = pack.characters.find((c) => c.id === session.npcId);
        if (char) { restoreSession(session, char); return; }
      }
    }
    const url = new URL(window.location.href);
    const roomParam = url.searchParams.get('room'); const worldParam = url.searchParams.get('v'); const npcParam = url.searchParams.get('npc');
    if (roomParam && worldParam && npcParam) {
      const char = pack.characters.find((c) => c.id === npcParam);
      if (char) {
        setActiveChar(char); setWorldId(worldParam); setPhase('loading');
        joinRoomAPI({ roomId: roomParam, displayName: pack.playerDisplayName, characterId: pack.playerCharacterId, slug: pack.slug, worldId: worldParam, npcCharacterId: npcParam }).then((result) => {
          setRoomId(roomParam); setPlayerId(result.playerId); setMyDisplayName(pack.playerDisplayName); setMyCharacterId(pack.playerCharacterId);
          setRoomMessages(result.messages); setPlayerCount(result.room.players.length); setActiveNpcIds(result.room.npcCharacterIds ?? [npcParam]);
          saveSession(storageKey, { roomId: roomParam, playerId: result.playerId, npcId: npcParam, worldId: worldParam, displayName: pack.playerDisplayName, characterId: pack.playerCharacterId });
          setChatReady(true); setPhase('chat');
        }).catch(() => {
          // 방이 만료/삭제됨 → stale 세션 정리, URL 파라미터 제거
          clearSession(storageKey);
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('room'); cleanUrl.searchParams.delete('v'); cleanUrl.searchParams.delete('npc');
          window.history.replaceState({}, '', cleanUrl.toString());
          toast.error('이전 대화가 만료되었습니다');
          if (pack.characters.length > 1) { setPhase('select'); } else { setPhase('title'); }
        });
        return;
      }
    }
    // autoChar가 있으면 (URL ?char= 또는 단일 캐릭터) → savedWorldId가 있으면 바로 방 생성
    if (autoChar) {
      setActiveChar(autoChar);
      try {
        const savedWorldId = localStorage.getItem(`${storageKey}:worldId`) || localStorage.getItem(`${storageKey}:villageId`);
        if (savedWorldId) {
          setWorldId(savedWorldId); setPhase('loading');
          handleCreateRoom(savedWorldId, autoChar).catch(() => setPhase('title'));
          return;
        }
      } catch {}
      // savedWorldId 없으면 title로 (시작하기 → 월드 생성 필요)
      return;
    }
    // 다중 캐릭터, autoChar 없음 → savedWorldId 있으면 select 화면
    try { const savedWorldId = localStorage.getItem(`${storageKey}:worldId`) || localStorage.getItem(`${storageKey}:villageId`); if (savedWorldId && pack.characters.length > 1) { setWorldId(savedWorldId); setPhase('select'); } } catch {}
  }, [storageKey, pack.characters, pack.slug, autoChar, pack.playerDisplayName, pack.playerCharacterId, restoreSession, handleCreateRoom, initialCharId]);

  const sendingRef = useRef(false); sendingRef.current = sending;
  useRoomPolling(roomId, phase === 'chat', sendingRef, setRoomMessages, setPlayerCount, setActiveNpcIds);

  const hasScrolledRef = useRef(false);
  useEffect(() => { if (!scrollRef.current) return; const behavior = hasScrolledRef.current ? 'smooth' : 'instant'; scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior }); if (roomMessages.length > 0) hasScrolledRef.current = true; }, [roomMessages, sending]);
  useEffect(() => { if (phase === 'chat') inputRef.current?.focus(); }, [phase]);

  const handleStart = useCallback(async () => {
    setPhase('loading');
    try {
      const newWorldId = await startGame(pack.slug); setWorldId(newWorldId); localStorage.setItem(`${storageKey}:worldId`, newWorldId);
      if (activeChar) { await handleCreateRoom(newWorldId, activeChar); } else { setPhase('select'); }
    } catch { setPhase('title'); }
  }, [pack.slug, storageKey, activeChar, handleCreateRoom]);

  const handleSelect = useCallback(async (char: Character) => {
    const session = loadSession(storageKey);
    if (session && session.npcId === char.id) { restoreSession(session, char); return; }
    setActiveChar(char); setSelectingCharId(char.id);
    try {
      if (!worldId) { const vid = await startGame(pack.slug); setWorldId(vid); localStorage.setItem(`${storageKey}:worldId`, vid); await handleCreateRoom(vid, char); }
      else { await handleCreateRoom(worldId, char); }
    } catch { toast.error('방 생성에 실패했습니다'); setSelectingCharId(null); }
  }, [pack.slug, storageKey, worldId, handleCreateRoom, restoreSession]);

  const handleBack = useCallback(() => {
    if (pack.characters.length > 1) {
      // 다중 캐릭터 → select 화면으로 (방은 유지, 다른 캐릭터 선택 가능)
      setPhase('select'); setChatReady(false);
    } else {
      router.push('/');
    }
  }, [pack.characters.length, router]);
  const handleInviteNpc = useCallback(async (charId: string) => { if (!roomId) return; try { const r = await inviteNpcAPI(roomId, charId); setActiveNpcIds(r.npcCharacterIds); } catch { toast.error('초대에 실패했습니다'); } }, [roomId]);
  const handleKickNpc = useCallback(async (charId: string) => { if (!roomId) return; try { const r = await kickNpcAPI(roomId, charId); setActiveNpcIds(r.npcCharacterIds); } catch { toast.error('내보내기에 실패했습니다'); } }, [roomId]);
  const handleMentionSelect = useCallback((charId: string) => { setTargetNpcId(charId); }, []);

  const handleSend = useCallback(async () => {
    if (sending) return; const rawMsg = input.trim(); if (!rawMsg || !activeChar || !roomId || !playerId) return;
    let resolvedTargetNpcId = targetNpcId; let cleanText = rawMsg;
    const mentionMatch = rawMsg.match(/^@(\S+)\s*/);
    if (mentionMatch) { const mentionedChar = pack.characters.find((c) => c.name === mentionMatch[1] && activeNpcIds.includes(c.id)); if (mentionedChar) { resolvedTargetNpcId = mentionedChar.id; cleanText = rawMsg.slice(mentionMatch[0].length).trim(); } }
    if (!cleanText) return;
    setInput(''); setSending(true); setRespondingNpcId(resolvedTargetNpcId); setTargetNpcId(null);
    const tempId = `pending-${Date.now()}`;
    setRoomMessages((prev) => [...prev, { id: tempId, roomId: roomId!, timestamp: Date.now(), sender: { type: 'player' as const, id: playerId!, name: myDisplayName ?? pack.playerDisplayName }, text: rawMsg }]);
    try {
      const result = await sendRoomMessage(roomId, playerId, rawMsg, { slug: pack.slug, worldId: worldId ?? '', npcCharacterId: activeChar.id, displayName: myDisplayName ?? pack.playerDisplayName, characterId: myCharacterId ?? pack.playerCharacterId, targetNpcId: resolvedTargetNpcId ?? undefined });
      setRoomMessages((prev) => { const without = prev.filter((m) => m.id !== tempId); const ids = new Set(without.map((m) => m.id)); const toAdd: RoomMessage[] = []; if (result.playerMessage && !ids.has(result.playerMessage.id)) toAdd.push(result.playerMessage); const npcMsgs = result.npcMessages ?? (result.npcMessage ? [result.npcMessage] : []); for (const m of npcMsgs) { if (!ids.has(m.id)) toAdd.push(m); } return [...without, ...toAdd]; });
    } catch { setRoomMessages((prev) => [...prev.filter((m) => m.id !== tempId), { id: `error-${Date.now()}`, roomId: roomId!, timestamp: Date.now(), sender: { type: 'system' as const }, text: '(응답을 생성하지 못했어요)' }]); }
    finally { setSending(false); setRespondingNpcId(null); inputRef.current?.focus(); }
  }, [input, sending, activeChar, roomId, playerId, worldId, pack, myDisplayName, myCharacterId, targetNpcId, activeNpcIds]);

  const handleShare = useCallback(() => { if (!roomId) return; const url = new URL(window.location.href); url.searchParams.set('room', roomId); navigator.clipboard.writeText(url.toString()).then(() => toast.success('방 링크가 복사되었습니다')).catch(() => toast.error('복사에 실패했습니다')); }, [roomId]);

  const handleDeleteRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      await deleteRoomAPI(roomId);
      clearSession(storageKey);
      // worldId는 유지 — 방만 삭제하고 같은 월드에서 다른 캐릭터와 대화 가능
      setRoomId(null); setPlayerId(null); setRoomMessages([]); setActiveNpcIds([]);
      setChatReady(false); setActiveChar(null);
      toast.success('방이 삭제되었습니다');
      // Remove room params from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('room'); url.searchParams.delete('v'); url.searchParams.delete('npc');
      window.history.replaceState({}, '', url.toString());
      if (pack.characters.length > 1) { setPhase('select'); } else { setPhase('title'); }
    } catch {
      toast.error('방 삭제에 실패했습니다');
    }
  }, [roomId, storageKey, pack.characters.length]);

  let content: React.ReactNode = null;
  if (phase === 'title' || phase === 'loading') { content = <TitleScreen pack={pack} onStart={handleStart} loading={phase === 'loading'} />; }
  else if (phase === 'select') { content = <SelectScreen pack={pack} chatCounts={chatCounts} onSelect={handleSelect} selectingCharId={selectingCharId} />; }
  else if (phase === 'chat' && activeChar) { content = <RoomChatScreen npcChar={activeChar} pack={pack} messages={roomMessages} sending={sending} input={input} onInputChange={setInput} onSend={handleSend} onBack={handleBack} onShare={handleShare} onDeleteRoom={handleDeleteRoom} playerCount={playerCount} myPlayerId={playerId ?? ''} inputRef={inputRef} scrollRef={scrollRef} loading={!chatReady} activeNpcIds={activeNpcIds} npcChars={npcCharsMap} onInvite={handleInviteNpc} onKickNpc={handleKickNpc} onMentionSelect={handleMentionSelect} respondingNpcId={respondingNpcId} primaryNpcId={activeChar.id} roomId={roomId ?? ''} />; }

  return (
    <div className="h-full w-full">
      {content}
    </div>
  );
}
