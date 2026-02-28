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
}: CharacterCardProps) {
  return (
    <Link
      href={`/${slug}?char=${charId}`}
      className="flex-none w-[130px] rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] group"
      style={{
        background: `linear-gradient(160deg, rgba(${glowRgb},0.12) 0%, rgba(14,14,20,0.95) 70%)`,
        border: `1px solid rgba(${glowRgb},0.18)`,
      }}
    >
      {/* Avatar */}
      <div
        className="w-full aspect-[3/4] flex items-center justify-center overflow-hidden"
        style={{ background: `rgba(${glowRgb},0.06)` }}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <span
            className="text-4xl font-bold opacity-30"
            style={{ color: glow }}
          >
            {name.charAt(0)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 py-2.5 flex flex-col gap-0.5">
        <span className="text-xs font-bold text-white leading-tight truncate">
          {fullName || name}
        </span>
        <span className="text-[10px] leading-tight truncate" style={{ color: glow }}>
          {role}
        </span>
        <span className="text-[10px] leading-tight" style={{ color: 'var(--color-text-dim)' }}>
          {age}세
        </span>
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
        style={{ boxShadow: `inset 0 0 30px rgba(${glowRgb},0.08)` }}
      />
    </Link>
  );
}
