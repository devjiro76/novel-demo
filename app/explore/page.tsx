import { getAllWorldCards } from '@/lib/story-pack';
import ExplorePage from '@/components/ExplorePage';

export default function Page() {
  const worlds = getAllWorldCards();
  return <ExplorePage worlds={worlds} />;
}
