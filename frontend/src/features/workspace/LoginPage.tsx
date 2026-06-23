import { useNavigate } from '@tanstack/react-router';
import { useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { fetchMockUsers } from '../../lib/chatApi';
import {
  activeChannelDetailAtom,
  channelIdAtom,
  channelsAtom,
  currentUserAtom,
  draftAtom,
  lobbyErrorAtom,
  statusAtom,
  timelineAtom
} from '../../state/chatAtoms';
import type { CurrentUser, UserRole } from '../../types/chat';

const roleLabel: Record<UserRole, string> = {
  STUDENT: '学生',
  TEACHER: '教师',
  ADMIN: '管理员'
};

const roleDescription: Record<UserRole, string> = {
  STUDENT: '查看课程频道、班级频道和学校通知',
  TEACHER: '进入授课课程频道，与学生讨论课程内容',
  ADMIN: '查看和管理全部频道空间'
};

export function LoginPage() {
  const navigate = useNavigate();
  const setCurrentUser = useSetAtom(currentUserAtom);
  const setChannelId = useSetAtom(channelIdAtom);
  const setChannels = useSetAtom(channelsAtom);
  const setActiveChannelDetail = useSetAtom(activeChannelDetailAtom);
  const setTimeline = useSetAtom(timelineAtom);
  const setDraft = useSetAtom(draftAtom);
  const setStatus = useSetAtom(statusAtom);
  const setLobbyError = useSetAtom(lobbyErrorAtom);
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError('');
      setLobbyError('');

      try {
        const nextUsers = await fetchMockUsers();
        if (!cancelled) {
          setUsers(nextUsers);
        }
      } catch {
        if (!cancelled) {
          setError('身份列表加载失败，请确认后端服务已启动。');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [setLobbyError]);

  function enterWorkspace(user: CurrentUser) {
    setCurrentUser(user);
    setChannelId('');
    setChannels([]);
    setActiveChannelDetail(null);
    setTimeline([]);
    setDraft('');
    setStatus('idle');
    setLobbyError('');
    navigate({ to: '/dashboard' });
  }

  return (
    <main className="min-h-screen bg-app px-5 py-8 text-primary">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-divider bg-card p-8 shadow-panel">
          <div className="grid size-14 place-items-center rounded-2xl bg-accent text-on-accent shadow-accent">
            <Icon className="size-7"><path d="M3 21h18" /><path d="M6 21V9l6-4 6 4v12" /><path d="M9 21v-5h6v5" /><path d="M9 11h.01M15 11h.01" /></Icon>
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-accent-strong">Campus Workspace</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-strong max-sm:text-3xl">选择身份进入星河大学频道空间</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
            当前 MVP 使用 Mock 身份模拟登录。系统会根据用户角色、院系、班级和课程关系返回可访问频道，进入频道后再建立 WebSocket 实时聊天连接。
          </p>
          <div className="mt-8 grid gap-3 text-sm text-muted">
            <div className="flex items-center gap-3 rounded-2xl bg-accent-wash p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent-strong">1</span>
              <span>先选择身份，而不是直接输入临时展示名和频道。</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-info-soft p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-card text-info">2</span>
              <span>后端根据身份计算频道权限，只展示可访问频道。</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-violet-soft p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-card text-violet">3</span>
              <span>进入频道后，Redis 维护在线状态，RabbitMQ 分发聊天消息。</span>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-divider bg-elevated p-5 shadow-panel">
          <div className="border-b border-divider px-2 pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-faint">Mock Login</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-strong">选择一个预设用户</h2>
            <p className="mt-2 text-sm text-muted">这一步对应产品主线里的“身份 → 频道 → 权限”。</p>
          </div>

          {error && <p className="mt-5 rounded-2xl border border-danger-border bg-danger-soft p-4 text-sm text-danger">{error}</p>}

          <div className="mt-5 grid gap-3">
            {loading && <p className="rounded-2xl bg-active p-4 text-sm text-muted">正在加载身份列表...</p>}
            {!loading && users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => enterWorkspace(user)}
                className="group grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-divider bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-accent-soft hover:shadow-composer"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-sm font-bold text-accent-strong">
                  {user.displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-strong">{user.displayName}</span>
                    <span className="rounded-full bg-active px-2 py-0.5 text-[10px] font-semibold text-muted">{roleLabel[user.role]}</span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-faint">{roleDescription[user.role]}</span>
                </span>
                <span className="text-xs font-semibold text-accent opacity-0 transition group-hover:opacity-100">进入 →</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
