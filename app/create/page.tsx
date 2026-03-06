'use client';

import Link from 'next/link';
import { Users, Globe } from 'lucide-react';
import { PageCard } from '@/components/layout';
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
      <PageHeader title="만들기" subtitle="캐릭터를 만들고, 월드로 조합하세요" />
      {/* Create options */}
      <div className="mb-8 grid grid-cols-2 gap-3">
        {createOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <Link
              key={opt.href}
              href={opt.href}
              className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.06] p-6 transition-all hover:scale-[1.02] hover:border-white/[0.12] active:scale-[0.98]"
              style={{ background: 'var(--color-surface)' }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: `${opt.color}22` }}
              >
                <Icon className="h-7 w-7" style={{ color: opt.color }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{opt.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* My characters */}
      <div>
        <div className="mb-3 flex items-center justify-between">
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
          <div className="py-8 text-center text-sm text-[var(--color-text-dim)]">
            불러오는 중...
          </div>
        ) : characters.length === 0 ? (
          <PageCard padding="lg">
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">아직 캐릭터가 없습니다.</p>
              <Link
                href="/create/character"
                className="inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
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
                className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] p-3"
                style={{ background: 'var(--color-surface)' }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
                  style={{ background: `${char.glow}22`, color: char.glow }}
                >
                  {char.name.charAt(0)}
                </div>
                <span className="w-full truncate text-center text-xs font-medium text-[var(--color-text)]">
                  {char.name}
                </span>
                <span className="w-full truncate text-center text-[10px] text-[var(--color-text-muted)]">
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
