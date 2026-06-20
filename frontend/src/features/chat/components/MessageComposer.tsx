import type { KeyboardEvent } from 'react';
import { Icon } from '../../../components/Icon';

interface MessageComposerProps {
  canSend: boolean;
  channelName: string;
  connected: boolean;
  draft: string;
  onDraftChange: (draft: string) => void;
  onSend: () => void;
}

export function MessageComposer({ canSend, channelName, connected, draft, onDraftChange, onSend }: MessageComposerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <footer className="px-5 pb-5 pt-2 max-sm:px-3 max-sm:pb-3">
      <div className="mx-auto max-w-4xl rounded-2xl border border-white/[0.08] bg-[#0b121a] p-2 shadow-[0_16px_48px_rgba(0,0,0,0.22)] transition focus-within:border-emerald-300/30">
        <textarea
          value={draft}
          maxLength={100}
          disabled={!connected}
          onKeyDown={handleKeyDown}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder={connected ? `发送消息到 #${channelName}` : '正在连接频道...'}
          className="min-h-16 w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex items-center justify-between border-t border-white/[0.05] px-2 pt-2">
          <span className="text-[10px] text-slate-600">Enter 发送 · Shift + Enter 换行</span>
          <button type="button" disabled={!canSend} onClick={onSend} className="flex h-8 items-center gap-2 rounded-lg bg-emerald-300 px-3 text-xs font-bold text-[#07120f] transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-30">
            发送
            <Icon className="size-3.5"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Icon>
          </button>
        </div>
      </div>
    </footer>
  );
}
