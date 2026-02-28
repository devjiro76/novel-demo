import ChatHistory from '@/components/ChatHistory';
import { getAllClientPacks } from '@/lib/story-pack';

export default function Page() {
  const packs = getAllClientPacks();
  return <ChatHistory packs={packs} />;
}
