import type { ConversationResponse } from './types';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_PATH}${path}`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function startGame(): Promise<void> {
  await post('/api/game/start');
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
