'use client';

import Link from 'next/link';
import type { WorldCardData } from '@/lib/story-pack';

interface WorldCardProps {
  world: WorldCardData;
  index?: number;
}

export default function WorldCard({ world, index = 0 }: WorldCardProps) {
  const href =
    world.type === 'builtin' && world.slug
      ? `/world/${world.slug}`
      : `/world/${world.id}`;

  const rgb = world.themeColorRgb;
  const displayChars = world.characters.slice(0, 3);

  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.97]"
      style={{
        animation: `slideUp 0.45s ease-out ${index * 70}ms both`,
        background: `linear-gradient(160deg, rgba(${rgb},0.10) 0%, rgba(17,17,24,0.95) 60%)`,
        border: `1px solid rgba(${rgb},0.18)`,
      }}
    >
      {/* Top image strip with overlapping avatars */}
      <div
        className="relative w-full h-28 overflow-hidden"
        style={{ background: `rgba(${rgb},0.06)` }}
      >
        {/* Background ambient glow */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, rgba(${rgb},0.5) 0%, transparent 70%)`,
          }}
        />

        {/* Overlapping character avatars */}
        <div className="absolute bottom-3 left-3 flex">
          {displayChars.map((char, i) => {
            const glowRgb = char.glow.startsWith('#')
              ? hexToRgb(char.glow)
              : char.glow;
            return (
              <div
                key={char.id}
                className="relative w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: `rgba(${rgb},0.4)`,
                  marginLeft: i === 0 ? 0 : -10,
                  zIndex: displayChars.length - i,
                  background: `rgba(${glowRgb},0.15)`,
                  boxShadow: `0 0 10px rgba(${glowRgb},0.25)`,
                }}
              >
                {char.image ? (
                  <img
                    src={char.image}
                    alt={char.name}
                    className="w-full h-full object-cover object-[50%_10%]"
                  />
                ) : (
                  <span
                    className="text-base font-bold"
                    style={{ color: char.glow, opacity: 0.7 }}
                  >
                    {char.name.charAt(0)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Badges: character count + relationship count */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
          <div
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm"
            style={{
              background: `rgba(${rgb},0.22)`,
              color: world.themeColor,
              border: `1px solid rgba(${rgb},0.30)`,
            }}
          >
            {world.characters.length} 캐릭터
          </div>
          {world.relationshipCount > 0 && (
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm"
              style={{
                background: `rgba(${rgb},0.12)`,
                color: world.themeColor,
                border: `1px solid rgba(${rgb},0.20)`,
              }}
            >
              {world.relationshipCount} 관계
            </div>
          )}
        </div>

        {/* Hover glow overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ boxShadow: `inset 0 0 40px rgba(${rgb},0.18)` }}
        />

        {/* Bottom gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-6"
          style={{
            background: `linear-gradient(to top, rgba(17,17,24,0.95), transparent)`,
          }}
        />
      </div>

      {/* Info area */}
      <div className="px-3 py-3 flex flex-col gap-1">
        <span className="text-[15px] font-bold text-[var(--color-text)] leading-tight">
          {world.name}
        </span>
        <p className="text-[11px] text-[var(--color-text-dim)] leading-[1.55] line-clamp-2 mt-0.5">
          {world.description}
        </p>

        {/* Tags */}
        {world.tags.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {world.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-[var(--color-text-dim)] border border-white/[0.06]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom glow line on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, ${world.themeColor}, transparent)`,
        }}
      />
    </Link>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
