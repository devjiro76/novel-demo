'use client';

import Link from 'next/link';
import { useIsDesktop } from '@/hooks/useMediaQuery';

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
  const isDesktop = useIsDesktop();
  
  // Responsive sizes
  const cardWidth = isDesktop ? 'w-[180px]' : 'w-[140px]';
  const cardRadius = isDesktop ? 'rounded-3xl' : 'rounded-2xl';
  const imageHeight = isDesktop ? 'h-[220px]' : 'h-[170px]';
  
  return (
    <Link
      href={`/${slug}?char=${charId}`}
      className={`
        ${cardWidth} ${cardRadius} overflow-hidden transition-all duration-300 
        hover:-translate-y-1 active:scale-[0.98] group relative
        animate-slide-up
      `}
      style={{
        background: `linear-gradient(160deg, rgba(${glowRgb},0.15) 0%, rgba(14,14,20,0.98) 60%)`,
        border: `1px solid rgba(${glowRgb},0.2)`,
        boxShadow: `0 4px 16px rgba(${glowRgb},0.1), 0 2px 4px rgba(0,0,0,0.3)`,
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Avatar */}
      <div 
        className={`w-full ${imageHeight} overflow-hidden relative`}
        style={{ background: `rgba(${glowRgb},0.08)` }}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="text-5xl font-bold opacity-40"
              style={{ color: glow }}
            >
              {name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent"
          style={{ opacity: 0.8 }}
        />
        
        {/* Age badge */}
        <div 
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
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
      <div className="px-3 py-3 flex flex-col gap-1">
        <span className="text-sm font-bold text-white leading-tight truncate">
          {fullName || name}
        </span>
        <span 
          className="text-[11px] leading-tight truncate font-medium"
          style={{ color: glow }}
        >
          {role}
        </span>
      </div>

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-inherit"
        style={{ 
          boxShadow: `inset 0 0 40px rgba(${glowRgb},0.15)`,
          borderRadius: 'inherit',
        }}
      />
      
      {/* Bottom glow line on hover */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ 
          background: `linear-gradient(90deg, transparent, ${glow}, transparent)`,
        }}
      />
    </Link>
  );
}
