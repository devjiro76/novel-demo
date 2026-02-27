import type { ConversationResponse } from './types';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
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

export async function startGame(slug: string): Promise<string> {
  const res = await post<{ ok: boolean; villageId: string }>('/api/game/start', { slug });
  return res.villageId;
}

export interface ChatHistoryMessage {
  role: 'user' | 'character';
  text: string;
  action?: string;
  innerThought?: string;
}

export async function submitConversation(
  slug: string,
  villageId: string,
  characterId: string,
  userMessage: string,
  situation: string,
  chatHistory?: ChatHistoryMessage[],
): Promise<ConversationResponse> {
  return post<ConversationResponse>('/api/turn/converse', {
    slug,
    villageId,
    characterId,
    userMessage,
    situation,
    chatHistory,
  });
}
