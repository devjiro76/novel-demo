'use client';

import React from 'react';
import type { RoomMessage } from '@/lib/room';
import type { CharacterMeta } from '@/lib/story-pack';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { getEmotionGlow, emotionGlowShadow } from '@/lib/emotion-color';
import { EMOTION_EMOJI } from '@/lib/emotion';

type Character = CharacterMeta;

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h < 12 ? '오전' : '오후';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${period} ${h12}:${m}`;
}

const EMOTION_ANIMATION_STYLE: Record<string, React.CSSProperties> = {
  pulse: { animation: 'emotionPulse 1.5s ease-in-out infinite' },
  flash: { animation: 'emotionFlash 0.3s ease-out' },
  tremble: { animation: 'emotionTremble 0.3s ease-in-out 3' },
};

function resolveAvatarSize(size: number): { sizeClass: string; fontSize: string } {
  if (size <= 32) return { sizeClass: 'size-8', fontSize: 'text-xs' };
  if (size <= 40) return { sizeClass: 'size-10', fontSize: 'text-sm' };
  return { sizeClass: 'size-14', fontSize: 'text-lg' };
}

function CharAvatar({
  char,
  size = 40,
  imageSrc,
  emotionKey,
}: {
  char: Character;
  size?: number;
  imageSrc?: string;
  emotionKey?: string;
}) {
  const { sizeClass, fontSize } = resolveAvatarSize(size);

  const emotionGlow = emotionKey ? getEmotionGlow(emotionKey) : null;
  const boxShadow = emotionKey ? emotionGlowShadow(emotionKey, char.glowRgb) : undefined;
  const animationStyle = emotionGlow?.animation
    ? EMOTION_ANIMATION_STYLE[emotionGlow.animation]
    : undefined;

  return (
    <Avatar
      className={`${sizeClass} border border-white/10`}
      style={{
        boxShadow,
        transition: 'box-shadow 0.4s ease',
        ...animationStyle,
      }}
    >
      {imageSrc && char.image && (
        <AvatarImage src={imageSrc} alt={char.name} className="object-cover object-[50%_15%]" />
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
function renderMentionText(
  text: string,
  npcChars?: Map<string, Character>,
  allChars?: Character[],
) {
  const match = text.match(/^(@\S+)\s*/);
  if (!match) return <>{text}</>;

  const mentionTag = match[1]; // e.g. "@은혜"
  const name = mentionTag.slice(1);
  const rest = text.slice(match[0].length);

  // Find the character to get their color
  let color: string | undefined;
  if (npcChars) {
    for (const c of npcChars.values()) {
      if (c.name === name) {
        color = c.glow;
        break;
      }
    }
  }
  if (!color && allChars) {
    const c = allChars.find((ch) => ch.name === name);
    if (c) color = c.glow;
  }

  return (
    <>
      <span className="font-semibold" style={{ color: color ?? '#a78bfa' }}>
        {mentionTag}
      </span>
      {rest ? ' ' + rest : ''}
    </>
  );
}

function EmotionBadgeSimple({
  emotion,
  resolvedChar,
}: {
  emotion: string;
  resolvedChar: Character;
}) {
  return (
    <Badge
      variant="outline"
      className="gap-1 border-transparent text-[10px] font-normal"
      style={{
        color: resolvedChar.glow,
        background: `rgba(${resolvedChar.glowRgb},0.12)`,
        boxShadow: `0 0 8px rgba(${resolvedChar.glowRgb},0.2)`,
      }}
    >
      {EMOTION_EMOJI[emotion] && <span className="text-[11px]">{EMOTION_EMOJI[emotion]}</span>}
      {emotion}
    </Badge>
  );
}

function EmotionBadgeVad({
  msg,
  resolvedChar,
}: {
  msg: RoomMessage & { emotionDetail: NonNullable<RoomMessage['emotionDetail']> };
  resolvedChar: Character;
}) {
  const intensity = msg.emotionDetail.intensity ?? 0.5;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="cursor-default gap-1 border-transparent text-[10px] font-normal"
          style={{
            color: resolvedChar.glow,
            background: `rgba(${resolvedChar.glowRgb},0.12)`,
            boxShadow: `0 0 8px rgba(${resolvedChar.glowRgb},${0.15 + intensity * 0.25})`,
            opacity: 0.7 + intensity * 0.3,
          }}
        >
          {EMOTION_EMOJI[msg.emotionDetail.primary] && (
            <span className="text-[11px]">{EMOTION_EMOJI[msg.emotionDetail.primary]}</span>
          )}
          {msg.emotion}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="space-y-0.5 p-2 text-[10px]">
        <p className="mb-1 font-medium">감정 상태</p>
        <p>
          {EMOTION_EMOJI[msg.emotionDetail.primary] ?? '😐'} {msg.emotion}
        </p>
        {msg.emotionDetail.secondary && (
          <p className="mt-1 text-white/40">
            보조: {EMOTION_EMOJI[msg.emotionDetail.secondary] ?? ''} {msg.emotionDetail.secondary}
          </p>
        )}
        {msg.emotionDetail.intensity !== undefined && (
          <p className="mt-1 text-white/30">
            강도: {Math.round(msg.emotionDetail.intensity * 100)}%
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function EmotionBadgeWithTooltip({
  msg,
  resolvedChar,
}: {
  msg: RoomMessage;
  resolvedChar: Character;
}) {
  if (!msg.emotion) return null;
  if (msg.emotionDetail?.vad) {
    return (
      <EmotionBadgeVad
        msg={msg as RoomMessage & { emotionDetail: NonNullable<RoomMessage['emotionDetail']> }}
        resolvedChar={resolvedChar}
      />
    );
  }
  return <EmotionBadgeSimple emotion={msg.emotion} resolvedChar={resolvedChar} />;
}

function RelationshipDeltaIndicator({
  msg,
  resolvedChar,
}: {
  msg: RoomMessage;
  resolvedChar: Character;
}) {
  if (!msg.relationshipDelta) return null;

  const { trust, strength } = msg.relationshipDelta;
  const isPositive = trust > 0.02 || strength > 0.02;
  const isNegative = trust < -0.02 || strength < -0.02;
  if (!isPositive && !isNegative) return null;

  return (
    <div className="flex justify-center">
      <span
        className="rounded-full px-2.5 py-1 text-[10px]"
        style={{
          background: isPositive ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          color: isPositive ? '#34d399' : '#f87171',
          border: isPositive ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(248,113,113,0.2)',
        }}
      >
        {isPositive
          ? `\u{1F495} ${resolvedChar.name}와(과) 더 가까워졌습니다`
          : `\u{1F494} ${resolvedChar.name}와(과) 거리가 멀어졌습니다`}
      </span>
    </div>
  );
}

function NpcMessageBubble({
  msg,
  resolvedChar,
  assetsBasePath,
}: {
  msg: RoomMessage;
  resolvedChar: Character;
  assetsBasePath?: string;
}) {
  return (
    <div className="slide-up space-y-3">
      {msg.action && (
        <p className="mx-4 my-1 rounded-xl border-l-2 border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13px] leading-loose text-white/50 italic">
          {msg.action}
        </p>
      )}

      {(msg.text || msg.innerThought) && (
        <div className="flex max-w-[92%] items-start gap-2.5">
          <CharAvatar
            char={resolvedChar}
            size={32}
            imageSrc={assetsBasePath ? `${assetsBasePath}${resolvedChar.image}` : undefined}
            emotionKey={msg.emotionDetail?.primary}
          />
          <div className="min-w-0 flex-1">
            <p className={`mb-1 text-[10px] font-medium ${resolvedChar.accentText}`}>
              {resolvedChar.name}
            </p>
            <div
              className="space-y-2 rounded-2xl rounded-tl-md px-4 py-3"
              style={{
                background: `linear-gradient(135deg, rgba(${resolvedChar.glowRgb},0.07), rgba(${resolvedChar.glowRgb},0.02))`,
                border: `1px solid rgba(${resolvedChar.glowRgb},0.1)`,
              }}
            >
              {msg.text && <p className="text-[13px] leading-relaxed">{msg.text}</p>}
              {msg.innerThought && (
                <p
                  className="mt-1 pl-2.5 text-[12px] leading-relaxed italic opacity-75"
                  style={{
                    borderLeft: `2px solid rgba(${resolvedChar.glowRgb},0.4)`,
                  }}
                >
                  {msg.innerThought}
                </p>
              )}
            </div>

            <div className="mt-1.5 ml-1 flex items-center gap-2">
              <EmotionBadgeWithTooltip msg={msg} resolvedChar={resolvedChar} />
              <span className="text-[9px] text-[var(--color-text-dim)]">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        </div>
      )}

      <RelationshipDeltaIndicator msg={msg} resolvedChar={resolvedChar} />
    </div>
  );
}

function RoomMessageBubbleInner({
  msg,
  npcChar,
  npcChars,
  myPlayerId,
  assetsBasePath,
}: {
  msg: RoomMessage;
  npcChar: Character;
  npcChars?: Map<string, Character>;
  myPlayerId: string;
  assetsBasePath?: string;
}) {
  // System message
  if (msg.sender.type === 'system') {
    return (
      <div className="slide-up flex justify-center">
        <Badge variant="secondary" className="text-[11px] font-normal">
          {msg.text}
        </Badge>
      </div>
    );
  }

  // Player message (mine)
  if (msg.sender.type === 'player' && msg.sender.id === myPlayerId) {
    return (
      <div className="slide-up flex items-end justify-end gap-1.5">
        <span className="shrink-0 pb-1 text-[9px] text-[var(--color-text-dim)]">
          {formatTime(msg.timestamp)}
        </span>
        <div className="max-w-[78%] rounded-2xl rounded-br-md border border-white/[0.04] bg-white/[0.06] px-4 py-2.5 backdrop-blur-sm">
          <p className="text-[13px] leading-relaxed">{renderMentionText(msg.text, npcChars)}</p>
        </div>
      </div>
    );
  }

  // Player message (other)
  if (msg.sender.type === 'player') {
    return (
      <div className="slide-up flex max-w-[85%] items-start gap-2.5">
        <Avatar className="size-7">
          <AvatarFallback className="bg-white/[0.08] text-[10px] font-bold text-white/60">
            {msg.sender.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] text-[var(--color-text-dim)]">{msg.sender.name}</p>
          <div className="flex items-end gap-1.5">
            <div className="rounded-2xl rounded-tl-md border border-white/[0.04] bg-white/[0.04] px-4 py-2.5 backdrop-blur-sm">
              <p className="text-[13px] leading-relaxed">{renderMentionText(msg.text, npcChars)}</p>
            </div>
            <span className="shrink-0 pb-1 text-[9px] text-[var(--color-text-dim)]">
              {formatTime(msg.timestamp)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // NPC message — resolve the correct character for multi-NPC rooms
  const resolvedChar =
    npcChars && msg.sender.type === 'npc' ? (npcChars.get(msg.sender.id) ?? npcChar) : npcChar;

  return <NpcMessageBubble msg={msg} resolvedChar={resolvedChar} assetsBasePath={assetsBasePath} />;
}

export const RoomMessageBubble = React.memo(RoomMessageBubbleInner);
export { CharAvatar };
