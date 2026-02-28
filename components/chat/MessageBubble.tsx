'use client';

import React from 'react';
import type { RoomMessage } from '@/lib/room';
import type { ClientStoryPack, CharacterMeta } from '@/lib/story-pack';

type Character = CharacterMeta;

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h < 12 ? '오전' : '오후';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${h12}:${m}`;
}

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

function RoomMessageBubbleInner({ msg, npcChar, pack, myPlayerId }: {
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
      <div className="flex justify-end items-end gap-1.5 slide-up">
        <span className="text-[9px] text-[var(--color-text-dim)] shrink-0 pb-1">{formatTime(msg.timestamp)}</span>
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
          <div className="flex items-end gap-1.5">
            <div className="rounded-2xl rounded-tl-md bg-white/[0.04] backdrop-blur-sm px-4 py-2.5 border border-white/[0.04]">
              <p className="text-[13px] leading-relaxed">{msg.text}</p>
            </div>
            <span className="text-[9px] text-[var(--color-text-dim)] shrink-0 pb-1">{formatTime(msg.timestamp)}</span>
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

            <div className="flex items-center gap-2 mt-1.5 ml-1">
              {msg.emotion && (
                <span
                  className="inline-block text-[10px] px-2 py-0.5 rounded-full"
                  style={{ color: npcChar.glow, background: `rgba(${npcChar.glowRgb},0.1)` }}
                >
                  {msg.emotion}
                </span>
              )}
              <span className="text-[9px] text-[var(--color-text-dim)]">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const RoomMessageBubble = React.memo(RoomMessageBubbleInner);
export { CharAvatar };
