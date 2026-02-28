'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { MessageSquare, UserPlus, Trophy, Settings, ChevronRight } from 'lucide-react';

export default function MyPage() {
  const isDesktop = useIsDesktop();
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
    { label: '캐릭터 만들기', href: '/create', icon: UserPlus, desc: '나만의 캐릭터 생성' },
    { label: '인기 랭킹', href: '/ranking', icon: Trophy, desc: '인기 있는 캐릭터 보기' },
    { label: '설정', href: '#', icon: Settings, desc: '준비 중', disabled: true },
  ];

  const stats = [
    { label: '대화', value: sessionCount },
    { label: '캐릭터', value: 0 },
    { label: '코인', value: '0' },
  ];

  if (isDesktop) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-black text-gradient">마이페이지</h1>
            <p className="text-[var(--color-text-secondary)] mt-2">계정 설정 및 활동 내역</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div 
                className="p-6 rounded-2xl text-center"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-24 h-24 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: 'var(--color-brand-gradient)' }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-lg font-bold mt-4">로그인하고 시작하기</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">소셜 계정으로 간편 로그인</p>

                {/* Social Login */}
                <div className="mt-6 space-y-2">
                  {['Google', 'Kakao', 'Apple'].map((provider) => (
                    <button
                      key={provider}
                      disabled
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl opacity-50 cursor-not-allowed"
                      style={{ 
                        background: 'var(--color-surface-2)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <span className="size-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                        {provider[0]}
                      </span>
                      <span className="flex-1 text-left text-sm">{provider}로 로그인</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-[var(--color-text-muted)]">
                        준비 중
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats & Menu */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats */}
              <div 
                className="grid grid-cols-3 gap-4 p-6 rounded-2xl"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-gradient">{stat.value}</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Menu */}
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return item.disabled ? (
                    <div
                      key={item.label}
                      className="flex items-center gap-4 p-4 rounded-xl opacity-40"
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-surface-2)' }}>
                        <Icon className="w-5 h-5 text-[var(--color-text-muted)]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">{item.desc}</p>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)]">준비 중</span>
                    </div>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-[var(--color-surface-hover)] group"
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: 'var(--color-surface-2)' }}
                      >
                        <Icon className="w-5 h-5 text-[var(--color-brand-primary)]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-[var(--color-text-muted)]">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-5 pt-10 pb-4">
        <Link href="/" className="text-[10px] text-[var(--color-text-dim)]">← 홈</Link>
        <h1 className="text-2xl font-bold mt-2">마이</h1>
      </header>

      <main className="px-5 pb-8">
        {/* Profile */}
        <div className="flex flex-col items-center py-8">
          <div
            className="size-20 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-brand-gradient)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-lg font-bold mt-4">로그인하고 시작하기</p>
          <p className="text-[11px] text-[var(--color-text-dim)] mt-1">소셜 계정으로 간편 로그인</p>

          {/* Social Login */}
          <div className="w-full mt-6 space-y-2.5">
            {['Google', 'Kakao', 'Apple'].map((provider) => (
              <button
                key={provider}
                disabled
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/[0.06] opacity-50 cursor-not-allowed"
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 py-4 border-t border-b border-white/[0.04]">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-[var(--color-text-dim)] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="mt-4 space-y-1">
          {menuItems.map((item) =>
            item.disabled ? (
              <div
                key={item.label}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl opacity-40"
              >
                <span className="text-sm text-[var(--color-text-dim)]">{item.label}</span>
                <span className="text-[10px] text-[var(--color-text-dim)]">준비 중</span>
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-sm">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-[var(--color-text-dim)]" />
              </Link>
            )
          )}
        </div>
      </main>
    </div>
  );
}
