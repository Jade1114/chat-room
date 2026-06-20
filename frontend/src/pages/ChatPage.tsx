import { useAtom, useAtomValue } from 'jotai';
import type { KeyboardEvent, ReactNode } from 'react';
import { useChatRoom } from '../hooks/useChatRoom';
import {
  activeChannelDetailAtom,
  canSendAtom,
  channelIdAtom,
  channelsAtom,
  currentUserAtom,
  draftAtom,
  isConnectedAtom,
  loadingChannelDetailAtom,
  loadingChannelsAtom,
  lobbyErrorAtom,
  statusAtom,
  timelineAtom
} from '../state/chatAtoms';
import type { ChannelType, UserRole } from '../types/chat';

const roleLabel: Record<UserRole, string> = {
  STUDENT: '学生',
  TEACHER: '教师',
  ADMIN: '管理员'
};

const typeLabel: Record<ChannelType, string> = {
  SCHOOL: '校园',
  DEPARTMENT: '院系',
  CLASS: '班级',
  COURSE: '课程'
};

const statusText = {
  idle: '离线',
  connecting: '连接中',
  connected: '实时在线'
} as const;

const deliveryText = {
  sending: '发送中',
  accepted: '已接收',
  delivered: '已送达',
  failed: '发送失败'
} as const;

function Icon({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function ChatPage() {
  const [draft, setDraft] = useAtom(draftAtom);
  const channelId = useAtomValue(channelIdAtom);
  const status = useAtomValue(statusAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const channels = useAtomValue(channelsAtom);
  const activeChannelDetail = useAtomValue(activeChannelDetailAtom);
  const loadingChannels = useAtomValue(loadingChannelsAtom);
  const loadingChannelDetail = useAtomValue(loadingChannelDetailAtom);
  const lobbyError = useAtomValue(lobbyErrorAtom);
  const timeline = useAtomValue(timelineAtom);
  const isConnected = useAtomValue(isConnectedAtom);
  const canSend = useAtomValue(canSendAtom);
  const { pickChannel, refreshLobby, sendChat } = useChatRoom();

  function handleSendKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  }

  const activeChannel = activeChannelDetail || channels.find((channel) => channel.id === channelId) || null;
  const onlineUsers = activeChannelDetail?.onlineUsers || [];
  const groupedChannels = (Object.keys(typeLabel) as ChannelType[]).map((type) => ({
    type,
    channels: channels.filter((channel) => channel.type === type)
  })).filter((group) => group.channels.length > 0);

  return (
    <main className="min-h-screen bg-[#080d13] text-[#e8edf2]">
      <div className="grid min-h-screen grid-cols-[64px_minmax(220px,272px)_minmax(0,1fr)] 2xl:grid-cols-[64px_272px_minmax(0,1fr)_292px] max-md:grid-cols-[56px_minmax(0,1fr)]">
        <aside className="flex min-h-screen flex-col items-center border-r border-white/[0.06] bg-[#090f16] px-2 py-4">
          <div className="grid size-10 place-items-center rounded-[14px] border border-emerald-200/20 bg-emerald-300 text-[#07120f] shadow-[0_8px_28px_rgba(52,211,153,0.14)]" title="星河大学">
            <Icon className="size-5"><path d="M3 21h18" /><path d="M6 21V9l6-4 6 4v12" /><path d="M9 21v-5h6v5" /><path d="M9 11h.01M15 11h.01" /></Icon>
          </div>

          <nav className="mt-7 flex flex-1 flex-col items-center gap-2" aria-label="主导航">
            <button type="button" disabled title="校园首页（即将开放）" className="group relative grid size-10 cursor-not-allowed place-items-center rounded-xl text-slate-600">
              <Icon className="size-[19px]"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></Icon>
            </button>
            <button type="button" title="消息频道" aria-current="page" className="group relative grid size-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300 transition hover:bg-emerald-300/15">
              <span className="absolute -left-2 h-5 w-0.5 rounded-r-full bg-emerald-300" />
              <Icon className="size-[19px]"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 9h8M8 13h5" /></Icon>
            </button>
            <button type="button" disabled title="课程空间（即将开放）" className="group relative grid size-10 cursor-not-allowed place-items-center rounded-xl text-slate-600">
              <Icon className="size-[19px]"><path d="m2 7 10-4 10 4-10 4Z" /><path d="M6 9.5V15c3 2 9 2 12 0V9.5" /><path d="M22 7v6" /></Icon>
            </button>
            <button type="button" disabled title="成员通讯录（即将开放）" className="group relative grid size-10 cursor-not-allowed place-items-center rounded-xl text-slate-600">
              <Icon className="size-[19px]"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Icon>
            </button>
          </nav>

          <button
            type="button"
            disabled
            title={currentUser ? `${currentUser.displayName} · ${roleLabel[currentUser.role]} · ${statusText[status]}` : '个人中心（即将开放）'}
            className="relative mb-1 grid size-10 cursor-not-allowed place-items-center rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
          >
            {currentUser?.displayName.slice(0, 1).toUpperCase() || '?'}
            <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#090f16] ${isConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          </button>
        </aside>

        <aside className="flex min-h-screen flex-col border-r border-white/[0.06] bg-[#0e151e] max-md:hidden">
          <section className="border-b border-white/[0.06] p-3">
            <div className="flex items-center gap-2">
              <h1 className="mr-auto shrink-0 text-sm font-semibold tracking-tight text-white">星河大学</h1>
              <button type="button" onClick={refreshLobby} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white" title="刷新频道">
                <Icon className="size-4"><path d="M20 6v5h-5" /><path d="M4 18v-5h5" /><path d="M18.5 9a7 7 0 0 0-11.7-2.6L4 9m16 6-2.8 2.6A7 7 0 0 1 5.5 15" /></Icon>
              </button>
            </div>
          </section>

          <section className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">我的频道</h2>
              {loadingChannels && <span className="text-[11px] text-slate-600">同步中</span>}
            </div>
            {lobbyError && <p className="mb-3 rounded-xl border border-rose-400/10 bg-rose-400/5 p-3 text-xs leading-5 text-rose-200">{lobbyError}</p>}
            <div className="grid gap-4">
              {groupedChannels.map((group) => (
                <div key={group.type}>
                  <p className="mb-1.5 px-2 text-[10px] font-bold tracking-[0.16em] text-slate-600">{typeLabel[group.type]}</p>
                  <div className="grid gap-0.5">
                    {group.channels.map((channel) => (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => pickChannel(channel.id)}
                        className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${channel.id === channelId ? 'bg-white/[0.07] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'}`}
                      >
                        <span className={`text-lg font-light ${channel.id === channelId ? 'text-emerald-300' : 'text-slate-600 group-hover:text-slate-400'}`}>#</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{channel.name}</span>
                        {channel.id === channelId && <span className="size-1.5 rounded-full bg-emerald-300" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </aside>

        <section className="grid min-h-screen min-w-0 grid-rows-[64px_minmax(0,1fr)_auto] bg-[#101821]">
          <header className="flex items-center gap-4 border-b border-white/[0.06] bg-[#101821]/90 px-5 backdrop-blur-xl max-sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-lg font-light text-emerald-300">#</div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-white">{activeChannel?.name || '选择频道'}</h2>
                <p className="truncate text-xs text-slate-500 max-sm:hidden">{activeChannel?.description || '选择一个频道开始协作'}</p>
              </div>
            </div>
          </header>

          <div className="min-h-0 overflow-y-auto px-5 py-6 max-sm:px-3">
            {timeline.length === 0 && (
              <div className="flex h-full min-h-80 items-center justify-center">
                <div className="max-w-sm text-center">
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.06] text-xl font-light text-emerald-300">#</div>
                  <p className="mt-4 text-base font-semibold text-slate-100">{activeChannel ? `欢迎来到 ${activeChannel.name}` : '选择一个频道'}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{activeChannel?.description || '从左侧频道列表进入你的校园空间。'}</p>
                  {activeChannel && !isConnected && <p className="mt-4 text-xs text-slate-600">正在接入实时消息...</p>}
                </div>
              </div>
            )}

            <div className="mx-auto grid max-w-4xl gap-1">
              {timeline.map((item) => item.role === 'system' ? (
                <div key={item.id} className="my-3 flex items-center gap-3 text-[11px] text-slate-600"><span className="h-px flex-1 bg-white/[0.05]" /><span>{item.text} · {item.time}</span><span className="h-px flex-1 bg-white/[0.05]" /></div>
              ) : (
                <article key={item.id} className={`group flex gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[0.025] ${item.role === 'me' ? 'bg-emerald-300/[0.025]' : ''}`}>
                  <div className={`grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${item.role === 'me' ? 'bg-emerald-300 text-[#07120f]' : 'bg-sky-300/10 text-sky-300'}`}>{(item.sender || '匿').slice(0, 1).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-semibold ${item.role === 'me' ? 'text-emerald-200' : 'text-slate-200'}`}>{item.sender || '匿名用户'}</span>
                      <span className="text-[10px] text-slate-600">{item.time}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{item.text}</p>
                    {item.role === 'me' && item.deliveryStatus && <p className={`mt-1 text-[10px] ${item.deliveryStatus === 'failed' ? 'text-rose-300' : 'text-slate-600'}`}>{deliveryText[item.deliveryStatus]}</p>}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <footer className="px-5 pb-5 pt-2 max-sm:px-3 max-sm:pb-3">
            <div className="mx-auto max-w-4xl rounded-2xl border border-white/[0.08] bg-[#0b121a] p-2 shadow-[0_16px_48px_rgba(0,0,0,0.22)] transition focus-within:border-emerald-300/30">
              <textarea
                value={draft}
                maxLength={100}
                disabled={!isConnected}
                onKeyDown={handleSendKeyDown}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={isConnected ? `发送消息到 #${activeChannel?.name || channelId}` : '正在连接频道...'}
                className="min-h-16 w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="flex items-center justify-between border-t border-white/[0.05] px-2 pt-2">
                <span className="text-[10px] text-slate-600">Enter 发送 · Shift + Enter 换行</span>
                <button type="button" disabled={!canSend} onClick={sendChat} className="flex h-8 items-center gap-2 rounded-lg bg-emerald-300 px-3 text-xs font-bold text-[#07120f] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-30">
                  发送
                  <Icon className="size-3.5"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Icon>
                </button>
              </div>
            </div>
          </footer>
        </section>

        <aside className="hidden min-h-screen border-l border-white/[0.06] bg-[#0e151e] px-4 py-5 2xl:block">
          <section>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">在线成员</p>
              <span className="text-xs font-semibold text-emerald-300/70">{activeChannelDetail?.onlineCount ?? 0}</span>
            </div>
            <div className="mt-3 grid gap-1">
              {loadingChannelDetail && <p className="rounded-xl bg-white/[0.025] p-3 text-xs text-slate-600">正在加载成员...</p>}
              {!loadingChannelDetail && onlineUsers.length === 0 && <p className="rounded-xl bg-white/[0.025] p-3 text-xs text-slate-600">还没有成员在线</p>}
              {onlineUsers.map((name, index) => (
                <div key={name} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.035]">
                  <div className={`relative grid size-8 place-items-center rounded-lg text-xs font-bold ${index % 2 ? 'bg-violet-300/10 text-violet-300' : 'bg-sky-300/10 text-sky-300'}`}>
                    {name.slice(0, 1).toUpperCase()}<span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-[#0e151e] bg-emerald-400" />
                  </div>
                  <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-300">{name}</p><p className="mt-0.5 text-[10px] text-slate-600">在线</p></div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
