'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ConversationResponse } from '@/lib/types';
import { startGame, submitConversation } from '@/lib/api-client';

type Phase = 'title' | 'loading' | 'select' | 'chat';

interface ChatMessage {
  role: 'user' | 'character';
  text: string;
  action?: string;
  innerThought?: string;
  emotion?: string;
}

const CHARACTERS = [
  { id: 'jeongsuk', name: '박정숙', age: 41, role: '덕희의 엄마', desc: '남편 몰래 낮에 만나는 사이. "용준아" 하고 부르면서도 몸이 먼저 반응한다.', color: 'pink' },
  { id: 'eunhye', name: '장은혜', age: 22, role: '덕희의 누나', desc: '첫 남자. 방문을 잠그고 만난다. 연하 질색이라던 원칙은 진작에 무너졌다.', color: 'purple' },
  { id: 'mina', name: '김미나', age: 22, role: '덕희의 여자친구', desc: '"이번이 마지막"을 다섯 번 넘게 말했다. 죄책감과 욕망 사이에서 무너지는 중.', color: 'red' },
] as const;

function CharacterCard({ char, onClick }: { char: typeof CHARACTERS[number]; onClick: () => void }) {
  const borderColor = char.color === 'pink' ? 'border-pink-500/30 hover:border-pink-500/60' :
    char.color === 'purple' ? 'border-purple-500/30 hover:border-purple-500/60' :
    'border-red-500/30 hover:border-red-500/60';
  const accentColor = char.color === 'pink' ? 'text-pink-400' :
    char.color === 'purple' ? 'text-purple-400' : 'text-red-400';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border ${borderColor} bg-[var(--color-surface-2)] p-4 transition-all hover:scale-[1.02] active:scale-[0.98]`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <span className={`font-bold ${accentColor}`}>{char.name}</span>
        <span className="text-[10px] text-[var(--color-text-dim)]">{char.age}세 · {char.role}</span>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{char.desc}</p>
    </button>
  );
}

export default function GameClient() {
  const [phase, setPhase] = useState<Phase>('title');
  const [activeChar, setActiveChar] = useState<typeof CHARACTERS[number] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Focus input when entering chat
  useEffect(() => {
    if (phase === 'chat') inputRef.current?.focus();
  }, [phase]);

  const handleStart = useCallback(async () => {
    setPhase('loading');
    try {
      await startGame();
      setPhase('select');
    } catch {
      setPhase('title');
    }
  }, []);

  const handleSelectCharacter = useCallback((char: typeof CHARACTERS[number]) => {
    setActiveChar(char);
    setMessages([]);
    setPhase('chat');
  }, []);

  const handleBack = useCallback(() => {
    setActiveChar(null);
    setMessages([]);
    setPhase('select');
  }, []);

  const handleReset = useCallback(() => {
    setPhase('title');
    setActiveChar(null);
    setMessages([]);
  }, []);

  const handleSend = useCallback(async () => {
    const msg = input.trim();
    if (!msg || sending || !activeChar) return;

    const userMsg: ChatMessage = { role: 'user', text: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const situation = `용준과 ${activeChar.name}은(는) 이미 여러 번 몸을 섞은 비밀 연인이다. 둘만의 시간.`;
      // Pass current chat history (before this message) for context
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
        { role: 'character', text: '(응답 생성 실패)' },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, activeChar, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ---- Title ----
  if (phase === 'title') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-black tracking-tight">못참아</h1>
          <p className="text-sm text-[var(--color-text-dim)]">성인 인터랙티브 노벨</p>
          <button
            onClick={handleStart}
            className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-medium transition-all active:scale-[0.97]"
          >
            시작하기
          </button>
        </div>
      </div>
    );
  }

  // ---- Loading ----
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-[var(--color-text-dim)] animate-pulse">초기화 중...</div>
      </div>
    );
  }

  // ---- Character Select ----
  if (phase === 'select') {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">누구와 대화할까?</h2>
          <button onClick={handleReset} className="text-[10px] text-[var(--color-text-dim)] hover:text-white transition-colors">
            리셋
          </button>
        </header>
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-3">
          {CHARACTERS.map((char) => (
            <CharacterCard key={char.id} char={char} onClick={() => handleSelectCharacter(char)} />
          ))}
        </main>
      </div>
    );
  }

  // ---- Chat ----
  const accentColor = activeChar?.color === 'pink' ? 'text-pink-400' :
    activeChar?.color === 'purple' ? 'text-purple-400' : 'text-red-400';
  const borderAccent = activeChar?.color === 'pink' ? 'border-pink-500/40' :
    activeChar?.color === 'purple' ? 'border-purple-500/40' : 'border-red-500/40';
  const bgAccent = activeChar?.color === 'pink' ? 'bg-pink-600' :
    activeChar?.color === 'purple' ? 'bg-purple-600' : 'bg-red-600';
  const bgAccentHover = activeChar?.color === 'pink' ? 'hover:bg-pink-500' :
    activeChar?.color === 'purple' ? 'hover:bg-purple-500' : 'hover:bg-red-500';

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="text-xs text-[var(--color-text-dim)] hover:text-white transition-colors"
        >
          ← 뒤로
        </button>
        <div className="flex-1 text-center">
          <span className={`text-sm font-bold ${accentColor}`}>{activeChar?.name}</span>
          <span className="text-[10px] text-[var(--color-text-dim)] ml-2">{activeChar?.role}</span>
        </div>
        <div className="w-8" />
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-xs text-[var(--color-text-dim)] py-12">
            {activeChar?.name}에게 말을 걸어보세요.
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-white/10 px-3.5 py-2">
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ) : (
            <div key={i} className="max-w-[88%]">
              <div className={`rounded-2xl rounded-bl-sm border ${borderAccent} bg-[var(--color-surface-2)] px-3.5 py-3 space-y-2`}>
                {msg.action && (
                  <p className="text-sm text-[var(--color-text-secondary)] italic leading-relaxed">{msg.action}</p>
                )}
                {msg.text && (
                  <p className="text-sm leading-relaxed">&ldquo;{msg.text}&rdquo;</p>
                )}
                {msg.innerThought && (
                  <p className="text-xs text-[var(--color-text-dim)] italic border-l-2 border-white/10 pl-2 leading-relaxed">
                    {msg.innerThought}
                  </p>
                )}
              </div>
              {msg.emotion && (
                <span className={`text-[10px] ${accentColor} mt-0.5 px-1`}>{msg.emotion}</span>
              )}
            </div>
          ),
        )}

        {sending && (
          <div className={`text-xs ${accentColor} animate-pulse px-1`}>
            {activeChar?.name}...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/5 px-4 py-3">
        <div className="flex gap-2 max-w-lg mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="메시지를 입력하세요..."
            className="flex-1 rounded-xl bg-[var(--color-surface-2)] border border-white/10 px-4 py-2.5 text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-purple-500/40 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className={`px-5 py-2.5 rounded-xl ${bgAccent} ${bgAccentHover} text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]`}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
