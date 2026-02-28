import { NextResponse } from 'next/server';
import { getRoom } from '@/lib/room-store';
import { getStoryPack } from '@/lib/story-pack';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;

  const room = await getRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const pack = getStoryPack(room.slug);
  const npcCharacterIds: string[] = (room as any).npcCharacterIds ?? [room.npcCharacterId];

  // Filter relationships relevant to NPCs in this room
  const relationships = pack.initialRelationships.filter(
    (rel) =>
      (rel.source.type === 'persona' && npcCharacterIds.includes(rel.source.id)) ||
      (rel.target.type === 'persona' && npcCharacterIds.includes(rel.target.id)),
  );

  return NextResponse.json({ relationships, npcCharacterIds });
}
