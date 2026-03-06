'use client';

import { useEffect, useRef } from 'react';
import type { RoomMessage } from '@/lib/room';

const BASE_INTERVAL = 2000;
const MAX_INTERVAL = 8000;

interface PollData {
  messages?: RoomMessage[];
  room?: { players?: unknown[]; npcCharacterIds?: string[] };
}

async function fetchRoomData(roomId: string): Promise<PollData | null> {
  try {
    const res = await fetch(`/api/room/${roomId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // network error — will retry
  }
}

function mergeMessages(
  prev: RoomMessage[],
  polled: RoomMessage[],
): { messages: RoomMessage[]; changed: boolean } {
  const prevIds = new Set(prev.filter((m) => !m.id.startsWith('pending-')).map((m) => m.id));
  const nonPendingCount = prev.filter((m) => !m.id.startsWith('pending-')).length;
  const hasNew = polled.some((m) => !prevIds.has(m.id));
  if (!hasNew && polled.length === nonPendingCount) {
    return { messages: prev, changed: false };
  }
  return { messages: polled, changed: true };
}

function adaptInterval(current: number, changed: boolean): number {
  if (changed) return BASE_INTERVAL;
  return Math.min(current * 1.5, MAX_INTERVAL);
}

/**
 * Polls GET /api/room/{roomId} with adaptive interval.
 * Backs off when no changes detected; resets on new data.
 */
export function useRoomPolling(
  roomId: string | null,
  enabled: boolean,
  sendingRef: React.RefObject<boolean>,
  setMessages: React.Dispatch<React.SetStateAction<RoomMessage[]>>,
  setPlayerCount: React.Dispatch<React.SetStateAction<number>>,
  setActiveNpcIds?: React.Dispatch<React.SetStateAction<string[]>>,
) {
  const intervalRef = useRef(BASE_INTERVAL);

  useEffect(() => {
    if (!roomId || !enabled) return;

    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const poll = async () => {
      if (sendingRef.current) {
        schedulePoll();
        return;
      }

      const data = await fetchRoomData(roomId);
      if (!data || cancelled) {
        schedulePoll();
        return;
      }

      let changed = false;
      setMessages((prev) => {
        const result = mergeMessages(prev, data.messages ?? []);
        changed = result.changed;
        return result.messages;
      });

      setPlayerCount(data.room?.players?.length ?? 1);
      if (setActiveNpcIds && data.room?.npcCharacterIds) {
        setActiveNpcIds(data.room.npcCharacterIds);
      }

      intervalRef.current = adaptInterval(intervalRef.current, changed);
      schedulePoll();
    };

    function schedulePoll() {
      if (!cancelled) {
        timer = setTimeout(poll, intervalRef.current);
      }
    }

    intervalRef.current = BASE_INTERVAL;
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [roomId, enabled, sendingRef, setMessages, setPlayerCount, setActiveNpcIds]);
}
