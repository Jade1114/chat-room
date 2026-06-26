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
    setParticipationMethod('');
    fetchActivityDetail(activityId)
      .then((data) => { if (!cancelled) setActivity(data); })
      .catch((err) => { if (!cancelled) setError(err.message || '活动加载失败'); })
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

  if (loading) return <div className="mx-auto max-w-4xl px-6 py-10 text-sm text-muted">正在加载活动...</div>;
  if (error && !activity) return <div className="mx-auto max-w-4xl px-6 py-10 text-sm text-danger">{error}</div>;
  if (!activity) return null;

  return (
    <div className="min-h-screen bg-content px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <Link to="/activities" className="mb-4 inline-flex items-center gap-2 rounded-full border border-divider bg-card px-4 py-2 text-sm font-semibold text-muted transition hover:border-accent-soft hover:text-accent-strong sm:mb-6">
          <Icon className="size-4"><path d="m15 18-6-6 6-6" /></Icon>
          返回发现事情
        </Link>

        <article className="overflow-hidden rounded-[1.5rem] border border-divider bg-card shadow-panel sm:rounded-[2.25rem]">
          <section className="relative overflow-hidden border-b border-divider bg-elevated p-5 sm:p-7">
            <div className="absolute right-[-7rem] top-[-8rem] size-64 rounded-full bg-accent-soft blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-strong">{categoryLabels[activity.category]}</span>
                <span className="rounded-full bg-active px-3 py-1 text-xs font-semibold text-muted">{activity.timeMode === 'SCHEDULED' ? '定时活动' : '持续招募'}</span>
                {splitTags(activity.tags).map((tag) => <span key={tag} className="rounded-full bg-active px-3 py-1 text-xs text-muted">#{tag}</span>)}
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight text-strong sm:mt-5 sm:text-3xl md:text-4xl">{activity.title}</h1>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted sm:mt-4 sm:text-base sm:leading-8">{activity.description}</p>
            </div>
          </section>

          <section className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6">
            <div className="rounded-2xl bg-active p-4">
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-faint">时间</dt>
              <dd className="mt-2 text-sm font-semibold text-primary">{activityTimeLabel(activity)}</dd>
            </div>
            <div className="rounded-2xl bg-active p-4">
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-faint">地点</dt>
              <dd className="mt-2 text-sm font-semibold text-primary">{activity.location}</dd>
            </div>
            <div className="rounded-2xl bg-active p-4">
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-faint">发起人</dt>
              <dd className="mt-2 text-sm font-semibold text-primary">{activity.initiatorDisplayName}</dd>
            </div>
            <div className="rounded-2xl bg-active p-4">
              <dt className="text-xs font-bold uppercase tracking-[0.16em] text-faint">发布时间</dt>
              <dd className="mt-2 text-sm font-semibold text-primary">{new Date(activity.createdAt).toLocaleString('zh-CN')}</dd>
            </div>
          </section>

          <section className="border-t border-divider p-4 sm:p-6">
            <div className="rounded-[1.5rem] border border-accent-soft bg-accent-wash p-4 sm:rounded-[1.75rem] sm:p-5">
              <div className="grid gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-strong">参与方式</h2>
                  <p className="mt-1 text-xs leading-5 text-muted">如果你感兴趣，可以查看发起人留下的联系方式或参与说明。</p>
                </div>
                {!participationMethod && (
                  <button type="button" onClick={handleReveal} disabled={revealing} className="w-full rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-on-accent shadow-accent transition hover:bg-accent-hover disabled:opacity-60 sm:w-auto">
                    {revealing ? '加载中...' : '查看参与方式'}
                  </button>
                )}
              </div>
              {participationMethod && <p className="mt-5 whitespace-pre-wrap break-words rounded-2xl bg-card p-4 text-sm leading-7 text-primary shadow-sm sm:p-5">{participationMethod}</p>}
              {error && activity && <p className="mt-3 text-xs text-danger">{error}</p>}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
