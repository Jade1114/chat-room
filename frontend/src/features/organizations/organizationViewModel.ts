import type { Channel } from '../../types/chat';
import type { OrganizationDetailResponse, OrganizationSummaryResponse } from '../../lib/organizationApi';

export type OrganizationRole = 'MEMBER' | 'ORGANIZER';
export type OrganizationTab = 'overview' | 'channels' | 'activities' | 'members' | 'settings';

export interface OrganizationChannel {
  id: string;
  name: string;
  purpose: string;
  unreadCount: number;
  kind: 'announcements' | 'general' | 'event' | 'random';
}

export interface OrganizationActivity {
  id: string;
  title: string;
  time: string;
  status: string;
}

export interface MemberPreviewVM {
  id: string;
  displayName: string;
  role: OrganizationRole;
}

/** @deprecated Use MemberPreviewVM */
export type OrganizationMemberPreview = MemberPreviewVM;

export interface OrganizationViewModel {
  id: string;
  name: string;
  mark: string;
  description: string;
  visibility: OrganizationSummaryResponse['visibility'];
  joinPolicy: OrganizationSummaryResponse['joinPolicy'];
  memberCount: number;
  joined: boolean;
  membershipLabel: string;
  defaultChannelId: string | null;
  colors: string;
  tags: string[];
  creatorName: string | null;
  channels: OrganizationChannel[];
  activities: OrganizationActivity[];
  members: MemberPreviewVM[];
}

const colorPalette = [
  'from-[#0f766e] to-[#34d399]',
  'from-[#92400e] to-[#f59e0b]',
  'from-[#4338ca] to-[#a78bfa]',
  'from-[#be123c] to-[#fb7185]',
  'from-[#0369a1] to-[#38bdf8]'
];

export function organizationMark(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || 'O';
}

export function organizationColor(id: string) {
  let hash = 0;
  for (const char of id) {
    hash = (hash + char.charCodeAt(0)) % colorPalette.length;
  }
  return colorPalette[hash];
}

function channelKind(channel: Channel): OrganizationChannel['kind'] {
  const text = `${channel.id} ${channel.name}`.toLowerCase();
  if (text.includes('announce') || text.includes('公告')) return 'announcements';
  if (text.includes('event') || text.includes('activity') || text.includes('活动')) return 'event';
  if (text.includes('random') || text.includes('闲聊')) return 'random';
  return 'general';
}

export function toOrganizationChannel(channel: Channel): OrganizationChannel {
  return {
    id: channel.id,
    name: channel.name,
    purpose: channel.description || '组织内交流频道。',
    unreadCount: channel.unreadCount,
    kind: channelKind(channel)
  };
}

export function toOrganizationViewModel(
  organization: OrganizationSummaryResponse | OrganizationDetailResponse
): OrganizationViewModel {
  const channels = 'channels' in organization ? organization.channels.map(toOrganizationChannel) : [];
  const tags = 'tags' in organization ? organization.tags : [];
  const creatorName = 'creatorName' in organization ? organization.creatorName : null;
  const members = 'members' in organization
    ? organization.members.map((m) => ({ id: m.id, displayName: m.displayName, role: m.role as OrganizationRole }))
    : [];
  return {
    id: organization.id,
    name: organization.name,
    mark: organizationMark(organization.name),
    description: organization.description,
    visibility: organization.visibility,
    joinPolicy: organization.joinPolicy,
    memberCount: organization.memberCount,
    joined: organization.joined,
    membershipLabel: organization.joined ? '已加入' : '未加入',
    defaultChannelId: organization.defaultChannelId,
    colors: organizationColor(organization.id),
    tags,
    creatorName,
    channels,
    activities: [],
    members
  };
}
