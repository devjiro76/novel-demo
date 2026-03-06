import Link from 'next/link';
import { Heart, Users } from 'lucide-react';
import type { MockContent } from '@/data/mock-contents';

function formatNumber(num: number) {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}천`;
  return num.toString();
}

export function ContentCard({ content, index: _index }: { content: MockContent; index: number }) {
  const isWorld = content.type === 'world';

  return (
    <Link
      href={`/${content.type}/${content.id}`}
      className="group w-[160px] flex-shrink-0 md:w-[180px]"
    >
      {/* Image Container */}
      <div className="relative mb-2.5 aspect-[3/4] overflow-hidden rounded-xl bg-gray-900">
        <img
          src={content.image}
          alt={content.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Type Badge */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
              isWorld ? 'bg-purple-500/80 text-white' : 'bg-white/20 text-white'
            }`}
          >
            {isWorld ? '월드' : '단독'}
          </span>
          {content.badge && (
            <span className="rounded bg-pink-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {content.badge}
            </span>
          )}
        </div>

        {/* Like Button */}
        <div className="absolute top-2 right-2">
          <button className="flex h-6 w-6 items-center justify-center rounded-full bg-black/30 transition-colors hover:bg-pink-500/50">
            <Heart className="h-3 w-3 text-white" />
          </button>
        </div>

        {/* For World: Character Avatars - Larger & Prominent */}
        {isWorld && content.characters.length > 1 && (
          <div className="absolute right-3 bottom-3 left-3">
            <div className="flex items-end justify-between">
              <div className="flex -space-x-2">
                {content.characters.slice(0, 3).map((char, i) => (
                  <div
                    key={i}
                    className="relative h-10 w-10 overflow-hidden rounded-full shadow-lg ring-2 ring-black/50 transition-transform group-hover:scale-110"
                    style={{ zIndex: content.characters.length - i }}
                    title={char.name}
                  >
                    <img src={char.image} alt={char.name} className="h-full w-full object-cover" />
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-500/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                ))}
                {content.characters.length > 3 && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-xs font-medium text-white ring-2 ring-black/50 backdrop-blur-sm">
                    +{content.characters.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="absolute right-2 bottom-2 flex items-center gap-2 text-[10px] text-white/70">
          {isWorld && (
            <span className="flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              {content.characters.length}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Heart className="h-3 w-3" />
            {formatNumber(content.likes)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-0.5">
        <h3 className="truncate text-sm font-bold text-white transition-colors group-hover:text-purple-400">
          {content.title}
        </h3>
        <p className="truncate text-xs text-gray-500">{content.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {content.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[9px] text-gray-600">
              {tag}
            </span>
          ))}
        </div>

        <p className="pt-0.5 text-[10px] text-gray-700">{content.author}</p>
      </div>
    </Link>
  );
}
