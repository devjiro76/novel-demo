'use client';

import { ReactNode } from 'react';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

// 표준화된 max-width 값
const CONTAINER_WIDTHS = {
  sm: 'max-w-[480px]',   // 좁은 콘텐츠 (설정, 마이)
  md: 'max-w-[720px]',   // 중간 콘텐츠 (채팅 내역)
  lg: 'max-w-[960px]',   // 넓은 콘텐츠 (랭킹, 탐색)
  xl: 'max-w-[1200px]',  // 매우 넓은 콘텐츠 (랜딩)
  full: '',              // 전체 폭 (게임 클라이언트)
} as const;

type ContainerWidth = keyof typeof CONTAINER_WIDTHS;

interface PageLayoutProps {
  children: ReactNode;
  
  // 헤더 설정
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  
  // 레이아웃 설정
  width?: ContainerWidth;
  
  // 추가 클래스
  className?: string;
  contentClassName?: string;
}

/**
 * 표준화된 페이지 레이아웃 컴포넌트
 * 
 * 모든 페이지는 이 컴포넌트를 사용해야 일관된 레이아웃을 가집니다.
 * 
 * 사용 예시:
 * <PageLayout title="마이페이지" subtitle="계정 설정" width="sm">
 *   <MyContent />
 * </PageLayout>
 */
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
  const isDesktop = useIsDesktop();
  const widthClass = CONTAINER_WIDTHS[width];

  // 데스크톱: 중앙 정렬 + 고정 너비 + 패딩
  if (isDesktop) {
    return (
      <div className={`min-h-screen p-8 ${className}`}>
        <div className={`mx-auto ${widthClass}`}>
          {/* 헤더 */}
          {(title || showBackButton) && (
            <header className="mb-8">
              {showBackButton && (
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  홈으로
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
          
          {/* 콘텐츠 */}
          <div className={contentClassName}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // 모바일: 전체 폭 + 표준 패딩
  return (
    <div className={`min-h-screen ${className}`}>
      {/* 헤더 */}
      {(title || showBackButton) && (
        <header className="px-4 pt-10 pb-4">
          {showBackButton && (
            <Link
              href={backHref}
              className="text-[10px] text-[var(--color-text-dim)] flex items-center gap-1 mb-2"
            >
              <ChevronLeft className="w-3 h-3" />
              홈
            </Link>
          )}
          {title && <h1 className="text-2xl font-bold">{title}</h1>}
          {subtitle && (
            <p className="text-[11px] text-[var(--color-text-dim)] mt-1">{subtitle}</p>
          )}
        </header>
      )}
      
      {/* 콘텐츠 - 표준 좌우 패딩 */}
      <div className={`px-4 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * 페이지 섹션 컴포넌트
 * 
 * 일관된 섹션 스타일링을 제공합니다.
 */
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
  const isDesktop = useIsDesktop();

  return (
    <section className={`${isDesktop ? 'mb-8' : 'mb-6'} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <div className="flex items-center gap-2">
              {icon && (
                <span className="text-[var(--color-brand-primary)]">{icon}</span>
              )}
              <h2 className={`font-bold ${isDesktop ? 'text-xl' : 'text-base'}`}>
                {title}
              </h2>
            </div>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * 카드 컴포넌트
 * 
 * 일관된 카드 스타일링을 제공합니다.
 */
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

/**
 * 그리드 컴포넌트
 * 
 * 일관된 그리드 레이아웃을 제공합니다.
 */
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
