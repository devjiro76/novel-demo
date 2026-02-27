import { notFound } from 'next/navigation';
import GameClient from '@/components/GameClient';
import { getStoryPack, toClientPack } from '@/lib/story-pack';
import { STORY_PACKS } from '@/stories';

export function generateStaticParams() {
  return Object.keys(STORY_PACKS).map((slug) => ({ slug }));
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!STORY_PACKS[slug]) notFound();

  const pack = getStoryPack(slug);
  const clientPack = toClientPack(pack);
  return <GameClient pack={clientPack} />;
}
