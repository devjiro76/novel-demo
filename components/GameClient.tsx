'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ClientStoryPack, CharacterMeta } from '@/lib/story-pack';
import { startGame } from '@/lib/api-client';
import {
  createRoomAPI,
  joinRoomAPI,
  sendRoomMessage,
  inviteNpcAPI,
  kickNpcAPI,
  deleteRoomAPI,
} from '@/lib/api-client-room';
import type { RoomMessage } from '@/lib/room';
import { saveSession, loadSession, clearSession } from '@/lib/session';
import { useRoomPolling } from '@/hooks/useRoomPolling';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RoomChatScreen } from './chat/RoomChatScreen';

type Phase = 'title' | 'loading' | 'select' | 'chat';
type Character = CharacterMeta;

function TitleScreen({
  pack,
  onStart,
  loading,
}: {
  pack: ClientStoryPack;
  onStart: () => void;
  loading: boolean;
}) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-end overflow-hidden">
      <div className="absolute inset-0">
        <picture>
          <source media="(min-width: 768px)" srcSet={`${pack.assetsBasePath}${pack.coverWide}`} />
          <img
            src={`${pack.assetsBasePath}${pack.coverTall}`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center opacity-40 blur-[2px] md:scale-110 md:opacity-50"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/60 to-[var(--color-bg)]/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/80 via-transparent to-[var(--color-bg)]" />
      </div>
      <Link
        href="/"
        className="absolute top-5 left-5 z-20 p-2 text-sm text-white/30 transition-colors hover:text-white/60 lg:hidden"
      >
        ← 다른 이야기
      </Link>
      <div className="breathe pointer-events-none absolute top-1/3 left-1/2 h-[200px] w-[400px] -translate-x-1/2 rounded-full bg-pink-500/8 blur-[80px]" />
      <div className="slide-up relative z-10 px-6 pb-20 text-center">
        <img
          src={`${pack.assetsBasePath}${pack.logo}`}
          alt={pack.subtitle ?? pack.title}
          className="mx-auto mb-8 w-[280px] max-w-[80vw] drop-shadow-lg"
        />
        <p className="mb-8 text-[12px] leading-relaxed text-white/30">
          당신은 <span className="font-semibold text-pink-300/60">{pack.playerDisplayName}</span>
          입니다.
        </p>
        <Button
          onClick={onStart}
          disabled={loading}
          size="lg"
          className="group relative h-auto overflow-hidden rounded-2xl px-12 py-4 text-sm font-bold tracking-wide active:scale-95"
          style={{
            background: 'var(--color-brand-gradient)',
            boxShadow: '0 0 30px rgba(168,85,247,0.3), 0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <span className="relative z-10">
            {loading ? (
              <>
                <Spinner className="mr-2 inline size-4" />
                준비 중...
              </>
            ) : (
              '시작하기'
            )}
          </span>
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </Button>
      </div>
    </div>
  );
}

function SelectCharacterCard({
  char,
  pack,
  chatCount,
  onClick,
  delay,
  selecting,
}: {
  char: Character;
  pack: ClientStoryPack;
  chatCount: number;
  onClick: () => void;
  delay: number;
  selecting?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={selecting}
      className="group relative w-full overflow-hidden rounded-2xl text-left transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] disabled:opacity-60"
      style={{
        animationDelay: `${delay}ms`,
        animation: `slideUp 0.5s ease-out ${delay}ms both`,
        background: `linear-gradient(135deg, rgba(${char.glowRgb},0.06), rgba(${char.glowRgb},0.02))`,
        border: `1px solid rgba(${char.glowRgb},0.12)`,
      }}
    >
      <div className="flex">
        <div className="relative w-24 shrink-0 overflow-hidden">
          <img
            src={`${pack.assetsBasePath}${char.image}`}
            alt={char.name}
            className="absolute inset-0 h-full w-full object-cover object-[50%_12%]"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${char.gradient}`} />
        </div>
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className={`text-base font-bold ${char.accentText}`}>{char.fullName}</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{char.age}세</span>
          </div>
          <p className="mb-2 text-[11px] text-[var(--color-text-dim)]">{char.role}</p>
          <p className="line-clamp-2 text-xs leading-relaxed whitespace-pre-line text-[var(--color-text-secondary)]">
            {char.desc}
          </p>
          {chatCount > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: char.glow, opacity: 0.5 }}
              />
              <p className="text-[10px] text-[var(--color-text-dim)]">{chatCount}개의 대화</p>
            </div>
          )}
        </div>
      </div>
      {selecting && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 backdrop-blur-[2px]">
          <Spinner className="size-5" style={{ color: char.glow }} />
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: `inset 0 0 40px rgba(${char.glowRgb},0.05)` }}
      />
    </button>
  );
}

function SelectScreen({
  pack,
  chatCounts,
  onSelect,
  selectingCharId,
}: {
  pack: ClientStoryPack;
  chatCounts: Record<string, number>;
  onSelect: (char: Character) => void;
  selectingCharId: string | null;
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="px-5 pt-8 pb-5 lg:px-8 lg:pt-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="mb-2 block text-[10px] text-[var(--color-text-dim)] transition-colors hover:text-white/60"
          >
            ← 홈으로
          </Link>
          <h2 className="text-xl font-bold tracking-tight lg:text-2xl">누구에게 갈까?</h2>
          <p className="mt-1 text-[11px] tracking-wide text-[var(--color-text-dim)]">
            비밀은 지켜줄게.
          </p>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-5 pb-8 lg:px-8">
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 lg:grid-cols-2">
          {pack.characters.map((char, i) => (
            <SelectCharacterCard
              key={char.id}
              char={char}
              pack={pack}
              chatCount={chatCounts[char.id] ?? 0}
              onClick={() => onSelect(char)}
              delay={i * 100}
              selecting={selectingCharId === char.id}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

// ---- Helpers ----

function resolveMentionTarget(
  rawMsg: string,
  activeNpcIds: string[],
  characters: Character[],
  currentTargetNpcId: string | null,
): { resolvedTargetNpcId: string | null; cleanText: string } {
  let resolvedTargetNpcId = currentTargetNpcId;
  let cleanText = rawMsg;
  const mentionMatch = rawMsg.match(/^@(\S+)\s*/);
  if (mentionMatch) {
    const mentionedChar = characters.find(
      (c) => c.name === mentionMatch[1] && activeNpcIds.includes(c.id),
    );
    if (mentionedChar) {
      resolvedTargetNpcId = mentionedChar.id;
      cleanText = rawMsg.slice(mentionMatch[0].length).trim();
    }
  }
  return { resolvedTargetNpcId, cleanText };
}

function mergeRoomMessages(
  prev: RoomMessage[],
  tempId: string,
  result: {
    playerMessage?: RoomMessage | null;
    npcMessage?: RoomMessage | null;
    npcMessages?: RoomMessage[];
  },
): RoomMessage[] {
  const without = prev.filter((m) => m.id !== tempId);
  const ids = new Set(without.map((m) => m.id));
  const toAdd: RoomMessage[] = [];
  if (result.playerMessage && !ids.has(result.playerMessage.id)) toAdd.push(result.playerMessage);
  const npcMsgs = result.npcMessages ?? (result.npcMessage ? [result.npcMessage] : []);
  for (const m of npcMsgs) {
    if (!ids.has(m.id)) toAdd.push(m);
  }
  return [...without, ...toAdd];
}

function buildPendingMessage(
  tempId: string,
  roomId: string,
  params: { playerId: string; senderName: string; text: string },
): RoomMessage {
  return {
    id: tempId,
    roomId,
    timestamp: Date.now(),
    sender: { type: 'player' as const, id: params.playerId, name: params.senderName },
    text: params.text,
  };
}

function buildErrorMessage(roomId: string): RoomMessage {
  return {
    id: `error-${Date.now()}`,
    roomId,
    timestamp: Date.now(),
    sender: { type: 'system' as const },
    text: '(응답을 생성하지 못했어요)',
  };
}

function buildSendParams(
  pack: ClientStoryPack,
  opts: {
    worldId: string | null;
    npcCharacterId: string;
    displayName: string;
    characterId: string;
    targetNpcId: string | null;
  },
) {
  return {
    slug: pack.slug,
    worldId: opts.worldId ?? '',
    npcCharacterId: opts.npcCharacterId,
    displayName: opts.displayName,
    characterId: opts.characterId,
    targetNpcId: opts.targetNpcId ?? undefined,
  };
}

// ---- Main ----
export default function GameClient({
  pack,
  initialCharId,
}: {
  pack: ClientStoryPack;
  initialCharId?: string;
}) {
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
    for (const id of activeNpcIds) {
      const c = pack.characters.find((ch) => ch.id === id);
      if (c) map.set(id, c);
    }
    return map;
  }, [activeNpcIds, pack.characters]);

  const handleCreateRoom = useCallback(
    async (vid: string, char: Character) => {
      const displayName = pack.playerDisplayName;
      const characterId = pack.playerCharacterId;
      const result = await createRoomAPI({
        slug: pack.slug,
        worldId: vid,
        npcCharacterId: char.id,
        player: { displayName, characterId },
      });
      setRoomId(result.roomId);
      setPlayerId(result.playerId);
      setMyDisplayName(displayName);
      setMyCharacterId(characterId);
      setRoomMessages([]);
      setPlayerCount(1);
      setActiveNpcIds([char.id]);
      saveSession(storageKey, {
        roomId: result.roomId,
        playerId: result.playerId,
        npcId: char.id,
        worldId: vid,
        displayName,
        characterId,
      });
      const url = new URL(window.location.href);
      url.searchParams.set('room', result.roomId);
      url.searchParams.set('v', vid);
      url.searchParams.set('npc', char.id);
      url.searchParams.set('char', char.id);
      window.history.replaceState({}, '', url.toString());
      setChatReady(true);
      setPhase('chat');
    },
    [pack.slug, pack.playerDisplayName, pack.playerCharacterId, storageKey],
  );

  const restoreSession = useCallback(
    async (session: NonNullable<ReturnType<typeof loadSession>>, char: Character) => {
      setActiveChar(char);
      setWorldId(session.worldId);
      setMyDisplayName(session.displayName);
      setMyCharacterId(session.characterId);
      setRoomId(session.roomId);
      setPlayerId(session.playerId);
      setPhase('chat');
      const url = new URL(window.location.href);
      url.searchParams.set('room', session.roomId);
      url.searchParams.set('v', session.worldId);
      url.searchParams.set('npc', session.npcId);
      window.history.replaceState({}, '', url.toString());
      try {
        const result = await joinRoomAPI({
          roomId: session.roomId,
          playerId: session.playerId,
          displayName: session.displayName,
          characterId: session.characterId,
          slug: pack.slug,
          worldId: session.worldId,
          npcCharacterId: session.npcId,
        });
        setRoomMessages(result.messages);
        setPlayerCount(result.room.players.length);
        setActiveNpcIds(result.room.npcCharacterIds ?? [session.npcId]);
        setChatReady(true);
      } catch {
        setChatReady(true);
      }
    },
    [pack.slug],
  );

  const handleRoomParam = useCallback(
    (roomParam: string, worldParam: string, npcParam: string) => {
      setPhase('loading');
      joinRoomAPI({
        roomId: roomParam,
        displayName: pack.playerDisplayName,
        characterId: pack.playerCharacterId,
        slug: pack.slug,
        worldId: worldParam,
        npcCharacterId: npcParam,
      })
        .then((result) => {
          setRoomId(roomParam);
          setPlayerId(result.playerId);
          setMyDisplayName(pack.playerDisplayName);
          setMyCharacterId(pack.playerCharacterId);
          setRoomMessages(result.messages);
          setPlayerCount(result.room.players.length);
          setActiveNpcIds(result.room.npcCharacterIds ?? [npcParam]);
          saveSession(storageKey, {
            roomId: roomParam,
            playerId: result.playerId,
            npcId: npcParam,
            worldId: worldParam,
            displayName: pack.playerDisplayName,
            characterId: pack.playerCharacterId,
          });
          setChatReady(true);
          setPhase('chat');
        })
        .catch(() => {
          clearSession(storageKey);
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('room');
          cleanUrl.searchParams.delete('v');
          cleanUrl.searchParams.delete('npc');
          window.history.replaceState({}, '', cleanUrl.toString());
          toast.error('이전 대화가 만료되었습니다');
          setPhase(pack.characters.length > 1 ? 'select' : 'title');
        });
    },
    [pack.slug, pack.playerDisplayName, pack.playerCharacterId, pack.characters.length, storageKey],
  );

  const tryInitWithSession = useCallback(
    (session: NonNullable<ReturnType<typeof loadSession>>): boolean => {
      if (initialCharId && session.npcId !== initialCharId) {
        const newChar = pack.characters.find((c) => c.id === initialCharId);
        if (newChar) {
          setActiveChar(newChar);
          setWorldId(session.worldId);
          setPhase('loading');
          handleCreateRoom(session.worldId, newChar).catch(() => setPhase('title'));
          return true;
        }
      } else {
        const char = pack.characters.find((c) => c.id === session.npcId);
        if (char) {
          restoreSession(session, char);
          return true;
        }
      }
      return false;
    },
    [initialCharId, pack.characters, handleCreateRoom, restoreSession],
  );

  const tryInitWithRoomParam = useCallback((): boolean => {
    const url = new URL(window.location.href);
    const roomParam = url.searchParams.get('room');
    const worldParam = url.searchParams.get('v');
    const npcParam = url.searchParams.get('npc');
    if (!roomParam || !worldParam || !npcParam) return false;
    const char = pack.characters.find((c) => c.id === npcParam);
    if (!char) return false;
    setActiveChar(char);
    setWorldId(worldParam);
    handleRoomParam(roomParam, worldParam, npcParam);
    return true;
  }, [pack.characters, handleRoomParam]);

  const tryInitWithAutoChar = useCallback((): boolean => {
    if (!autoChar) return false;
    setActiveChar(autoChar);
    try {
      const savedWorldId = localStorage.getItem(`${storageKey}:worldId`);
      if (savedWorldId) {
        setWorldId(savedWorldId);
        setPhase('loading');
        handleCreateRoom(savedWorldId, autoChar).catch(() => setPhase('title'));
      }
    } catch {
      /* ignored */
    }
    return true;
  }, [autoChar, storageKey, handleCreateRoom]);

  useEffect(() => {
    const session = loadSession(storageKey);
    if (session && tryInitWithSession(session)) return;
    if (tryInitWithRoomParam()) return;
    if (tryInitWithAutoChar()) return;
    try {
      const savedWorldId = localStorage.getItem(`${storageKey}:worldId`);
      if (savedWorldId && pack.characters.length > 1) {
        setWorldId(savedWorldId);
        setPhase('select');
      }
    } catch {
      /* ignored */
    }
  }, [
    storageKey,
    pack.characters.length,
    tryInitWithSession,
    tryInitWithRoomParam,
    tryInitWithAutoChar,
  ]);

  const sendingRef = useRef(false);
  sendingRef.current = sending;
  useRoomPolling(
    roomId,
    phase === 'chat',
    sendingRef,
    setRoomMessages,
    setPlayerCount,
    setActiveNpcIds,
  );

  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (!scrollRef.current) return;
    const behavior = hasScrolledRef.current ? 'smooth' : 'instant';
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
    if (roomMessages.length > 0) hasScrolledRef.current = true;
  }, [roomMessages, sending]);
  useEffect(() => {
    if (phase === 'chat') inputRef.current?.focus();
  }, [phase]);

  const handleStart = useCallback(async () => {
    setPhase('loading');
    try {
      const newWorldId = await startGame(pack.slug);
      setWorldId(newWorldId);
      localStorage.setItem(`${storageKey}:worldId`, newWorldId);
      if (activeChar) {
        await handleCreateRoom(newWorldId, activeChar);
      } else {
        setPhase('select');
      }
    } catch {
      setPhase('title');
    }
  }, [pack.slug, storageKey, activeChar, handleCreateRoom]);

  const handleSelect = useCallback(
    async (char: Character) => {
      const session = loadSession(storageKey);
      if (session && session.npcId === char.id) {
        restoreSession(session, char);
        return;
      }
      setActiveChar(char);
      setSelectingCharId(char.id);
      try {
        if (!worldId) {
          const vid = await startGame(pack.slug);
          setWorldId(vid);
          localStorage.setItem(`${storageKey}:worldId`, vid);
          await handleCreateRoom(vid, char);
        } else {
          await handleCreateRoom(worldId, char);
        }
      } catch {
        toast.error('방 생성에 실패했습니다');
        setSelectingCharId(null);
      }
    },
    [pack.slug, storageKey, worldId, handleCreateRoom, restoreSession],
  );

  const handleBack = useCallback(() => {
    if (pack.characters.length > 1) {
      setPhase('select');
      setChatReady(false);
    } else {
      router.push('/');
    }
  }, [pack.characters.length, router]);

  const handleInviteNpc = useCallback(
    async (charId: string) => {
      if (!roomId) return;
      try {
        const r = await inviteNpcAPI(roomId, charId);
        setActiveNpcIds(r.npcCharacterIds);
      } catch {
        toast.error('초대에 실패했습니다');
      }
    },
    [roomId],
  );

  const handleKickNpc = useCallback(
    async (charId: string) => {
      if (!roomId) return;
      try {
        const r = await kickNpcAPI(roomId, charId);
        setActiveNpcIds(r.npcCharacterIds);
      } catch {
        toast.error('내보내기에 실패했습니다');
      }
    },
    [roomId],
  );

  const handleMentionSelect = useCallback((charId: string) => {
    setTargetNpcId(charId);
  }, []);

  const executeSendRequest = useCallback(
    async (req: {
      roomId: string;
      playerId: string;
      rawMsg: string;
      tempId: string;
      params: ReturnType<typeof buildSendParams>;
    }) => {
      try {
        const result = await sendRoomMessage(req.roomId, req.playerId, req.rawMsg, req.params);
        setRoomMessages((prev) => mergeRoomMessages(prev, req.tempId, result));
      } catch {
        setRoomMessages((prev) => [
          ...prev.filter((m) => m.id !== req.tempId),
          buildErrorMessage(req.roomId),
        ]);
      } finally {
        setSending(false);
        setRespondingNpcId(null);
        inputRef.current?.focus();
      }
    },
    [],
  );

  const handleSend = useCallback(async () => {
    if (sending || !activeChar || !roomId || !playerId) return;
    const rawMsg = input.trim();
    if (!rawMsg) return;
    const { resolvedTargetNpcId, cleanText } = resolveMentionTarget(
      rawMsg,
      activeNpcIds,
      pack.characters,
      targetNpcId,
    );
    if (!cleanText) return;
    const senderName = myDisplayName ?? pack.playerDisplayName;
    const characterId = myCharacterId ?? pack.playerCharacterId;
    setInput('');
    setSending(true);
    setRespondingNpcId(resolvedTargetNpcId);
    setTargetNpcId(null);
    const tempId = `pending-${Date.now()}`;
    setRoomMessages((prev) => [
      ...prev,
      buildPendingMessage(tempId, roomId, { playerId, senderName, text: rawMsg }),
    ]);
    await executeSendRequest({
      roomId,
      playerId,
      rawMsg,
      tempId,
      params: buildSendParams(pack, {
        worldId,
        npcCharacterId: activeChar.id,
        displayName: senderName,
        characterId,
        targetNpcId: resolvedTargetNpcId,
      }),
    });
  }, [
    input,
    sending,
    activeChar,
    roomId,
    playerId,
    worldId,
    pack,
    myDisplayName,
    myCharacterId,
    targetNpcId,
    activeNpcIds,
    executeSendRequest,
  ]);

  const handleShare = useCallback(() => {
    if (!roomId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    navigator.clipboard
      .writeText(url.toString())
      .then(() => toast.success('방 링크가 복사되었습니다'))
      .catch(() => toast.error('복사에 실패했습니다'));
  }, [roomId]);

  const handleDeleteRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      await deleteRoomAPI(roomId);
      clearSession(storageKey);
      setRoomId(null);
      setPlayerId(null);
      setRoomMessages([]);
      setActiveNpcIds([]);
      setChatReady(false);
      setActiveChar(null);
      toast.success('방이 삭제되었습니다');
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      url.searchParams.delete('v');
      url.searchParams.delete('npc');
      window.history.replaceState({}, '', url.toString());
      setPhase(pack.characters.length > 1 ? 'select' : 'title');
    } catch {
      toast.error('방 삭제에 실패했습니다');
    }
  }, [roomId, storageKey, pack.characters.length]);

  let content: React.ReactNode = null;
  if (phase === 'title' || phase === 'loading') {
    content = <TitleScreen pack={pack} onStart={handleStart} loading={phase === 'loading'} />;
  } else if (phase === 'select') {
    content = (
      <SelectScreen
        pack={pack}
        chatCounts={chatCounts}
        onSelect={handleSelect}
        selectingCharId={selectingCharId}
      />
    );
  } else if (phase === 'chat' && activeChar) {
    content = (
      <RoomChatScreen
        npcChar={activeChar}
        pack={pack}
        messages={roomMessages}
        sending={sending}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onBack={handleBack}
        onShare={handleShare}
        onDeleteRoom={handleDeleteRoom}
        playerCount={playerCount}
        myPlayerId={playerId ?? ''}
        inputRef={inputRef}
        scrollRef={scrollRef}
        loading={!chatReady}
        activeNpcIds={activeNpcIds}
        npcChars={npcCharsMap}
        onInvite={handleInviteNpc}
        onKickNpc={handleKickNpc}
        onMentionSelect={handleMentionSelect}
        respondingNpcId={respondingNpcId}
        primaryNpcId={activeChar.id}
        roomId={roomId ?? ''}
      />
    );
  }

  return <div className="h-full w-full">{content}</div>;
}
