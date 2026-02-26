'use client';

import { type FC, useState } from 'react';
import type { TurnRecord } from '@/lib/types';

interface Props {
  records: TurnRecord[];
}

const StoryLog: FC<Props> = ({ records }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (records.length === 0) return null;

  return (
    <div className="border-t border-white/5 mt-6 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-[var(--color-text-dim)] hover:text-white transition-colors"
      >
        <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>
          ▸
        </span>
        이전 기록 ({records.length}턴)
      </button>

      {isOpen && (
        <div className="mt-3 space-y-4 max-h-96 overflow-y-auto pr-2">
          {[...records].reverse().map((record, i) => (
            <div
              key={i}
              className="text-xs border-l-2 border-white/10 pl-3 space-y-1"
            >
              <div className="flex items-center gap-2 text-[var(--color-text-dim)]">
                <span className="font-mono">#{record.turn}</span>
                <span className="text-[10px]">{record.location}</span>
              </div>
              <p className="text-[var(--color-text-dim)] line-clamp-2">{record.situation}</p>
              <p className="text-[var(--color-accent)]">▸ {record.choiceText}</p>
              {record.reactions.map((r, j) => (
                <p key={j} className="text-[var(--color-text-dim)]">
                  <span className="font-medium text-white/70">{r.displayName}:</span>{' '}
                  &quot;{r.dialogue.slice(0, 60)}{r.dialogue.length > 60 ? '...' : ''}&quot;
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryLog;
