'use client';

import React from 'react';
import type { EmotionDetail } from '@/lib/types';
import { resolveEmotionLabel } from '@/lib/emotion';

function VadBar({ label, value }: { label: string; value: number }) {
  // value is -1..1, map to 0..100%
  const pct = Math.round(((value + 1) / 2) * 100);
  const color =
    value > 0.2 ? 'bg-emerald-400/70' : value < -0.2 ? 'bg-rose-400/70' : 'bg-white/30';
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-white/30 w-3 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[9px] text-white/25 w-6 text-right shrink-0">
        {value >= 0 ? '+' : ''}{value.toFixed(2)}
      </span>
    </div>
  );
}

interface EmotionEvolutionProps {
  emotionDetail: EmotionDetail;
  glowRgb: string;
}

export function EmotionEvolution({ emotionDetail, glowRgb }: EmotionEvolutionProps) {
  const { primary, delta, vad } = emotionDetail;
  const label = resolveEmotionLabel(primary) || primary;

  // Compute dominant delta axis
  const dominantDelta = delta
    ? Math.max(Math.abs(delta.V), Math.abs(delta.A), Math.abs(delta.D))
    : 0;
  const hasDelta = delta && dominantDelta > 0.01;
  const netChange = delta ? (delta.V + delta.A + delta.D) / 3 : 0;
  const arrow = !hasDelta ? '' : netChange > 0.01 ? ' ↑' : netChange < -0.01 ? ' ↓' : ' →';

  return (
    <div
      className="mt-1.5 rounded-lg px-2.5 py-1.5 space-y-1"
      style={{ background: `rgba(${glowRgb},0.05)`, border: `1px solid rgba(${glowRgb},0.08)` }}
    >
      {hasDelta && (
        <p className="text-[10px] text-white/40">
          <span className="font-medium" style={{ color: `rgba(${glowRgb},0.9)` }}>
            {label}
          </span>
          {delta && (
            <span className={netChange > 0.01 ? 'text-emerald-400/70' : netChange < -0.01 ? 'text-rose-400/70' : 'text-white/30'}>
              {' '}{netChange >= 0 ? '+' : ''}{netChange.toFixed(2)}{arrow}
            </span>
          )}
        </p>
      )}
      <VadBar label="V" value={vad.V} />
      <VadBar label="A" value={vad.A} />
      <VadBar label="D" value={vad.D} />
    </div>
  );
}
