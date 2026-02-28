'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { 
  ChevronRight, 
  Bell, 
  Moon, 
  Shield, 
  HelpCircle, 
  Info, 
  Trash2,
  ChevronLeft
} from 'lucide-react';

export default function SettingsPage() {
  const isDesktop = useIsDesktop();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const settingsGroups = [
    {
      title: '앱 설정',
      items: [
        {
          icon: Bell,
          label: '알림',
          type: 'toggle' as const,
          value: notifications,
          onChange: setNotifications,
        },
        {
          icon: Moon,
          label: '다크 모드',
          type: 'toggle' as const,
          value: darkMode,
          onChange: setDarkMode,
          disabled: true,
        },
      ],
    },
    {
      title: '계정',
      items: [
        {
          icon: Shield,
          label: '개인정보 보호',
          type: 'link' as const,
          href: '#',
        },
        {
          icon: Trash2,
          label: '데이터 삭제',
          type: 'action' as const,
          danger: true,
          onClick: () => {
            if (confirm('모든 대화 기록이 삭제됩니다. 계속하시겠습니까?')) {
              localStorage.clear();
              alert('데이터가 삭제되었습니다.');
            }
          },
        },
      ],
    },
    {
      title: '지원',
      items: [
        {
          icon: HelpCircle,
          label: '도움말',
          type: 'link' as const,
          href: '#',
        },
        {
          icon: Info,
          label: '앱 정보',
          type: 'info' as const,
          value: 'v1.0.0',
        },
      ],
    },
  ];

  const header = (
    <header className={isDesktop ? 'mb-8' : 'px-4 pt-10 pb-4'}>
      {isDesktop ? (
        <>
          <h1 className="text-3xl font-black text-gradient">설정</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">앱 설정 및 계정 관리</p>
        </>
      ) : (
        <>
          <Link href="/" className="text-[10px] text-[var(--color-text-dim)] flex items-center gap-1 mb-2">
            <ChevronLeft className="w-3 h-3" /> 홈
          </Link>
          <h1 className="text-2xl font-bold">설정</h1>
          <p className="text-[11px] text-[var(--color-text-dim)] mt-1">앱 설정 및 계정 관리</p>
        </>
      )}
    </header>
  );

  const renderSettingItem = (item: any) => {
    const Icon = item.icon;
    
    if (item.type === 'toggle') {
      return (
        <div 
          key={item.label}
          className="flex items-center justify-between py-3"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-[var(--color-text-muted)]" />
            <span className={item.disabled ? 'text-[var(--color-text-muted)]' : ''}>{item.label}</span>
          </div>
          <button
            onClick={() => !item.disabled && item.onChange(!item.value)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              item.value ? 'bg-[var(--color-brand-primary)]' : 'bg-[var(--color-surface-3)]'
            } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                item.value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      );
    }
    
    if (item.type === 'link') {
      return (
        <Link
          key={item.label}
          href={item.href}
          className="flex items-center justify-between py-3 group"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-[var(--color-text-muted)]" />
            <span>{item.label}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors" />
        </Link>
      );
    }
    
    if (item.type === 'action') {
      return (
        <button
          key={item.label}
          onClick={item.onClick}
          className="w-full flex items-center justify-between py-3"
        >
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${item.danger ? 'text-red-400' : 'text-[var(--color-text-muted)]'}`} />
            <span className={item.danger ? 'text-red-400' : ''}>{item.label}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
        </button>
      );
    }
    
    if (item.type === 'info') {
      return (
        <div
          key={item.label}
          className="flex items-center justify-between py-3"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-[var(--color-text-muted)]" />
            <span>{item.label}</span>
          </div>
          <span className="text-sm text-[var(--color-text-muted)]">{item.value}</span>
        </div>
      );
    }
  };

  const content = (
    <div className={isDesktop ? 'space-y-6 max-w-2xl' : 'px-4 space-y-6 pb-8'}>
      {settingsGroups.map((group) => (
        <div 
          key={group.title}
          className={isDesktop ? 'rounded-2xl p-6' : ''}
          style={isDesktop ? {
            background: 'var(--color-surface)',
            border: '1px solid rgba(255,255,255,0.06)',
          } : {}}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 px-1">
            {group.title}
          </h2>
          <div className={isDesktop ? 'space-y-1' : 'space-y-1 bg-[var(--color-surface)] rounded-xl px-4 border border-white/[0.06]'}>
            {group.items.map(renderSettingItem)}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="text-center pt-8 pb-4">
        <p className="text-xs text-[var(--color-text-dim)]">
          © 2025 Novel. All rights reserved.
        </p>
      </div>
    </div>
  );

  // Desktop Layout
  if (isDesktop) {
    return (
      <div className="min-h-screen p-8">
        {header}
        {content}
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="min-h-screen">
      {header}
      {content}
    </div>
  );
}
