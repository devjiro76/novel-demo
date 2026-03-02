'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import { PageLayout } from '@/components/layout';
import type { StoryManifest, WorldCardData } from '@/lib/story-pack';
import type { UserWorld } from '@/lib/types';
import { hexToRgb } from '@/lib/colors';
import CharacterCard from '@/components/CharacterCard';
import { deleteWorldAPI } from '@/lib/api-client-room';
import { clearSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent,
  AlertDialogHeader, AlertDialogFooter, AlertDialogTitle,
  AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface WorldDetailProps {
  manifest?: StoryManifest;
  userWorld?: UserWorld;
  worldCard: WorldCardData;
}

export default function WorldDetail({ manifest, userWorld, worldCard }: WorldDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const themeColor = worldCard.themeColor;
  const themeRgb = worldCard.themeColorRgb;
  const slug = worldCard.slug ?? worldCard.id;

  const handleDeleteWorld = async () => {
    setDeleting(true);
    try {
      const storageKey = `novel:${slug}`;
      let worldInstanceId: string | undefined;
      try { worldInstanceId = localStorage.getItem(`${storageKey}:worldId`) ?? localStorage.getItem(`${storageKey}:villageId`) ?? undefined; } catch {}
      await deleteWorldAPI(worldCard.id, worldInstanceId);
      clearSession(storageKey);
      try { localStorage.removeItem(`${storageKey}:worldId`); localStorage.removeItem(`${storageKey}:villageId`); } catch {}
      toast.success('월드가 삭제되었습니다');
      router.push('/');
    } catch {
      toast.error('월드 삭제에 실패했습니다');
      setDeleting(false);
    }
  };

  const characters = manifest
    ? manifest.characters
        .filter((c) => c.id !== manifest.playerCharacterId)
        .map((c) => ({
          id: c.id,
          name: c.name,
          fullName: c.fullName,
          age: c.age,
          role: c.role,
          glow: c.glow,
          glowRgb: c.glowRgb,
          image: c.image ? `${manifest.assetsBasePath}${c.image}` : undefined,
        }))
    : userWorld
    ? userWorld.characters.map((c) => ({
        id: c.id,
        name: c.name,
        fullName: c.fullName,
        age: c.age,
        role: c.role,
        glow: c.glow,
        glowRgb: hexToRgb(c.glow),
        image: undefined as string | undefined,
      }))
    : [];

  const firstCharId = characters[0]?.id;

  return (
    <PageLayout
      title={worldCard.name}
      subtitle={worldCard.description}
      width="md"
      showBackButton
    >
      {/* Tags */}
      <div className="flex items-center gap-2 mb-6">
        {worldCard.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{
              background: `rgba(${themeRgb},0.14)`,
              color: themeColor,
              border: `1px solid rgba(${themeRgb},0.25)`,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Character grid */}
      {characters.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} style={{ color: themeColor }} />
            <h2 className="text-sm font-bold">등장인물</h2>
            <span className="ml-auto text-xs text-[var(--color-text-dim)]">
              {characters.length}명
            </span>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
            {characters.map((char) => (
              <CharacterCard
                key={char.id}
                charId={char.id}
                name={char.name}
                fullName={char.fullName}
                role={char.role}
                age={char.age}
                image={char.image}
                glow={char.glow}
                glowRgb={char.glowRgb}
                slug={slug}
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="sticky bottom-4 pt-4 flex gap-3">
        <Link
          href={firstCharId ? `/${slug}?char=${firstCharId}` : `/${slug}`}
          className="flex items-center justify-center flex-1 h-14 rounded-2xl text-base font-bold tracking-wide transition-opacity active:opacity-80"
          style={{
            background: 'var(--color-brand-gradient)',
            boxShadow: `0 0 24px rgba(${themeRgb},0.35)`,
            color: '#fff',
          }}
        >
          대화 시작하기
        </Link>
        {userWorld && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="h-14 px-5 rounded-2xl text-red-400/60 hover:text-red-400 border-white/[0.08] hover:border-red-400/30"
                disabled={deleting}
              >
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>월드를 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription className="text-[var(--color-text-muted)]">
                  이 월드의 모든 대화와 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없어요.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteWorld} disabled={deleting} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">
                  {deleting ? '삭제 중...' : '삭제'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </PageLayout>
  );
}
