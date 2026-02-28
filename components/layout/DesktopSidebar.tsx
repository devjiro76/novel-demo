'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Home, 
  MessageCircle, 
  PlusCircle, 
  User, 
  Compass,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const MAIN_NAV_ITEMS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/chats', label: '채팅', icon: MessageCircle },
  { href: '/explore', label: '탐색', icon: Compass },
  { href: '/ranking', label: '랭킹', icon: TrendingUp },
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
      className="sticky top-0 h-screen flex-shrink-0 transition-all duration-300 z-[var(--z-sticky)]"
      style={{ 
        width: isCollapsed 
          ? 'var(--layout-sidebar-collapsed)' 
          : 'var(--layout-sidebar-width)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Glass background */}
      <div className="absolute inset-0 glass-strong" />
      
      <div className="relative h-full flex flex-col">
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 h-16">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--color-brand-gradient)',
              boxShadow: '0 0 20px rgba(168,85,247,0.3)',
            }}
          >
            <span className="text-white text-lg font-black tracking-tight">N</span>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-black text-gradient">
              Novel
            </span>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {!isCollapsed && (
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
              메뉴
            </div>
          )}
          
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = item.href === '/' 
              ? pathname === '/' 
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}
                `}
              >
                <div className="relative">
                  <Icon 
                    className="w-5 h-5 transition-colors duration-200"
                    style={{ 
                      color: isActive 
                        ? 'var(--color-brand-primary)' 
                        : 'var(--color-text-secondary)',
                      strokeWidth: isActive ? 2.5 : 2,
                    }}
                  />
                  {isActive && (
                    <div 
                      className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full"
                      style={{ background: 'var(--color-brand-primary)' }}
                    />
                  )}
                </div>
                
                {!isCollapsed && (
                  <span 
                    className="text-sm font-medium transition-colors duration-200"
                    style={{ 
                      color: isActive 
                        ? 'var(--color-text)' 
                        : 'var(--color-text-secondary)' 
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Divider */}
          {!isCollapsed && (
            <div className="my-4 border-t border-white/[0.06]" />
          )}

          {/* Secondary Navigation */}
          {!isCollapsed && (
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
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
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                  ${isActive ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'}
                `}
              >
                <Icon 
                  className="w-5 h-5 transition-colors duration-200"
                  style={{ 
                    color: isActive 
                      ? 'var(--color-brand-primary)' 
                      : 'var(--color-text-secondary)',
                    strokeWidth: isActive ? 2.5 : 2,
                  }}
                />
                
                {!isCollapsed && (
                  <span 
                    className="text-sm font-medium transition-colors duration-200"
                    style={{ 
                      color: isActive 
                        ? 'var(--color-text)' 
                        : 'var(--color-text-secondary)' 
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
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/[0.04] transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
