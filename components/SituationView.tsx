'use client';

import type { FC } from 'react';
import type { CharacterStatus } from '@/lib/types';

interface Props {
  situation: string;
  location: string;
  characters: CharacterStatus[];
}

const EMOTION_EMOJI: Record<string, string> = {
  joy: '😊',
  sadness: '😢',
  anger: '😠',
  fear: '😰',
  surprise: '😲',
  disgust: '😒',
  trust: '🤝',
  anticipation: '✨',
  serenity: '😌',
  interest: '🤔',
  neutral: '😐',
};

function getEmoji(label: string): string {
  const lower = label.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOTION_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '💭';
}

const SituationView: FC<Props> = ({ situation, location, characters }) => {
  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-dim)]">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
        {location}
      </div>

      <div className="text-base leading-relaxed whitespace-pre-line">
        {situation}
      </div>

      {characters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {characters.map((c) => (
            <div
              key={c.characterId}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-2)] text-sm"
            >
              <span className="text-base">{getEmoji(c.emotionLabel)}</span>
              <div>
                <span className="font-medium">{c.displayName}</span>
                <span className="ml-2 text-xs text-[var(--color-text-dim)]">
                  {c.emotionLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SituationView;
