'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const CONTAINER_WIDTHS = {
  sm: 'max-w-[480px]',
  md: 'max-w-[720px]',
  lg: 'max-w-[960px]',
  xl: 'max-w-[1200px]',
  full: '',
} as const;

type ContainerWidth = keyof typeof CONTAINER_WIDTHS;

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  width?: ContainerWidth;
  className?: string;
  contentClassName?: string;
}

export function PageLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  backHref = '/',
  width = 'lg',
  className = '',
  contentClassName = '',
}: PageLayoutProps) {
  const widthClass = CONTAINER_WIDTHS[width];

  return (
    <div className={`min-h-screen px-4 pt-10 pb-4 lg:p-8 ${className}`}>
      <div className={`mx-auto ${widthClass}`}>
        {(title || showBackButton) && (
          <header className="mb-4 lg:mb-8">
            {showBackButton && (
              <Link
                href={backHref}
                className="inline-flex lg:hidden items-center gap-1 text-[10px] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors mb-2"
              >
                <ChevronLeft className="w-3 h-3" />
                홈
              </Link>
            )}
            {title && (
              <h1 className="text-2xl lg:text-3xl font-bold lg:font-black text-gradient">{title}</h1>
            )}
            {subtitle && (
              <p className="text-[11px] lg:text-base text-[var(--color-text-dim)] lg:text-[var(--color-text-secondary)] mt-1 lg:mt-2">{subtitle}</p>
            )}
          </header>
        )}

        <div className={contentClassName}>
          {children}
        </div>
      </div>
    </div>
  );
}

interface PageSectionProps {
  children: ReactNode;
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function PageSection({
  children,
  title,
  icon,
  action,
  className = '',
}: PageSectionProps) {
  return (
    <section className={`mb-6 lg:mb-8 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <div className="flex items-center gap-2">
              {icon && (
                <span className="text-[var(--color-brand-primary)]">{icon}</span>
              )}
              <h2 className="text-base lg:text-xl font-bold">{title}</h2>
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

interface PageCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING_CLASSES = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

export function PageCard({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'md',
}: PageCardProps) {
  const baseClasses = 'rounded-2xl bg-[var(--color-surface)] border border-white/[0.06]';
  const hoverClasses = hover
    ? 'transition-all hover:bg-[var(--color-surface-hover)] cursor-pointer'
    : '';
  const paddingClass = PADDING_CLASSES[padding];

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left ${baseClasses} ${hoverClasses} ${paddingClass} ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`${baseClasses} ${paddingClass} ${className}`}>
      {children}
    </div>
  );
}

interface PageGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GRID_COLS = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
} as const;

const GAP_CLASSES = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
} as const;

export function PageGrid({
  children,
  cols = 1,
  gap = 'md',
  className = '',
}: PageGridProps) {
  return (
    <div className={`grid ${GRID_COLS[cols]} ${GAP_CLASSES[gap]} ${className}`}>
      {children}
    </div>
  );
}
