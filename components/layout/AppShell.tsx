'use client';

import { ReactNode } from 'react';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { MobileNav } from './MobileNav';
import { DesktopSidebar } from './DesktopSidebar';

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
  fullHeight?: boolean;
}

export function AppShell({ children, hideNav = false, fullHeight = false }: AppShellProps) {
  const isDesktop = useIsDesktop();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {isDesktop ? (
        /* Desktop Layout */
        <div className="flex min-h-screen">
          {!hideNav && <DesktopSidebar />}
          <main 
            className={`flex-1 overflow-x-hidden ${fullHeight ? 'h-screen' : 'min-h-screen'}`}
          >
            <div className={`max-w-[1400px] mx-auto ${fullHeight ? 'h-full' : 'min-h-screen'}`}>
              {children}
            </div>
          </main>
        </div>
      ) : (
        /* Mobile Layout */
        <div className={`flex flex-col ${fullHeight ? 'h-screen' : 'min-h-screen'}`}>
          <main className={`flex-1 ${hideNav ? '' : 'pb-20'} ${fullHeight ? 'h-full overflow-hidden' : ''}`}>
            {children}
          </main>
          {!hideNav && <MobileNav />}
        </div>
      )}
    </div>
  );
}
