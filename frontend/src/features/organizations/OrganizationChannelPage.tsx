import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { fetchOrganization } from '../../lib/organizationApi';
import { useOrganizations } from '../../hooks/useOrganizations';
import { ChatWorkspace } from '../chat/ChatWorkspace';
import { toOrganizationViewModel, type OrganizationViewModel, type OrganizationChannel } from './organizationViewModel';

export function OrganizationChannelPage() {
  const { organizationId, channelId } = useParams({ from: '/organizations/$organizationId/channels/$channelId' });
  const { joinAndRefreshOrganization } = useOrganizations();
  const [organization, setOrganization] = useState<OrganizationViewModel | null>(null);
  const [channel, setChannel] = useState<OrganizationChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

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

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      const detail = await joinAndRefreshOrganization(organizationId);
      const viewModel = toOrganizationViewModel(detail);
      setOrganization(viewModel);
      setChannel(viewModel.channels.find((item) => item.id === channelId) || null);
    } catch {
      setError('加入组织失败');
    } finally {
      setJoining(false);
    }
  };

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

  if (!organization.joined) {
    return (
      <main className="grid h-screen place-items-center bg-content p-7">
        <article className="max-w-xl rounded-3xl border border-divider bg-card p-7 text-center text-sm text-muted shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-strong">Membership required</p>
          <h1 className="mt-2 text-xl font-semibold text-strong">加入组织后才能进入频道</h1>
          <p className="mt-3 leading-6">
            你正在查看 <span className="font-semibold text-strong">{organization.name}</span> 的公开频道信息。
            频道聊天属于组织成员权限；加入前可以回到组织主页查看公开活动和成员人数。
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining}
              className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-on-accent disabled:opacity-60"
            >
              {joining ? '加入中...' : '加入组织并进入频道'}
            </button>
            <Link
              to="/organizations/$organizationId"
              params={{ organizationId }}
              className="rounded-xl border border-divider px-4 py-2 text-xs font-semibold text-primary hover:bg-hover"
            >
              回到组织主页
            </Link>
          </div>
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
