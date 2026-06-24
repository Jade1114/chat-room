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

export interface OrganizationMemberPreview {
  id: string;
  displayName: string;
  role: OrganizationRole;
}

export interface OrganizationViewModel {
  id: string;
  name: string;
  mark: string;
  description: string;
  visibility: 'PUBLIC';
  joinPolicy: 'OPEN';
  memberCount: number;
  role: OrganizationRole;
  colors: string;
  channels: OrganizationChannel[];
  activities: OrganizationActivity[];
  members: OrganizationMemberPreview[];
}

export const organizationViewModels: OrganizationViewModel[] = [
  {
    id: 'org-public-square',
    name: 'Public Square',
    mark: 'P',
    description: '平台维护的公共广场，用于开放交流、组织发现、活动推广和新成员熟悉平台。',
    visibility: 'PUBLIC',
    joinPolicy: 'OPEN',
    memberCount: 1284,
    role: 'MEMBER',
    colors: 'from-[#0f766e] to-[#34d399]',
    channels: [
      { id: 'ch-public-square', name: 'general', purpose: '公共闲聊、平台提问和新组织宣传。', unreadCount: 0, kind: 'general' },
      { id: 'ch-public-announcements', name: 'announcements', purpose: '平台维护的公告和活动提醒。', unreadCount: 2, kind: 'announcements' }
    ],
    activities: [
      { id: 'act-public-1', title: '本周新组织展示', time: '今天 20:00', status: '公开' },
      { id: 'act-public-2', title: '兴趣组织圆桌', time: '周六 19:30', status: '报名中' }
    ],
    members: [
      { id: 'u-admin', displayName: 'Platform Admin', role: 'ORGANIZER' },
      { id: 'u-yuy', displayName: 'Yuy', role: 'MEMBER' },
      { id: 'u-mina', displayName: 'Mina', role: 'MEMBER' }
    ]
  },
  {
    id: 'org-go-club',
    name: '围棋社',
    mark: 'G',
    description: '围棋爱好者组织，定期组织对局、复盘和新手教学。组织主页负责介绍、活动和成员，频道负责具体交流。',
    visibility: 'PUBLIC',
    joinPolicy: 'OPEN',
    memberCount: 86,
    role: 'ORGANIZER',
    colors: 'from-[#92400e] to-[#f59e0b]',
    channels: [
      { id: 'ch-go-club', name: 'general', purpose: '围棋社日常交流、约棋和新成员提问。', unreadCount: 4, kind: 'general' },
      { id: 'ch-go-announcements', name: 'announcements', purpose: '社团公告、活动安排和规则说明。', unreadCount: 0, kind: 'announcements' },
      { id: 'ch-go-review', name: 'game-review', purpose: '棋局复盘、题目讨论和学习材料沉淀。', unreadCount: 0, kind: 'event' }
    ],
    activities: [
      { id: 'act-go-1', title: '新手教学局', time: '明天 18:30', status: '可参加' },
      { id: 'act-go-2', title: '周末复盘会', time: '周日 14:00', status: '成员可见' }
    ],
    members: [
      { id: 'u-yuy', displayName: 'Yuy', role: 'ORGANIZER' },
      { id: 'u-luna', displayName: 'Luna', role: 'MEMBER' },
      { id: 'u-mina', displayName: 'Mina', role: 'MEMBER' }
    ]
  },
  {
    id: 'org-indie-game-lab',
    name: '独立游戏实验室',
    mark: 'I',
    description: '一起做小型游戏原型、试玩反馈和线上 Game Jam 的创作组织。频道按项目和活动拆分，避免所有讨论挤在一个聊天室。',
    visibility: 'PUBLIC',
    joinPolicy: 'OPEN',
    memberCount: 42,
    role: 'ORGANIZER',
    colors: 'from-[#4338ca] to-[#a78bfa]',
    channels: [
      { id: 'ch-indie-game-lab', name: 'general', purpose: '实验室日常交流、灵感分享和项目招募。', unreadCount: 0, kind: 'general' },
      { id: 'ch-game-announcements', name: 'announcements', purpose: 'Game Jam、试玩夜和版本发布通知。', unreadCount: 0, kind: 'announcements' },
      { id: 'ch-game-jam', name: 'game-jam', purpose: 'Game Jam 组队、主题讨论和提交提醒。', unreadCount: 1, kind: 'event' },
      { id: 'ch-game-random', name: 'random', purpose: '游戏截图、灵感碎片和轻松闲聊。', unreadCount: 0, kind: 'random' }
    ],
    activities: [
      { id: 'act-game-1', title: '48 小时 Game Jam', time: '周五 21:00', status: '组队中' },
      { id: 'act-game-2', title: '试玩反馈夜', time: '下周三 20:00', status: '公开' }
    ],
    members: [
      { id: 'u-mina', displayName: 'Mina', role: 'ORGANIZER' },
      { id: 'u-yuy', displayName: 'Yuy', role: 'MEMBER' },
      { id: 'u-luna', displayName: 'Luna', role: 'MEMBER' }
    ]
  }
];

export function findOrganization(organizationId: string | undefined) {
  return organizationViewModels.find((organization) => organization.id === organizationId) || organizationViewModels[0];
}

export function findChannel(organizationId: string | undefined, channelId: string | undefined) {
  const organization = findOrganization(organizationId);
  return organization.channels.find((channel) => channel.id === channelId) || organization.channels[0];
}
