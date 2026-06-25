import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Icon } from '../../components/Icon';
import { fetchActivityFeed, type ActivityResponse } from '../../lib/activityApi';
import { activityTimeLabel, categoryLabels, categoryOptions, splitTags } from '../activities/activityView';

type FeedTab = 'upcoming' | 'ongoing';

const tabMeta: Record<FeedTab, { label: string; description: string; empty: string }> = {
  upcoming: {
    label: '即将发生',
    description: '有明确开始时间，按开始时间升序。',
    empty: '当前筛选下没有即将发生的 Activity。'
  },
  ongoing: {
    label: '持续招募',
    description: '长期开放，按发布时间倒序。',
    empty: '当前筛选下没有持续招募的 Activity。'
  }
};

function ActivityCard({ activity }: { activity: ActivityResponse }) {
  return (
    <Link
      to="/activities/$activityId"
      params={{ activityId: activity.id }}
      className="block rounded-2xl border border-divider bg-card p-4 transition hover:border-accent-soft hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-strong">
              {categoryLabels[activity.category]}
            </span>
            {splitTags(activity.tags).map((tag) => (
              <span key={tag} className="rounded-full bg-active px-2 py-0.5 text-[10px] font-medium text-muted">#{tag}</span>
            ))}
          </div>
          <p className="mt-2 text-base font-semibold text-strong">{activity.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted line-clamp-2">{activity.description}</p>
        </div>
        <Icon className="size-4 shrink-0 text-faint"><path d="m9 18 6-6-6-6" /></Icon>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-faint">
        <span className="flex items-center gap-1"><Icon className="size-3"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>{activityTimeLabel(activity)}</span>
        <span className="flex items-center gap-1"><Icon className="size-3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></Icon>{activity.location}</span>
        <span>发起人：{activity.initiatorDisplayName}</span>
      </div>
    </Link>
  );
}

function FeedTabButton({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${active ? 'bg-card text-strong shadow-sm' : 'text-muted hover:text-primary'}`}
    >
      <span>{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-accent-soft text-accent-strong' : 'bg-surface text-faint'}`}>{count}</span>
    </button>
  );
}

export function ActivitySchedulePage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [activeTab, setActiveTab] = useState<FeedTab>('upcoming');
  const [upcoming, setUpcoming] = useState<ActivityResponse[]>([]);
  const [ongoing, setOngoing] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filters = useMemo(() => ({ query, category, tag }), [query, category, tag]);
  const activeActivities = activeTab === 'upcoming' ? upcoming : ongoing;
  const currentTab = tabMeta[activeTab];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchActivityFeed(filters)
      .then((data) => {
        if (!cancelled) {
          setUpcoming(data.upcoming);
          setOngoing(data.ongoing);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || '活动加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [filters]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">Activity-first MVP</p>
          <h1 className="mt-2 text-2xl font-bold text-strong">发现事情</h1>
          <p className="mt-2 text-sm text-muted">找到值得一起完成的事情，再通过参与方式私下联系发起者。</p>
        </div>
        <Link to="/activities/new" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-on-accent shadow-accent">发起事情</Link>
      </div>

      <section className="mb-6 grid gap-3 rounded-2xl border border-divider bg-card p-4 md:grid-cols-[1fr_180px_180px]">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索 title / description / tags" className="rounded-xl border border-divider bg-surface px-3 py-2 text-sm outline-none focus:border-accent-soft" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-divider bg-surface px-3 py-2 text-sm outline-none focus:border-accent-soft">
          <option value="">全部分类</option>
          {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="标签，例如 后端" className="rounded-xl border border-divider bg-surface px-3 py-2 text-sm outline-none focus:border-accent-soft" />
      </section>

      {loading && <div className="rounded-2xl border border-divider bg-card p-6 text-center text-sm text-muted">正在加载 Activity...</div>}
      {!loading && error && <div className="rounded-2xl border border-danger/30 bg-danger/10 p-6 text-center text-sm text-danger">{error}</div>}
      {!loading && !error && (
        <section className="grid gap-4">
          <div className="rounded-2xl bg-active p-1 sm:flex">
            <FeedTabButton active={activeTab === 'upcoming'} label="即将发生 Upcoming" count={upcoming.length} onClick={() => setActiveTab('upcoming')} />
            <FeedTabButton active={activeTab === 'ongoing'} label="持续招募 Ongoing" count={ongoing.length} onClick={() => setActiveTab('ongoing')} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-strong">{currentTab.label}</h2>
            <p className="mt-1 text-xs text-muted">{currentTab.description}</p>
          </div>

          <div className="grid gap-3">
            {activeActivities.length === 0 ? (
              <div className="rounded-2xl border border-divider bg-card p-6 text-sm text-muted">{currentTab.empty}</div>
            ) : activeActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}
          </div>
        </section>
      )}
    </div>
  );
}
