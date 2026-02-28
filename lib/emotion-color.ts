/**
 * Emotion → glow color/intensity mapping for avatar visualization.
 * Used by MessageBubble to show dynamic emotion-based glow on NPC avatars.
 */

export interface EmotionGlow {
  color: string;
  intensity: number; // 0–1
  animation?: 'pulse' | 'flash' | 'tremble';
}

const EMOTION_GLOW_MAP: Record<string, EmotionGlow> = {
  joy:         { color: '#fbbf24', intensity: 0.7 },
  excitement:  { color: '#fbbf24', intensity: 0.85, animation: 'pulse' },
  contentment: { color: '#fbbf24', intensity: 0.5 },
  sadness:     { color: '#60a5fa', intensity: 0.6 },
  anger:       { color: '#ef4444', intensity: 0.9, animation: 'pulse' },
  surprise:    { color: '#facc15', intensity: 0.8, animation: 'flash' },
  fear:        { color: '#7c3aed', intensity: 0.7, animation: 'tremble' },
  anxiety:     { color: '#7c3aed', intensity: 0.5, animation: 'tremble' },
  disgust:     { color: '#84cc16', intensity: 0.6 },
  trust:       { color: '#34d399', intensity: 0.6 },
  calm:        { color: '#a78bfa', intensity: 0.3 },
  shame:       { color: '#f472b6', intensity: 0.5 },
  guilt:       { color: '#9ca3af', intensity: 0.4 },
  numbness:    { color: '#6b7280', intensity: 0.2 },
};

/** Resolve a discrete emotion key to a glow configuration. */
export function getEmotionGlow(emotionKey: string): EmotionGlow | null {
  const key = emotionKey.toLowerCase().trim();
  return EMOTION_GLOW_MAP[key] ?? null;
}

/** Convert hex color (#rrggbb) to "r,g,b" string. */
function hexToRgb(hex: string): string {
  const c = hex.replace('#', '');
  return `${parseInt(c.slice(0, 2), 16)},${parseInt(c.slice(2, 4), 16)},${parseInt(c.slice(4, 6), 16)}`;
}

/** Get CSS box-shadow string for emotion glow. */
export function emotionGlowShadow(emotionKey: string, fallbackGlowRgb: string): string {
  const glow = getEmotionGlow(emotionKey);
  if (!glow) return `0 0 12px rgba(${fallbackGlowRgb},0.3)`;
  const rgb = hexToRgb(glow.color);
  const spread = 8 + glow.intensity * 16;
  const alpha = 0.2 + glow.intensity * 0.4;
  return `0 0 ${spread}px rgba(${rgb},${alpha})`;
}
