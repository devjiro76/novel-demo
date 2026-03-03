'use client';

import { useState } from 'react';
import { PageCard } from '@/components/layout';
import { AppContainer, PageHeader } from '@/components/layout/AppContainer';
import { Bell, Moon, Shield, HelpCircle, Info, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const Toggle = ({
    checked,
    onChange,
    disabled = false
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative ${
        checked ? 'bg-[var(--color-brand-primary)]' : 'bg-[var(--color-surface-2)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const settingsGroups = [
    {
      title: '앱 설정',
      items: [
        {
          icon: Bell,
          label: '알림',
          control: <Toggle checked={notifications} onChange={setNotifications} />,
        },
        {
          icon: Moon,
          label: '다크 모드',
          control: <Toggle checked={darkMode} onChange={setDarkMode} disabled />,
        },
      ],
    },
    {
      title: '계정',
      items: [
        {
          icon: Shield,
          label: '개인정보 보호',
          control: <span className="text-xs text-[var(--color-text-muted)]">준비 중</span>,
        },
        {
          icon: Trash2,
          label: '데이터 삭제',
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
          control: <span className="text-xs text-[var(--color-text-muted)]">준비 중</span>,
        },
        {
          icon: Info,
          label: '앱 정보',
          control: <span className="text-sm text-[var(--color-text-muted)]">v1.0.0</span>,
        },
      ],
    },
  ];

  return (
    <AppContainer>
      <PageHeader 
        title="설정"
        subtitle="앱 설정 및 계정 관리"
      />
      <div className="space-y-6">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3 px-1">
              {group.title}
            </h2>
            <PageCard padding="none">
              <div className="divide-y divide-white/[0.04]">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const ItemWrapper = item.onClick ? 'button' : 'div';
                  return (
                    <ItemWrapper
                      key={item.label}
                      onClick={item.onClick}
                      className={`flex items-center justify-between px-4 py-3.5 ${
                        item.onClick ? 'w-full text-left cursor-pointer hover:bg-white/[0.02]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${item.danger ? 'text-red-400' : 'text-[var(--color-text-muted)]'}`} />
                        <span className={item.danger ? 'text-red-400' : ''}>{item.label}</span>
                      </div>
                      {'control' in item && item.control}
                    </ItemWrapper>
                  );
                })}
              </div>
            </PageCard>
          </div>
        ))}

        <div className="text-center pt-8 pb-4">
          <p className="text-xs text-[var(--color-text-dim)]">
            © 2025 Novel. All rights reserved.
          </p>
        </div>
      </div>
    </AppContainer>
  );
}
