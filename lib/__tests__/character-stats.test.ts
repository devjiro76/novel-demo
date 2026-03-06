import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCharacterStats,
  incrementChatCount,
  incrementMessageCount,
  toggleFavorite,
  getAllCharacterStats,
} from '../character-stats';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  }),
  length: 0,
  key: vi.fn(() => null),
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('getCharacterStats', () => {
  it('returns default stats for unknown character', () => {
    const stats = getCharacterStats('unknown');
    expect(stats.chatCount).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.favorited).toBe(false);
  });

  it('returns stored stats', () => {
    store['novel:character-stats'] = JSON.stringify({
      char1: { chatCount: 5, lastChatAt: 1000, totalMessages: 50, favorited: true },
    });
    const stats = getCharacterStats('char1');
    expect(stats.chatCount).toBe(5);
    expect(stats.totalMessages).toBe(50);
    expect(stats.favorited).toBe(true);
  });
});

describe('incrementChatCount', () => {
  it('increments chat count and updates lastChatAt', () => {
    incrementChatCount('char1');
    const stats = getCharacterStats('char1');
    expect(stats.chatCount).toBe(1);
    expect(stats.lastChatAt).toBeGreaterThan(0);
  });

  it('increments existing count', () => {
    incrementChatCount('char1');
    incrementChatCount('char1');
    expect(getCharacterStats('char1').chatCount).toBe(2);
  });
});

describe('incrementMessageCount', () => {
  it('increments by 1 by default', () => {
    incrementMessageCount('char1');
    expect(getCharacterStats('char1').totalMessages).toBe(1);
  });

  it('increments by specified count', () => {
    incrementMessageCount('char1', 5);
    expect(getCharacterStats('char1').totalMessages).toBe(5);
  });
});

describe('toggleFavorite', () => {
  it('toggles favorited state and returns new value', () => {
    const result1 = toggleFavorite('char1');
    expect(result1).toBe(true);
    expect(getCharacterStats('char1').favorited).toBe(true);

    const result2 = toggleFavorite('char1');
    expect(result2).toBe(false);
    expect(getCharacterStats('char1').favorited).toBe(false);
  });
});

describe('getAllCharacterStats', () => {
  it('returns empty object when no stats exist', () => {
    expect(getAllCharacterStats()).toEqual({});
  });

  it('returns all stored stats', () => {
    incrementChatCount('char1');
    incrementChatCount('char2');
    const all = getAllCharacterStats();
    expect(Object.keys(all)).toContain('char1');
    expect(Object.keys(all)).toContain('char2');
  });
});
