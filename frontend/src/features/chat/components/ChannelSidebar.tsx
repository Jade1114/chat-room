import { Icon } from '../../../components/Icon';
import type { Channel, ChannelType } from '../../../types/chat';

const typeLabel: Record<ChannelType, string> = {
  ORGANIZATION: '组织'
};

export interface ChannelGroup {
  type: ChannelType;
  channels: Channel[];
}

interface ChannelSidebarProps {
  activeChannelId: string;
  error: string;
  groups: ChannelGroup[];
  loading: boolean;
  onPickChannel: (channelId: string) => void;
  onRefresh: () => void;
}

export function ChannelSidebar({ activeChannelId, error, groups, loading, onPickChannel, onRefresh }: ChannelSidebarProps) {
  return (
    <aside className="flex min-h-screen flex-col border-r border-divider bg-sidebar max-md:hidden">
      <section className="border-b border-divider p-3">
        <div className="flex items-center gap-2">
          <h1 className="mr-auto shrink-0 text-sm font-semibold tracking-tight text-strong">组织平台</h1>
          <button type="button" onClick={onRefresh} className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle transition hover:bg-hover hover:text-primary" title="刷新频道">
            <Icon className="size-4"><path d="M20 6v5h-5" /><path d="M4 18v-5h5" /><path d="M18.5 9a7 7 0 0 0-11.7-2.6L4 9m16 6-2.8 2.6A7 7 0 0 1 5.5 15" /></Icon>
          </button>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-4 flex items-center justify-between px-2">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">我的频道</h2>
          {loading && <span className="text-[11px] text-faint">同步中</span>}
        </div>
        {error && <p className="mb-3 rounded-xl border border-danger-border bg-danger-soft p-3 text-xs leading-5 text-danger">{error}</p>}
        <div className="grid gap-4">
          {groups.map((group) => (
            <div key={group.type}>
              <p className="mb-1.5 px-2 text-[10px] font-bold tracking-[0.16em] text-faint">{typeLabel[group.type]}</p>
              <div className="grid gap-0.5">
                {group.channels.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => onPickChannel(channel.id)}
                    className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${channel.id === activeChannelId ? 'bg-active text-strong' : 'text-muted hover:bg-hover hover:text-primary'}`}
                  >
                    <span className={`text-lg font-light ${channel.id === activeChannelId ? 'text-accent' : 'text-faint group-hover:text-muted'}`}>#</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{channel.name}</span>
                    {channel.unreadCount > 0 && channel.id !== activeChannelId && (
                      <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                      </span>
                    )}
                    {channel.id === activeChannelId && <span className="size-1.5 rounded-full bg-accent" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
