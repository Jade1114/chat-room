import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Icon } from '../../components/Icon';
import { fetchActivityFeed, recordSiteVisit, type ActivityResponse } from '../../lib/activityApi';
import { activityTimeLabel, categoryLabels, categoryOptions, splitTags } from '../activities/activityView';

type FeedTab = 'upcoming' | 'ongoing' | 'hot';

const tabMeta: Record<FeedTab, { label: string; description: string; empty: string }> = {
  upcoming: {
    label: '即将发生',
    description: '已经定好时间的活动，适合马上安排日程。',
    empty: '当前筛选下没有即将发生的活动。'
  },
  ongoing: {
    label: '持续招募',
    description: '长期开放的组队、学习、项目和兴趣邀请。',
    empty: '当前筛选下没有持续招募的活动。'
  },
  hot: {
    label: '热门活动',
    description: '根据浏览、查看参与方式和感兴趣行为排序，看看哪些活动正在被关注。',
    empty: '当前筛选下还没有热门活动。'
  }
};

function ActivityCard({ activity, showHotMetrics = false }: { activity: ActivityResponse; showHotMetrics?: boolean }) {
  const tags = splitTags(activity.tags);
  const metrics = activity.hotMetrics;
  return (
    <Link
      to="/activities/$activityId"
      params={{ activityId: activity.id }}
      className="group block overflow-hidden rounded-[1.5rem] border border-divider bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent-soft hover:shadow-panel sm:rounded-[1.75rem] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent-strong">
              {categoryLabels[activity.category]}
            </span>
            <span className="rounded-full bg-active px-2.5 py-1 text-[11px] font-medium text-faint">
              {activity.timeMode === 'SCHEDULED' ? '定时活动' : '持续招募'}
            </span>
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-active px-2.5 py-1 text-[11px] font-medium text-muted">#{tag}</span>
            ))}
          </div>
          <h3 className="mt-3 text-base font-bold tracking-tight text-strong transition group-hover:text-accent-strong sm:mt-4 sm:text-lg">{activity.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted line-clamp-3 sm:line-clamp-2">{activity.description}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-active text-faint transition group-hover:bg-accent group-hover:text-on-accent">
          <Icon className="size-4"><path d="m9 18 6-6-6-6" /></Icon>
        </span>
      </div>
      <div className="mt-5 grid gap-2 rounded-2xl bg-active/70 p-3 text-xs text-muted sm:grid-cols-[1.3fr_1fr]">
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="size-3.5 shrink-0 text-accent-strong"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>
          <span className="truncate">{activityTimeLabel(activity)}</span>
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <Icon className="size-3.5 shrink-0 text-accent-strong"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></Icon>
          <span className="truncate">{activity.location}</span>
        </span>
      </div>
      {showHotMetrics && metrics && (
        <div className="mt-4 rounded-2xl border border-accent-soft/70 bg-accent-wash px-3 py-2 text-xs text-accent-strong">
          <span className="font-black">🔥 最近被关注：</span>
          <span>{metrics.interestCount} 人感兴趣</span>
          <span className="mx-1.5 text-accent-strong/50">·</span>
          <span>{metrics.participationMethodViews} 次查看参与方式</span>
          <span className="mx-1.5 text-accent-strong/50">·</span>
          <span>{metrics.detailViews} 次浏览</span>
        </div>
      )}
      <div className="mt-4 flex flex-col gap-2 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <span>发起人：{activity.initiatorDisplayName}</span>
        <span className="font-semibold text-accent-strong">查看参与方式 →</span>
      </div>
    </Link>
  );
}

function FeedTabButton({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative z-10 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-colors duration-300 ${active ? 'text-strong' : 'text-muted hover:text-primary'}`}
    >
      <span>{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-[10px] transition-colors duration-300 ${active ? 'bg-accent-soft text-accent-strong' : 'bg-surface text-faint'}`}>{count}</span>
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
  const [hot, setHot] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const activityFeedRef = useRef<HTMLDivElement | null>(null);
  const [showWelcome, setShowWelcome] = useState(() => {
    try {
      return localStorage.getItem('chat_room_welcome_dismissed') !== '1';
    } catch {
      return true;
    }
  });
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const filters = useMemo(() => ({ query, category, tag }), [query, category, tag]);
  const activeActivities = activeTab === 'upcoming' ? upcoming : activeTab === 'ongoing' ? ongoing : hot;
  const currentTab = tabMeta[activeTab];
  const totalActivities = upcoming.length + ongoing.length;
  const activeTabIndex = activeTab === 'upcoming' ? 0 : activeTab === 'ongoing' ? 1 : 2;

  useEffect(() => {
    void recordSiteVisit().catch(() => {
      // Site visit analytics must not block the public activity center.
    });
  }, []);

  function dismissWelcome() {
    setShowWelcome(false);
    if (dontShowAgain) {
      try { localStorage.setItem('chat_room_welcome_dismissed', '1'); } catch { /* no-op */ }
    }
  }

  function handleBrowseCurrentActivities() {
    activityFeedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      fetchActivityFeed(filters),
      fetchActivityFeed({ ...filters, sort: 'hot' })
    ])
      .then(([data, hotData]) => {
        if (!cancelled) {
          setUpcoming(data.upcoming);
          setOngoing(data.ongoing);
          setHot(hotData.hot || []);
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
    <div className="min-h-screen bg-content">
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" onClick={() => dismissWelcome()}>
          <div
            className="relative w-full max-w-lg animate-fade-slide-up overflow-hidden rounded-[2rem] border border-divider bg-card shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative border-b border-divider bg-elevated px-6 py-5 sm:px-8 sm:py-7">
              <div className="absolute right-[-6rem] top-[-6rem] size-48 rounded-full bg-accent-soft blur-3xl" />
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent-strong">欢迎来到</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-strong sm:text-3xl">校园活动中心</h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-muted">
                  这里不是信息流，也不是社交平台。它只收集一类内容：<span className="font-semibold text-primary">值得一起完成的事</span>。
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismissWelcome()}
                className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-active text-muted transition hover:bg-hover hover:text-primary sm:right-6 sm:top-6"
                aria-label="关闭"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="space-y-0 px-6 py-6 sm:px-8 sm:py-7">
              <div className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-base font-black text-accent-strong">1</span>
                <div>
                  <h3 className="text-sm font-bold text-strong">发现活动</h3>
                  <p className="mt-1 text-xs leading-5 text-muted">浏览即将发生的活动，或者长期招募的组队邀请。搜索、分类、标签都能帮你快速筛选。</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-base font-black text-accent-strong">2</span>
                <div>
                  <h3 className="text-sm font-bold text-strong">查看参与方式</h3>
                  <p className="mt-1 text-xs leading-5 text-muted">感兴趣就点击“查看参与方式”，可以看到发起人留下的微信、QQ、邮箱或其他联系方式。</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-base font-black text-accent-strong">3</span>
                <div>
                  <h3 className="text-sm font-bold text-strong">发起你的活动</h3>
                  <p className="mt-1 text-xs leading-5 text-muted">任何人都可以发起一件事。把时间、地点、参与方式写清楚，等待感兴趣的人联系你。</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-divider px-6 py-4 sm:px-8">
              <label className="flex cursor-pointer items-center gap-2.5 text-xs text-muted select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="size-4 rounded-md border-divider bg-surface text-accent focus:ring-accent"
                />
                下次不再显示
              </label>
              <button
                type="button"
                onClick={() => dismissWelcome()}
                className="rounded-2xl bg-accent px-5 py-2.5 text-sm font-bold text-on-accent shadow-accent transition hover:bg-accent-hover"
              >
                开始浏览
              </button>
            </div>
          </div>
        </div>
      )}
      <section className="relative overflow-hidden border-b border-divider bg-elevated">
        <div className="absolute right-[-8rem] top-[-10rem] size-80 rounded-full bg-accent-soft blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[20%] size-72 rounded-full bg-info-soft blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-7 sm:px-6 sm:py-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <h1 className="max-w-3xl text-3xl font-black tracking-tight text-strong sm:text-4xl md:text-5xl">今天想做点什么？</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted sm:mt-4 sm:text-base sm:leading-8">
              发现校园里正在发生、正在招募的活动。找到感兴趣的事情，查看参与方式，然后直接联系发起人。
            </p>
            <div className="mt-5 grid gap-3 sm:mt-6 sm:flex sm:flex-wrap">
              <Link to="/activities/new" className="rounded-2xl bg-accent px-5 py-3 text-center text-sm font-bold text-on-accent shadow-accent transition hover:bg-accent-hover">发起一件事情</Link>
              <Link to="/me/activities" className="rounded-2xl border border-accent-soft bg-card px-5 py-3 text-center text-sm font-bold text-accent-strong transition hover:bg-accent-soft">查看我的活动</Link>
              <button type="button" onClick={handleBrowseCurrentActivities} className="rounded-2xl border border-divider bg-card px-5 py-3 text-center text-sm font-bold text-primary transition hover:border-accent-soft hover:text-accent-strong">浏览当前活动</button>
            </div>
          </div>
          <div className="grid gap-3 rounded-[1.5rem] border border-divider bg-card/80 p-4 shadow-panel backdrop-blur sm:rounded-[2rem] sm:p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-active p-3 sm:p-4">
                <div className="text-2xl font-black text-strong">{totalActivities}</div>
                <div className="mt-1 text-[11px] text-faint">可参与</div>
              </div>
              <div className="rounded-2xl bg-active p-3 sm:p-4">
                <div className="text-2xl font-black text-strong">{upcoming.length}</div>
                <div className="mt-1 text-[11px] text-faint">即将发生</div>
              </div>
              <div className="rounded-2xl bg-active p-3 sm:p-4">
                <div className="text-2xl font-black text-strong">{ongoing.length}</div>
                <div className="mt-1 text-[11px] text-faint">持续招募</div>
              </div>
            </div>
            <p className="text-xs leading-6 text-muted">想学习、运动、组队做项目，或者找人一起参加比赛，都可以从这里开始。</p>
          </div>
        </div>
      </section>

      <div id="activity-feed" ref={activityFeedRef} className="scroll-mt-4 mx-auto max-w-6xl px-4 py-6 sm:scroll-mt-6 sm:px-6 sm:py-8">
        <section className="mb-6 grid gap-3 rounded-[1.5rem] border border-divider bg-card p-3 shadow-sm sm:p-4 md:grid-cols-[1fr_180px_180px]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索标题、说明、标签" className="rounded-2xl border border-divider bg-surface px-4 py-3 text-sm outline-none transition focus:border-accent-soft" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-divider bg-surface px-4 py-3 text-sm outline-none transition focus:border-accent-soft">
            <option value="">全部分类</option>
            {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="输入标签，如：运动、学习" className="rounded-2xl border border-divider bg-surface px-4 py-3 text-sm outline-none transition focus:border-accent-soft" />
        </section>

        {loading && <div className="rounded-3xl border border-divider bg-card p-8 text-center text-sm text-muted">正在加载活动...</div>}
        {!loading && error && <div className="rounded-3xl border border-danger/30 bg-danger/10 p-8 text-center text-sm text-danger">{error}</div>}
        {!loading && !error && (
          <section className="grid gap-5">
            <div className="relative grid grid-cols-3 overflow-hidden rounded-[1.5rem] bg-active p-1">
              <div
                className="absolute inset-y-1 left-1 rounded-2xl bg-card shadow-sm ring-1 ring-divider transition-transform duration-300 ease-out"
                style={{ width: 'calc(33.333333% - 0.25rem)', transform: `translateX(${activeTabIndex * 100}%)` }}
              />
              <FeedTabButton active={activeTab === 'upcoming'} label="即将发生" count={upcoming.length} onClick={() => setActiveTab('upcoming')} />
              <FeedTabButton active={activeTab === 'ongoing'} label="持续招募" count={ongoing.length} onClick={() => setActiveTab('ongoing')} />
              <FeedTabButton active={activeTab === 'hot'} label="热门" count={hot.length} onClick={() => setActiveTab('hot')} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-strong">{currentTab.label}</h2>
                <p className="mt-1 text-sm text-muted">{currentTab.description}</p>
              </div>
              <p className="rounded-full bg-accent-wash px-3 py-1 text-xs font-semibold text-accent-strong">当前 {activeActivities.length} 个结果</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {activeActivities.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-divider bg-card p-8 text-sm text-muted lg:col-span-2">{currentTab.empty}</div>
              ) : activeActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} showHotMetrics={activeTab === 'hot'} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
