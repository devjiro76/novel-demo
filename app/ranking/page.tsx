import RankingPage from '@/components/RankingPage';
import { getAllClientPacks, getAllWorldCards } from '@/lib/story-pack';

export default function Page() {
  const packs = getAllClientPacks();
  const worlds = getAllWorldCards();
  return <RankingPage packs={packs} worlds={worlds} />;
}
