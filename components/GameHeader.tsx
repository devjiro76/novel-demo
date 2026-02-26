'use client';

import type { FC } from 'react';

const CHAPTER_NAMES: Record<number, string> = {
  1: '김포의 여름',
  2: '균열',
  3: '이중생활',
  4: '폭풍 전야',
  5: '진실',
  6: '그 후',
};

interface Props {
  chapter: number;
  turnCount: number;
  relationships: Record<string, number>;
  onReset: () => void;
}

const DISPLAY_NAMES: Record<string, string> = {
  jeongsuk: '정숙',
  eunhye: '은혜',
  mina: '미나',
  jeongjung: '정중',
  deokhui: '덕희',
};

function affinityColor(val: number): string {
  if (val >= 30) return 'text-pink-400';
  if (val >= 10) return 'text-green-400';
  if (val <= -10) return 'text-red-400';
  return 'text-gray-400';
}

const GameHeader: FC<Props> = ({ chapter, turnCount, relationships, onReset }) => {
  return (
    <header className="sticky top-0 z-10 bg-[var(--color-surface)]/90 backdrop-blur-sm border-b border-white/5 px-4 py-3">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div>
          <div className="text-xs text-[var(--color-text-dim)] tracking-wider">
            Ch.{chapter} {CHAPTER_NAMES[chapter] ?? ''}
          </div>
          <div className="text-sm font-medium">
            {turnCount}턴째
          </div>
        </div>

        <div className="flex gap-3 text-xs">
          {Object.entries(relationships).map(([id, val]) => (
            <span key={id} className={affinityColor(val)} title={`${DISPLAY_NAMES[id]}: ${val}`}>
              {DISPLAY_NAMES[id]} {val > 0 ? '+' : ''}{val}
            </span>
          ))}
        </div>

        <button
          onClick={onReset}
          className="text-xs text-[var(--color-text-dim)] hover:text-white transition-colors"
          title="게임 리셋"
        >
          리셋
        </button>
      </div>
    </header>
  );
};

export default GameHeader;
