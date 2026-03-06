'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
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
  Palette,
  Loader2,
} from 'lucide-react';
import { AppContainer, PageHeader } from '@/components/layout/AppContainer';
import { useSession, signOut } from '@/lib/auth-client';

const MOCK_MY_CONTENTS = [
  { id: 1, title: '내가 만든 월드 1', type: 'world', views: 1200, likes: 45 },
  { id: 2, title: '인기 캐릭터', type: 'solo', views: 3400, likes: 128 },
];

export default function MyPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/login');
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <AppContainer>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </AppContainer>
    );
  }

  if (!session) return null;

  const user = {
    name: session.user.name ?? '사용자',
    email: session.user.email,
    image: session.user.image,
    // 아직 VIP/코인 시스템 미구현 — 기본값
    level: 'Free',
    isVIP: false,
    vipExpiry: '',
    coins: 0,
    revenue: 0,
  };

  return (
    <AppContainer>
      <PageHeader
        title="마이"
        rightContent={
          <button className="rounded-full p-2 transition-colors hover:bg-white/[0.06]">
            <Settings className="h-5 w-5 text-gray-400" />
          </button>
        }
      />

      <div className="space-y-6">
        {/* Profile Section */}
        <ProfileSection user={user} />

        {/* VIP Banner */}
        <VIPBanner isVIP={user.isVIP} expiry={user.vipExpiry} />

        {/* Assets Section */}
        <AssetsSection coins={user.coins} />

        {/* Creator Revenue */}
        <RevenueSection revenue={user.revenue} />

        {/* My Contents */}
        <MyContentsSection contents={MOCK_MY_CONTENTS} />

        {/* Menu List */}
        <MenuSection />
      </div>
    </AppContainer>
  );
}

// Profile Section
interface UserInfo {
  name: string;
  email: string;
  image?: string | null;
  level: string;
  isVIP: boolean;
  vipExpiry: string;
  coins: number;
  revenue: number;
}

function ProfileSection({ user }: { user: UserInfo }) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-2xl font-bold text-white">
          {user.name[0]}
        </div>
        {user.isVIP && (
          <div className="absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-black bg-gradient-to-r from-yellow-400 to-orange-500">
            <Crown className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <span className="rounded-full border border-yellow-500/30 bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
            {user.level}
          </span>
        </div>
        <p className="text-sm text-gray-500">{user.email}</p>

        <div className="mt-2 flex items-center gap-3">
          <Link
            href="/my/edit"
            className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700"
          >
            프로필 수정
          </Link>
          <button className="rounded-lg bg-gray-800 p-1.5 text-gray-400 transition-colors hover:text-white">
            <ShareIcon className="h-4 w-4" />
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
      <div className="overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">VIP 멤버십</h3>
              <p className="text-xs text-gray-400">만료일: {expiry}</p>
            </div>
          </div>
          <Link
            href="/vip/manage"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
          >
            관리
          </Link>
        </div>
        <div className="mt-3 flex gap-2">
          <span className="rounded bg-black/30 px-2 py-1 text-[10px] text-yellow-300">
            무제한 대화
          </span>
          <span className="rounded bg-black/30 px-2 py-1 text-[10px] text-yellow-300">
            광고 제거
          </span>
          <span className="rounded bg-black/30 px-2 py-1 text-[10px] text-yellow-300">
            프리미엄 콘텐츠
          </span>
        </div>
      </div>
    );
  }

  return (
    <Link href="/vip" className="block">
      <div className="group overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/80 to-pink-600/80 p-4 transition-opacity hover:opacity-90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">VIP 가입하기</h3>
              <p className="text-xs text-white/70">무제한 대화와 특별한 혜택</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/50 transition-colors group-hover:text-white" />
        </div>
      </div>
    </Link>
  );
}

// Assets Section (Coins)
function AssetsSection({ coins }: { coins: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-medium text-gray-300">보유 코인</span>
        </div>
        <Link
          href="/coins/history"
          className="text-xs text-gray-500 transition-colors hover:text-white"
        >
          내역 보기
        </Link>
      </div>

      <div className="mb-4 flex items-end gap-1">
        <span className="text-2xl font-black text-white">{coins.toLocaleString()}</span>
        <span className="mb-1 text-sm text-gray-500">코인</span>
      </div>

      <Link
        href="/coins/charge"
        className="block w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        코인 충전하기
      </Link>
    </div>
  );
}

// Creator Revenue Section
function RevenueSection({ revenue }: { revenue: number }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gray-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <span className="text-sm font-medium text-gray-300">창작자 수익</span>
        </div>
        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
          이번 달
        </span>
      </div>

      <div className="mb-4 flex items-end gap-1">
        <span className="text-2xl font-black text-white">{revenue.toLocaleString()}</span>
        <span className="mb-1 text-sm text-gray-500">원</span>
      </div>

      <div className="flex gap-2">
        <Link
          href="/creator/stats"
          className="flex-1 rounded-xl bg-gray-800 py-2.5 text-center text-xs font-medium text-white transition-colors hover:bg-gray-700"
        >
          통계 보기
        </Link>
        <Link
          href="/creator/withdraw"
          className="flex-1 rounded-xl bg-gray-800 py-2.5 text-center text-xs font-medium text-white transition-colors hover:bg-gray-700"
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
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-white">내 콘텐츠</h3>
        <Link href="/my/contents" className="text-xs text-gray-500 hover:text-white">
          전체 보기
        </Link>
      </div>

      <div className="space-y-2">
        {contents.map((item) => (
          <Link
            key={item.id}
            href={`/my/contents/${item.id}`}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-gray-900/50 p-3 transition-colors hover:border-purple-500/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30">
              <span className="text-lg">{item.type === 'world' ? '🌏' : '👤'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium text-white">{item.title}</h4>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {item.views.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {item.likes}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </Link>
        ))}
      </div>

      <Link
        href="/create"
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-700 py-3 text-gray-500 transition-colors hover:border-purple-500/50 hover:text-purple-400"
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
          <h3 className="mb-3 px-1 text-xs font-medium text-gray-500">{group.title}</h3>
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-gray-900/50">
            {group.items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3.5 transition-colors last:border-0 hover:bg-white/[0.04]"
              >
                <item.icon className="h-5 w-5 text-gray-400" />
                <span className="flex-1 text-sm text-white">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <button
        onClick={async () => {
          await signOut();
          window.location.href = '/login';
        }}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-400 transition-colors hover:bg-red-500/10"
      >
        <LogOut className="h-5 w-5" />
        <span className="text-sm font-medium">로그아웃</span>
      </button>
    </div>
  );
}

// Share Icon Component
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}
