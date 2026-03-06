'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorldCardData } from '@/lib/story-pack';
import { hexToRgb } from '@/lib/colors';

interface WorldCardProps {
  world: WorldCardData;
  index?: number;
}

export default function WorldCard({ world, index = 0 }: WorldCardProps) {
  const router = useRouter();

  const href =
    world.type === 'builtin' && world.slug ? `/world/${world.slug}` : `/world/${world.id}`;

  const startHref = world.type === 'builtin' && world.slug ? `/${world.slug}` : `/${world.id}`;

  const rgb = world.themeColorRgb;
  const displayChars = world.characters.slice(0, 3);

  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl transition-all duration-300 active:scale-[0.97]"
      style={{
        animation: `slideUp 0.45s ease-out ${index * 70}ms both`,
        background: `linear-gradient(160deg, rgba(${rgb},0.10) 0%, rgba(17,17,24,0.95) 60%)`,
        border: `1px solid rgba(${rgb},0.18)`,
      }}
      onClick={() => router.push(href)}
      role="article"
    >
      {/* Top image strip with overlapping avatars */}
      <div
        className="relative h-28 w-full overflow-hidden"
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
            const glowRgb = char.glow.startsWith('#') ? hexToRgb(char.glow) : char.glow;
            return (
              <div
                key={char.id}
                className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2"
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
                    className="h-full w-full object-cover object-[50%_10%]"
                  />
                ) : (
                  <span className="text-base font-bold" style={{ color: char.glow, opacity: 0.7 }}>
                    {char.name.charAt(0)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Badges: character count + relationship count */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
          <div
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm"
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
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm"
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
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 40px rgba(${rgb},0.18)` }}
        />

        {/* Bottom gradient fade */}
        <div
          className="absolute right-0 bottom-0 left-0 h-6"
          style={{
            background: `linear-gradient(to top, rgba(17,17,24,0.95), transparent)`,
          }}
        />
      </div>

      {/* Info area */}
      <div className="flex flex-col gap-1 px-3 py-3">
        <span className="text-[15px] leading-tight font-bold text-[var(--color-text)]">
          {world.name}
        </span>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-[1.55] text-[var(--color-text-dim)]">
          {world.description}
        </p>

        {/* Tags */}
        {world.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {world.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--color-border-subtle)] bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-[var(--color-text-dim)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom glow line on hover */}
      <div
        className="absolute right-0 bottom-0 left-0 h-[1px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${world.themeColor}, transparent)`,
        }}
      />

      {/* "바로 시작" hover overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,0.45)` }} />
        <div className="relative z-10 flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(startHref);
            }}
            className="rounded-xl px-4 py-2 text-[13px] font-bold text-white transition-transform active:scale-95"
            style={{
              background: `linear-gradient(135deg, rgba(${rgb},0.9) 0%, rgba(${rgb},0.7) 100%)`,
              boxShadow: `0 0 20px rgba(${rgb},0.4)`,
            }}
          >
            바로 시작
          </button>
          <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="rounded-xl px-4 py-2 text-[13px] font-semibold text-[var(--color-text)] transition-transform active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            자세히 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
