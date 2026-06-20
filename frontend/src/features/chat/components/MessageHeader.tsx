import type { Channel } from '../../../types/chat';

interface MessageHeaderProps {
  channel: Channel | null;
}

export function MessageHeader({ channel }: MessageHeaderProps) {
  return (
    <header className="flex items-center gap-4 border-b border-divider bg-content px-5 max-sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-hover text-lg font-light text-accent">#</div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-strong">{channel?.name || '选择频道'}</h2>
          <p className="truncate text-xs text-muted max-sm:hidden">{channel?.description || '选择一个频道开始协作'}</p>
        </div>
      </div>
    </header>
  );
}
