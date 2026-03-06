'use client';

import type { CharacterMeta } from '@/lib/story-pack';
import { CharAvatar } from './MessageBubble';

interface TypingIndicatorProps {
  char: CharacterMeta;
  assetsBasePath: string;
}

export function TypingIndicator({ char, assetsBasePath }: TypingIndicatorProps) {
  const imageSrc = `${assetsBasePath}${char.image}`;

  return (
    <div className="slide-up flex max-w-[92%] items-end gap-2.5">
      <CharAvatar char={char} size={32} imageSrc={imageSrc} />
      <div className="flex flex-col gap-1">
        <p className={`text-[10px] font-medium ${char.accentText}`}>{char.name}</p>
        <div
          className="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-md px-4 py-3"
          style={{
            background: `linear-gradient(135deg, rgba(${char.glowRgb},0.07), rgba(${char.glowRgb},0.02))`,
            border: `1px solid rgba(${char.glowRgb},0.1)`,
          }}
        >
          <span className="mr-1 text-[10px] text-white/50">{char.name}이(가) 입력 중</span>
          <span
            className="dot-bounce dot-bounce-1 inline-block size-1.5 rounded-full"
            style={{ backgroundColor: char.glow }}
          />
          <span
            className="dot-bounce dot-bounce-2 inline-block size-1.5 rounded-full"
            style={{ backgroundColor: char.glow }}
          />
          <span
            className="dot-bounce dot-bounce-3 inline-block size-1.5 rounded-full"
            style={{ backgroundColor: char.glow }}
          />
        </div>
      </div>
    </div>
  );
}
