import { useAtom, useAtomValue } from 'jotai';
import type { KeyboardEvent } from 'react';
import { useChatRoom } from '../hooks/useChatRoom';
import {
  activeRoomDetailAtom,
  canConnectAtom,
  canSendAtom,
  draftAtom,
  isConnectedAtom,
  loadingDetailAtom,
  loadingRoomsAtom,
  roomIdAtom,
  roomsAtom,
  selectedRoomAtom,
  statusAtom,
  timelineAtom,
  usernameAtom
} from '../state/chatAtoms';

const statusText = {
  idle: '未连接',
  connecting: '连接中',
  connected: '已连接'
} as const;

export function ChatPage() {
  const [username, setUsername] = useAtom(usernameAtom);
  const [roomId, setRoomId] = useAtom(roomIdAtom);
  const [draft, setDraft] = useAtom(draftAtom);
  const status = useAtomValue(statusAtom);
  const rooms = useAtomValue(roomsAtom);
  const activeRoomDetail = useAtomValue(activeRoomDetailAtom);
  const loadingRooms = useAtomValue(loadingRoomsAtom);
  const loadingDetail = useAtomValue(loadingDetailAtom);
  const timeline = useAtomValue(timelineAtom);
  const isConnected = useAtomValue(isConnectedAtom);
  const canConnect = useAtomValue(canConnectAtom);
  const canSend = useAtomValue(canSendAtom);
  const selectedRoom = useAtomValue(selectedRoomAtom);
  const { connect, disconnect, pickRoom, refreshLobby, refreshRoomDetail, sendChat } = useChatRoom();

  function handleSendKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(45,212,191,0.24),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(249,115,22,0.22),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_52%,#111827_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-200">React · Jotai · TanStack Router</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Room Chat</h1>
            <p className="mt-2 text-sm text-slate-300">WebSocket 实时聊天，房间状态通过 REST 接口刷新。</p>
          </div>
          <div className={`inline-flex w-fit items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold ${status === 'connected' ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100' : status === 'connecting' ? 'border-amber-300/40 bg-amber-400/15 text-amber-100' : 'border-slate-300/20 bg-slate-900/50 text-slate-300'}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${status === 'connected' ? 'bg-emerald-300' : status === 'connecting' ? 'bg-amber-300' : 'bg-slate-500'}`} />
            {statusText[status]}
          </div>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="grid content-start gap-4">
            <section className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-xl shadow-black/10 backdrop-blur">
              <h2 className="text-lg font-bold text-white">连接信息</h2>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-slate-300">
                  昵称
                  <input
                    value={username}
                    maxLength={20}
                    disabled={isConnected}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="例如：yuy"
                    className="h-11 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-teal-300/70 focus:ring-4 focus:ring-teal-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-300">
                  房间号
                  <input
                    value={roomId}
                    maxLength={20}
                    disabled={isConnected}
                    onBlur={() => refreshRoomDetail(roomId.trim())}
                    onChange={(event) => setRoomId(event.target.value)}
                    placeholder="例如：room-1"
                    className="h-11 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-teal-300/70 focus:ring-4 focus:ring-teal-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!canConnect}
                  onClick={connect}
                  className="h-11 rounded-2xl bg-orange-500 px-4 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  连接
                </button>
                <button
                  type="button"
                  disabled={!isConnected}
                  onClick={disconnect}
                  className="h-11 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-bold text-slate-100 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  断开
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-xl shadow-black/10 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white">房间大厅</h2>
                <button type="button" onClick={refreshLobby} className="rounded-full bg-teal-300 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-teal-200">
                  刷新
                </button>
              </div>
              <div className="mt-4 grid gap-2">
                {loadingRooms && <p className="rounded-2xl bg-slate-950/40 p-3 text-sm text-slate-400">正在加载房间...</p>}
                {!loadingRooms && rooms.length === 0 && <p className="rounded-2xl bg-slate-950/40 p-3 text-sm text-slate-400">当前没有在线房间</p>}
                {!loadingRooms &&
                  rooms.map((room) => (
                    <button
                      key={room.roomId}
                      type="button"
                      disabled={isConnected}
                      onClick={() => pickRoom(room.roomId)}
                      className={`flex h-12 items-center justify-between rounded-2xl border px-4 text-left transition disabled:cursor-not-allowed ${room.roomId === selectedRoom ? 'border-teal-300/60 bg-teal-300/15 text-teal-50' : 'border-white/10 bg-slate-950/40 text-slate-200 hover:bg-white/10'}`}
                    >
                      <span className="text-sm font-semibold"># {room.roomId}</span>
                      <strong className="text-xs text-slate-300">{room.onlineCount} 人</strong>
                    </button>
                  ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-xl shadow-black/10 backdrop-blur">
              <h2 className="text-lg font-bold text-white">房间详情</h2>
              {loadingDetail && <p className="mt-4 rounded-2xl bg-slate-950/40 p-3 text-sm text-slate-400">正在获取详情...</p>}
              {!loadingDetail && !activeRoomDetail && <p className="mt-4 rounded-2xl bg-slate-950/40 p-3 text-sm text-slate-400">暂无详情（可先选择房间）</p>}
              {!loadingDetail && activeRoomDetail && (
                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-slate-950/40 p-4">
                    <p className="text-sm text-slate-400">当前房间</p>
                    <p className="mt-1 font-bold text-white"># {activeRoomDetail.roomId}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/40 p-4">
                    <p className="text-sm text-slate-400">在线人数</p>
                    <p className="mt-1 text-2xl font-black text-teal-200">{activeRoomDetail.onlineCount}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeRoomDetail.usernames.map((name) => (
                      <span key={name} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </aside>

          <section className="grid min-h-[560px] grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.08] shadow-2xl shadow-black/20 backdrop-blur">
            <div className="overflow-y-auto p-5">
              {timeline.length === 0 && (
                <div className="flex h-full min-h-80 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-slate-950/30 p-8 text-center">
                  <div>
                    <p className="text-5xl">💬</p>
                    <p className="mt-4 text-lg font-bold text-white">还没有消息</p>
                    <p className="mt-2 text-sm text-slate-400">先进入一个房间，然后聊起来吧。</p>
                  </div>
                </div>
              )}
              <div className="grid gap-3">
                {timeline.map((item) => (
                  <article key={item.id} className={`max-w-[78%] rounded-3xl border px-4 py-3 ${item.role === 'me' ? 'ml-auto border-orange-300/30 bg-orange-400/15' : item.role === 'system' ? 'mx-auto max-w-full border-white/10 bg-slate-900/70 text-center' : 'border-teal-300/20 bg-teal-300/10'}`}>
                    <div className="mb-1 flex items-center justify-between gap-4 text-xs text-slate-400">
                      <span className="font-bold text-slate-200">{item.role === 'system' ? '系统' : item.sender}</span>
                      <span>{item.time}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>

            <footer className="grid gap-3 border-t border-white/10 bg-slate-950/40 p-4 sm:grid-cols-[minmax(0,1fr)_112px]">
              <textarea
                value={draft}
                maxLength={100}
                disabled={!isConnected}
                onKeyDown={handleSendKeyDown}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="输入消息，按 Enter 发送，Shift + Enter 换行"
                className="min-h-24 resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-300/70 focus:ring-4 focus:ring-orange-300/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                disabled={!canSend}
                onClick={sendChat}
                className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                发送
              </button>
            </footer>
          </section>
        </section>
      </div>
    </main>
  );
}
