import { atom } from 'jotai';
import type { ConnectionStatus, RoomDetail, RoomSummary, TimelineItem } from '../types/chat';

export const usernameAtom = atom('');
export const roomIdAtom = atom('');
export const draftAtom = atom('');
export const statusAtom = atom<ConnectionStatus>('idle');
export const timelineAtom = atom<TimelineItem[]>([]);
export const roomsAtom = atom<RoomSummary[]>([]);
export const activeRoomDetailAtom = atom<RoomDetail | null>(null);
export const loadingRoomsAtom = atom(false);
export const loadingDetailAtom = atom(false);

export const trimmedUsernameAtom = atom((get) => get(usernameAtom).trim());
export const selectedRoomAtom = atom((get) => get(roomIdAtom).trim());
export const isConnectedAtom = atom((get) => get(statusAtom) === 'connected');
export const canConnectAtom = atom((get) => {
  return !get(isConnectedAtom) && get(trimmedUsernameAtom).length > 0 && get(selectedRoomAtom).length > 0;
});
export const canSendAtom = atom((get) => get(isConnectedAtom) && get(draftAtom).trim().length > 0);
