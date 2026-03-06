import { describe, it, expect } from 'vitest';
import { resolveEmotionLabel, EMOTION_KO } from '../emotion';

describe('resolveEmotionLabel', () => {
  it('returns Korean label for known emotion key', () => {
    expect(resolveEmotionLabel('joy')).toBe('기쁨');
    expect(resolveEmotionLabel('anger')).toBe('분노');
    expect(resolveEmotionLabel('sadness')).toBe('슬픔');
  });

  it('handles case-insensitive input', () => {
    expect(resolveEmotionLabel('JOY')).toBe('기쁨');
    expect(resolveEmotionLabel('Anger')).toBe('분노');
  });

  it('trims whitespace', () => {
    expect(resolveEmotionLabel('  joy  ')).toBe('기쁨');
  });

  it('returns empty string for unknown emotion', () => {
    expect(resolveEmotionLabel('unknown_emotion')).toBe('');
    expect(resolveEmotionLabel('')).toBe('');
  });

  it('EMOTION_KO covers all expected emotions', () => {
    const expected = [
      'joy',
      'excitement',
      'contentment',
      'anger',
      'fear',
      'sadness',
      'anxiety',
      'surprise',
      'disgust',
      'trust',
      'calm',
      'shame',
      'guilt',
      'numbness',
    ];
    for (const key of expected) {
      expect(EMOTION_KO[key]).toBeDefined();
    }
  });
});
