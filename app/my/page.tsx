'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  User, 
  Settings, 
  Heart, 
  Clock, 
  Crown, 
  Coins, 
  TrendingUp,
  ChevronRight,
  LogOut,
  HelpCircle,
  Bell,
  Shield,
  Palette
} from 'lucide-react';
import { PageLayout, PageCard, PageSection } from '@/components/layout';
import { AppContainer, PageHeader } from '@/components/layout/AppContainer';

// 목업 데이터
const MOCK_USER = {
  name: '사용자',
  handle: '@user123',
  avatar: null,
  level: 'Gold',
  isVIP: true,
  vipExpiry: '2026.06.30',
  coins: 1250,
  revenue: 85000, // 원
};

const MOCK_MY_CONTENTS = [
  { id: 1, title: '내가 만든 월드 1', type: 'world', views: 1200, likes: 45 },
  { id: 2, title: '인기 캐릭터', type: 'solo', views: 3400, likes: 128 },
];

export default function MyPage() {
  return (
    <AppContainer>
      <PageHeader 
        title="마이"
        rightContent={
          <button className="p-2 rounded-full hover:bg-white/[0.06] transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        }
      />

      <div className="space-y-6">
        {/* Profile Section */}
        <ProfileSection user={MOCK_USER} />

        {/* VIP Banner */}
        <VIPBanner isVIP={MOCK_USER.isVIP} expiry={MOCK_USER.vipExpiry} />

        {/* Assets Section */}
        <AssetsSection coins={MOCK_USER.coins} />

        {/* Creator Revenue */}
        <RevenueSection revenue={MOCK_USER.revenue} />

        {/* My Contents */}
        <MyContentsSection contents={MOCK_MY_CONTENTS} />

        {/* Menu List */}
        <MenuSection />
      </div>
    </AppContainer>
  );
}

// Profile Section
function ProfileSection({ user }: { user: typeof MOCK_USER }) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
          {user.name[0]}
        </div>
        {user.isVIP && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center border-2 border-black">
            <Crown className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium border border-yellow-500/30">
            {user.level}
          </span>
        </div>
        <p className="text-sm text-gray-500">{user.handle}</p>
        
        <div className="flex items-center gap-3 mt-2">
          <Link 
            href="/my/edit"
            className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-medium hover:bg-gray-700 transition-colors"
          >
            프로필 수정
          </Link>
          <button className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <ShareIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// VIP Banner
function VIPBanner({ isVIP, expiry }: { isVIP: boolean; expiry: string }) {
  if (isVIP) {
    return (
      <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border border-yellow-500/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">VIP 멤버십</h3>
              <p className="text-xs text-gray-400">만료일: {expiry}</p>
            </div>
          </div>
          <Link 
            href="/vip/manage"
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
          >
            관리
          </Link>
        </div>
        <div className="flex gap-2 mt-3">
          <span className="px-2 py-1 rounded bg-black/30 text-[10px] text-yellow-300">무제한 대화</span>
          <span className="px-2 py-1 rounded bg-black/30 text-[10px] text-yellow-300">광고 제거</span>
          <span className="px-2 py-1 rounded bg-black/30 text-[10px] text-yellow-300">프리미엄 콘텐츠</span>
        </div>
      </div>
    );
  }

  return (
    <Link href="/vip" className="block">
      <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-purple-600/80 to-pink-600/80 p-4 group hover:opacity-90 transition-opacity">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">VIP 가입하기</h3>
              <p className="text-xs text-white/70">무제한 대화와 특별한 혜택</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// Assets Section (Coins)
function AssetsSection({ coins }: { coins: number }) {
  return (
    <div className="rounded-2xl bg-gray-900/50 border border-white/[0.06] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-gray-300">보유 코인</span>
        </div>
        <Link 
          href="/coins/history"
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          내역 보기
        </Link>
      </div>
      
      <div className="flex items-end gap-1 mb-4">
        <span className="text-2xl font-black text-white">{coins.toLocaleString()}</span>
        <span className="text-sm text-gray-500 mb-1">코인</span>
      </div>
      
      <Link 
        href="/coins/charge"
        className="block w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold text-center hover:opacity-90 transition-opacity"
      >
        코인 충전하기
      </Link>
    </div>
  );
}

// Creator Revenue Section
function RevenueSection({ revenue }: { revenue: number }) {
  return (
    <div className="rounded-2xl bg-gray-900/50 border border-white/[0.06] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-gray-300">창작자 수익</span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium">
          이번 달
        </span>
      </div>
      
      <div className="flex items-end gap-1 mb-4">
        <span className="text-2xl font-black text-white">{revenue.toLocaleString()}</span>
        <span className="text-sm text-gray-500 mb-1">원</span>
      </div>
      
      <div className="flex gap-2">
        <Link 
          href="/creator/stats"
          className="flex-1 py-2.5 rounded-xl bg-gray-800 text-white text-xs font-medium text-center hover:bg-gray-700 transition-colors"
        >
          통계 보기
        </Link>
        <Link 
          href="/creator/withdraw"
          className="flex-1 py-2.5 rounded-xl bg-gray-800 text-white text-xs font-medium text-center hover:bg-gray-700 transition-colors"
        >
          출금 신청
        </Link>
      </div>
    </div>
  );
}

// My Contents Section
function MyContentsSection({ contents }: { contents: typeof MOCK_MY_CONTENTS }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-white">내 콘텐츠</h3>
        <Link href="/my/contents" className="text-xs text-gray-500 hover:text-white">
          전체 보기
        </Link>
      </div>
      
      <div className="space-y-2">
        {contents.map(item => (
          <Link 
            key={item.id}
            href={`/my/contents/${item.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/50 border border-white/[0.06] hover:border-purple-500/30 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
              <span className="text-lg">{item.type === 'world' ? '🌏' : '👤'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white truncate">{item.title}</h4>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {item.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {item.likes}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </Link>
        ))}
      </div>
      
      <Link 
        href="/create"
        className="flex items-center justify-center gap-2 w-full py-3 mt-3 rounded-xl border border-dashed border-gray-700 text-gray-500 hover:border-purple-500/50 hover:text-purple-400 transition-colors"
      >
        <span className="text-lg">+</span>
        <span className="text-sm font-medium">새 콘텐츠 만들기</span>
      </Link>
    </div>
  );
}

// Menu Section
function MenuSection() {
  const menuGroups = [
    {
      title: '활동',
      items: [
        { icon: Heart, label: '즐겨찾기', href: '/my/favorites', badge: null },
        { icon: Clock, label: '최근 본 콘텐츠', href: '/my/history', badge: null },
        { icon: Bell, label: '알림 설정', href: '/my/notifications', badge: '3' },
      ],
    },
    {
      title: '설정 및 지원',
      items: [
        { icon: Palette, label: '테마 설정', href: '/my/theme', badge: null },
        { icon: Shield, label: '개인정보 보호', href: '/my/privacy', badge: null },
        { icon: HelpCircle, label: '고객센터', href: '/support', badge: null },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {menuGroups.map((group, index) => (
        <div key={index}>
          <h3 className="text-xs font-medium text-gray-500 mb-3 px-1">{group.title}</h3>
          <div className="rounded-2xl bg-gray-900/50 border border-white/[0.06] overflow-hidden">
            {group.items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0"
              >
                <item.icon className="w-5 h-5 text-gray-400" />
                <span className="flex-1 text-sm text-white">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </Link>
            ))}
          </div>
        </div>
      ))}
      
      {/* Logout */}
      <button className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-medium">로그아웃</span>
      </button>
    </div>
  );
}

// Share Icon Component
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}
