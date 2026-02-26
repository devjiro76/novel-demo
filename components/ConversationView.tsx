'use client';

import { useState, useRef, useEffect, type FC } from 'react';
import type { ConversationResponse } from '@/lib/types';
import { submitConversation } from '@/lib/api-client';

interface ConversationMessage {
  role: 'user' | 'character';
  text: string;
  action?: string;
  innerThought?: string;
  emotion?: { primary: string; vad: { V: number; A: number; D: number } };
}

interface Props {
  characterId: string;
  displayName: string;
  tierCrossed: number;
  situation: string;
  onEnd: () => void;
}

function vadToColor(vad: { V: number; A: number; D: number }): string {
  if (vad.V > 0.3) return 'text-green-400';
  if (vad.V < -0.3) return 'text-red-400';
  return 'text-yellow-400';
}

const ConversationView: FC<Props> = ({ characterId, displayName, tierCrossed, situation, onEnd }) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [ended, setEnded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || sending || ended) return;

    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setSending(true);

    try {
      const res: ConversationResponse = await submitConversation(characterId, msg, situation);
      setMessages((prev) => [
        ...prev,
        {
          role: 'character',
          text: res.dialogue,
          action: res.action,
          innerThought: res.innerThought,
          emotion: res.emotion,
        },
      ]);
      if (res.conversationOver) {
        setEnded(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'character', text: '(응답을 생성하지 못했습니다)' },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full fade-in">
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-purple-300">
            {displayName}와(과) 대화
          </span>
          <span className="text-[10px] text-[var(--color-text-dim)]">
            Tier {tierCrossed} 돌파
          </span>
        </div>
        <p className="text-xs text-[var(--color-text-dim)] mt-1">
          자유롭게 대화하세요. 캐릭터가 자연스럽게 대화를 마무리할 수 있습니다.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] max-h-[400px]">
        {messages.map((msg, i) =>
          msg.role === 'user' ? (
            <div key={i} className="flex justify-end slide-up" style={{ animationDelay: '0ms' }}>
              <div className="max-w-[80%] rounded-lg bg-purple-600/30 border border-purple-500/20 px-3 py-2">
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ) : (
            <div key={i} className="slide-up" style={{ animationDelay: '0ms' }}>
              <div className="rounded-lg border border-white/5 bg-[var(--color-surface-2)] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-xs font-medium">{displayName}</span>
                  {msg.emotion && (
                    <span className={`text-[10px] ${vadToColor(msg.emotion.vad)}`}>
                      {msg.emotion.primary}
                    </span>
                  )}
                </div>
                <div className="px-3 py-2 space-y-1.5">
                  {msg.action && (
                    <p className="text-xs text-[var(--color-text-secondary)] italic">{msg.action}</p>
                  )}
                  {msg.text && (
                    <p className="text-sm">&ldquo;{msg.text}&rdquo;</p>
                  )}
                  {msg.innerThought && (
                    <p className="text-[10px] text-[var(--color-text-dim)] italic border-l-2 border-purple-500/30 pl-2">
                      {msg.innerThought}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ),
        )}

        {sending && (
          <div className="text-xs text-[var(--color-text-dim)] animate-pulse px-1">
            {displayName}이(가) 생각하고 있습니다...
          </div>
        )}
      </div>

      {!ended ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            placeholder="메시지를 입력하세요..."
            className="flex-1 rounded-lg bg-[var(--color-surface-2)] border border-white/10 px-3 py-2 text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none focus:border-purple-500/40 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전송
          </button>
        </div>
      ) : (
        <button
          onClick={onEnd}
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium transition-all active:scale-[0.98]"
        >
          대화 종료 — 다음 상황으로
        </button>
      )}

      {!ended && (
        <button
          onClick={onEnd}
          className="mt-2 w-full py-2 rounded-lg border border-white/10 text-xs text-[var(--color-text-dim)] hover:border-white/20 hover:text-[var(--color-text-secondary)] transition-all"
        >
          대화 그만하기
        </button>
      )}
    </div>
  );
};

export default ConversationView;
