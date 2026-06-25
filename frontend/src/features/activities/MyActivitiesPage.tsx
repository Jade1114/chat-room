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

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-strong">我的发布</h1>
          <p className="mt-2 text-sm text-muted">只展示我发起的 Activity，不包含我参与/收藏/看过联系方式的历史。</p>
        </div>
        <Link to="/activities/new" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent">发起事情</Link>
      </div>
      {loading && <div className="rounded-2xl border border-divider bg-card p-6 text-sm text-muted">正在加载...</div>}
      {error && <div className="mb-4 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>}
      {!loading && activities.length === 0 && <div className="rounded-2xl border border-divider bg-card p-8 text-center text-sm text-muted">你还没有发布 Activity。</div>}
      <div className="grid gap-3">
        {activities.map((activity) => (
          <article key={activity.id} className="rounded-2xl border border-divider bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-strong">{categoryLabels[activity.category]}</span><span className="rounded-full bg-active px-2 py-0.5 text-[10px] text-muted">{activity.status}</span></div>
                <Link to="/activities/$activityId" params={{ activityId: activity.id }} className="mt-2 block text-base font-semibold text-strong hover:text-accent-strong">{activity.title}</Link>
                <p className="mt-1 text-xs text-muted">{activityTimeLabel(activity)} · {activity.location}</p>
              </div>
              {activity.status === 'PUBLISHED' && <button type="button" onClick={() => void handleClose(activity.id)} className="rounded-xl border border-divider px-3 py-2 text-xs font-semibold text-muted hover:bg-hover">关闭</button>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
