import { apiBaseUrl } from '../config';
import type { Channel, ChannelDetail, CurrentUser } from '../types/chat';

function withUserId(path: string, userId?: string) {
  const url = new URL(`${apiBaseUrl}${path}`);
  if (userId) {
    url.searchParams.set('userId', userId);
  }
  return url.toString();
}

export async function fetchCurrentUser(userId?: string): Promise<CurrentUser> {
  const response = await fetch(withUserId('/api/me', userId));

  if (!response.ok) {
    throw new Error(`current user status ${response.status}`);
  }

  return response.json();
}

export async function fetchChannels(userId?: string): Promise<Channel[]> {
  const response = await fetch(withUserId('/api/channels', userId));

  if (!response.ok) {
    throw new Error(`channels status ${response.status}`);
  }

  return response.json();
}

export async function fetchChannelDetail(channelId: string, userId?: string): Promise<ChannelDetail> {
  const response = await fetch(withUserId(`/api/channels/${encodeURIComponent(channelId)}`, userId));

  if (!response.ok) {
    throw new Error(`channel detail status ${response.status}`);
  }

  return response.json();
}
