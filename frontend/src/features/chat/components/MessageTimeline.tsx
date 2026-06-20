import type { Channel, DeliveryStatus, TimelineItem } from '../../../types/chat';

const deliveryText: Record<DeliveryStatus, string> = {
  sending: '发送中',
  accepted: '已接收',
  delivered: '已送达',
  failed: '发送失败'
};

interface MessageTimelineProps {
  channel: Channel | null;
  connected: boolean;
  items: TimelineItem[];
}

export function MessageTimeline({ channel, connected, items }: MessageTimelineProps) {
  return (
    <div className="min-h-0 overflow-y-auto px-5 py-6 max-sm:px-3">
      {items.length === 0 && (
        <div className="flex h-full min-h-80 items-center justify-center">
          <div className="max-w-sm text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.06] text-xl font-light text-emerald-300">#</div>
            <p className="mt-4 text-base font-semibold text-slate-100">{channel ? `欢迎来到 ${channel.name}` : '选择一个频道'}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{channel?.description || '从左侧频道列表进入你的校园空间。'}</p>
            {channel && !connected && <p className="mt-4 text-xs text-slate-600">正在接入实时消息...</p>}
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-4xl gap-1">
        {items.map((item) => item.role === 'system' ? (
          <div key={item.id} className="my-3 flex items-center gap-3 text-[11px] text-slate-600">
            <span className="h-px flex-1 bg-white/[0.05]" />
            <span>{item.text} · {item.time}</span>
            <span className="h-px flex-1 bg-white/[0.05]" />
          </div>
        ) : (
          <article key={item.id} className={`group flex gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[0.025] ${item.role === 'me' ? 'bg-emerald-300/[0.025]' : ''}`}>
            <div className={`grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold ${item.role === 'me' ? 'bg-emerald-300 text-[#07120f]' : 'bg-sky-300/10 text-sky-300'}`}>
              {(item.sender || '匿').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-sm font-semibold ${item.role === 'me' ? 'text-emerald-200' : 'text-slate-200'}`}>{item.sender || '匿名用户'}</span>
                <span className="text-[10px] text-slate-600">{item.time}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{item.text}</p>
              {item.role === 'me' && item.deliveryStatus && (
                <p className={`mt-1 text-[10px] ${item.deliveryStatus === 'failed' ? 'text-rose-300' : 'text-slate-600'}`}>{deliveryText[item.deliveryStatus]}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
