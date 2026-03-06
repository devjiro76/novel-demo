import { describe, it, expect } from 'vitest';
import { hexToRgb } from '../colors';

describe('hexToRgb', () => {
  it('converts hex to rgb string', () => {
    expect(hexToRgb('#ff0000')).toBe('255,0,0');
    expect(hexToRgb('#00ff00')).toBe('0,255,0');
    expect(hexToRgb('#0000ff')).toBe('0,0,255');
  });

  it('handles hex without hash prefix', () => {
    expect(hexToRgb('ff0000')).toBe('255,0,0');
  });

  it('converts mixed values correctly', () => {
    expect(hexToRgb('#a855f7')).toBe('168,85,247');
    expect(hexToRgb('#1a1a24')).toBe('26,26,36');
  });

  it('handles black and white', () => {
    expect(hexToRgb('#000000')).toBe('0,0,0');
    expect(hexToRgb('#ffffff')).toBe('255,255,255');
  });
});
