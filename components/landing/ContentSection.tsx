'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MockContent } from '@/data/mock-contents';
import { ContentCard } from './ContentCard';

export function ContentSection({ title, contents }: { title: string; contents: MockContent[] }) {
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = (el: HTMLDivElement) => {
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef) {
      scrollRef.scrollBy({ left: direction === 'left' ? -280 : 280, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-5">
      {/* Section Header */}
      <div className="mb-3 flex items-center justify-between px-4">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <button className="text-xs text-gray-500 hover:text-white">더 보기</button>
          <div className="flex gap-1">
            <button
              onClick={() => scroll('left')}
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                canScrollLeft ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-600'
              }`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className={`flex h-6 w-6 items-center justify-center rounded-full ${
                canScrollRight ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-600'
              }`}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div
        ref={setScrollRef}
        onScroll={(e) => checkScroll(e.currentTarget)}
        className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-2"
      >
        {contents.map((content, index) => (
          <ContentCard key={content.id} content={content} index={index} />
        ))}
      </div>
    </section>
  );
}
