import { notFound } from 'next/navigation';
import { STORY_PACKS } from '@/stories';
import { storyToWorldCard } from '@/lib/story-pack';
import WorldDetail from '@/components/WorldDetail';

interface Props {
  params: Promise<{ worldId: string }>;
}

export default async function WorldPage({ params }: Props) {
  const { worldId } = await params;

  // Try to match against builtin story slugs
  const manifest = STORY_PACKS[worldId];
  if (manifest) {
    const worldCard = storyToWorldCard(manifest);
    return <WorldDetail manifest={manifest} worldCard={worldCard} />;
  }

  // KV lookup for user-created worlds will be added later
  notFound();
}
