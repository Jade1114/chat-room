import { useAtomValue } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { currentUserAtom } from '../../state/chatAtoms';
import { fetchAdminOverview, type AdminOverviewResponse } from '../../lib/adminApi';

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value || 0);
}

function formatPercent(value: number) {
  return `${Math.round((value || 0) * 100)}%`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function MetricCard({ label, value, hint, tone = 'default' }: { label: string; value: string; hint: string; tone?: 'default' | 'accent' | 'violet' | 'info' }) {
  const toneClass = {
    default: 'bg-card',
    accent: 'bg-accent-wash ring-1 ring-accent-soft',
    violet: 'bg-violet-soft',
    info: 'bg-info-soft'
  }[tone];
  return (
    <div className={`rounded-[1.5rem] border border-divider p-5 ${toneClass}`}>
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-faint">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-tight text-strong">{value}</div>
      <p className="mt-2 text-xs leading-5 text-muted">{hint}</p>
    </div>
  );
}

export function AdminPage() {
  const currentUser = useAtomValue(currentUserAtom);
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.role !== 'ADMIN') {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchAdminOverview()
      .then((data) => { if (!cancelled) setOverview(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : '管理数据加载失败'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser?.role]);

  const maxContactViews = useMemo(() => {
    return Math.max(1, ...(overview?.topActivities || []).map((activity) => activity.participationMethodViews));
  }, [overview?.topActivities]);

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-content px-6 text-center text-sm text-muted">
        仅管理员可访问此页面。
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-content px-6 py-8 text-primary max-md:px-4">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-divider bg-elevated p-7 shadow-panel">
          <div className="absolute right-[-6rem] top-[-8rem] size-64 rounded-full bg-accent-soft blur-3xl" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-accent-strong">管理后台</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-strong">平台数据概览</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              这里展示活动中心的访问、联系方式点击和活动状态，方便快速了解当前使用情况。
            </p>
          </div>
        </section>

        {loading && <div className="mt-6 rounded-3xl border border-divider bg-card p-8 text-center text-sm text-muted">正在加载管理数据...</div>}
        {!loading && error && <div className="mt-6 rounded-3xl border border-danger/30 bg-danger/10 p-8 text-center text-sm text-danger">{error}</div>}

        {!loading && overview && (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <MetricCard label="网站访问数" value={formatNumber(overview.siteVisitors)} hint="打开活动中心的独立访问人数。" tone="accent" />
              <MetricCard label="查看联系方式" value={formatNumber(overview.participationMethodViews)} hint="用户点击“查看参与方式”的总次数。" tone="info" />
              <MetricCard label="联系方式转化率" value={formatPercent(overview.contactViewRate)} hint="查看联系方式次数 / 网站访问数。" tone="violet" />
              <MetricCard label="活动总数" value={formatNumber(overview.totalActivities)} hint="包含仍在发布、已关闭和已过期的活动。" />
              <MetricCard label="仍在发布" value={formatNumber(overview.publishedActivities)} hint="当前仍可被用户看到的活动。" />
              <MetricCard label="已关闭 / 过期" value={`${formatNumber(overview.closedActivities)} / ${formatNumber(overview.expiredActivities)}`} hint="发起者主动关闭和已经过期的活动。" />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[2rem] border border-divider bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-strong">热门活动</h2>
                    <p className="mt-1 text-xs text-muted">按联系方式点击优先，其次按详情访问排序。</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-4">
                  {overview.topActivities.length === 0 ? (
                    <p className="rounded-2xl bg-active p-4 text-sm text-muted">还没有行为数据。</p>
                  ) : overview.topActivities.map((activity) => {
                    const width = `${Math.max(6, Math.round(activity.participationMethodViews / maxContactViews * 100))}%`;
                    return (
                      <div key={activity.activityId} className="rounded-2xl border border-divider bg-elevated p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-bold text-strong">{activity.title}</div>
                            <div className="mt-1 text-xs text-faint">{activity.category} · {activity.activityId}</div>
                          </div>
                          <div className="text-right text-xs text-muted">
                            <div><span className="font-bold text-strong">{activity.participationMethodViews}</span> 次联系方式</div>
                            <div><span className="font-bold text-strong">{activity.detailViews}</span> 次详情</div>
                          </div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-active">
                          <div className="h-full rounded-full bg-accent" style={{ width }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-divider bg-card p-6 shadow-sm">
                <h2 className="text-lg font-black text-strong">最近行为</h2>
                <p className="mt-1 text-xs text-muted">用于快速观察用户最近在看什么、是否点开联系方式。</p>
                <div className="mt-5 grid gap-3">
                  {overview.recentEvents.length === 0 ? (
                    <p className="rounded-2xl bg-active p-4 text-sm text-muted">还没有行为事件。</p>
                  ) : overview.recentEvents.map((event, index) => (
                    <div key={`${event.activityId}-${event.userId}-${event.createdAt}-${index}`} className="rounded-2xl bg-active p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${event.eventType === '查看参与方式' ? 'bg-accent-soft text-accent-strong' : 'bg-info-soft text-info'}`}>{event.eventType}</span>
                        <span className="text-[11px] text-faint">{formatDateTime(event.createdAt)}</span>
                      </div>
                      <div className="mt-2 line-clamp-1 text-sm font-semibold text-strong">{event.title}</div>
                      <div className="mt-1 text-xs text-muted">访客：{event.visitorId || '未知'}{event.userId ? ` · 用户：${event.userId}` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
