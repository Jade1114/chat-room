import type { ActivityCategory, ActivityResponse } from '../../lib/activityApi';

export const categoryLabels: Record<ActivityCategory, string> = {
  STUDY: '学习',
  SPORTS: '运动',
  GAME: '游戏',
  PROJECT: '项目',
  WORKSHOP: 'Workshop',
  COMPETITION: '比赛',
  TRAVEL: '出行',
  TEAM_UP: '找队友',
  OTHER: '其他'
};

export const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({ value: value as ActivityCategory, label }));

export function splitTags(tags: string | null | undefined) {
  return (tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
}

export function formatDateTime(value: string | null) {
  if (!value) return '未设置';
  return new Date(value).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export function activityTimeLabel(activity: ActivityResponse) {
  if (activity.timeMode === 'ONGOING') return `持续招募至 ${formatDateTime(activity.expiresAt)}`;
  return activity.endTime
    ? `${formatDateTime(activity.startTime)} - ${formatDateTime(activity.endTime)}`
    : formatDateTime(activity.startTime);
}

export function toLocalInputValue(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function fromLocalInputValue(value: string) {
  if (!value) return '';
  return new Date(value).toISOString();
}
