'use client';

import Link from 'next/link';
import { Users, Globe } from 'lucide-react';
import { PageLayout, PageCard } from '@/components/layout';
import { AppContainer, PageHeader } from '@/components/layout/AppContainer';
import { useUserCharacters } from '@/hooks/useUserCharacters';

const createOptions = [
  {
    label: '캐릭터 만들기',
    desc: '나만의 AI 캐릭터를 생성하세요',
    href: '/create/character',
    icon: Users,
    color: '#a855f7',
  },
  {
    label: '월드 만들기',
    desc: '캐릭터를 조합하여 스토리를 만드세요',
    href: '/create/world',
    icon: Globe,
    color: '#3b82f6',
  },
];

export default function CreateHubPage() {
  const { characters, loading } = useUserCharacters();

  return (
    <AppContainer>
      <PageHeader 
        title="만들기" 
        subtitle="캐릭터를 만들고, 월드로 조합하세요"
      />
      {/* Create options */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {createOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <Link
              key={opt.href}
              href={opt.href}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border border-white/[0.06] transition-all hover:scale-[1.02] hover:border-white/[0.12] active:scale-[0.98]"
              style={{ background: 'var(--color-surface)' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `${opt.color}22` }}
              >
                <Icon className="w-7 h-7" style={{ color: opt.color }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{opt.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* My characters */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">
            내 캐릭터 {!loading && `(${characters.length})`}
          </h2>
          {characters.length > 0 && (
            <Link
              href="/create/character"
              className="text-xs text-[var(--color-brand-primary)] hover:underline"
            >
              + 새 캐릭터
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-sm text-[var(--color-text-dim)]">
            불러오는 중...
          </div>
        ) : characters.length === 0 ? (
          <PageCard padding="lg">
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-[var(--color-text-secondary)]">
                아직 캐릭터가 없습니다.
              </p>
              <Link
                href="/create/character"
                className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--color-brand-gradient)' }}
              >
                캐릭터를 먼저 만들어보세요
              </Link>
            </div>
          </PageCard>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {characters.map((char) => (
              <div
                key={char.id}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/[0.06]"
                style={{ background: 'var(--color-surface)' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: `${char.glow}22`, color: char.glow }}
                >
                  {char.name.charAt(0)}
                </div>
                <span className="text-xs font-medium text-[var(--color-text)] truncate w-full text-center">
                  {char.name}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)] truncate w-full text-center">
                  {char.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppContainer>
  );
}
