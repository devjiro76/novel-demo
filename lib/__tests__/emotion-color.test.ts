import { describe, it, expect } from 'vitest';
import { getEmotionGlow, emotionGlowShadow } from '../emotion-color';

describe('getEmotionGlow', () => {
  it('returns glow config for known emotions', () => {
    const joy = getEmotionGlow('joy');
    expect(joy).not.toBeNull();
    expect(joy!.color).toBe('#fbbf24');
    expect(joy!.intensity).toBe(0.7);
  });

  it('returns animation for high-intensity emotions', () => {
    const anger = getEmotionGlow('anger');
    expect(anger!.animation).toBe('pulse');

    const fear = getEmotionGlow('fear');
    expect(fear!.animation).toBe('tremble');
  });

  it('handles case-insensitive input', () => {
    expect(getEmotionGlow('JOY')).not.toBeNull();
    expect(getEmotionGlow('Anger')).not.toBeNull();
  });

  it('returns null for unknown emotion', () => {
    expect(getEmotionGlow('unknown')).toBeNull();
    expect(getEmotionGlow('')).toBeNull();
  });

  it('trims whitespace', () => {
    expect(getEmotionGlow('  joy  ')).not.toBeNull();
  });
});

describe('emotionGlowShadow', () => {
  it('returns emotion-based shadow for known emotion', () => {
    const shadow = emotionGlowShadow('joy', '168,85,247');
    expect(shadow).toContain('rgba(251,191,36,');
  });

  it('returns fallback shadow for unknown emotion', () => {
    const shadow = emotionGlowShadow('unknown', '168,85,247');
    expect(shadow).toContain('rgba(168,85,247,0.3)');
  });

  it('intensity affects spread and alpha', () => {
    const calmShadow = emotionGlowShadow('calm', '0,0,0');
    const angerShadow = emotionGlowShadow('anger', '0,0,0');
    // anger (0.9 intensity) should have larger spread than calm (0.3)
    const calmSpread = parseFloat(calmShadow.match(/0 0 ([\d.]+)px/)![1]);
    const angerSpread = parseFloat(angerShadow.match(/0 0 ([\d.]+)px/)![1]);
    expect(angerSpread).toBeGreaterThan(calmSpread);
  });
});
