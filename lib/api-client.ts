import { post } from './fetch-utils';

export async function startGame(slug: string): Promise<string> {
  const res = await post<{ ok: boolean; worldId: string }>('/api/game/start', { slug });
  return res.worldId;
}
