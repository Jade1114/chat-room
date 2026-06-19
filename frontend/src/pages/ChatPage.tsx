import { useAtom, useAtomValue } from 'jotai';
import type { KeyboardEvent } from 'react';
import { useChatRoom } from '../hooks/useChatRoom';
import {
  activeChannelDetailAtom,
  canConnectAtom,
  canSendAtom,
  channelIdAtom,
  channelsAtom,
  currentUserAtom,
  draftAtom,
  isConnectedAtom,
  loadingChannelDetailAtom,
  loadingChannelsAtom,
  loadingUsersAtom,
  lobbyErrorAtom,
  mockUsersAtom,
  selectedUserIdAtom,
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
  SCHOOL: '全校',
  DEPARTMENT: '院系',
  CLASS: '班级',
  COURSE: '课程'
};

const typeMark: Record<ChannelType, string> = {
  SCHOOL: 'S',
  DEPARTMENT: 'D',
  CLASS: 'C',
  COURSE: 'K'
};

const statusText = {
  idle: '未连接',
  connecting: '连接中',
  connected: '已连接'
} as const;

const deliveryText = {
  sending: '发送中',
  accepted: '已接收',
  delivered: '已送达',
  failed: '失败'
} as const;

export function ChatPage() {
  const [draft, setDraft] = useAtom(draftAtom);
  const [selectedUserId, setSelectedUserId] = useAtom(selectedUserIdAtom);
  const channelId = useAtomValue(channelIdAtom);
  const status = useAtomValue(statusAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const mockUsers = useAtomValue(mockUsersAtom);
  const channels = useAtomValue(channelsAtom);
  const activeChannelDetail = useAtomValue(activeChannelDetailAtom);
  const loadingUsers = useAtomValue(loadingUsersAtom);
  const loadingChannels = useAtomValue(loadingChannelsAtom);
  const loadingChannelDetail = useAtomValue(loadingChannelDetailAtom);
  const lobbyError = useAtomValue(lobbyErrorAtom);
  const timeline = useAtomValue(timelineAtom);
  const isConnected = useAtomValue(isConnectedAtom);
  const canConnect = useAtomValue(canConnectAtom);
  const canSend = useAtomValue(canSendAtom);
  const { connect, disconnect, pickChannel, refreshLobby, sendChat, switchUser } = useChatRoom();

  function handleSendKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  }

  function handleUserChange(nextUserId: string) {
    setSelectedUserId(nextUserId);
    switchUser(nextUserId);
  }

  const activeChannel = activeChannelDetail || channels.find((channel) => channel.id === channelId) || null;
  const onlineUsers = activeChannelDetail?.onlineUsers || [];

  return (
    <main className="min-h-screen bg-[#101318] text-[#eef2f4]">
      <div className="grid min-h-screen grid-cols-[76px_minmax(240px,300px)_minmax(0,1fr)] xl:grid-cols-[76px_300px_minmax(0,1fr)_320px]">
        <aside className="flex flex-col items-center gap-3 border-r border-white/8 bg-[#161a20] px-3 py-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-[#6ee7b7] text-lg font-black text-[#0f1720]">
            CR
          </div>
          <div className="h-px w-10 bg-white/10" />
          {channels.slice(0, 7).map((channel) => (
            <button
              key={channel.id}
              type="button"
              title={channel.name}
              disabled={isConnected}
              onClick={() => pickChannel(channel.id)}
              className={`grid size-12 place-items-center rounded-2xl text-sm font-black transition ${
                channel.id === channelId
                  ? 'bg-[#f59e0b] text-[#18120a]'
                  : 'bg-[#232832] text-[#b8c2cc] hover:bg-[#2f3745] hover:text-white'
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              {typeMark[channel.type]}
            </button>
          ))}
        </aside>

        <aside className="flex min-h-screen flex-col border-r border-white/8 bg-[#1c2129]">
          <section className="border-b border-white/8 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ea0b3]">Campus</p>
                <h1 className="mt-1 text-xl font-black tracking-normal text-white">星河大学</h1>
              </div>
              <button
                type="button"
                onClick={refreshLobby}
                className="grid size-9 place-items-center rounded-lg bg-[#2b3442] text-sm font-black text-[#c9d4df] transition hover:bg-[#3a4657]"
                title="刷新"
              >
                R
              </button>
            </div>

            <label className="grid gap-2 text-xs font-bold text-[#97a6b7]">
              当前身份
              <select
                value={selectedUserId}
                disabled={loadingUsers || isConnected}
                onChange={(event) => handleUserChange(event.target.value)}
                className="h-11 rounded-lg border border-white/10 bg-[#11161d] px-3 text-sm font-semibold text-white outline-none transition focus:border-[#6ee7b7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mockUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName} / {roleLabel[user.role]}
                  </option>
                ))}
              </select>
            </label>

            {currentUser && (
              <div className="mt-3 rounded-lg bg-[#11161d] p-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-[#6ee7b7] text-sm font-black text-[#0f1720]">
                    {currentUser.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{currentUser.displayName}</p>
                    <p className="text-xs text-[#93a4b7]">{roleLabel[currentUser.role]}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase tracking-[0.16em] text-[#8696a8]">频道</h2>
              {loadingChannels && <span className="text-xs text-[#8696a8]">加载中</span>}
            </div>

            {lobbyError && <p className="mb-2 rounded-lg bg-[#3a1f25] p-3 text-sm text-[#fecdd3]">{lobbyError}</p>}

            <div className="grid gap-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  disabled={isConnected}
                  onClick={() => pickChannel(channel.id)}
                  className={`group grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-2 py-2 text-left transition ${
                    channel.id === channelId
                      ? 'bg-[#374151] text-white'
                      : 'text-[#aeb9c5] hover:bg-[#2a313d] hover:text-white'
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  <span className="text-center text-base font-black text-[#7dd3fc]">#</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{channel.name}</span>
                    <span className="block truncate text-xs text-[#7f8da0]">{channel.description}</span>
                  </span>
                  <span className="rounded-md bg-black/20 px-1.5 py-1 text-[10px] font-black text-[#b6c3d1]">
                    {typeLabel[channel.type]}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="border-t border-white/8 p-3">
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
              status === 'connected' ? 'bg-[#10352e] text-[#bbf7d0]' : status === 'connecting' ? 'bg-[#3b2d13] text-[#fde68a]' : 'bg-[#11161d] text-[#aeb9c5]'
            }`}>
              <span className={`size-2 rounded-full ${status === 'connected' ? 'bg-[#34d399]' : status === 'connecting' ? 'bg-[#facc15]' : 'bg-[#64748b]'}`} />
              <span className="text-sm font-bold">{statusText[status]}</span>
            </div>
          </section>
        </aside>

        <section className="grid min-h-screen min-w-0 grid-rows-[64px_minmax(0,1fr)_auto] bg-[#202632]">
          <header className="flex items-center justify-between gap-4 border-b border-white/8 px-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#7dd3fc]">#</span>
                <h2 className="truncate text-lg font-black text-white">{activeChannel?.name || '选择频道'}</h2>
              </div>
              <p className="truncate text-xs text-[#94a3b8]">{activeChannel?.description || '请选择一个可访问频道'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={!canConnect}
                onClick={connect}
                className="h-9 rounded-lg bg-[#6ee7b7] px-4 text-sm font-black text-[#0f1720] transition hover:bg-[#86efac] disabled:cursor-not-allowed disabled:opacity-50"
              >
                连接
              </button>
              <button
                type="button"
                disabled={!isConnected}
                onClick={disconnect}
                className="h-9 rounded-lg bg-[#374151] px-4 text-sm font-black text-white transition hover:bg-[#4b5563] disabled:cursor-not-allowed disabled:opacity-50"
              >
                断开
              </button>
            </div>
          </header>

          <div className="min-h-0 overflow-y-auto px-5 py-4">
            {timeline.length === 0 && (
              <div className="flex h-full min-h-80 items-center justify-center">
                <div className="max-w-sm text-center">
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#2f3846] text-2xl font-black text-[#7dd3fc]">#</div>
                  <p className="mt-4 text-lg font-black text-white">{activeChannel ? activeChannel.name : '还没有选择频道'}</p>
                  <p className="mt-2 text-sm leading-6 text-[#98a6b5]">{activeChannel?.description || '从左侧频道列表进入一个空间。'}</p>
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {timeline.map((item) => (
                <article
                  key={item.id}
                  className={`grid gap-1 rounded-lg px-3 py-2 ${
                    item.role === 'me'
                      ? 'ml-auto w-fit max-w-[82%] bg-[#f59e0b] text-[#18120a]'
                      : item.role === 'system'
                        ? 'mx-auto w-fit max-w-[90%] bg-[#2c3441] text-[#c8d2dd]'
                        : 'mr-auto w-fit max-w-[82%] bg-[#2a3340] text-[#eef2f4]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="font-black">{item.role === 'system' ? '系统' : item.sender}</span>
                    <span className={item.role === 'me' ? 'text-[#5c3b05]' : 'text-[#8b9aad]'}>{item.time}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">{item.text}</p>
                  {item.role === 'me' && item.deliveryStatus && (
                    <div className="flex justify-end text-[11px] font-bold text-[#6d4608]">
                      {deliveryText[item.deliveryStatus]}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>

          <footer className="border-t border-white/8 bg-[#1b2029] p-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_96px]">
              <textarea
                value={draft}
                maxLength={100}
                disabled={!isConnected}
                onKeyDown={handleSendKeyDown}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={isConnected ? `发送到 #${activeChannel?.name || channelId}` : '连接频道后开始聊天'}
                className="min-h-20 resize-none rounded-lg border border-white/10 bg-[#11161d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6f7d8e] focus:border-[#f59e0b] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                disabled={!canSend}
                onClick={sendChat}
                className="rounded-lg bg-[#f59e0b] px-5 py-3 text-sm font-black text-[#18120a] transition hover:bg-[#fbbf24] disabled:cursor-not-allowed disabled:opacity-50"
              >
                发送
              </button>
            </div>
          </footer>
        </section>

        <aside className="hidden min-h-screen border-l border-white/8 bg-[#1c2129] p-4 xl:block">
          <section>
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#8ea0b3]">频道资料</h2>
            <div className="mt-3 rounded-lg bg-[#11161d] p-4">
              {loadingChannelDetail && <p className="text-sm text-[#94a3b8]">加载中</p>}
              {!loadingChannelDetail && activeChannel && (
                <div className="grid gap-3">
                  <div>
                    <p className="text-xs text-[#8796a8]">名称</p>
                    <p className="mt-1 text-base font-black text-white">{activeChannel.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8796a8]">类型</p>
                    <p className="mt-1 text-sm font-bold text-[#7dd3fc]">{typeLabel[activeChannel.type]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#8796a8]">Scope</p>
                    <p className="mt-1 break-all text-sm font-bold text-[#d3dce6]">{activeChannel.scopeId}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-[#8ea0b3]">在线成员</h2>
              <span className="rounded-md bg-[#2f3846] px-2 py-1 text-xs font-black text-[#d3dce6]">
                {activeChannelDetail?.onlineCount ?? 0}
              </span>
            </div>

            <div className="mt-3 grid gap-2">
              {onlineUsers.length === 0 && <p className="rounded-lg bg-[#11161d] p-3 text-sm text-[#94a3b8]">暂无在线成员</p>}
              {onlineUsers.map((name) => (
                <div key={name} className="flex items-center gap-3 rounded-lg bg-[#11161d] p-3">
                  <div className="grid size-9 place-items-center rounded-lg bg-[#2f3846] text-sm font-black text-[#7dd3fc]">
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{name}</p>
                    <p className="text-xs text-[#7d8da0]">online</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
