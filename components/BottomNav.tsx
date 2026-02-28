'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/',
    label: '홈',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
          stroke={active ? '#c084fc' : 'var(--color-text-dim)'}
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill={active ? 'rgba(192,132,252,0.12)' : 'none'}
        />
      </svg>
    ),
  },
  {
    href: '/chats',
    label: '채팅',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
          stroke={active ? '#c084fc' : 'var(--color-text-dim)'}
          strokeWidth="1.8"
          strokeLinejoin="round"
          fill={active ? 'rgba(192,132,252,0.12)' : 'none'}
        />
      </svg>
    ),
  },
  {
    href: '/create',
    label: '만들기',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          cx="12" cy="12" r="9"
          stroke={active ? '#c084fc' : 'var(--color-text-dim)'}
          strokeWidth="1.8"
          fill={active ? 'rgba(192,132,252,0.12)' : 'none'}
        />
        <path
          d="M12 8v8M8 12h8"
          stroke={active ? '#c084fc' : 'var(--color-text-dim)'}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/my',
    label: '마이',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          cx="12" cy="8" r="3.5"
          stroke={active ? '#c084fc' : 'var(--color-text-dim)'}
          strokeWidth="1.8"
          fill={active ? 'rgba(192,132,252,0.12)' : 'none'}
        />
        <path
          d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7"
          stroke={active ? '#c084fc' : 'var(--color-text-dim)'}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  // 게임 플레이 중이면 숨김 (slug 페이지: /motchama, /oppa-friends 등)
  // world 상세 페이지에서도 숨김
  const hideOn = ['/world/'];
  const isSlugPage = pathname !== '/' && !NAV_ITEMS.some((item) => pathname.startsWith(item.href) && item.href !== '/');
  if (isSlugPage || hideOn.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around px-2 z-50"
      style={{
        background: 'linear-gradient(to top, rgba(8,8,13,0.98) 70%, rgba(8,8,13,0.85) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-4 py-1 ${isActive ? '' : 'opacity-50'}`}
          >
            {item.icon(isActive)}
            <span
              className="text-[10px] font-semibold"
              style={{ color: isActive ? '#c084fc' : 'var(--color-text-dim)' }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
