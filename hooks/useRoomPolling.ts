'use client';

import { useEffect, useRef } from 'react';
import type { RoomMessage } from '@/lib/room';

const BASE_INTERVAL = 2000;
const MAX_INTERVAL = 8000;

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
      try {
        const res = await fetch(`/api/room/${roomId}`);
        if (!res.ok || cancelled) { schedulePoll(); return; }
        const data: { messages?: RoomMessage[]; room?: { players?: unknown[] } } = await res.json();
        const polledMessages: RoomMessage[] = data.messages ?? [];
        const polledPlayerCount: number = data.room?.players?.length ?? 1;

        let changed = false;
        setMessages((prev) => {
          const prevIds = new Set(
            prev.filter((m) => !m.id.startsWith('pending-')).map((m) => m.id),
          );
          const nonPendingCount = prev.filter((m) => !m.id.startsWith('pending-')).length;
          const hasNew = polledMessages.some((m) => !prevIds.has(m.id));
          if (!hasNew && polledMessages.length === nonPendingCount) {
            return prev; // no change → skip re-render
          }
          changed = true;
          return polledMessages; // KV is source of truth
        });

        setPlayerCount(polledPlayerCount);

        // Adaptive: back off when idle, reset when data changes
        if (changed) {
          intervalRef.current = BASE_INTERVAL;
        } else {
          intervalRef.current = Math.min(intervalRef.current * 1.5, MAX_INTERVAL);
        }
      } catch {
        // network error — will retry
      }
      schedulePoll();
    };

    function schedulePoll() {
      if (!cancelled) {
        timer = setTimeout(poll, intervalRef.current);
      }
    }

    // Initial fetch
    intervalRef.current = BASE_INTERVAL;
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [roomId, enabled, sendingRef, setMessages, setPlayerCount]);
}
