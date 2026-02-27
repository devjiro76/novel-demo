'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ConversationResponse } from '@/lib/types';
import type { ClientStoryPack, CharacterMeta } from '@/lib/story-pack';
import { startGame, submitConversation } from '@/lib/api-client';
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

type Phase = 'title' | 'loading' | 'select' | 'chat';

interface ChatMessage {
  role: 'user' | 'character';
  text: string;
  action?: string;
  innerThought?: string;
  emotion?: string;
}

type Character = CharacterMeta;

// ---- Avatar ----
function Avatar({ char, size = 40 }: { char: Character; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden shrink-0 border border-white/10"
      style={{ width: size, height: size }}
    >
      <img
        src={`${BASE}${char.image}`}
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
      {/* Background */}
      <div className="absolute inset-0">
        <picture>
          <source media="(min-width: 768px)" srcSet={`${BASE}${pack.coverWide}`} />
          <img
            src={`${BASE}${pack.coverTall}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center opacity-40 blur-[2px] md:scale-110 md:opacity-50"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080d] via-[#08080d]/60 to-[#08080d]/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08080d]/80 via-transparent to-[#08080d]" />
      </div>

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full bg-pink-500/8 blur-[80px] breathe pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center pb-20 px-6 slide-up">
        <img
          src={`${BASE}${pack.logo}`}
          alt={pack.subtitle ?? pack.title}
          className="w-[280px] max-w-[80vw] mx-auto mb-8 drop-shadow-lg"
        />

        <p className="text-[12px] text-white/30 mb-8 leading-relaxed">
          당신은 <span className="text-pink-300/60 font-semibold">{pack.playerDisplayName}</span>입니다.<br />
          캐릭터들은 당신을 용준으로 대합니다.
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
function CharacterCard({ char, chatCount, onClick, delay }: {
  char: Character;
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
        {/* Image */}
        <div className="relative w-24 shrink-0 overflow-hidden">
          <img
            src={`${BASE}${char.image}`}
            alt={char.name}
            className="absolute inset-0 w-full h-full object-cover object-[50%_12%]"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${char.gradient}`} />
        </div>

        {/* Info */}
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

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `inset 0 0 40px rgba(${char.glowRgb},0.05)` }}
      />
    </button>
  );
}

// ---- Select Screen ----
function SelectScreen({ characters, chatHistories, onSelect, onReset }: {
  characters: Character[];
  chatHistories: Record<string, ChatMessage[]>;
  onSelect: (char: Character) => void;
  onReset: () => void;
}) {
  return (
    <div className="h-screen flex flex-col">
      <header className="px-5 pt-8 pb-5">
        <div className="flex items-end justify-between">
          <div>
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
        {characters.map((char, i) => (
          <CharacterCard
            key={char.id}
            char={char}
            chatCount={(chatHistories[char.id] ?? []).length}
            onClick={() => onSelect(char)}
            delay={i * 100}
          />
        ))}
      </main>
    </div>
  );
}

// ---- Chat Message ----
function MessageBubble({ msg, char }: { msg: ChatMessage; char: Character }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end slide-up">
        <div className="max-w-[78%] rounded-2xl rounded-br-md bg-white/[0.06] backdrop-blur-sm px-4 py-2.5 border border-white/[0.04]">
          <p className="text-[13px] leading-relaxed">{msg.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-up space-y-3">
      {/* Narration — full width, no avatar, visually separate */}
      {msg.action && (
        <p className="text-[12px] text-white/70 italic leading-relaxed text-center px-6">
          {msg.action}
        </p>
      )}

      {/* Character speech bubble */}
      {(msg.text || msg.innerThought) && (
        <div className="flex gap-2.5 items-start max-w-[92%]">
          <Avatar char={char} size={32} />
          <div className="flex-1 min-w-0">
            <div
              className="rounded-2xl rounded-tl-md px-4 py-3 space-y-2"
              style={{
                background: `linear-gradient(135deg, rgba(${char.glowRgb},0.07), rgba(${char.glowRgb},0.02))`,
                border: `1px solid rgba(${char.glowRgb},0.1)`,
              }}
            >
              {msg.text && (
                <p className="text-[13px] leading-relaxed">&ldquo;{msg.text}&rdquo;</p>
              )}
              {msg.innerThought && (
                <p
                  className="text-[12px] italic leading-relaxed pl-2.5 mt-1"
                  style={{
                    borderLeft: `2px solid rgba(${char.glowRgb},0.4)`,
                    color: char.glow,
                    opacity: 0.75,
                  }}
                >
                  ({msg.innerThought})
                </p>
              )}
            </div>

            {msg.emotion && (
              <span
                className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-1.5 ml-1"
                style={{ color: char.glow, background: `rgba(${char.glowRgb},0.1)` }}
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

// ---- Chat Screen ----
function ChatScreen({ char, messages, sending, input, onInputChange, onSend, onBack, inputRef, scrollRef }: {
  char: Character;
  messages: ChatMessage[];
  sending: boolean;
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onBack: () => void;
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
      {/* Header */}
      <header
        className="px-4 py-3 flex items-center gap-3 slide-down"
        style={{
          background: `linear-gradient(180deg, rgba(${char.glowRgb},0.06), transparent)`,
          borderBottom: `1px solid rgba(${char.glowRgb},0.08)`,
        }}
      >
        <button
          onClick={onBack}
          className="text-sm text-[var(--color-text-dim)] hover:text-white/60 transition-colors p-1"
        >
          ←
        </button>
        <Avatar char={char} size={36} />
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-bold ${char.accentText}`}>{char.fullName}</span>
          <span className="text-[10px] text-[var(--color-text-dim)] ml-2">{char.role}</span>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 opacity-50">
            <Avatar char={char} size={56} />
            <p className="text-xs text-[var(--color-text-dim)] mt-4 leading-relaxed">
              {char.fullName}에게 말을 걸어보세요.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} char={char} />
        ))}

        {sending && (
          <div className="flex gap-2.5 items-start slide-up">
            <Avatar char={char} size={32} />
            <div className="flex items-center gap-1.5 pt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: char.glow,
                    animation: `breathe 1s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="px-4 py-3"
        style={{
          background: `linear-gradient(0deg, rgba(${char.glowRgb},0.03), transparent)`,
          borderTop: `1px solid rgba(${char.glowRgb},0.06)`,
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
              borderColor: input.trim() ? `rgba(${char.glowRgb},0.3)` : undefined,
              boxShadow: input.trim() ? `0 0 15px rgba(${char.glowRgb},0.05)` : undefined,
            }}
          />
          <button
            onClick={onSend}
            disabled={sending || !input.trim()}
            className={`px-5 py-3 rounded-2xl ${char.btnBg} text-sm font-medium transition-all disabled:opacity-25 disabled:cursor-not-allowed active:scale-95`}
            style={{
              boxShadow: !sending && input.trim() ? `0 0 20px rgba(${char.glowRgb},0.2)` : undefined,
            }}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main ----
export default function GameClient({ pack }: { pack: ClientStoryPack }) {
  const [phase, setPhase] = useState<Phase>('title');
  const [activeChar, setActiveChar] = useState<Character | null>(null);
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('novel:started')) setPhase('select');
      const saved = sessionStorage.getItem('novel:chats');
      if (saved) setChatHistories(JSON.parse(saved));
    } catch {}
  }, []);

  const messages = activeChar ? (chatHistories[activeChar.id] ?? []) : [];

  const setMessages = useCallback((updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (!activeChar) return;
    setChatHistories((prev) => ({
      ...prev,
      [activeChar.id]: typeof updater === 'function' ? updater(prev[activeChar.id] ?? []) : updater,
    }));
  }, [activeChar]);

  useEffect(() => {
    try { sessionStorage.setItem('novel:chats', JSON.stringify(chatHistories)); } catch {}
  }, [chatHistories]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (phase === 'chat') inputRef.current?.focus();
  }, [phase]);

  const handleStart = useCallback(async () => {
    setPhase('loading');
    try {
      await startGame();
      sessionStorage.setItem('novel:started', '1');
      setPhase('select');
    } catch {
      setPhase('title');
    }
  }, []);

  const handleSelect = useCallback((char: Character) => {
    setActiveChar(char);
    setPhase('chat');
  }, []);

  const handleBack = useCallback(() => {
    setActiveChar(null);
    setPhase('select');
  }, []);

  const handleReset = useCallback(() => {
    setPhase('title');
    setActiveChar(null);
    setChatHistories({});
    try {
      sessionStorage.removeItem('novel:chats');
      sessionStorage.removeItem('novel:started');
    } catch {}
  }, []);

  const handleSend = useCallback(async () => {
    const msg = input.trim();
    if (!msg || sending || !activeChar) return;

    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setSending(true);

    try {
      const situation = pack.defaultSituation.replace(/\{\{charFullName\}\}/g, activeChar.fullName);
      const res: ConversationResponse = await submitConversation(activeChar.id, msg, situation, messages);
      setMessages((prev) => [
        ...prev,
        {
          role: 'character',
          text: res.dialogue,
          action: res.action,
          innerThought: res.innerThought,
          emotion: res.emotion.primary,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'character', text: '(응답을 생성하지 못했어요)' },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, activeChar, messages, setMessages]);

  let content: React.ReactNode = null;

  if (phase === 'title' || phase === 'loading') {
    content = <TitleScreen pack={pack} onStart={handleStart} loading={phase === 'loading'} />;
  } else if (phase === 'select') {
    content = (
      <SelectScreen
        characters={pack.characters}
        chatHistories={chatHistories}
        onSelect={handleSelect}
        onReset={handleReset}
      />
    );
  } else if (phase === 'chat' && activeChar) {
    content = (
      <ChatScreen
        char={activeChar}
        messages={messages}
        sending={sending}
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onBack={handleBack}
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
