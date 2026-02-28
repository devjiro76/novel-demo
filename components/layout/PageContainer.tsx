'use client';

import { ReactNode } from 'react';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  headerClassName?: string;
}

const maxWidthClasses = {
  sm: 'max-w-[480px]',      // Mobile-first pages (My, ChatHistory)
  md: 'max-w-[720px]',      // Medium content (Ranking)
  lg: 'max-w-[960px]',      // Large content (Explore)
  xl: 'max-w-[1200px]',     // Extra large (Landing)
  full: 'max-w-[1400px]',   // Full width (Desktop default)
};

export function PageContainer({
  children,
  title,
  subtitle,
  showBack = false,
  backHref = '/',
  maxWidth = 'lg',
  className = '',
  headerClassName = '',
}: PageContainerProps) {
  const isDesktop = useIsDesktop();

  // Desktop: Centered container with max-width
  if (isDesktop) {
    return (
      <div className={`min-h-screen p-8 ${className}`}>
        <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>
          {(title || showBack) && (
            <header className={`mb-8 ${headerClassName}`}>
              {showBack && (
                <Link 
                  href={backHref}
                  className="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  홈
                </Link>
              )}
              {title && (
                <h1 className="text-3xl font-black text-gradient">{title}</h1>
              )}
              {subtitle && (
                <p className="text-[var(--color-text-secondary)] mt-2">{subtitle}</p>
              )}
            </header>
          )}
          {children}
        </div>
      </div>
    );
  }

  // Mobile: Full width with consistent padding
  return (
    <div className={`min-h-screen ${className}`}>
      {(title || showBack) && (
        <header className={`px-4 pt-10 pb-4 ${headerClassName}`}>
          {showBack && (
            <Link 
              href={backHref}
              className="text-[10px] text-[var(--color-text-dim)] flex items-center gap-1 mb-2"
            >
              <ChevronLeft className="w-3 h-3" />
              홈
            </Link>
          )}
          {title && (
            <h1 className="text-2xl font-bold">{title}</h1>
          )}
          {subtitle && (
            <p className="text-[11px] text-[var(--color-text-dim)] mt-1">{subtitle}</p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}

// Content wrapper for consistent padding in mobile
interface ContentProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function PageContent({ children, className = '', padding = true }: ContentProps) {
  const isDesktop = useIsDesktop();
  
  if (isDesktop) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <div className={`${padding ? 'px-4' : ''} ${className}`}>
      {children}
    </div>
  );
}

// Card container for consistent card styling
interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function PageCard({ children, className = '', hover = false, onClick }: CardProps) {
  const baseClasses = 'rounded-2xl p-4';
  const styleClasses = 'bg-[var(--color-surface)] border border-white/[0.06]';
  const hoverClasses = hover ? 'transition-all hover:bg-[var(--color-surface-hover)] cursor-pointer' : '';
  
  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className={`w-full text-left ${baseClasses} ${styleClasses} ${hoverClasses} ${className}`}
      >
        {children}
      </button>
    );
  }
  
  return (
    <div className={`${baseClasses} ${styleClasses} ${className}`}>
      {children}
    </div>
  );
}

// Section with consistent spacing
interface SectionProps {
  children: ReactNode;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function PageSection({ children, title, icon, className = '', action }: SectionProps) {
  const isDesktop = useIsDesktop();
  
  return (
    <section className={`${isDesktop ? 'mb-8' : 'mb-6'} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <div className="flex items-center gap-2">
              {icon && <span className="text-[var(--color-brand-primary)]">{icon}</span>}
              <h2 className={`font-bold ${isDesktop ? 'text-xl' : 'text-base'}`}>{title}</h2>
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
