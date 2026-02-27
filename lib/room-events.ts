import { EventEmitter } from 'events';
import type { SSEEventType } from './room';

const emitter = new EventEmitter();
emitter.setMaxListeners(100);

export interface RoomEvent {
  type: SSEEventType;
  data: unknown;
}

export function emitRoomEvent(roomId: string, type: SSEEventType, data: unknown): void {
  emitter.emit(`room:${roomId}`, { type, data });
}

export function onRoomEvent(
  roomId: string,
  cb: (event: RoomEvent) => void,
): () => void {
  const handler = (event: RoomEvent) => cb(event);
  emitter.on(`room:${roomId}`, handler);
  return () => emitter.off(`room:${roomId}`, handler);
}
