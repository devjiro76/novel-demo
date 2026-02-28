'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

  return (
    <div className="h-screen w-screen bg-black flex justify-center">
      <div className="w-full max-w-[480px] h-full bg-[#08080d] flex flex-col relative">

        {/* Header */}
        <header className="px-5 pt-10 pb-4">
          <Link href="/" className="text-[10px] text-[var(--color-text-dim)]">← 홈</Link>
          <h1 className="text-2xl font-bold mt-2">마이</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-24">
          {/* Profile area */}
          <div className="flex flex-col items-center py-8">
            <div
              className="size-20 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-lg font-bold text-[var(--color-text)] mt-4">로그인하고 시작하기</p>
            <p className="text-[11px] text-[var(--color-text-dim)] mt-1">소셜 계정으로 간편 로그인</p>

            {/* Social login buttons */}
            <div className="w-full mt-6 space-y-2.5">
              {[
                { name: 'Google', icon: 'G', bg: 'rgba(255,255,255,0.06)' },
                { name: 'Kakao', icon: 'K', bg: 'rgba(254,229,0,0.08)' },
                { name: 'Apple', icon: '', bg: 'rgba(255,255,255,0.06)' },
              ].map((provider) => (
                <button
                  key={provider.name}
                  disabled
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/[0.06] opacity-50 cursor-not-allowed"
                  style={{ background: provider.bg }}
                >
                  <span className="size-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                    {provider.icon}
                  </span>
                  <span className="flex-1 text-left text-sm text-[var(--color-text-secondary)]">
                    {provider.name}로 로그인
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
            {[
              { label: '대화', value: sessionCount },
              { label: '캐릭터', value: 0 },
              { label: '코인', value: '0' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-bold text-[var(--color-text)]">{stat.value}</p>
                <p className="text-[10px] text-[var(--color-text-dim)] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Menu list */}
          <div className="mt-4 space-y-1">
            {[
              { label: '내 대화', href: '/chats', active: true },
              { label: '캐릭터 만들기', href: '/create', active: true },
              { label: '인기 랭킹', href: '/ranking', active: true },
              { label: '설정', href: '#', active: false },
            ].map((item) =>
              item.active ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-white/[0.03] transition-colors"
                >
                  <span className="text-sm text-[var(--color-text)]">{item.label}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-4 py-3.5 rounded-xl opacity-40"
                >
                  <span className="text-sm text-[var(--color-text-dim)]">{item.label}</span>
                  <span className="text-[10px] text-[var(--color-text-dim)]">준비 중</span>
                </div>
              )
            )}
          </div>
        </main>

        {/* Bottom navigation — 마이 active */}
        <nav
          className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-around px-2"
          style={{
            background: 'linear-gradient(to top, rgba(8,8,13,0.98) 70%, rgba(8,8,13,0.85) 100%)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Home — inactive */}
          <Link href="/" className="flex flex-col items-center gap-1 px-4 py-1 opacity-50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
                stroke="var(--color-text-dim)"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[10px] font-medium text-[var(--color-text-dim)]">홈</span>
          </Link>

          {/* Chat — inactive */}
          <Link href="/chats" className="flex flex-col items-center gap-1 px-4 py-1 opacity-50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                stroke="var(--color-text-dim)"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[10px] font-medium text-[var(--color-text-dim)]">채팅</span>
          </Link>

          {/* Create — inactive */}
          <Link href="/create" className="flex flex-col items-center gap-1 px-4 py-1 opacity-50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="var(--color-text-dim)" strokeWidth="1.8" />
              <path
                d="M12 8v8M8 12h8"
                stroke="var(--color-text-dim)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10px] font-medium text-[var(--color-text-dim)]">만들기</span>
          </Link>

          {/* My — active */}
          <Link href="/my" className="flex flex-col items-center gap-1 px-4 py-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="#c084fc" strokeWidth="1.8" fill="rgba(192,132,252,0.12)" />
              <path
                d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7"
                stroke="#c084fc"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10px] font-semibold" style={{ color: '#c084fc' }}>마이</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
