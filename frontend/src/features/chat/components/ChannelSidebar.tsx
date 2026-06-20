import { Icon } from '../../../components/Icon';
import type { Channel, ChannelType } from '../../../types/chat';

const typeLabel: Record<ChannelType, string> = {
  SCHOOL: '校园',
  DEPARTMENT: '院系',
  CLASS: '班级',
  COURSE: '课程'
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
    <aside className="flex min-h-screen flex-col border-r border-white/[0.06] bg-[#0e151e] max-md:hidden">
      <section className="border-b border-white/[0.06] p-3">
        <div className="flex items-center gap-2">
          <h1 className="mr-auto shrink-0 text-sm font-semibold tracking-tight text-white">星河大学</h1>
          <button type="button" onClick={onRefresh} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white" title="刷新频道">
            <Icon className="size-4"><path d="M20 6v5h-5" /><path d="M4 18v-5h5" /><path d="M18.5 9a7 7 0 0 0-11.7-2.6L4 9m16 6-2.8 2.6A7 7 0 0 1 5.5 15" /></Icon>
          </button>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-4 flex items-center justify-between px-2">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">我的频道</h2>
          {loading && <span className="text-[11px] text-slate-600">同步中</span>}
        </div>
        {error && <p className="mb-3 rounded-xl border border-rose-400/10 bg-rose-400/5 p-3 text-xs leading-5 text-rose-200">{error}</p>}
        <div className="grid gap-4">
          {groups.map((group) => (
            <div key={group.type}>
              <p className="mb-1.5 px-2 text-[10px] font-bold tracking-[0.16em] text-slate-600">{typeLabel[group.type]}</p>
              <div className="grid gap-0.5">
                {group.channels.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => onPickChannel(channel.id)}
                    className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${channel.id === activeChannelId ? 'bg-white/[0.07] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'}`}
                  >
                    <span className={`text-lg font-light ${channel.id === activeChannelId ? 'text-emerald-300' : 'text-slate-600 group-hover:text-slate-400'}`}>#</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{channel.name}</span>
                    {channel.id === activeChannelId && <span className="size-1.5 rounded-full bg-emerald-300" />}
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
