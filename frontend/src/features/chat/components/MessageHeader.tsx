import type { Channel } from '../../../types/chat';

interface MessageHeaderProps {
  channel: Channel | null;
}

export function MessageHeader({ channel }: MessageHeaderProps) {
  return (
    <header className="flex items-center gap-4 border-b border-white/[0.06] bg-[#101821]/90 px-5 backdrop-blur-xl max-sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-lg font-light text-emerald-300">#</div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-white">{channel?.name || '选择频道'}</h2>
          <p className="truncate text-xs text-slate-500 max-sm:hidden">{channel?.description || '选择一个频道开始协作'}</p>
        </div>
      </div>
    </header>
  );
}
