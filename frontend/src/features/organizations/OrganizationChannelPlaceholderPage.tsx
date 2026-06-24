import { useMemo } from 'react';
import { Icon } from '../../components/Icon';
import { findChannel, findOrganization } from './organizationMock';

function useRouteIdsFromPath() {
  return useMemo(() => {
    const match = window.location.pathname.match(/\/organizations\/([^/]+)\/channels\/([^/]+)/);
    return { organizationId: match?.[1], channelId: match?.[2] };
  }, []);
}

export function OrganizationChannelPlaceholderPage() {
  const { organizationId, channelId } = useRouteIdsFromPath();
  const organization = findOrganization(organizationId);
  const channel = findChannel(organizationId, channelId);

  return (
    <div className="grid h-screen min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-content">
      <header className="flex items-center justify-between border-b border-divider px-7 py-4">
        <div>
          <p className="text-xs text-muted">{organization.name} / <span className="font-semibold text-strong"># {channel.name}</span></p>
          <h1 className="mt-1 text-xl font-semibold text-strong">频道聊天占位</h1>
        </div>
        <a href={`/organizations/${organization.id}`} className="rounded-xl border border-divider px-4 py-2 text-xs font-semibold text-primary hover:bg-hover">回到组织主页</a>
      </header>

      <section className="grid place-items-center p-7">
        <article className="max-w-xl rounded-3xl border border-divider bg-card p-7 text-center shadow-card">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Icon className="size-6"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 9h8M8 13h5" /></Icon>
          </div>
          <h2 className="mt-5 text-lg font-semibold text-strong">下一步会把真实 ChatWorkspace 嵌进这里</h2>
          <p className="mt-3 text-sm leading-7 text-muted">Phase 2-A 先确认 URL 和头部语义：用户进入的是某个组织下的某个频道，而不是直接进入一个孤立频道。</p>
          <div className="mt-5 rounded-2xl bg-active px-4 py-3 text-left text-xs text-muted">
            <p><span className="font-semibold text-strong">Organization:</span> {organization.id}</p>
            <p className="mt-1"><span className="font-semibold text-strong">Channel:</span> {channel.id}</p>
          </div>
        </article>
      </section>

      <footer className="border-t border-divider p-4">
        <div className="rounded-2xl border border-divider bg-card px-4 py-3 text-sm text-faint">Message #{channel.name}</div>
      </footer>
    </div>
  );
}
