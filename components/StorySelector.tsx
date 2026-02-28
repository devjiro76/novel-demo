'use client';

import Link from 'next/link';
import type { ClientStoryPack } from '@/lib/story-pack';
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';

export default function StorySelector({ packs }: { packs: ClientStoryPack[] }) {
  return (
    <div className="h-screen w-screen bg-black flex justify-center">
      <div className="w-full max-w-[480px] h-full bg-[#08080d] relative md:border-x md:border-white/[0.06] md:shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        <div className="h-screen flex flex-col">
          <header className="px-5 pt-10 pb-6">
            <h1 className="text-2xl font-bold tracking-tight">어떤 이야기를 할까?</h1>
            <p className="text-[11px] text-[var(--color-text-dim)] mt-1.5 tracking-wide">플레이할 스토리를 선택하세요.</p>
          </header>

          <main className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">
            {packs.map((pack, i) => (
              <Link
                key={pack.slug}
                href={`/${pack.slug}`}
                className="w-full text-left rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] group relative block"
                style={{
                  animation: `slideUp 0.5s ease-out ${i * 120}ms both`,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex">
                  <div className="relative w-28 h-36 shrink-0 overflow-hidden">
                    <img
                      src={`${pack.assetsBasePath}${pack.coverTall}`}
                      alt={pack.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#08080d]/80" />
                  </div>

                  <div className="flex-1 p-4 min-w-0 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-white mb-1">{pack.title}</h3>
                    {pack.subtitle && (
                      <p className="text-[11px] text-white/40 mb-3">{pack.subtitle}</p>
                    )}
                    <AvatarGroup>
                      {pack.characters.slice(0, 4).map((char) => (
                        <Avatar key={char.id} size="sm" className="border border-white/10">
                          <AvatarImage
                            src={`${pack.assetsBasePath}${char.image}`}
                            alt={char.name}
                            className="object-cover object-[50%_15%]"
                          />
                          <AvatarFallback>{char.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {pack.characters.length > 4 && (
                        <AvatarGroupCount className="text-[9px] text-white/40 bg-white/5 border border-white/10 size-6">
                          +{pack.characters.length - 4}
                        </AvatarGroupCount>
                      )}
                    </AvatarGroup>
                  </div>
                </div>

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 40px rgba(255,255,255,0.03)' }}
                />
              </Link>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}
