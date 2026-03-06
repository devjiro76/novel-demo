'use client';

import Link from 'next/link';

interface CharacterCardProps {
  charId: string;
  name: string;
  fullName: string;
  role: string;
  age: number;
  image?: string;
  glow: string;
  glowRgb: string;
  slug: string;
  index?: number;
}

export default function CharacterCard({
  charId,
  name,
  fullName,
  role,
  age,
  image,
  glow,
  glowRgb,
  slug,
  index = 0,
}: CharacterCardProps) {
  return (
    <Link
      href={`/${slug}?char=${charId}`}
      className="group animate-slide-up relative w-[140px] shrink-0 overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] lg:w-[180px] lg:rounded-3xl"
      style={{
        background: `linear-gradient(160deg, rgba(${glowRgb},0.15) 0%, rgba(14,14,20,0.98) 60%)`,
        border: `1px solid rgba(${glowRgb},0.2)`,
        boxShadow: `0 4px 16px rgba(${glowRgb},0.1), 0 2px 4px rgba(0,0,0,0.3)`,
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Avatar */}
      <div
        className="relative h-[170px] w-full overflow-hidden lg:h-[220px]"
        style={{ background: `rgba(${glowRgb},0.08)` }}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl font-bold opacity-40" style={{ color: glow }}>
              {name.charAt(0)}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent opacity-80" />

        {/* Age badge */}
        <div
          className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: `rgba(${glowRgb},0.2)`,
            color: glow,
            border: `1px solid rgba(${glowRgb},0.3)`,
          }}
        >
          {age}세
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-3 py-3">
        <span className="truncate text-sm leading-tight font-bold text-white">
          {fullName || name}
        </span>
        <span className="truncate text-[11px] leading-tight font-medium" style={{ color: glow }}>
          {role}
        </span>
      </div>

      {/* Hover glow effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 0 40px rgba(${glowRgb},0.15)`,
          borderRadius: 'inherit',
        }}
      />

      {/* Bottom glow line on hover */}
      <div
        className="absolute right-0 bottom-0 left-0 h-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${glow}, transparent)`,
        }}
      />
    </Link>
  );
}
