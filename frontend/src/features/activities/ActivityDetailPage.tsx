import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { Icon } from '../../components/Icon';
import { fetchActivityDetail, revealParticipationMethod, type ActivityResponse } from '../../lib/activityApi';
import { activityTimeLabel, categoryLabels, splitTags } from './activityView';

export function ActivityDetailPage() {
  const { activityId } = useParams({ from: '/activities/$activityId' });
  const [activity, setActivity] = useState<ActivityResponse | null>(null);
  const [participationMethod, setParticipationMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchActivityDetail(activityId)
      .then((data) => { if (!cancelled) setActivity(data); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Activity 加载失败'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activityId]);

  async function handleReveal() {
    setRevealing(true);
    setError('');
    try {
      setParticipationMethod(await revealParticipationMethod(activityId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '参与方式加载失败');
    } finally {
      setRevealing(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-muted">正在加载 Activity...</div>;
  if (error && !activity) return <div className="mx-auto max-w-3xl px-6 py-8 text-sm text-danger">{error}</div>;
  if (!activity) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link to="/activities" className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-primary"><Icon className="size-4"><path d="m15 18-6-6 6-6" /></Icon>返回发现事情</Link>
      <article className="rounded-3xl border border-divider bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-strong">{categoryLabels[activity.category]}</span>
          {splitTags(activity.tags).map((tag) => <span key={tag} className="rounded-full bg-active px-2 py-0.5 text-[10px] text-muted">#{tag}</span>)}
        </div>
        <h1 className="mt-4 text-2xl font-bold text-strong">{activity.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{activity.description}</p>
        <dl className="mt-6 grid gap-3 rounded-2xl bg-active p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-faint">时间</dt><dd className="mt-1 font-medium text-primary">{activityTimeLabel(activity)}</dd></div>
          <div><dt className="text-xs text-faint">地点</dt><dd className="mt-1 font-medium text-primary">{activity.location}</dd></div>
          <div><dt className="text-xs text-faint">发起人</dt><dd className="mt-1 font-medium text-primary">{activity.initiatorDisplayName}</dd></div>
          <div><dt className="text-xs text-faint">发布时间</dt><dd className="mt-1 font-medium text-primary">{new Date(activity.createdAt).toLocaleString('zh-CN')}</dd></div>
        </dl>

        <section className="mt-6 rounded-2xl border border-accent-soft bg-accent-wash p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-strong">参与方式</h2>
              <p className="mt-1 text-xs text-muted">点击后记录 PARTICIPATION_METHOD_VIEW，用于 MVP 验证，不代表平台内报名。</p>
            </div>
            {!participationMethod && <button type="button" onClick={handleReveal} disabled={revealing} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent disabled:opacity-60">{revealing ? '加载中...' : '查看参与方式'}</button>}
          </div>
          {participationMethod && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-card p-4 text-sm leading-6 text-primary">{participationMethod}</p>}
          {error && activity && <p className="mt-3 text-xs text-danger">{error}</p>}
        </section>
      </article>
    </div>
  );
}
