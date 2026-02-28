'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { RelSeed } from '@/lib/story-pack';

interface RelationshipIndicatorProps {
  roomId: string;
  npcId: string;
  glowRgb: string;
  glow: string;
}

export function RelationshipIndicator({ roomId, npcId, glowRgb, glow }: RelationshipIndicatorProps) {
  const [open, setOpen] = useState(false);
  const [rel, setRel] = useState<RelSeed | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => setOpen(false), []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open || rel || loading) return;
    setLoading(true);
    fetch(`/api/room/${roomId}/relationships`)
      .then((r) => r.json() as Promise<{ relationships: RelSeed[] }>)
      .then((data) => {
        const found = data.relationships.find(
          (r) =>
            (r.source.type === 'persona' && r.source.id === npcId) ||
            (r.target.type === 'persona' && r.target.id === npcId),
        );
        setRel(found ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, roomId, npcId, rel, loading]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-colors"
        style={{
          color: open ? glow : 'rgba(255,255,255,0.3)',
          background: open ? `rgba(${glowRgb},0.1)` : 'transparent',
        }}
        aria-label="관계 정보"
        aria-expanded={open}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
        관계
      </button>

      {open && (
        <div
          role="tooltip"
          aria-live="polite"
          className="absolute top-full right-0 mt-1 w-48 rounded-xl p-3 z-20 space-y-2"
          style={{
            background: '#12121a',
            border: `1px solid rgba(${glowRgb},0.15)`,
            boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(${glowRgb},0.08)`,
          }}
        >
          {loading && (
            <p className="text-[10px] text-white/30 text-center py-1">불러오는 중...</p>
          )}
          {!loading && !rel && (
            <p className="text-[10px] text-white/30 text-center py-1">관계 정보 없음</p>
          )}
          {!loading && rel && (
            <>
              <p className="text-[10px] text-white/50 mb-1">{rel.relationshipType}</p>
              <RelBar label="신뢰" value={rel.trust} glowRgb={glowRgb} />
              <RelBar label="친밀" value={rel.strength} glowRgb={glowRgb} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RelBar({ label, value, glowRgb }: { label: string; value: number; glowRgb: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between">
        <span className="text-[9px] text-white/30">{label}</span>
        <span className="text-[9px] text-white/25">{pct}%</span>
      </div>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `rgba(${glowRgb},0.7)` }}
        />
      </div>
    </div>
  );
}
