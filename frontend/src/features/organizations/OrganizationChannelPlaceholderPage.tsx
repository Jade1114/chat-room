import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Icon } from '../../components/Icon';
import { fetchOrganization } from '../../lib/organizationApi';
import { toOrganizationViewModel, type OrganizationViewModel, type OrganizationChannel } from './organizationViewModel';

function useRouteIdsFromPath() {
  return useMemo(() => {
    const match = window.location.pathname.match(/\/organizations\/([^/]+)\/channels\/([^/]+)/);
    return { organizationId: match?.[1] || 'org-public-square', channelId: match?.[2] || '' };
  }, []);
}

export function OrganizationChannelPlaceholderPage() {
  const { organizationId, channelId } = useRouteIdsFromPath();
  const [organization, setOrganization] = useState<OrganizationViewModel | null>(null);
  const [channel, setChannel] = useState<OrganizationChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchOrganization(organizationId)
      .then((detail) => {
        if (cancelled) return;
        const viewModel = toOrganizationViewModel(detail);
        setOrganization(viewModel);
        setChannel(viewModel.channels.find((item) => item.id === channelId) || viewModel.channels[0] || null);
      })
      .catch(() => {
        if (!cancelled) setError('频道上下文加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [organizationId, channelId]);

  return (
    <div className="grid h-screen min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-content">
      <header className="flex items-center justify-between border-b border-divider px-7 py-4">
        <div>
          <p className="text-xs text-muted">{organization?.name || organizationId} / <span className="font-semibold text-strong"># {channel?.name || channelId}</span></p>
          <h1 className="mt-1 text-xl font-semibold text-strong">频道聊天占位</h1>
        </div>
        <Link to="/organizations/$organizationId" params={{ organizationId }} className="rounded-xl border border-divider px-4 py-2 text-xs font-semibold text-primary hover:bg-hover">回到组织主页</Link>
      </header>

      <section className="grid place-items-center p-7">
        {loading && <article className="max-w-xl rounded-3xl border border-divider bg-card p-7 text-center text-sm text-muted shadow-card">正在加载频道上下文...</article>}
        {!loading && error && <article className="max-w-xl rounded-3xl border border-danger/30 bg-danger/10 p-7 text-center text-sm text-danger shadow-card">{error}</article>}
        {!loading && !error && organization && channel && (
          <article className="max-w-xl rounded-3xl border border-divider bg-card p-7 text-center shadow-card">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
              <Icon className="size-6"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 9h8M8 13h5" /></Icon>
            </div>
            <h2 className="mt-5 text-lg font-semibold text-strong">下一步会把真实 ChatWorkspace 嵌进这里</h2>
            <p className="mt-3 text-sm leading-7 text-muted">现在频道页已经从真实 Organization API 加载组织/频道上下文。</p>
            <div className="mt-5 rounded-2xl bg-active px-4 py-3 text-left text-xs text-muted">
              <p><span className="font-semibold text-strong">Organization:</span> {organization.id}</p>
              <p className="mt-1"><span className="font-semibold text-strong">Channel:</span> {channel.id}</p>
            </div>
          </article>
        )}
      </section>

      <footer className="border-t border-divider p-4">
        <div className="rounded-2xl border border-divider bg-card px-4 py-3 text-sm text-faint">Message #{channel?.name || channelId}</div>
      </footer>
    </div>
  );
}
