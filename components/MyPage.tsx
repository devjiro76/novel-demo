'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageLayout, PageCard } from '@/components/layout';
import { MessageSquare, UserPlus, Trophy, Settings, ChevronRight } from 'lucide-react';

export default function MyPage() {
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('novel:') && key.endsWith(':session')) count++;
    }
    // setState called after async-like synchronous read; not a cascading render concern
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionCount(count);
  }, []);

  const menuItems = [
    { label: '내 대화', href: '/chats', icon: MessageSquare, desc: '이전 대화를 이어가세요' },
    {
      label: '캐릭터 만들기',
      href: '/create/character',
      icon: UserPlus,
      desc: '나만의 캐릭터 생성',
    },
    { label: '인기 랭킹', href: '/ranking', icon: Trophy, desc: '인기 있는 캐릭터 보기' },
    { label: '설정', href: '/settings', icon: Settings, desc: '앱 설정', disabled: true },
  ];

  const stats = [
    { label: '대화', value: sessionCount },
    { label: '캐릭터', value: 0 },
    { label: '코인', value: '0' },
  ];

  return (
    <PageLayout title="마이페이지" subtitle="계정 설정 및 활동 내역" width="md">
      {/* Profile */}
      <PageCard padding="lg" className="mb-4 lg:mb-6">
        <div className="flex flex-col items-center py-4 lg:py-8">
          <div
            className="flex size-16 items-center justify-center rounded-full lg:size-20"
            style={{ background: 'var(--color-brand-gradient)' }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mt-3 text-base font-bold lg:mt-4 lg:text-lg">로그인하고 시작하기</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)] lg:text-sm">
            소셜 계정으로 간편 로그인
          </p>

          <div className="mt-4 w-full space-y-2 lg:mt-6 lg:space-y-2.5">
            {['Google', 'Kakao', 'Apple'].map((provider) => (
              <button
                key={provider}
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-xl border border-white/[0.06] px-4 py-3 opacity-50 lg:py-3.5"
                style={{ background: 'var(--color-surface)' }}
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60">
                  {provider[0]}
                </span>
                <span className="flex-1 text-left text-sm text-[var(--color-text-secondary)]">
                  {provider}로 로그인
                </span>
                <span className="rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--color-text-dim)]">
                  준비 중
                </span>
              </button>
            ))}
          </div>
        </div>
      </PageCard>

      {/* Stats */}
      <PageCard padding="lg" className="mb-4 lg:mb-6">
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-gradient text-xl font-bold lg:text-2xl">{stat.value}</p>
              <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)] lg:mt-1 lg:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </PageCard>

      {/* Menu */}
      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return item.disabled ? (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl p-3 opacity-40 lg:p-4"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-2)] lg:h-10 lg:w-10">
                  <Icon className="h-4 w-4 text-[var(--color-text-muted)] lg:h-5 lg:w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="hidden text-xs text-[var(--color-text-muted)] lg:block">
                    {item.desc}
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)] lg:text-xs">준비 중</span>
            </div>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-center justify-between rounded-xl p-3 transition-all hover:bg-[var(--color-surface-hover)] lg:p-4"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-2)] lg:h-10 lg:w-10">
                  <Icon className="h-4 w-4 text-[var(--color-brand-primary)] lg:h-5 lg:w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="hidden text-xs text-[var(--color-text-muted)] lg:block">
                    {item.desc}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-text)] lg:h-5 lg:w-5" />
            </Link>
          );
        })}
      </div>
    </PageLayout>
  );
}
