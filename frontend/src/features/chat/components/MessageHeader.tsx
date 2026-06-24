import type { Channel } from '../../../types/chat';
import { Icon } from '../../../components/Icon';

interface MessageHeaderProps {
  channel: Channel | null;
  onlineCount: number;
  organizationName?: string;
  onToggleMembers?: () => void;
}

export function MessageHeader({ channel, onlineCount, organizationName, onToggleMembers }: MessageHeaderProps) {
  return (
    <header className="flex items-center gap-4 border-b border-divider bg-content px-5 max-sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-hover text-lg font-light text-accent">#</div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-strong">
            {organizationName ? `${organizationName} / # ${channel?.name || '选择频道'}` : channel?.name || '选择频道'}
          </h2>
          <p className="truncate text-xs text-muted max-sm:hidden">{channel?.description || '选择一个频道开始协作'}</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-3">
        {onToggleMembers && (
          <button
            type="button"
            onClick={onToggleMembers}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-muted transition hover:bg-hover hover:text-primary 2xl:hidden"
            title="在线成员"
          >
            <Icon className="size-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>
            <span className="text-xs font-semibold text-accent-strong">{onlineCount}</span>
          </button>
        )}
      </div>
    </header>
  );
}
