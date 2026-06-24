import { apiBaseUrl } from '../config';
import { getToken } from './authApi';
import type { Channel } from '../types/chat';

export interface OrganizationSummaryResponse {
  id: string;
  name: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'DRAFT';
  joinPolicy: 'OPEN' | 'APPROVAL' | 'INVITE_ONLY';
  memberCount: number;
  joined: boolean;
  defaultChannelId: string | null;
}

export interface MemberPreview {
  id: string;
  displayName: string;
  role: 'MEMBER' | 'ORGANIZER';
}

export interface OrganizationDetailResponse extends OrganizationSummaryResponse {
  channels: Channel[];
  tags: string[];
  creatorName: string | null;
  members: MemberPreview[];
}

function buildApiUrl(path: string) {
  return new URL(`${apiBaseUrl}${path}`, window.location.origin);
}

function buildHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  return headers;
}

export async function fetchOrganizations(): Promise<OrganizationSummaryResponse[]> {
  const response = await fetch(buildApiUrl('/api/organizations'), { headers: buildHeaders() });
  if (!response.ok) {
    throw new Error(`organizations status ${response.status}`);
  }
  return response.json();
}

export async function fetchOrganization(organizationId: string): Promise<OrganizationDetailResponse> {
  const response = await fetch(buildApiUrl(`/api/organizations/${encodeURIComponent(organizationId)}`), { headers: buildHeaders() });
  if (!response.ok) {
    throw new Error(`organization detail status ${response.status}`);
  }
  return response.json();
}

export async function joinOrganization(organizationId: string): Promise<OrganizationDetailResponse> {
  const response = await fetch(buildApiUrl(`/api/organizations/${encodeURIComponent(organizationId)}/join`), {
    method: 'POST',
    headers: buildHeaders()
  });
  if (!response.ok) {
    throw new Error(`join organization status ${response.status}`);
  }
  return response.json();
}

export async function createOrganization(name: string, description: string): Promise<OrganizationDetailResponse> {
  const response = await fetch(buildApiUrl('/api/organizations'), {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ name, description })
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `create organization status ${response.status}`);
  }
  return response.json();
}
