'use client';

import React, { useState } from 'react';
import type { ClientStoryPack } from '@/lib/story-pack';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CharAvatar } from './MessageBubble';

interface InviteNpcPopoverProps {
  pack: ClientStoryPack;
  activeNpcIds: string[];
  onInvite: (charId: string) => void;
  disabled?: boolean;
}

export function InviteNpcPopover({
  pack,
  activeNpcIds,
  onInvite,
  disabled,
}: InviteNpcPopoverProps) {
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
          className="size-10 shrink-0 rounded-2xl border-white/[0.06] text-white/40 hover:text-white/70"
        >
          +
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-64 border-white/[0.08] bg-[#12121a] p-2"
      >
        <p className="px-2 py-1.5 text-[11px] text-white/40">대화에 초대하기</p>
        <div className="space-y-0.5">
          {invitable.map((char) => (
            <button
              key={char.id}
              onClick={() => {
                onInvite(char.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.06]"
            >
              <CharAvatar char={char} size={28} imageSrc={`${pack.assetsBasePath}${char.image}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${char.accentText}`}>{char.fullName}</p>
                <p className="truncate text-[10px] text-white/40">{char.role}</p>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
