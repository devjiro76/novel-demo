'use client';

import { useState } from 'react';
import { PageCard } from '@/components/layout';
import { AppContainer, PageHeader } from '@/components/layout/AppContainer';
import { Bell, Moon, Shield, HelpCircle, Info, Trash2 } from 'lucide-react';

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? 'bg-[var(--color-brand-primary)]' : 'bg-[var(--color-surface-2)]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

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
      <PageHeader title="설정" subtitle="앱 설정 및 계정 관리" />
      <div className="space-y-6">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h2 className="mb-3 px-1 text-xs font-semibold tracking-wider text-[var(--color-text-muted)] uppercase">
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
                        item.onClick ? 'w-full cursor-pointer text-left hover:bg-white/[0.02]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-5 w-5 ${item.danger ? 'text-red-400' : 'text-[var(--color-text-muted)]'}`}
                        />
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

        <div className="pt-8 pb-4 text-center">
          <p className="text-xs text-[var(--color-text-dim)]">© 2025 Novel. All rights reserved.</p>
        </div>
      </div>
    </AppContainer>
  );
}
