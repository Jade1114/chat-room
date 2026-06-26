import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { closeActivity, fetchMyActivities, type ActivityResponse } from '../../lib/activityApi';
import { activityTimeLabel, categoryLabels } from './activityView';

export function MyActivitiesPage() {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setActivities(await fetchMyActivities());
    } catch (err) {
      setError(err instanceof Error ? err.message : '我的发布加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleClose(activityId: string) {
    setError('');
    try {
      await closeActivity(activityId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '关闭失败');
    }
  }

  const publishedCount = activities.filter((activity) => activity.status === 'PUBLISHED').length;

  return (
    <div className="min-h-screen bg-content px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <section className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-[2rem] border border-divider bg-elevated p-7 shadow-panel">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-accent-strong">My Activities</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-strong">我的发布</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">管理我发布过的活动。</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-active px-4 py-3 text-sm text-muted"><span className="font-black text-strong">{publishedCount}</span> 个仍在发布</div>
            <Link to="/activities/new" className="rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-on-accent shadow-accent transition hover:bg-accent-hover">发起事情</Link>
          </div>
        </section>

        {loading && <div className="rounded-3xl border border-divider bg-card p-8 text-sm text-muted">正在加载...</div>}
        {error && <div className="mb-4 rounded-3xl border border-danger/30 bg-danger/10 p-5 text-sm text-danger">{error}</div>}
        {!loading && activities.length === 0 && <div className="rounded-3xl border border-divider bg-card p-10 text-center text-sm text-muted">你还没有发布活动。</div>}
        <div className="grid gap-4 lg:grid-cols-2">
          {activities.map((activity) => (
            <article key={activity.id} className="rounded-[1.75rem] border border-divider bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent-strong">{categoryLabels[activity.category]}</span>
                    <span className="rounded-full bg-active px-2.5 py-1 text-[11px] font-semibold text-muted">{activity.status}</span>
                  </div>
                  <Link to="/activities/$activityId" params={{ activityId: activity.id }} className="mt-3 block text-lg font-black text-strong transition hover:text-accent-strong">{activity.title}</Link>
                  <p className="mt-2 text-sm leading-6 text-muted">{activityTimeLabel(activity)} · {activity.location}</p>
                </div>
                {activity.status === 'PUBLISHED' && <button type="button" onClick={() => void handleClose(activity.id)} className="rounded-2xl border border-divider px-4 py-2 text-xs font-bold text-muted transition hover:bg-hover hover:text-primary">关闭</button>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
