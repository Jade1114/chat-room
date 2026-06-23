import { apiBaseUrl } from '../config';
import type { Channel, ChannelDetail, ChatMessagePayload, CurrentUser } from '../types/chat';

function withUserId(path: string, userId?: string, extraParams?: Record<string, string | number | undefined>) {
  const url = new URL(`${apiBaseUrl}${path}`);
  if (userId) {
    url.searchParams.set('userId', userId);
  }
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function fetchMockUsers(): Promise<CurrentUser[]> {
  const response = await fetch(`${apiBaseUrl}/api/mock-users`);

  if (!response.ok) {
    throw new Error(`mock users status ${response.status}`);
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

export async function fetchChannelMessages(
  channelId: string,
  userId?: string,
  options: { before?: string; limit?: number } = {}
): Promise<ChatMessagePayload[]> {
  const response = await fetch(
    withUserId(`/api/channels/${encodeURIComponent(channelId)}/messages`, userId, {
      before: options.before,
      limit: options.limit
    })
  );

  if (!response.ok) {
    throw new Error(`channel messages status ${response.status}`);
  }

  return response.json();
}
