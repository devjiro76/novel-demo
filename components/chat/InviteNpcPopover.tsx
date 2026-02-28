'use client';

import React, { useState } from 'react';
import type { ClientStoryPack, CharacterMeta } from '@/lib/story-pack';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CharAvatar } from './MessageBubble';

interface InviteNpcPopoverProps {
  pack: ClientStoryPack;
  activeNpcIds: string[];
  onInvite: (charId: string) => void;
  disabled?: boolean;
}

export function InviteNpcPopover({ pack, activeNpcIds, onInvite, disabled }: InviteNpcPopoverProps) {
  const [open, setOpen] = useState(false);

  const invitable = pack.characters.filter((c) => !activeNpcIds.includes(c.id));
  if (invitable.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          className="shrink-0 size-10 rounded-2xl border-white/[0.06] text-white/40 hover:text-white/70"
        >
          +
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-64 p-2 bg-[#12121a] border-white/[0.08]"
      >
        <p className="text-[11px] text-white/40 px-2 py-1.5">대화에 초대하기</p>
        <div className="space-y-0.5">
          {invitable.map((char) => (
            <button
              key={char.id}
              onClick={() => {
                onInvite(char.id);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.06] transition-colors text-left"
            >
              <CharAvatar char={char} size={28} imageSrc={`${pack.assetsBasePath}${char.image}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${char.accentText}`}>{char.fullName}</p>
                <p className="text-[10px] text-white/40 truncate">{char.role}</p>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
