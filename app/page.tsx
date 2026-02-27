import StorySelector from '@/components/StorySelector';
import { getAllClientPacks } from '@/lib/story-pack';

export default function Page() {
  const packs = getAllClientPacks();
  return <StorySelector packs={packs} />;
}
