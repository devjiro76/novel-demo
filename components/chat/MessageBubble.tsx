'use client';

import React from 'react';
import type { RoomMessage } from '@/lib/room';
import type { CharacterMeta } from '@/lib/story-pack';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type Character = CharacterMeta;

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h < 12 ? '오전' : '오후';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${h12}:${m}`;
}

function CharAvatar({ char, size = 40, imageSrc }: { char: Character; size?: number; imageSrc?: string }) {
  const sizeClass = size <= 32 ? 'size-8' : size <= 40 ? 'size-10' : 'size-14';
  const fontSize = size <= 32 ? 'text-xs' : size <= 40 ? 'text-sm' : 'text-lg';
  return (
    <Avatar className={`${sizeClass} border border-white/10`}>
      {imageSrc && char.image && (
        <AvatarImage
          src={imageSrc}
          alt={char.name}
          className="object-cover object-[50%_15%]"
        />
      )}
      <AvatarFallback
        className={`${fontSize} font-bold`}
        style={{
          background: `linear-gradient(135deg, rgba(${char.glowRgb},0.3), rgba(${char.glowRgb},0.1))`,
          color: char.glow,
        }}
        delayMs={0}
      >
        {char.name.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Render text with @mention highlighted using the mentioned NPC's color */
function renderMentionText(text: string, npcChars?: Map<string, Character>, allChars?: Character[]) {
  const match = text.match(/^(@\S+)\s*/);
  if (!match) return <>{text}</>;

  const mentionTag = match[1]; // e.g. "@은혜"
  const name = mentionTag.slice(1);
  const rest = text.slice(match[0].length);

  // Find the character to get their color
  let color: string | undefined;
  if (npcChars) {
    for (const c of npcChars.values()) {
      if (c.name === name) { color = c.glow; break; }
    }
  }
  if (!color && allChars) {
    const c = allChars.find((ch) => ch.name === name);
    if (c) color = c.glow;
  }

  return (
    <>
      <span className="font-semibold" style={{ color: color ?? '#a78bfa' }}>{mentionTag}</span>
      {rest ? ' ' + rest : ''}
    </>
  );
}

function RoomMessageBubbleInner({ msg, npcChar, npcChars, myPlayerId, assetsBasePath }: {
  msg: RoomMessage;
  npcChar: Character;
  npcChars?: Map<string, Character>;
  myPlayerId: string;
  assetsBasePath?: string;
}) {
  // System message
  if (msg.sender.type === 'system') {
    return (
      <div className="flex justify-center slide-up">
        <Badge variant="secondary" className="text-[11px] font-normal">
          {msg.text}
        </Badge>
      </div>
    );
  }

  // Player message (mine)
  if (msg.sender.type === 'player' && msg.sender.id === myPlayerId) {
    return (
      <div className="flex justify-end items-end gap-1.5 slide-up">
        <span className="text-[9px] text-[var(--color-text-dim)] shrink-0 pb-1">{formatTime(msg.timestamp)}</span>
        <div className="max-w-[78%] rounded-2xl rounded-br-md bg-white/[0.06] backdrop-blur-sm px-4 py-2.5 border border-white/[0.04]">
          <p className="text-[13px] leading-relaxed">{renderMentionText(msg.text, npcChars)}</p>
        </div>
      </div>
    );
  }

  // Player message (other)
  if (msg.sender.type === 'player') {
    return (
      <div className="flex gap-2.5 items-start max-w-[85%] slide-up">
        <Avatar className="size-7">
          <AvatarFallback className="bg-white/[0.08] text-[10px] font-bold text-white/60">
            {msg.sender.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[var(--color-text-dim)] mb-1">{msg.sender.name}</p>
          <div className="flex items-end gap-1.5">
            <div className="rounded-2xl rounded-tl-md bg-white/[0.04] backdrop-blur-sm px-4 py-2.5 border border-white/[0.04]">
              <p className="text-[13px] leading-relaxed">{renderMentionText(msg.text, npcChars)}</p>
            </div>
            <span className="text-[9px] text-[var(--color-text-dim)] shrink-0 pb-1">{formatTime(msg.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  // NPC message — resolve the correct character for multi-NPC rooms
  const resolvedChar = (npcChars && msg.sender.type === 'npc')
    ? (npcChars.get(msg.sender.id) ?? npcChar)
    : npcChar;

  return (
    <div className="slide-up space-y-3">
      {msg.action && (
        <p className="text-[13px] text-white/50 italic leading-loose mx-4 my-1 px-4 py-3 rounded-xl bg-white/[0.02] border-l-2 border-white/[0.08]">
          {msg.action}
        </p>
      )}

      {(msg.text || msg.innerThought) && (
        <div className="flex gap-2.5 items-start max-w-[92%]">
          <CharAvatar char={resolvedChar} size={32} imageSrc={assetsBasePath ? `${assetsBasePath}${resolvedChar.image}` : undefined} />
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-medium mb-1 ${resolvedChar.accentText}`}>{resolvedChar.name}</p>
            <div
              className="rounded-2xl rounded-tl-md px-4 py-3 space-y-2"
              style={{
                background: `linear-gradient(135deg, rgba(${resolvedChar.glowRgb},0.07), rgba(${resolvedChar.glowRgb},0.02))`,
                border: `1px solid rgba(${resolvedChar.glowRgb},0.1)`,
              }}
            >
              {msg.text && (
                <p className="text-[13px] leading-relaxed">{msg.text}</p>
              )}
              {msg.innerThought && (
                <p
                  className="text-[12px] italic leading-relaxed pl-2.5 mt-1 opacity-75"
                  style={{
                    borderLeft: `2px solid rgba(${resolvedChar.glowRgb},0.4)`,
                  }}
                >
                  {msg.innerThought}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1.5 ml-1">
              {msg.emotion && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal border-transparent"
                  style={{ color: resolvedChar.glow, background: `rgba(${resolvedChar.glowRgb},0.1)` }}
                >
                  {msg.emotion}
                </Badge>
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
