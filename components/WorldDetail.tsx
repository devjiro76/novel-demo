'use client';

import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import type { StoryManifest, WorldCardData } from '@/lib/story-pack';
import type { UserWorld } from '@/lib/types';
import { hexToRgb } from '@/lib/colors';
import CharacterCard from '@/components/CharacterCard';

interface WorldDetailProps {
  manifest?: StoryManifest;
  userWorld?: UserWorld;
  worldCard: WorldCardData;
}

export default function WorldDetail({ manifest, userWorld, worldCard }: WorldDetailProps) {
  const themeColor = worldCard.themeColor;
  const themeRgb = worldCard.themeColorRgb;
  const slug = worldCard.slug ?? worldCard.id;

  // Build character list for display
  const characters = manifest
    ? manifest.characters
        .filter((c) => c.id !== manifest.playerCharacterId)
        .map((c) => ({
          id: c.id,
          name: c.name,
          fullName: c.fullName,
          age: c.age,
          role: c.role,
          glow: c.glow,
          glowRgb: c.glowRgb,
          image: c.image ? `${manifest.assetsBasePath}${c.image}` : undefined,
        }))
    : userWorld
    ? userWorld.characters.map((c) => ({
        id: c.id,
        name: c.name,
        fullName: c.fullName,
        age: c.age,
        role: c.role,
        glow: c.glow,
        glowRgb: hexToRgb(c.glow),
        image: undefined as string | undefined,
      }))
    : [];

  const firstCharId = characters[0]?.id;

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: `radial-gradient(ellipse 70% 40% at 50% -5%, rgba(${themeRgb},0.18) 0%, var(--color-bg) 55%)`,
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{
          background: `color-mix(in srgb, var(--color-bg), transparent 25%)`,
          borderBottom: `1px solid rgba(${themeRgb},0.12)`,
        }}
      >
        <Link
          href="/"
          className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
          style={{ background: `rgba(${themeRgb},0.1)`, border: `1px solid rgba(${themeRgb},0.2)` }}
        >
          <ArrowLeft size={18} style={{ color: themeColor }} />
        </Link>
        <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
          {worldCard.name}
        </span>
      </header>

      <main className="px-4 pb-32 max-w-2xl mx-auto">
        {/* World name + description */}
        <section className="pt-8 pb-6">
          <div className="flex items-center gap-2 mb-1">
            {worldCard.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: `rgba(${themeRgb},0.14)`,
                  color: themeColor,
                  border: `1px solid rgba(${themeRgb},0.25)`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight mt-2" style={{ color: themeColor }}>
            {worldCard.name}
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {worldCard.description}
          </p>
        </section>

        {/* Character grid */}
        {characters.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Users size={15} style={{ color: themeColor }} />
              <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>등장인물</h2>
              <span className="ml-auto text-xs" style={{ color: 'var(--color-text-dim)' }}>
                {characters.length}명
              </span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {characters.map((char) => (
                <CharacterCard
                  key={char.id}
                  charId={char.id}
                  name={char.name}
                  fullName={char.fullName}
                  role={char.role}
                  age={char.age}
                  image={char.image}
                  glow={char.glow}
                  glowRgb={char.glowRgb}
                  slug={slug}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* CTA — Fixed Bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 z-30"
        style={{ background: `linear-gradient(to top, var(--color-bg) 60%, transparent)` }}
      >
        <div className="max-w-2xl mx-auto">
          <Link
            href={firstCharId ? `/${slug}?char=${firstCharId}` : `/${slug}`}
            className="flex items-center justify-center w-full h-14 rounded-2xl text-base font-bold tracking-wide transition-opacity active:opacity-80"
            style={{
              background: `var(--color-brand-gradient)`,
              boxShadow: `0 0 24px rgba(${themeRgb},0.35)`,
              color: '#fff',
            }}
          >
            대화 시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}
