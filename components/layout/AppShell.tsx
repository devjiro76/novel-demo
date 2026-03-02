'use client';

import { ReactNode } from 'react';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { MobileNav } from './MobileNav';
import { DesktopSidebar } from './DesktopSidebar';

export function AppShell({ children }: { children: ReactNode }) {
  const isDesktop = useIsDesktop();

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
      <main className="flex-1 min-h-0 overflow-y-auto pb-20">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
