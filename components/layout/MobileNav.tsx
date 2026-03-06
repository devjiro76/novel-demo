'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, PlusCircle, User } from 'lucide-react';

const NAV_ITEMS = [
  {
    href: '/',
    label: '홈',
    icon: Home,
    isPrimary: false as const,
  },
  {
    href: '/chats',
    label: '채팅',
    icon: MessageCircle,
    isPrimary: false as const,
  },
  {
    href: '/create',
    label: '만들기',
    icon: PlusCircle,
    isPrimary: true as const,
  },
  {
    href: '/my',
    label: '마이',
    icon: User,
    isPrimary: false as const,
  },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-[var(--z-nav)]">
      {/* Glass background */}
      <div
        className="glass-strong absolute inset-0"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      />

      {/* Safe area spacer for notched devices */}
      <div className="relative flex items-center justify-around px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -mt-6 flex flex-col items-center"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 active:scale-95"
                  style={{
                    background: isActive
                      ? 'var(--color-brand-gradient)'
                      : 'linear-gradient(135deg, rgba(168,85,247,0.8) 0%, rgba(236,72,153,0.8) 100%)',
                    boxShadow: isActive
                      ? '0 0 24px rgba(168,85,247,0.5), 0 4px 12px rgba(0,0,0,0.4)'
                      : '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={2} />
                </div>
                <span
                  className="mt-1 text-[10px] font-medium"
                  style={{
                    color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-4 py-1 transition-all duration-200 active:scale-95"
            >
              <div className="relative">
                <Icon
                  className="h-[22px] w-[22px] transition-colors duration-200"
                  style={{
                    color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                    strokeWidth: isActive ? 2.5 : 1.8,
                  }}
                />
                {isActive && (
                  <div
                    className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                    style={{ background: 'var(--color-brand-primary)' }}
                  />
                )}
              </div>
              <span
                className="text-[11px] font-medium transition-colors duration-200"
                style={{
                  color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
