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
    setSessionCount(count);
  }, []);

  const menuItems = [
    { label: '내 대화', href: '/chats', icon: MessageSquare, desc: '이전 대화를 이어가세요' },
    { label: '캐릭터 만들기', href: '/create/character', icon: UserPlus, desc: '나만의 캐릭터 생성' },
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
            className="size-16 lg:size-20 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-brand-gradient)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-base lg:text-lg font-bold mt-3 lg:mt-4">로그인하고 시작하기</p>
          <p className="text-xs lg:text-sm text-[var(--color-text-muted)] mt-1">소셜 계정으로 간편 로그인</p>

          <div className="w-full mt-4 lg:mt-6 space-y-2 lg:space-y-2.5">
            {['Google', 'Kakao', 'Apple'].map((provider) => (
              <button
                key={provider}
                disabled
                className="w-full flex items-center gap-3 px-4 py-3 lg:py-3.5 rounded-xl border border-white/[0.06] opacity-50 cursor-not-allowed"
                style={{ background: 'var(--color-surface)' }}
              >
                <span className="size-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                  {provider[0]}
                </span>
                <span className="flex-1 text-left text-sm text-[var(--color-text-secondary)]">
                  {provider}로 로그인
                </span>
                <span className="text-[10px] text-[var(--color-text-dim)] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
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
              <p className="text-xl lg:text-2xl font-bold text-gradient">{stat.value}</p>
              <p className="text-[10px] lg:text-sm text-[var(--color-text-muted)] mt-0.5 lg:mt-1">{stat.label}</p>
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
              className="flex items-center justify-between p-3 lg:p-4 rounded-xl opacity-40"
              style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center bg-[var(--color-surface-2)]">
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-[var(--color-text-muted)]" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)] hidden lg:block">{item.desc}</p>
                </div>
              </div>
              <span className="text-[10px] lg:text-xs text-[var(--color-text-muted)]">준비 중</span>
            </div>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between p-3 lg:p-4 rounded-xl transition-all hover:bg-[var(--color-surface-hover)] group"
              style={{ background: 'var(--color-surface)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center bg-[var(--color-surface-2)]">
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-[var(--color-brand-primary)]" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)] hidden lg:block">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors" />
            </Link>
          );
        })}
      </div>
    </PageLayout>
  );
}
