'use client';

import type { FC } from 'react';
import type { CharacterReaction } from '@/lib/types';

interface Props {
  reaction: CharacterReaction;
  index: number;
}

function vadToColor(vad: { V: number; A: number; D: number }): string {
  if (vad.V > 0.3) return 'text-green-400';
  if (vad.V < -0.3) return 'text-red-400';
  return 'text-yellow-400';
}

function formatVAD(vad: { V: number; A: number; D: number }): string {
  return `V:${vad.V >= 0 ? '+' : ''}${vad.V.toFixed(2)} A:${vad.A.toFixed(2)} D:${vad.D.toFixed(2)}`;
}

const ReactionCard: FC<Props> = ({ reaction, index }) => {
  return (
    <div
      className="slide-up rounded-lg border border-white/5 bg-[var(--color-surface-2)] overflow-hidden"
      style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
        <span className="font-medium text-sm">{reaction.displayName}</span>
        <span className={`text-xs ${vadToColor(reaction.emotion.vad)}`}>
          {reaction.emotion.primary}
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        {reaction.action && (
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] italic">
            {reaction.action}
          </p>
        )}

        {reaction.dialogue && (
          <p className="text-sm leading-relaxed">
            &ldquo;{reaction.dialogue}&rdquo;
          </p>
        )}

        <p className="text-xs text-[var(--color-text-dim)] italic border-l-2 border-purple-500/30 pl-3">
          {reaction.innerThought}
        </p>

        <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-dim)] pt-1">
          <span className={vadToColor(reaction.emotion.vad)}>
            {formatVAD(reaction.emotion.vad)}
          </span>
          {reaction.emotion.secondary && (
            <span>+{reaction.emotion.secondary}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactionCard;
