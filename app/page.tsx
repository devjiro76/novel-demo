import Landing from '@/components/landing/Landing';
import { getAllClientPacks, getAllWorldCards } from '@/lib/story-pack';

export default function Page() {
  const packs = getAllClientPacks();
  const worlds = getAllWorldCards();
  return <Landing packs={packs} worlds={worlds} />;
}
