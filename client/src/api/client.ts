/**
 * Novel API client
 */

import type {
  GameStartResponse,
  TurnNextResponse,
  TurnChooseResponse,
  GameStateResponse,
  ConversationResponse,
  Choice,
} from '../types';

const BASE_URL = import.meta.env.PROD
  ? 'https://novel-api.molroo.io'
  : '/api';

let currentGameId: string | null = null;

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (currentGameId) h['X-Game-ID'] = currentGameId;
  return h;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
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
  const res = await fetch(`${BASE_URL}${path}`, { headers: headers() });

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

export async function startGame(): Promise<GameStartResponse> {
  const result = await post<GameStartResponse>('/game/start');
  currentGameId = result.gameId;
  return result;
}

export async function getNextTurn(): Promise<TurnNextResponse> {
  return post<TurnNextResponse>('/turn/next');
}

export async function submitChoice(
  choiceIndex: number,
  situation: string,
  choices: Choice[],
): Promise<TurnChooseResponse> {
  return post<TurnChooseResponse>('/turn/choose', {
    choiceIndex,
    situation,
    choices,
  });
}

export async function getGameState(): Promise<GameStateResponse> {
  return get<GameStateResponse>('/game/state');
}

export async function submitConversation(
  characterId: string,
  userMessage: string,
  situation: string,
): Promise<ConversationResponse> {
  return post<ConversationResponse>('/turn/converse', {
    characterId,
    userMessage,
    situation,
  });
}

export async function resetGame(): Promise<void> {
  await post('/game/reset');
  currentGameId = null;
}
