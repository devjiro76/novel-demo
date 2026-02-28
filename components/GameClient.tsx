'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { ClientStoryPack, CharacterMeta } from '@/lib/story-pack';
import { startGame } from '@/lib/api-client';
import { createRoomAPI, joinRoomAPI, sendRoomMessage } from '@/lib/api-client-room';
import type { RoomMessage } from '@/lib/room';
import RoleSelectScreen from './RoleSelectScreen';

type Phase = 'title' | 'loading' | 'select' | 'roleSelect' | 'chat';

type Character = CharacterMeta;

// ---- Avatar ----
function CharAvatar({ char, pack, size = 40 }: { char: Character; pack: ClientStoryPack; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden shrink-0 border border-white/10"
      style={{ width: size, height: size }}
    >
      <img
        src={`${pack.assetsBasePath}${char.image}`}
        alt={char.name}
        className="object-cover object-[50%_15%] w-full h-full"
      />
    </div>
  );
}

// ---- Title Screen ----
function TitleScreen({ pack, onStart, loading }: { pack: ClientStoryPack; onStart: () => void; loading: boolean }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-end relative overflow-hidden">
      <div className="absolute inset-0">
        <picture>
          <source media="(min-width: 768px)" srcSet={`${pack.assetsBasePath}${pack.coverWide}`} />
          <img
            src={`${pack.assetsBasePath}${pack.coverTall}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 blur-[2px] md:scale-110 md:opacity-50"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080d] via-[#08080d]/60 to-[#08080d]/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080d]/80 via-transparent to-[#08080d]" />
      </div>

      <Link
        href="/"
        className="absolute top-5 left-5 z-20 text-sm text-white/30 hover:text-white/60 transition-colors p-2"
      >
        ← 다른 이야기
      </Link>

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full bg-pink-500/8 blur-[80px] breathe pointer-events-none" />

      <div className="relative z-10 text-center pb-20 px-6 slide-up">
        <img
          src={`${pack.assetsBasePath}${pack.logo}`}
          alt={pack.subtitle ?? pack.title}
          className="w-[280px] max-w-[80vw] mx-auto mb-8 drop-shadow-lg"
        />

        <p className="text-[12px] text-white/30 mb-8 leading-relaxed">
          당신은 <span className="text-pink-300/60 font-semibold">{pack.playerDisplayName}</span>입니다.
        </p>

        <button
          onClick={onStart}
          disabled={loading}
          className="relative px-12 py-4 rounded-2xl text-sm font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #ec4899, #a855f7)',
            boxShadow: '0 0 30px rgba(168,85,247,0.3), 0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <span className="relative z-10">{loading ? '준비 중...' : '시작하기'}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>
      </div>
    </div>
  );
}

// ---- Character Card ----
function CharacterCard({ char, pack, chatCount, onClick, delay }: {
  char: Character;
  pack: ClientStoryPack;
  chatCount: number;
  onClick: () => void;
  delay: number;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] group relative"
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
            className="absolute inset-0 w-full h-full object-cover object-[50%_12%]"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${char.gradient}`} />
        </div>

        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={`text-base font-bold ${char.accentText}`}>{char.fullName}</span>
            <span className="text-[10px] text-[var(--color-text-dim)]">{char.age}세</span>
          </div>
          <p className="text-[11px] text-[var(--color-text-dim)] mb-2">{char.role}</p>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line line-clamp-2">
            {char.desc}
          </p>
          {chatCount > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: char.glow, opacity: 0.5 }} />
              <p className="text-[10px] text-[var(--color-text-dim)]">{chatCount}개의 대화</p>
            </div>
          )}
        </div>
      </div>

      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `inset 0 0 40px rgba(${char.glowRgb},0.05)` }}
      />
    </button>
  );
}

// ---- Select Screen ----
function SelectScreen({ pack, chatCounts, onSelect, onReset }: {
  pack: ClientStoryPack;
  chatCounts: Record<string, number>;
  onSelect: (char: Character) => void;
  onReset: () => void;
}) {
  return (
    <div className="h-screen flex flex-col">
      <header className="px-5 pt-8 pb-5">
        <div className="flex items-end justify-between">
          <div>
            <Link
              href="/"
              className="text-[10px] text-[var(--color-text-dim)] hover:text-white/60 transition-colors mb-2 block"
            >
              ← 다른 이야기
            </Link>
            <h2 className="text-xl font-bold tracking-tight">누구에게 갈까?</h2>
            <p className="text-[11px] text-[var(--color-text-dim)] mt-1 tracking-wide">비밀은 지켜줄게.</p>
          </div>
          <button
            onClick={onReset}
            className="text-[10px] text-[var(--color-text-dim)] hover:text-white/60 transition-colors px-2 py-1"
          >
            초기화
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-8 space-y-3">
        {pack.characters.map((char, i) => (
          <CharacterCard
            key={char.id}
            char={char}
            pack={pack}
            chatCount={chatCounts[char.id] ?? 0}
            onClick={() => onSelect(char)}
            delay={i * 100}
          />
        ))}
      </main>
    </div>
  );
}

// ---- Chat Message (Room-based) ----
function RoomMessageBubble({ msg, npcChar, pack, myPlayerId }: {
  msg: RoomMessage;
  npcChar: Character;
  pack: ClientStoryPack;
  myPlayerId: string;
}) {
  // System message
  if (msg.sender.type === 'system') {
    return (
      <div className="flex justify-center slide-up">
        <span className="text-[11px] text-[var(--color-text-dim)] bg-white/[0.03] px-3 py-1 rounded-full">
          {msg.text}
        </span>
      </div>
    );
  }

  // Player message (mine)
  if (msg.sender.type === 'player' && msg.sender.id === myPlayerId) {
    return (
      <div className="flex justify-end slide-up">
        <div className="max-w-[78%] rounded-2xl rounded-br-md bg-white/[0.06] backdrop-blur-sm px-4 py-2.5 border border-white/[0.04]">
          <p className="text-[13px] leading-relaxed">{msg.text}</p>
        </div>
      </div>
    );
  }

  // Player message (other)
  if (msg.sender.type === 'player') {
    return (
      <div className="flex gap-2.5 items-start max-w-[85%] slide-up">
        <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0 text-[10px] font-bold text-white/60">
          {msg.sender.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[var(--color-text-dim)] mb-1">{msg.sender.name}</p>
          <div className="rounded-2xl rounded-tl-md bg-white/[0.04] backdrop-blur-sm px-4 py-2.5 border border-white/[0.04]">
            <p className="text-[13px] leading-relaxed">{msg.text}</p>
          </div>
        </div>
      </div>
    );
  }

  // NPC message
  return (
    <div className="slide-up space-y-3">
      {msg.action && (
        <p className="text-[12px] text-white/70 italic leading-relaxed px-6">
          {msg.action}
        </p>
      )}

      {(msg.text || msg.innerThought) && (
        <div className="flex gap-2.5 items-start max-w-[92%]">
          <CharAvatar char={npcChar} pack={pack} size={32} />
          <div className="flex-1 min-w-0">
            <div
              className="rounded-2xl rounded-tl-md px-4 py-3 space-y-2"
              style={{
                background: `linear-gradient(135deg, rgba(${npcChar.glowRgb},0.07), rgba(${npcChar.glowRgb},0.02))`,
                border: `1px solid rgba(${npcChar.glowRgb},0.1)`,
              }}
            >
              {msg.text && (
                <p className="text-[13px] leading-relaxed">{msg.text}</p>
              )}
              {msg.innerThought && (
                <p
                  className="text-[12px] italic leading-relaxed pl-2.5 mt-1 opacity-75"
                  style={{
                    borderLeft: `2px solid rgba(${npcChar.glowRgb},0.4)`,
                  }}
                >
                  {msg.innerThought}
                </p>
              )}
            </div>

            {msg.emotion && (
              <span
                className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-1.5 ml-1"
                style={{ color: npcChar.glow, background: `rgba(${npcChar.glowRgb},0.1)` }}
              >
                {msg.emotion}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Chat Screen (Room-based) ----
function RoomChatScreen({ npcChar, pack, messages, sending, input, onInputChange, onSend, onBack, onShare, playerCount, myPlayerId, inputRef, scrollRef }: {
  npcChar: Character;
  pack: ClientStoryPack;
  messages: RoomMessage[];
  sending: boolean;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onBack: () => void;
  onShare: () => void;
  playerCount: number;
  myPlayerId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header
        className="px-4 py-3 flex items-center gap-3 slide-down"
        style={{
          background: `linear-gradient(180deg, rgba(${npcChar.glowRgb},0.06), transparent)`,
          borderBottom: `1px solid rgba(${npcChar.glowRgb},0.08)`,
        }}
      >
        <CharAvatar char={npcChar} pack={pack} size={36} />
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-bold ${npcChar.accentText}`}>{npcChar.fullName}</span>
          <span className="text-[10px] text-[var(--color-text-dim)] ml-2">
            {npcChar.role} ({playerCount}명)
          </span>
        </div>
        <button
          onClick={onShare}
          className="text-[10px] text-[var(--color-text-dim)] hover:text-white/60 transition-colors px-2 py-1 border border-white/[0.06] rounded-lg"
        >
          공유
        </button>
        <button
          onClick={onBack}
          className="text-[10px] text-[var(--color-text-dim)] hover:text-white/60 transition-colors px-2 py-1 border border-white/[0.06] rounded-lg"
        >
          ← 뒤로
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 opacity-50">
            <CharAvatar char={npcChar} pack={pack} size={56} />
            <p className="text-xs text-[var(--color-text-dim)] mt-4 leading-relaxed">
              {npcChar.fullName}에게 말을 걸어보세요.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <RoomMessageBubble
            key={msg.id}
            msg={msg}
            npcChar={npcChar}
            pack={pack}
            myPlayerId={myPlayerId}
          />
        ))}

        {sending && (
          <div className="flex gap-2.5 items-start slide-up">
            <CharAvatar char={npcChar} pack={pack} size={32} />
            <div className="flex items-center gap-1.5 pt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: npcChar.glow,
                    animation: `breathe 1s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="px-4 py-3"
        style={{
          background: `linear-gradient(0deg, rgba(${npcChar.glowRgb},0.03), transparent)`,
          borderTop: `1px solid rgba(${npcChar.glowRgb},0.06)`,
        }}
      >
        {messages.length === 0 && (
          <p className="text-[10px] text-[var(--color-text-dim)] text-center mb-2 opacity-60">
            대사 외에 <span className="text-white/50">(행동)</span> <span className="text-white/50">(시간이동)</span> <span className="text-white/50">(전개방향)</span> 도 괄호로 지정할 수 있어요
          </p>
        )}
        <div className="flex gap-2 max-w-lg mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="대사 또는 (행동)을 입력하세요..."
            className="flex-1 rounded-2xl bg-[var(--color-surface-2)] border border-white/[0.06] px-4 py-3 text-base placeholder:text-[var(--color-text-dim)] focus:outline-none disabled:opacity-40 transition-all"
            style={{
              borderColor: input.trim() ? `rgba(${npcChar.glowRgb},0.3)` : undefined,
              boxShadow: input.trim() ? `0 0 15px rgba(${npcChar.glowRgb},0.05)` : undefined,
            }}
          />
          <button
            onClick={onSend}
            disabled={sending || !input.trim()}
            className={`px-5 py-3 rounded-2xl ${npcChar.btnBg} text-sm font-medium transition-all disabled:opacity-25 disabled:cursor-not-allowed active:scale-95`}
            style={{
              boxShadow: !sending && input.trim() ? `0 0 20px rgba(${npcChar.glowRgb},0.2)` : undefined,
            }}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- useRoomPolling Hook ----
// Polls GET /api/room/{roomId} for room updates (KV is source of truth)
function useRoomPolling(
  roomId: string | null,
  enabled: boolean,
  sendingRef: React.RefObject<boolean>,
  setMessages: React.Dispatch<React.SetStateAction<RoomMessage[]>>,
  setPlayerCount: React.Dispatch<React.SetStateAction<number>>,
  interval = 2000,
) {
  useEffect(() => {
    if (!roomId || !enabled) return;

    let timer: ReturnType<typeof setInterval>;

    const poll = async () => {
      if (sendingRef.current) return; // skip while sending — POST result handles it
      try {
        const res = await fetch(`/api/room/${roomId}`);
        if (!res.ok) return;
        const data: { messages?: RoomMessage[]; room?: { players?: unknown[] } } = await res.json();
        const polledMessages: RoomMessage[] = data.messages ?? [];
        const polledPlayerCount: number = data.room?.players?.length ?? 1;

        setMessages((prev) => {
          const prevIds = new Set(
            prev.filter((m) => !m.id.startsWith('pending-')).map((m) => m.id),
          );
          const hasNew = polledMessages.some((m) => !prevIds.has(m.id));
          if (!hasNew && polledMessages.length === prev.filter((m) => !m.id.startsWith('pending-')).length) {
            return prev; // no change → skip re-render
          }
          return polledMessages; // KV is source of truth → replace entirely
        });

        setPlayerCount(polledPlayerCount);
      } catch {
        // network error — will retry next interval
      }
    };

    // Initial fetch
    poll();
    timer = setInterval(poll, interval);

    return () => clearInterval(timer);
  }, [roomId, enabled, interval, sendingRef, setMessages, setPlayerCount]);
}

// ---- Main ----
export default function GameClient({ pack }: { pack: ClientStoryPack }) {
  const [phase, setPhase] = useState<Phase>('title');
  const [villageId, setVillageId] = useState<string | null>(null);
  const [activeChar, setActiveChar] = useState<Character | null>(null);
  const [chatCounts, setChatCounts] = useState<Record<string, number>>({});
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Room state
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [myDisplayName, setMyDisplayName] = useState<string | null>(null);
  const [myCharacterId, setMyCharacterId] = useState<string | null>(null);
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]);
  const [playerCount, setPlayerCount] = useState(1);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  const storageKey = `novel:${pack.slug}`;

  // ---- Single session storage ----
  interface Session {
    roomId: string;
    playerId: string;
    npcId: string;
    villageId: string;
    displayName: string;
    characterId: string;
  }

  function saveSession(s: Session) {
    try { localStorage.setItem(`${storageKey}:session`, JSON.stringify(s)); } catch {}
  }

  function loadSession(): Session | null {
    try {
      const raw = localStorage.getItem(`${storageKey}:session`);
      return raw ? JSON.parse(raw) as Session : null;
    } catch { return null; }
  }

  function clearSession() {
    try { localStorage.removeItem(`${storageKey}:session`); } catch {}
  }

  // Restore state on mount
  useEffect(() => {
    // 1) Check localStorage session first (covers refresh + re-entry)
    const session = loadSession();
    if (session) {
      const char = pack.characters.find((c) => c.id === session.npcId);
      if (char) {
        setActiveChar(char);
        setVillageId(session.villageId);
        setMyDisplayName(session.displayName);
        setMyCharacterId(session.characterId);
        setRoomId(session.roomId);
        setPlayerId(session.playerId);
        setPhase('chat');
        // Ensure URL reflects the session
        const url = new URL(window.location.href);
        url.searchParams.set('room', session.roomId);
        url.searchParams.set('v', session.villageId);
        url.searchParams.set('npc', session.npcId);
        window.history.replaceState({}, '', url.toString());
        // Background: ensure player in KV
        joinRoomAPI({
          roomId: session.roomId,
          playerId: session.playerId,
          displayName: session.displayName,
          characterId: session.characterId,
          slug: pack.slug,
          villageId: session.villageId,
          npcCharacterId: session.npcId,
        }).catch(() => {});
        return;
      }
    }

    // 2) Check URL params (shared link from someone else, no local session)
    const url = new URL(window.location.href);
    const roomParam = url.searchParams.get('room');
    const villageParam = url.searchParams.get('v');
    const npcParam = url.searchParams.get('npc');

    if (roomParam && villageParam && npcParam) {
      const char = pack.characters.find((c) => c.id === npcParam);
      if (char) {
        setJoiningRoomId(roomParam);
        setActiveChar(char);
        setVillageId(villageParam);
        setPhase('roleSelect');
        return;
      }
    }

    // 3) Normal flow: restore villageId
    try {
      const savedVillageId = localStorage.getItem(`${storageKey}:villageId`);
      if (savedVillageId) {
        setVillageId(savedVillageId);
        setPhase('select');
      }
    } catch {}
  }, [storageKey, pack.characters]);

  // Ref to let polling hook skip while sending (POST result handles it)
  const sendingRef = useRef(false);
  sendingRef.current = sending;

  // Polling: fetch room state periodically (KV is source of truth)
  useRoomPolling(roomId, phase === 'chat', sendingRef, setRoomMessages, setPlayerCount);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [roomMessages, sending]);

  // Focus input on chat phase
  useEffect(() => {
    if (phase === 'chat') inputRef.current?.focus();
  }, [phase]);

  // ---- Handlers ----

  const handleStart = useCallback(async () => {
    setPhase('loading');
    try {
      const newVillageId = await startGame(pack.slug);
      setVillageId(newVillageId);
      localStorage.setItem(`${storageKey}:villageId`, newVillageId);
      setPhase('select');
    } catch {
      setPhase('title');
    }
  }, [pack.slug, storageKey]);

  const handleSelect = useCallback((char: Character) => {
    setActiveChar(char);

    // Check if we have a saved session for this NPC
    const session = loadSession();
    if (session && session.npcId === char.id) {
      // Restore from session → straight to chat
      setMyDisplayName(session.displayName);
      setMyCharacterId(session.characterId);
      setRoomId(session.roomId);
      setPlayerId(session.playerId);

      const url = new URL(window.location.href);
      url.searchParams.set('room', session.roomId);
      url.searchParams.set('v', session.villageId);
      url.searchParams.set('npc', session.npcId);
      window.history.replaceState({}, '', url.toString());

      setPhase('chat');

      // Background: ensure player in KV
      joinRoomAPI({
        roomId: session.roomId,
        playerId: session.playerId,
        displayName: session.displayName,
        characterId: session.characterId,
        slug: pack.slug,
        villageId: session.villageId,
        npcCharacterId: session.npcId,
      }).catch(() => {
        clearSession();
        setRoomId(null);
        setPlayerId(null);
        setPhase('roleSelect');
      });
      return;
    }

    setPhase('roleSelect');
  }, [pack.slug]);

  const handleRoleConfirm = useCallback(async (displayName: string, characterId: string) => {
    if (!activeChar) return;
    setRoleLoading(true);

    setMyDisplayName(displayName);
    setMyCharacterId(characterId);

    try {
      if (joiningRoomId) {
        const result = await joinRoomAPI({
          roomId: joiningRoomId,
          displayName,
          characterId,
          slug: pack.slug,
          villageId: villageId ?? undefined,
          npcCharacterId: activeChar.id,
        });
        setRoomId(joiningRoomId);
        setPlayerId(result.playerId);
        setRoomMessages(result.messages);
        setPlayerCount(result.room.players.length);
        saveSession({
          roomId: joiningRoomId, playerId: result.playerId, npcId: activeChar.id,
          villageId: villageId ?? '', displayName, characterId,
        });
        setPhase('chat');
      } else {
        if (!villageId) { setRoleLoading(false); return; }
        const result = await createRoomAPI({
          slug: pack.slug,
          villageId,
          npcCharacterId: activeChar.id,
          player: { displayName, characterId },
        });
        setRoomId(result.roomId);
        setPlayerId(result.playerId);
        setRoomMessages([]);
        setPlayerCount(1);
        saveSession({
          roomId: result.roomId, playerId: result.playerId, npcId: activeChar.id,
          villageId, displayName, characterId,
        });

        const url = new URL(window.location.href);
        url.searchParams.set('room', result.roomId);
        url.searchParams.set('v', villageId);
        url.searchParams.set('npc', activeChar.id);
        window.history.replaceState({}, '', url.toString());

        setPhase('chat');
      }
    } catch (err) {
      console.error('Failed to create/join room:', err);
    } finally {
      setRoleLoading(false);
    }
  }, [activeChar, joiningRoomId, villageId, pack.slug]);

  const handleBack = useCallback(() => {
    // Session stays in localStorage — re-entering will auto-restore
    setRoomId(null);
    setPlayerId(null);
    setRoomMessages([]);
    setActiveChar(null);
    setJoiningRoomId(null);

    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    url.searchParams.delete('v');
    url.searchParams.delete('npc');
    window.history.replaceState({}, '', url.toString());

    if (villageId) {
      setPhase('select');
    } else {
      setPhase('title');
    }
  }, [villageId]);

  const handleReset = useCallback(() => {
    setPhase('title');
    setVillageId(null);
    setActiveChar(null);
    setRoomId(null);
    setPlayerId(null);
    setRoomMessages([]);
    setChatCounts({});
    setJoiningRoomId(null);
    try {
      localStorage.removeItem(`${storageKey}:villageId`);
      clearSession();
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    url.searchParams.delete('v');
    url.searchParams.delete('npc');
    window.history.replaceState({}, '', url.toString());
  }, [storageKey]);

  const handleSend = useCallback(async () => {
    if (sending) return;
    const msg = input.trim();
    if (!msg || !activeChar || !roomId || !playerId) return;

    setInput('');
    setSending(true);

    // Optimistic: show user message immediately
    const tempId = `pending-${Date.now()}`;
    setRoomMessages((prev) => [
      ...prev,
      {
        id: tempId,
        roomId: roomId!,
        timestamp: Date.now(),
        sender: { type: 'player' as const, id: playerId!, name: myDisplayName ?? pack.playerDisplayName },
        text: msg,
      },
    ]);

    try {
      const result = await sendRoomMessage(roomId, playerId, msg, {
        slug: pack.slug,
        villageId: villageId ?? '',
        npcCharacterId: activeChar.id,
        displayName: myDisplayName ?? pack.playerDisplayName,
        characterId: myCharacterId ?? pack.playerCharacterId,
      });
      // Replace temp message with real ones (dedup against SSE)
      setRoomMessages((prev) => {
        const without = prev.filter((m) => m.id !== tempId);
        const ids = new Set(without.map((m) => m.id));
        const toAdd: RoomMessage[] = [];
        if (result.playerMessage && !ids.has(result.playerMessage.id)) toAdd.push(result.playerMessage);
        if (result.npcMessage && !ids.has(result.npcMessage.id)) toAdd.push(result.npcMessage);
        return [...without, ...toAdd];
      });
    } catch {
      setRoomMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        {
          id: `error-${Date.now()}`,
          roomId: roomId!,
          timestamp: Date.now(),
          sender: { type: 'system' as const },
          text: '(응답을 생성하지 못했어요)',
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending, activeChar, roomId, playerId, villageId, pack, myDisplayName, myCharacterId]);

  const handleShare = useCallback(() => {
    if (!roomId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId);
    navigator.clipboard.writeText(url.toString()).then(() => {
      // Visual feedback: could add a toast but keeping it simple
      alert('방 링크가 클립보드에 복사되었습니다!');
    }).catch(() => {});
  }, [roomId]);

  // ---- Render ----

  let content: React.ReactNode = null;

  if (phase === 'title' || phase === 'loading') {
    content = <TitleScreen pack={pack} onStart={handleStart} loading={phase === 'loading'} />;
  } else if (phase === 'select') {
    content = (
      <SelectScreen
        pack={pack}
        chatCounts={chatCounts}
        onSelect={handleSelect}
        onReset={handleReset}
      />
    );
  } else if (phase === 'roleSelect' && activeChar) {
    content = (
      <RoleSelectScreen
        pack={pack}
        npcChar={activeChar}
        defaultDisplayName={myDisplayName ?? pack.playerDisplayName}
        defaultCharacterId={myCharacterId ?? pack.playerCharacterId}
        isJoining={!!joiningRoomId}
        onConfirm={handleRoleConfirm}
        loading={roleLoading}
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
        playerCount={playerCount}
        myPlayerId={playerId ?? ''}
        inputRef={inputRef}
        scrollRef={scrollRef}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-black flex justify-center">
      <div className="w-full max-w-[480px] h-full bg-[#08080d] relative md:border-x md:border-white/[0.06] md:shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        {content}
      </div>
    </div>
  );
}
