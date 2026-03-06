'use client';

interface CharacterStats {
  chatCount: number; // 총 대화 횟수
  lastChatAt: number; // 마지막 대화 timestamp
  totalMessages: number; // 총 메시지 수
  favorited: boolean; // 즐겨찾기 여부
}

const STATS_KEY = 'novel:character-stats';

function loadAllStats(): Record<string, CharacterStats> {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllStats(stats: Record<string, CharacterStats>): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* ignored */
  }
}

export function getCharacterStats(charId: string): CharacterStats {
  const all = loadAllStats();
  return all[charId] ?? { chatCount: 0, lastChatAt: 0, totalMessages: 0, favorited: false };
}

export function incrementChatCount(charId: string): void {
  const all = loadAllStats();
  const stats = all[charId] ?? { chatCount: 0, lastChatAt: 0, totalMessages: 0, favorited: false };
  stats.chatCount += 1;
  stats.lastChatAt = Date.now();
  all[charId] = stats;
  saveAllStats(all);
}

export function incrementMessageCount(charId: string, count = 1): void {
  const all = loadAllStats();
  const stats = all[charId] ?? { chatCount: 0, lastChatAt: 0, totalMessages: 0, favorited: false };
  stats.totalMessages += count;
  all[charId] = stats;
  saveAllStats(all);
}

export function toggleFavorite(charId: string): boolean {
  const all = loadAllStats();
  const stats = all[charId] ?? { chatCount: 0, lastChatAt: 0, totalMessages: 0, favorited: false };
  stats.favorited = !stats.favorited;
  all[charId] = stats;
  saveAllStats(all);
  return stats.favorited;
}

export function getAllCharacterStats(): Record<string, CharacterStats> {
  return loadAllStats();
}
