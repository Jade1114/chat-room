import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { fetchOrganization } from '../../lib/organizationApi';
import { ChatWorkspace } from '../chat/ChatWorkspace';
import { toOrganizationViewModel, type OrganizationViewModel, type OrganizationChannel } from './organizationViewModel';

function useRouteIdsFromPath() {
  return useMemo(() => {
    const match = window.location.pathname.match(/\/organizations\/([^/]+)\/channels\/([^/]+)/);
    return { organizationId: match?.[1] || 'org-public-square', channelId: match?.[2] || '' };
  }, []);
}

export function OrganizationChannelPage() {
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
        const selectedChannel = viewModel.channels.find((item) => item.id === channelId) || null;
        setOrganization(viewModel);
        setChannel(selectedChannel);
        if (!selectedChannel) {
          setError('这个组织下没有找到对应频道。');
        }
      })
      .catch(() => {
        if (!cancelled) setError('频道上下文加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [organizationId, channelId]);

  if (loading) {
    return (
      <main className="grid h-screen place-items-center bg-content p-7">
        <article className="max-w-xl rounded-3xl border border-divider bg-card p-7 text-center text-sm text-muted shadow-card">
          正在加载频道上下文...
        </article>
      </main>
    );
  }

  if (error || !organization || !channel) {
    return (
      <main className="grid h-screen place-items-center bg-content p-7">
        <article className="max-w-xl rounded-3xl border border-danger/30 bg-danger/10 p-7 text-center text-sm text-danger shadow-card">
          <p>{error || '频道上下文不可用'}</p>
          <Link
            to="/organizations/$organizationId"
            params={{ organizationId }}
            className="mt-5 inline-flex rounded-xl border border-danger/30 px-4 py-2 text-xs font-semibold text-danger hover:bg-danger/10"
          >
            回到组织主页
          </Link>
        </article>
      </main>
    );
  }

  return (
    <ChatWorkspace
      organizationContext={{
        activities: organization.activities,
        id: organization.id,
        memberCount: organization.memberCount,
        members: organization.members,
        name: organization.name
      }}
      organizationId={organization.id}
      initialChannelId={channel.id}
    />
  );
}
