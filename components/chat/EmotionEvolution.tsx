'use client';

import React from 'react';
import type { EmotionDetail } from '@/lib/types';
import { resolveEmotionLabel, EMOTION_EMOJI } from '@/lib/emotion';

interface EmotionEvolutionProps {
  emotionDetail: EmotionDetail;
  glowRgb: string;
}

function computeArrow(netChange: number, hasDelta: boolean): string {
  if (!hasDelta) return '';
  if (netChange > 0.01) return ' ↑';
  if (netChange < -0.01) return ' ↓';
  return '';
}

function computeArrowColor(netChange: number): string {
  if (netChange > 0.01) return 'text-emerald-400/80';
  if (netChange < -0.01) return 'text-rose-400/80';
  return 'text-white/30';
}

export function EmotionEvolution({ emotionDetail, glowRgb }: EmotionEvolutionProps) {
  const { primary, delta } = emotionDetail;
  const label = resolveEmotionLabel(primary) || primary;
  const emoji = EMOTION_EMOJI[primary] ?? '😐';

  // Compute net change from delta
  const dominantDelta = delta
    ? Math.max(Math.abs(delta.V), Math.abs(delta.A), Math.abs(delta.D))
    : 0;
  const hasDelta = delta !== undefined && dominantDelta > 0.01;
  const netChange = delta ? (delta.V + delta.A + delta.D) / 3 : 0;

  const arrow = computeArrow(netChange, hasDelta);
  const arrowColor = computeArrowColor(netChange);

  return (
    <div
      className="mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{
        background: `rgba(${glowRgb},0.06)`,
        border: `1px solid rgba(${glowRgb},0.1)`,
      }}
    >
      <span className="text-[12px] leading-none">{emoji}</span>
      <span className="text-[10px] font-medium" style={{ color: `rgba(${glowRgb},0.9)` }}>
        {label}
      </span>
      {hasDelta && arrow && (
        <span className={`text-[10px] leading-none font-bold ${arrowColor}`}>{arrow}</span>
      )}
    </div>
  );
}
