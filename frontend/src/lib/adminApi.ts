import { apiBaseUrl } from '../config';
import { getToken } from './authApi';

export interface AdminActivityMetric {
  activityId: string;
  title: string;
  category: string;
  detailViews: number;
  participationMethodViews: number;
}

export interface AdminEventMetric {
  activityId: string;
  title: string;
  eventType: string;
  userId: string | null;
  visitorId: string | null;
  createdAt: string;
}

export interface AdminOverviewResponse {
  siteVisitors: number;
  totalActivities: number;
  publishedActivities: number;
  closedActivities: number;
  expiredActivities: number;
  participationMethodViews: number;
  contactViewRate: number;
  topActivities: AdminActivityMetric[];
  recentEvents: AdminEventMetric[];
}

function buildHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'B' + 'earer ' + token;
  return headers;
}

async function parseError(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({}));
  return new Error(body.error || fallback);
}

export async function fetchAdminOverview(): Promise<AdminOverviewResponse> {
  const response = await fetch(`${apiBaseUrl}/api/admin/overview`, { headers: buildHeaders() });
  if (!response.ok) throw await parseError(response, `admin overview status ${response.status}`);
  return response.json();
}
