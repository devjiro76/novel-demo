'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  MessageCircle,
  PlusCircle,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const MAIN_NAV_ITEMS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/chats', label: '채팅', icon: MessageCircle },
] as const;

const SECONDARY_NAV_ITEMS = [
  { href: '/create', label: '만들기', icon: PlusCircle },
  { href: '/my', label: '마이페이지', icon: User },
  { href: '/settings', label: '설정', icon: Settings },
] as const;

export function DesktopSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className="sticky top-0 z-[var(--z-sticky)] h-screen flex-shrink-0 transition-all duration-300"
      style={{
        width: isCollapsed ? 'var(--layout-sidebar-collapsed)' : 'var(--layout-sidebar-width)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Glass background */}
      <div className="glass-strong absolute inset-0" />

      <div className="relative flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 p-4">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{
              background: 'var(--color-brand-gradient)',
              boxShadow: '0 0 20px rgba(168,85,247,0.3)',
            }}
          >
            <span className="text-lg font-black tracking-tight text-white">N</span>
          </div>
          {!isCollapsed && <span className="text-gradient text-xl font-black">Novel</span>}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {!isCollapsed && (
            <div
              className="mb-2 px-3 text-[11px] font-semibold tracking-wider uppercase"
              style={{ color: 'var(--color-text-dim)' }}
            >
              메뉴
            </div>
          )}

          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${isActive ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'} `}
              >
                <div className="relative">
                  <Icon
                    className="h-5 w-5 transition-colors duration-200"
                    style={{
                      color: isActive
                        ? 'var(--color-brand-primary)'
                        : 'var(--color-text-secondary)',
                      strokeWidth: isActive ? 2.5 : 2,
                    }}
                  />
                  {isActive && (
                    <div
                      className="absolute top-1/2 -right-1 h-4 w-1 -translate-y-1/2 rounded-full"
                      style={{ background: 'var(--color-brand-primary)' }}
                    />
                  )}
                </div>

                {!isCollapsed && (
                  <span
                    className="text-sm font-medium transition-colors duration-200"
                    style={{
                      color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Divider */}
          {!isCollapsed && <div className="my-4 border-t border-white/[0.06]" />}

          {/* Secondary Navigation */}
          {!isCollapsed && (
            <div
              className="mb-2 px-3 text-[11px] font-semibold tracking-wider uppercase"
              style={{ color: 'var(--color-text-dim)' }}
            >
              사용자
            </div>
          )}

          {SECONDARY_NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${isActive ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'} `}
              >
                <Icon
                  className="h-5 w-5 transition-colors duration-200"
                  style={{
                    color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                    strokeWidth: isActive ? 2.5 : 2,
                  }}
                />

                {!isCollapsed && (
                  <span
                    className="text-sm font-medium transition-colors duration-200"
                    style={{
                      color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-white/[0.06] p-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-center rounded-xl p-2 transition-colors hover:bg-white/[0.04]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
