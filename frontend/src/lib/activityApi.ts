import { apiBaseUrl } from '../config';
import { clearToken, getToken } from './authApi';
import { getLocalSessionId } from './localSession';

export type ActivityCategory = 'STUDY' | 'SPORTS' | 'GAME' | 'PROJECT' | 'WORKSHOP' | 'COMPETITION' | 'TRAVEL' | 'TEAM_UP' | 'OTHER';
export type ActivityTimeMode = 'SCHEDULED' | 'ONGOING';
export type ActivityStatus = 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'CLOSED';

export interface ActivityHotMetrics {
  score: number;
  detailViews: number;
  participationMethodViews: number;
  interestCount: number;
}

export interface ActivityResponse {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  tags: string;
  timeMode: ActivityTimeMode;
  startTime: string | null;
  endTime: string | null;
  expiresAt: string;
  location: string;
  participationMethod: string | null;
  status: ActivityStatus;
  createdBy: string;
  createdByUserId: string | null;
  createdByLocalSessionId: string | null;
  initiatorDisplayName: string;
  interestCount: number;
  interestedByCurrentIdentity: boolean;
  canExpressInterest: boolean;
  initiatedByCurrentIdentity: boolean;
  hotMetrics: ActivityHotMetrics | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFeedResponse {
  upcoming: ActivityResponse[];
  ongoing: ActivityResponse[];
  hot?: ActivityResponse[];
}

export interface ActivityPayload {
  title: string;
  description: string;
  category: ActivityCategory;
  tags: string;
  timeMode: ActivityTimeMode;
  startTime?: string;
  endTime?: string;
  expiresAt?: string;
  location: string;
  participationMethod: string;
}

function buildApiUrl(path: string, params?: Record<string, string>) {
  const url = new URL(`${apiBaseUrl}${path}`, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value.trim()) url.searchParams.set(key, value.trim());
  });
  return url;
}

function buildHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Local-Session-Id': getLocalSessionId()
  };
  if (token) headers.Authorization = 'B' + 'earer ' + token;
  return headers;
}

async function parseError(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({}));
  return new Error(body.error || fallback);
}

export async function recordSiteVisit(): Promise<void> {
  const response = await fetch(buildApiUrl('/api/site-events/visit'), {
    method: 'POST',
    headers: buildHeaders()
  });
  if (!response.ok) throw await parseError(response, `site visit status ${response.status}`);
}

export async function fetchActivityFeed(filters: { query?: string; category?: string; tag?: string; sort?: 'hot' } = {}): Promise<ActivityFeedResponse> {
  const response = await fetch(buildApiUrl('/api/activities', filters), { headers: buildHeaders() });
  if (!response.ok) throw await parseError(response, `activities status ${response.status}`);
  return response.json();
}

export async function fetchActivityDetail(activityId: string): Promise<ActivityResponse> {
  const response = await fetch(buildApiUrl(`/api/activities/${encodeURIComponent(activityId)}`), { headers: buildHeaders() });
  if (!response.ok) throw await parseError(response, `activity detail status ${response.status}`);
  return response.json();
}

export async function revealParticipationMethod(activityId: string): Promise<string> {
  const response = await fetch(buildApiUrl(`/api/activities/${encodeURIComponent(activityId)}/participation-method`), {
    method: 'POST',
    headers: buildHeaders()
  });
  if (!response.ok) throw await parseError(response, `participation method status ${response.status}`);
  const body = await response.json();
  return body.participationMethod;
}

export async function expressActivityInterest(activityId: string): Promise<ActivityResponse> {
  const response = await fetch(buildApiUrl(`/api/activities/${encodeURIComponent(activityId)}/interest`), {
    method: 'POST',
    headers: buildHeaders()
  });
  if (!response.ok) throw await parseError(response, `activity interest status ${response.status}`);
  return response.json();
}

export async function createActivity(payload: ActivityPayload): Promise<ActivityResponse> {
  const response = await fetch(buildApiUrl('/api/activities'), {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      throw new Error('发布失败，请刷新页面后重试');
    }
    throw await parseError(response, `create activity status ${response.status}`);
  }
  return response.json();
}

export async function updateActivity(activityId: string, payload: ActivityPayload): Promise<ActivityResponse> {
  const response = await fetch(buildApiUrl(`/api/activities/${encodeURIComponent(activityId)}`), {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw await parseError(response, `update activity status ${response.status}`);
  return response.json();
}

export async function closeActivity(activityId: string): Promise<ActivityResponse> {
  const response = await fetch(buildApiUrl(`/api/activities/${encodeURIComponent(activityId)}/close`), {
    method: 'POST',
    headers: buildHeaders()
  });
  if (!response.ok) throw await parseError(response, `close activity status ${response.status}`);
  return response.json();
}

export async function fetchMyActivities(): Promise<ActivityResponse[]> {
  const response = await fetch(buildApiUrl('/api/me/activities'), { headers: buildHeaders() });
  if (!response.ok) throw await parseError(response, `my activities status ${response.status}`);
  return response.json();
}
