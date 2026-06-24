import { useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { useChatRoom } from '../../hooks/useChatRoom';
import { channelsAtom, currentUserAtom, isConnectedAtom, loadingChannelsAtom } from '../../state/chatAtoms';
import type { ChannelType } from '../../types/chat';

const channelTypeLabel: Record<ChannelType, string> = {
  ORGANIZATION: '组织'
};

export function WorkspaceDashboard() {
  const navigate = useNavigate();
  const currentUser = useAtomValue(currentUserAtom);
  const channels = useAtomValue(channelsAtom);
  const loadingChannels = useAtomValue(loadingChannelsAtom);
  const isConnected = useAtomValue(isConnectedAtom);
  const { pickChannel, refreshLobby } = useChatRoom();

  const unreadChannels = channels.filter((channel) => channel.unreadCount > 0);
  const organizationChannels = channels.filter((channel) => channel.type === 'ORGANIZATION');
  const visibleChannels = channels.slice(0, 6);
  const totalUnread = unreadChannels.reduce((sum, channel) => sum + channel.unreadCount, 0);

  function enterChannel(channelId: string) {
    pickChannel(channelId);
    navigate({ to: '/messages' });
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-content px-6 py-6 text-primary max-md:px-4">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section className="rounded-[2rem] border border-divider bg-elevated p-7 shadow-panel">
          <div className="flex flex-wrap items-start gap-4">
            <div className="mr-auto">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-strong">Workspace Dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-strong">
                {currentUser?.displayName || '同学'}，欢迎回到组织平台
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                这里先汇总你的组织频道和未读状态。选择一个频道后再进入聊天区，避免登录后直接落入默认频道。
              </p>
            </div>
            <button
              type="button"
              onClick={refreshLobby}
              className="rounded-xl border border-divider bg-card px-4 py-2 text-xs font-semibold text-muted transition hover:bg-hover hover:text-primary"
            >
              {loadingChannels ? '同步中...' : '刷新频道'}
            </button>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-accent-wash p-4">
              <p className="text-xs font-semibold text-accent-strong">Workspace 连接</p>
              <p className="mt-2 text-2xl font-semibold text-strong">{isConnected ? '在线' : '连接中'}</p>
            </div>
            <div className="rounded-2xl bg-info-soft p-4">
              <p className="text-xs font-semibold text-info">我的频道</p>
              <p className="mt-2 text-2xl font-semibold text-strong">{channels.length}</p>
            </div>
            <div className="rounded-2xl bg-danger-soft p-4">
              <p className="text-xs font-semibold text-danger">总未读</p>
              <p className="mt-2 text-2xl font-semibold text-strong">{totalUnread}</p>
            </div>
          </div>
        </section>

        {unreadChannels.length > 0 && (
          <section className="rounded-[1.5rem] border border-divider bg-elevated p-5 shadow-composer">
            <h2 className="text-sm font-semibold text-strong">需要处理的未读</h2>
            <div className="mt-4 grid gap-2">
              {unreadChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => enterChannel(channel.id)}
                  className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 text-left transition hover:bg-hover"
                >
                  <span className="rounded-full bg-danger px-2 py-1 text-[10px] font-bold leading-none text-white">{channel.unreadCount}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{channel.name}</span>
                  <span className="text-xs text-faint">进入 →</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-divider bg-elevated p-5 shadow-composer">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-strong">最近可进入频道</h2>
              <button type="button" onClick={() => navigate({ to: '/messages' })} className="text-xs font-semibold text-accent">查看全部</button>
            </div>
            <div className="mt-4 grid gap-2">
              {visibleChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => enterChannel(channel.id)}
                  className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 text-left transition hover:bg-hover"
                >
                  <span className="text-lg font-light text-accent">#</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-primary">{channel.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-faint">{channelTypeLabel[channel.type]} · {channel.description}</span>
                  </span>
                  {channel.unreadCount > 0 && <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">{channel.unreadCount}</span>}
                </button>
              ))}
              {!loadingChannels && visibleChannels.length === 0 && (
                <p className="rounded-xl bg-card p-4 text-sm text-muted">暂无可访问频道。</p>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-divider bg-elevated p-5 shadow-composer">
            <h2 className="text-sm font-semibold text-strong">我的组织频道</h2>
            <div className="mt-4 grid gap-2">
              {organizationChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => enterChannel(channel.id)}
                  className="rounded-xl bg-card px-4 py-3 text-left transition hover:bg-hover"
                >
                  <span className="block truncate text-sm font-medium text-primary">{channel.name}</span>
                  <span className="mt-1 block truncate text-xs text-faint">{channel.description}</span>
                </button>
              ))}
              {!loadingChannels && organizationChannels.length === 0 && (
                <p className="rounded-xl bg-card p-4 text-sm text-muted">当前没有组织频道。</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
