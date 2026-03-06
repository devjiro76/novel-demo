export interface GameSession {
  roomId: string;
  playerId: string;
  npcId: string;
  worldId: string;
  displayName: string;
  characterId: string;
}

export function saveSession(storageKey: string, s: GameSession): void {
  try {
    localStorage.setItem(`${storageKey}:session`, JSON.stringify(s));
  } catch {
    /* ignored */
  }
}

export function loadSession(storageKey: string): GameSession | null {
  try {
    const raw = localStorage.getItem(`${storageKey}:session`);
    return raw ? (JSON.parse(raw) as GameSession) : null;
  } catch {
    /* ignored */ return null;
  }
}

export function clearSession(storageKey: string): void {
  try {
    localStorage.removeItem(`${storageKey}:session`);
  } catch {
    /* ignored */
  }
}
