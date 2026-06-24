import { useMemo, useState, type ReactNode } from 'react';
import { Icon } from '../../components/Icon';
import { findOrganization, type OrganizationChannel, type OrganizationTab, type OrganizationViewModel } from './organizationMock';

const tabLabels: Record<OrganizationTab, string> = {
  overview: 'Overview',
  channels: 'Channels',
  activities: 'Activities',
  members: 'Members',
  settings: 'Settings'
};

function useOrganizationIdFromPath() {
  return useMemo(() => {
    const match = window.location.pathname.match(/\/organizations\/([^/]+)/);
    return match?.[1];
  }, []);
}

function SmallIcon({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Icon className={`size-4 ${className}`}>{children}</Icon>;
}

function OrganizationMark({ organization, large = false }: { organization: OrganizationViewModel; large?: boolean }) {
  return <span className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${organization.colors} font-bold text-white shadow-composer ${large ? 'size-16 text-xl' : 'size-10 text-sm'}`}>{organization.mark}</span>;
}

function ChannelIcon({ channel }: { channel: OrganizationChannel }) {
  if (channel.kind === 'announcements') return <SmallIcon><path d="m3 11 17-5v12L3 14Z" /><path d="M11.6 16.5 13 21H7l-1.8-6" /></SmallIcon>;
  if (channel.kind === 'event') return <SmallIcon><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></SmallIcon>;
  if (channel.kind === 'random') return <SmallIcon><path d="M7 3h10l4 8-9 10-9-10 4-8Z" /></SmallIcon>;
  return <span className="text-sm font-bold text-faint">#</span>;
}

function Hero({ organization }: { organization: OrganizationViewModel }) {
  return (
    <section className={`relative overflow-hidden rounded-[32px] bg-gradient-to-br ${organization.colors} p-7 text-white shadow-panel`}>
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-end gap-4">
          <OrganizationMark organization={organization} large />
          <div>
            <p className="text-xs font-semibold text-white/70">{organization.visibility} · {organization.joinPolicy} · {organization.memberCount} members</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{organization.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#13211e]">进入默认频道</button>
          <button className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-semibold text-white">组织设置</button>
        </div>
      </div>
      <p className="relative z-10 mt-5 max-w-2xl text-sm leading-7 text-white/75">{organization.description}</p>
      <div className="absolute -right-10 -top-16 size-56 rounded-full border-[42px] border-white/10" />
    </section>
  );
}

function ChannelsSection({ organization }: { organization: OrganizationViewModel }) {
  return (
    <article className="rounded-3xl border border-divider bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-strong">Channels</h2>
          <p className="mt-1 text-xs text-muted">频道是组织下的交流入口，不再等同于组织本身。</p>
        </div>
        <button className="rounded-xl border border-divider px-3 py-2 text-xs font-semibold text-primary">New channel</button>
      </div>
      <div className="mt-4 grid gap-2">
        {organization.channels.map((channel) => (
          <a key={channel.id} href={`/organizations/${organization.id}/channels/${channel.id}`} className="flex items-center gap-3 rounded-2xl bg-active px-4 py-3 transition hover:bg-hover">
            <span className="grid size-9 place-items-center rounded-xl bg-card text-muted"><ChannelIcon channel={channel} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-strong"># {channel.name}</span>
              <span className="block truncate text-xs text-muted">{channel.purpose}</span>
            </span>
            {channel.unreadCount > 0 && <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white">{channel.unreadCount}</span>}
          </a>
        ))}
      </div>
    </article>
  );
}

function ActivitiesSection({ organization }: { organization: OrganizationViewModel }) {
  return (
    <article className="rounded-3xl border border-divider bg-card p-5">
      <h2 className="text-base font-semibold text-strong">Activities</h2>
      <p className="mt-1 text-xs text-muted">活动是组织存在的业务理由，后续会从这里进入报名和日程。</p>
      <div className="mt-4 grid gap-3">
        {organization.activities.map((activity) => (
          <div key={activity.id} className="rounded-2xl border border-divider p-3">
            <p className="text-sm font-semibold text-strong">{activity.title}</p>
            <p className="mt-1 text-xs text-muted">{activity.time} · {activity.status}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function MembersSection({ organization }: { organization: OrganizationViewModel }) {
  return (
    <article className="rounded-3xl border border-divider bg-card p-5">
      <h2 className="text-base font-semibold text-strong">Members</h2>
      <p className="mt-1 text-xs text-muted">成员与角色属于组织层，不属于频道层。</p>
      <div className="mt-4 grid gap-2">
        {organization.members.map((member) => (
          <div key={member.id} className="flex items-center justify-between rounded-2xl bg-active px-4 py-3">
            <span className="text-sm font-semibold text-strong">{member.displayName}</span>
            <span className="rounded-full bg-card px-2 py-1 text-[10px] text-muted">{member.role}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function OverviewTab({ organization }: { organization: OrganizationViewModel }) {
  return (
    <div className="space-y-5">
      <Hero organization={organization} />
      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-5 max-xl:grid-cols-1">
        <ChannelsSection organization={organization} />
        <ActivitiesSection organization={organization} />
      </div>
      <MembersSection organization={organization} />
    </div>
  );
}

function PlaceholderTab({ organization, tab }: { organization: OrganizationViewModel; tab: OrganizationTab }) {
  if (tab === 'channels') return <ChannelsSection organization={organization} />;
  if (tab === 'activities') return <ActivitiesSection organization={organization} />;
  if (tab === 'members') return <MembersSection organization={organization} />;
  return (
    <article className="rounded-3xl border border-divider bg-card p-7">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-strong">Coming next</p>
      <h2 className="mt-2 text-xl font-semibold text-strong">{tabLabels[tab]}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">这里是组织层能力的正式占位。Phase 2-A 先定清楚组织/频道/活动的边界，后续再接入真实 API 和完整交互。</p>
    </article>
  );
}

export function OrganizationDetailPage() {
  const organizationId = useOrganizationIdFromPath();
  const organization = findOrganization(organizationId);
  const [activeTab, setActiveTab] = useState<OrganizationTab>('overview');

  return (
    <main className="grid h-screen min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-content">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-divider bg-content px-7 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-strong">Organization Homepage First</p>
          <h1 className="mt-1 text-xl font-semibold text-strong">{organization.name}</h1>
        </div>
        <nav className="flex flex-wrap gap-2 text-xs">
          {(Object.keys(tabLabels) as OrganizationTab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-3 py-1.5 font-semibold ${activeTab === tab ? 'bg-accent text-on-accent' : 'text-muted hover:bg-hover'}`}>{tabLabels[tab]}</button>
          ))}
        </nav>
      </header>
      <section className="min-h-0 overflow-y-auto p-7 max-sm:p-4">
        {activeTab === 'overview' ? <OverviewTab organization={organization} /> : <PlaceholderTab organization={organization} tab={activeTab} />}
      </section>
    </main>
  );
}
