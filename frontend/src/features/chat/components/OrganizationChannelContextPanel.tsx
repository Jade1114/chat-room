import type { OrganizationActivity, OrganizationMemberPreview } from '../../organizations/organizationViewModel';

interface OrganizationChannelContextPanelProps {
  activities: OrganizationActivity[];
  memberCount: number;
  members: OrganizationMemberPreview[];
  onlineCount: number;
  onlineUsers: string[];
  loadingOnlineMembers: boolean;
  sidebar?: boolean;
}

const roleLabel: Record<OrganizationMemberPreview['role'], string> = {
  MEMBER: 'Member',
  ORGANIZER: 'Organizer'
};

export function OrganizationChannelContextPanel({
  activities,
  memberCount,
  members,
  onlineCount,
  onlineUsers,
  loadingOnlineMembers,
  sidebar = true
}: OrganizationChannelContextPanelProps) {
  const asideClasses = sidebar
    ? 'hidden min-h-screen overflow-y-auto border-l border-divider bg-sidebar px-4 py-5 2xl:block'
    : 'px-4 py-5';

  return (
    <aside className={asideClasses}>
      <div className="grid gap-6">
        <section>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-faint">活动记录</p>
            <span className="text-xs font-semibold text-accent-strong">{activities.length}</span>
          </div>
          <div className="mt-3 grid gap-2">
            {activities.length === 0 && (
              <p className="rounded-xl bg-hover p-3 text-xs leading-5 text-faint">这个组织还没有活动记录。</p>
            )}
            {activities.map((activity) => (
              <article key={activity.id} className="rounded-2xl border border-divider bg-card p-3">
                <p className="text-xs font-semibold text-primary">{activity.title}</p>
                <p className="mt-1 text-[11px] text-muted">{activity.time}</p>
                <span className="mt-2 inline-flex rounded-full bg-active px-2 py-1 text-[10px] font-semibold text-faint">
                  {activity.status}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-faint">在线成员</p>
            <span className="text-xs font-semibold text-accent-strong">{onlineCount}</span>
          </div>
          <div className="mt-3 grid gap-1">
            {loadingOnlineMembers && <p className="rounded-xl bg-hover p-3 text-xs text-faint">正在加载成员...</p>}
            {!loadingOnlineMembers && onlineUsers.length === 0 && <p className="rounded-xl bg-hover p-3 text-xs text-faint">还没有成员在线</p>}
            {onlineUsers.map((name, index) => (
              <div key={name} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-hover">
                <div className={`relative grid size-8 place-items-center rounded-lg text-xs font-bold ${index % 2 ? 'bg-violet-soft text-violet' : 'bg-info-soft text-info'}`}>
                  {name.slice(0, 1).toUpperCase()}
                  <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-sidebar bg-online" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-primary">{name}</p>
                  <p className="mt-0.5 text-[10px] text-faint">在线</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-faint">Members</p>
            <span className="text-xs font-semibold text-accent-strong">{memberCount}</span>
          </div>
          <div className="mt-3 grid gap-1">
            {members.length === 0 && <p className="rounded-xl bg-hover p-3 text-xs text-faint">成员预览待接入。</p>}
            {members.map((member, index) => (
              <div key={member.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-hover">
                <div className={`grid size-8 place-items-center rounded-lg text-xs font-bold ${index % 2 ? 'bg-accent-soft text-accent' : 'bg-success-soft text-success'}`}>
                  {member.displayName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-primary">{member.displayName}</p>
                  <p className="mt-0.5 text-[10px] text-faint">{roleLabel[member.role]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
