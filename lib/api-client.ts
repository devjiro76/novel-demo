import type {
  GameStateResponse,
  ConversationResponse,
} from './types';

let currentGameId: string | null = null;

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (currentGameId) h['X-Game-ID'] = currentGameId;
  return h;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: headers() });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export function getGameId(): string | null {
  return currentGameId;
}

export function setGameId(id: string | null): void {
  currentGameId = id;
}

export async function startGame(): Promise<{ gameId: string }> {
  const result = await post<{ gameId: string }>('/api/game/start');
  currentGameId = result.gameId;
  return result;
}

export async function getGameState(): Promise<GameStateResponse> {
  return get<GameStateResponse>('/api/game/state');
}

export interface ChatHistoryMessage {
  role: 'user' | 'character';
  text: string;
  action?: string;
  innerThought?: string;
}

export async function submitConversation(
  characterId: string,
  userMessage: string,
  situation: string,
  chatHistory?: ChatHistoryMessage[],
): Promise<ConversationResponse> {
  return post<ConversationResponse>('/api/turn/converse', {
    characterId,
    userMessage,
    situation,
    chatHistory,
  });
}

export async function resetGame(): Promise<void> {
  await post('/api/game/reset');
  currentGameId = null;
}
