'use client';

import { useState, useEffect } from 'react';

const banners = [
  {
    id: 1,
    title: '새로운 월드가 열립니다',
    subtitle: 'AI와 함께 만드는 무한한 이야기',
    badge: 'NEW',
    gradient: 'from-purple-600/90 via-pink-600/80 to-orange-500/80',
  },
  {
    id: 2,
    title: '이번 주 인기 콘텐츠',
    subtitle: '가장 많은 사랑을 받은 세계관',
    badge: 'HOT',
    gradient: 'from-orange-600/90 via-red-600/80 to-pink-600/80',
  },
];

export function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="px-4 py-4">
      <div className="relative aspect-[3/1] overflow-hidden rounded-2xl md:aspect-[4/1]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient}`} />
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-10">
              <span className="mb-2 inline-block w-fit rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                {banner.badge}
              </span>
              <h2 className="mb-1 text-xl font-black text-white md:text-2xl">{banner.title}</h2>
              <p className="text-sm text-white/80">{banner.subtitle}</p>
            </div>
          </div>
        ))}

        {/* Indicator */}
        <div className="absolute right-4 bottom-3 text-xs text-white/70">
          {current + 1} / {banners.length}
        </div>
      </div>
    </section>
  );
}
