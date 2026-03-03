'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { MobileNav } from './MobileNav';
import { DesktopSidebar } from './DesktopSidebar';

const NON_GAME_PREFIXES = ['/chats', '/create', '/explore', '/ranking', '/my', '/settings', '/world', '/api', '/login', '/signup'];

function isGamePlayPath(pathname: string) {
  if (pathname === '/') return false;
  return !NON_GAME_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function AppShell({ children }: { children: ReactNode }) {
  const isDesktop = useIsDesktop();
  const pathname = usePathname();
  const hideNav = isGamePlayPath(pathname);

  if (isDesktop) {
    return (
      <div className="flex h-screen bg-[var(--color-bg)]">
        <DesktopSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-[var(--color-bg)]">
      <main className={`flex-1 min-h-0 overflow-y-auto ${hideNav ? '' : 'pb-20'}`}>
        {children}
      </main>
      {!hideNav && <MobileNav />}
    </div>
  );
}
