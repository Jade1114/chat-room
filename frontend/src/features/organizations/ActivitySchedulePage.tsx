import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Icon } from '../../components/Icon';
import { fetchActivities, type ActivityResponse } from '../../lib/organizationApi';
import { toOrganizationActivities, type OrganizationActivity } from './organizationViewModel';

type ScheduleTab = 'discover' | 'my-schedule';

function ActivityCard({ activity }: { activity: OrganizationActivity }) {
  return (
    <div className="rounded-2xl border border-divider bg-card p-4 transition hover:border-accent-soft hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-strong">{activity.title}</p>
          {activity.description && (
            <p className="mt-1 text-xs leading-5 text-muted line-clamp-2">{activity.description}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          activity.status === 'ongoing' ? 'bg-accent-soft text-accent-strong' :
          activity.status === 'upcoming' ? 'bg-active text-muted' :
          'bg-active text-faint'
        }`}>
          {activity.status === 'ongoing' ? '进行中' : activity.status === 'upcoming' ? '即将开始' : '已结束'}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-faint">
        <span className="flex items-center gap-1">
          <Icon className="size-3"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>
          {activity.time}
        </span>
        <span className="flex items-center gap-1">
          <Icon className="size-3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></Icon>
          {activity.location}
        </span>
      </div>
    </div>
  );
}

export function ActivitySchedulePage() {
  const [tab, setTab] = useState<ScheduleTab>('discover');
  const [allActivities, setAllActivities] = useState<OrganizationActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchActivities()
      .then((data: ActivityResponse[]) => {
        if (!cancelled) {
          setAllActivities(toOrganizationActivities(data));
        }
      })
      .catch(() => {
        if (!cancelled) setError('活动加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const discoverActivities = useMemo(
    () => allActivities.filter((a) => a.status !== 'past'),
    [allActivities]
  );

  const mySchedule = useMemo(
    () => allActivities.filter((a) => a.status !== 'past'),
    [allActivities]
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-strong">活动中心</h1>
        <p className="mt-2 text-sm text-muted">发现公开活动，查看已加入组织的日程。</p>
      </div>

      <nav className="mb-6 flex gap-1 rounded-xl bg-active p-1 text-sm">
        <button
          type="button"
          onClick={() => setTab('discover')}
          className={`flex-1 rounded-lg px-4 py-2 font-semibold transition ${tab === 'discover' ? 'bg-card text-strong shadow-sm' : 'text-muted hover:text-primary'}`}
        >
          发现活动
        </button>
        <button
          type="button"
          onClick={() => setTab('my-schedule')}
          className={`flex-1 rounded-lg px-4 py-2 font-semibold transition ${tab === 'my-schedule' ? 'bg-card text-strong shadow-sm' : 'text-muted hover:text-primary'}`}
        >
          我的日程
        </button>
      </nav>

      {loading && (
        <div className="rounded-2xl border border-divider bg-card p-6 text-center text-sm text-muted">正在加载活动...</div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-6 text-center text-sm text-danger">{error}</div>
      )}

      {!loading && !error && tab === 'discover' && (
        <div className="grid gap-3">
          {discoverActivities.length === 0 && (
            <div className="rounded-2xl border border-divider bg-card p-8 text-center">
              <p className="text-sm text-muted">暂无公开活动。</p>
            </div>
          )}
          {discoverActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {!loading && !error && tab === 'my-schedule' && (
        <div>
          {mySchedule.length === 0 ? (
            <div className="rounded-2xl border border-divider bg-card p-8 text-center">
              <p className="text-sm text-muted">还没有加入的活动。去发现页面加入感兴趣的组织。</p>
              <Link to="/organizations" className="mt-3 inline-block rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-on-accent">
                去发现组织
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {mySchedule.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
