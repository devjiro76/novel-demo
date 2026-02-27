import GameClient from '@/components/GameClient';
import { getStoryPack, toClientPack } from '@/lib/story-pack';

export default function Page() {
  const pack = getStoryPack();
  const clientPack = toClientPack(pack);
  return <GameClient pack={clientPack} />;
}
