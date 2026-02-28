'use client';

import React from 'react';
import type { EmotionDetail } from '@/lib/types';
import { resolveEmotionLabel } from '@/lib/emotion';

const EMOTION_EMOJI: Record<string, string> = {
  joy: '😊', excitement: '✨', contentment: '😌',
  anger: '😠', fear: '😨', sadness: '😢',
  anxiety: '😰', surprise: '😲', disgust: '😒',
  trust: '🤝', calm: '😶', shame: '😳',
  guilt: '😔', numbness: '😶‍🌫️',
};

interface EmotionEvolutionProps {
  emotionDetail: EmotionDetail;
  glowRgb: string;
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

  const arrow = !hasDelta ? '' : netChange > 0.01 ? ' ↑' : netChange < -0.01 ? ' ↓' : '';
  const arrowColor = netChange > 0.01
    ? 'text-emerald-400/80'
    : netChange < -0.01
      ? 'text-rose-400/80'
      : 'text-white/30';

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
        <span className={`text-[10px] font-bold leading-none ${arrowColor}`}>
          {arrow}
        </span>
      )}
    </div>
  );
}
