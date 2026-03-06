'use client';

import { ReactNode } from 'react';

interface AppContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * 통일된 앱 컨테이너
 * - 모든 페이지에서 동일한 max-width와 padding 사용
 * - 페이지 전환 시 레이아웃 흔들림 방지
 */
export function AppContainer({ children, className = '' }: AppContainerProps) {
  return (
    <div className={`min-h-screen pb-24 lg:pb-8 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8">{children}</div>
    </div>
  );
}

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  rightContent?: ReactNode;
}

export function PageHeader({ title, subtitle, rightContent }: PageHeaderProps) {
  return (
    <header className="py-6 lg:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          {title && <h1 className="text-gradient text-2xl font-black lg:text-3xl">{title}</h1>}
          {subtitle && (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
          )}
        </div>
        {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
      </div>
    </header>
  );
}
