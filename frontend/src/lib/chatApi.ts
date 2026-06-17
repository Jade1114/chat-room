import { apiBaseUrl } from '../config';
import type { RoomDetail, RoomSummary } from '../types/chat';

export async function fetchRooms(): Promise<RoomSummary[]> {
  const response = await fetch(`${apiBaseUrl}/api/rooms`);

  if (!response.ok) {
    throw new Error(`rooms status ${response.status}`);
  }

  return response.json();
}

export async function fetchRoomDetail(roomId: string): Promise<RoomDetail> {
  const response = await fetch(`${apiBaseUrl}/api/rooms/${encodeURIComponent(roomId)}`);

  if (!response.ok) {
    throw new Error(`room detail status ${response.status}`);
  }

  return response.json();
}
