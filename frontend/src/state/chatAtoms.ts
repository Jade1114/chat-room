import { atom } from 'jotai';
import type { Channel, ChannelDetail, ConnectionStatus, CurrentUser, TimelineItem } from '../types/chat';

export const selectedUserIdAtom = atom('');
export const currentUserAtom = atom<CurrentUser | null>(null);
export const mockUsersAtom = atom<CurrentUser[]>([]);
export const channelIdAtom = atom('');
export const draftAtom = atom('');
export const statusAtom = atom<ConnectionStatus>('idle');
export const timelineAtom = atom<TimelineItem[]>([]);
export const channelsAtom = atom<Channel[]>([]);
export const activeChannelDetailAtom = atom<ChannelDetail | null>(null);
export const loadingUsersAtom = atom(false);
export const loadingChannelsAtom = atom(false);
export const loadingChannelDetailAtom = atom(false);
export const lobbyErrorAtom = atom('');

export const displayNameAtom = atom((get) => get(currentUserAtom)?.displayName.trim() || '');
export const selectedChannelIdAtom = atom((get) => get(channelIdAtom).trim());
export const isConnectedAtom = atom((get) => get(statusAtom) === 'connected');
export const canSendAtom = atom((get) => get(isConnectedAtom) && get(draftAtom).trim().length > 0);
