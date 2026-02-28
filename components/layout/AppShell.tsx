'use client';

import { ReactNode } from 'react';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { MobileNav } from './MobileNav';
import { DesktopSidebar } from './DesktopSidebar';

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav = false }: AppShellProps) {
  const isDesktop = useIsDesktop();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {isDesktop ? (
        /* Desktop Layout */
        <div className="flex min-h-screen">
          {!hideNav && <DesktopSidebar />}
          <main className="flex-1 min-h-screen overflow-x-hidden">
            <div className="max-w-[1400px] mx-auto min-h-screen">
              {children}
            </div>
          </main>
        </div>
      ) : (
        /* Mobile Layout */
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 pb-20">
            {children}
          </main>
          {!hideNav && <MobileNav />}
        </div>
      )}
    </div>
  );
}
