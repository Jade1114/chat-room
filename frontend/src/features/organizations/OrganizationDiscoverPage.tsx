import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Icon } from '../../components/Icon';
import type { OrganizationSummaryResponse } from '../../lib/organizationApi';
import { useOrganizations } from '../../hooks/useOrganizations';
import { organizationColor, organizationMark } from './organizationViewModel';
import { LegacyOrganizationBanner } from './LegacyOrganizationBanner';

function OrganizationCard({
  organization,
  joining,
  onJoin
}: {
  organization: OrganizationSummaryResponse;
  joining: boolean;
  onJoin: (organizationId: string) => void;
}) {
  const colors = organizationColor(organization.id);
  const mark = organizationMark(organization.name);

  return (
    <article className="group rounded-[28px] border border-divider bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-accent-soft hover:shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${colors} text-base font-bold text-white shadow-composer`}>
            {mark}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-strong">{organization.name}</h2>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
              {organization.visibility} · {organization.joinPolicy}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${organization.joined ? 'bg-accent-soft text-accent-strong' : 'bg-active text-muted'}`}>
          {organization.joined ? '已加入' : '可加入'}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted">
        {organization.description || '这个组织还没有填写简介。'}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="rounded-full bg-active px-2.5 py-1">{organization.memberCount} members</span>
        {organization.defaultChannelId && <span className="rounded-full bg-active px-2.5 py-1">default channel</span>}
      </div>

      <div className="mt-5 flex gap-2">
        <Link
          to="/organizations/$organizationId"
          params={{ organizationId: organization.id }}
          className="flex-1 rounded-xl border border-divider px-4 py-2.5 text-center text-xs font-semibold text-primary transition hover:bg-hover"
        >
          查看主页
        </Link>
        {organization.joined ? (
          <Link
            to="/organizations/$organizationId"
            params={{ organizationId: organization.id }}
            className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-center text-xs font-semibold text-on-accent transition hover:opacity-90"
          >
            进入组织
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onJoin(organization.id)}
            disabled={joining}
            className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {joining ? '加入中...' : '加入组织'}
          </button>
        )}
      </div>
    </article>
  );
}

export function OrganizationDiscoverPage() {
  const {
    publicOrganizations: organizations,
    loading,
    error: loadError,
    joinAndRefreshOrganization
  } = useOrganizations();
  const [actionError, setActionError] = useState('');
  const [joiningId, setJoiningId] = useState('');

  const error = actionError || loadError;

  const handleJoin = async (organizationId: string) => {
    setJoiningId(organizationId);
    setActionError('');
    try {
      await joinAndRefreshOrganization(organizationId);
    } catch {
      setActionError('加入组织失败');
    } finally {
      setJoiningId('');
    }
  };

  return (
    <main className="grid h-screen min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-content">
      <header className="border-b border-divider bg-content px-7 py-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-strong">Organization Discovery</p>
            <h1 className="mt-2 text-2xl font-semibold text-strong">组织发现中心</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              这里展示平台上所有公开组织。Public Square 只是其中一个组织，不再等同于发现中心本身。
            </p>
          </div>
          <button type="button" className="rounded-xl border border-divider px-4 py-2.5 text-xs font-semibold text-primary hover:bg-hover">
            创建组织
          </button>
        </div>
      </header>

      <section className="min-h-0 overflow-y-auto p-7 max-sm:p-4">
        <div className="mb-5"><LegacyOrganizationBanner /></div>
        {error && (
          <div className="mb-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-divider bg-card p-7 text-sm text-muted">正在加载公开组织...</div>
        )}

        {!loading && organizations.length === 0 && !error && (
          <div className="rounded-3xl border border-divider bg-card p-7 text-sm text-muted">暂无公开组织。</div>
        )}

        {!loading && organizations.length > 0 && (
          <div className="grid grid-cols-3 gap-5 max-2xl:grid-cols-2 max-lg:grid-cols-1">
            {organizations.map((organization) => (
              <OrganizationCard
                key={organization.id}
                organization={organization}
                joining={joiningId === organization.id}
                onJoin={handleJoin}
              />
            ))}
          </div>
        )}

        <div className="mt-7 rounded-3xl border border-divider bg-card p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-accent-soft text-accent">
              <Icon className="size-5"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></Icon>
            </span>
            <div>
              <h2 className="text-sm font-semibold text-strong">信息架构边界</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                组织发现中心负责浏览公开组织；组织主页负责展示单个组织；频道页负责组织内交流。三者不再混在一个概念里。
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
