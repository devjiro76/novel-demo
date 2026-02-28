import RankingPage from '@/components/RankingPage';
import { getAllClientPacks } from '@/lib/story-pack';

export default function Page() {
  const packs = getAllClientPacks();
  return <RankingPage packs={packs} />;
}
