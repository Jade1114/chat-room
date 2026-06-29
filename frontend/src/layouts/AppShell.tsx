import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useTheme } from '../features/theme/useTheme';
import { currentUserAtom, isConnectedAtom } from '../state/chatAtoms';
import { useAuth } from '../hooks/useAuth';
import { useActivityNotifications } from '../hooks/useActivityNotifications';
import type { UserRole } from '../types/chat';

const roleLabel: Record<UserRole, string> = {
  MEMBER: '成员',
  ORGANIZER: '组织者',
  ADMIN: '管理员'
};

interface NavigationItem {
  label: string;
  description: string;
  to?: '/activities' | '/activities/new' | '/me/activities' | '/organizations' | '/organizations/create' | '/admin';
  activeWhen?: (pathname: string) => boolean;
  icon: ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    label: '发现事情',
    description: '浏览即将发生和持续招募的活动',
    to: '/activities',
    activeWhen: (pathname) => pathname === '/activities' || (pathname.startsWith('/activities/') && pathname !== '/activities/new'),
    icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>
  },
  {
    label: '发起事情',
    description: '发布一个值得一起完成的事情',
    to: '/activities/new',
    activeWhen: (pathname) => pathname === '/activities/new',
    icon: <><path d="M12 5v14M5 12h14" /></>
  },
  {
    label: '我的发布',
    description: '管理我发布过的活动',
    to: '/me/activities',
    activeWhen: (pathname) => pathname === '/me/activities',
    icon: <><path d="M16 21v-2a4 4 0 0 0-8 0v2" /><circle cx="12" cy="7" r="4" /><path d="M4 11h16" /></>
  },
];

function SidebarNavigationItem({ item, pathname }: { item: NavigationItem; pathname: string }) {
  const active = item.activeWhen?.(pathname) ?? false;
  const className = `group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${active ? 'bg-accent-soft text-accent-strong ring-1 ring-accent-soft' : 'text-muted hover:bg-hover hover:text-primary'}`;
  const content = (
    <>
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? 'bg-accent text-on-accent' : 'bg-active text-faint group-hover:text-primary'}`}>
        <Icon className="size-[18px]">{item.icon}</Icon>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{item.label}</span>
        <span className="mt-0.5 block truncate text-[10px] text-faint">{item.description}</span>
      </span>
    </>
  );

  if (!item.to) {
    return (
      <button type="button" className={`${className} cursor-default opacity-80`} title="后续阶段接入">
        {content}
      </button>
    );
  }

  return (
    <Link to={item.to} className={className}>
      {content}
    </Link>
  );
}

function ActivityInterestDialog({
  notification,
  onDismiss
}: {
  notification: ReturnType<typeof useActivityNotifications>['notifications'][number] | undefined;
  onDismiss: (id: string) => void;
}) {
  const open = Boolean(notification);

  return (
    <Dialog modal={false} open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && notification) onDismiss(notification.id);
    }}>
      <DialogContent
        showOverlay={false}
        className="!left-auto !right-4 !top-4 !w-[min(380px,calc(100vw-2rem))] !max-w-none !translate-x-0 !translate-y-0 gap-3 rounded-3xl border-accent-soft bg-surface/95 p-4 shadow-card backdrop-blur"
      >
        {notification && (
          <div className="flex items-start gap-3 pr-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-strong">
              <Icon className="size-5"><path d="M12 21s-6-4.35-8.25-8.24A4.5 4.5 0 0 1 12 7.5a4.5 4.5 0 0 1 8.25 5.26C18 16.65 12 21 12 21Z" /></Icon>
            </span>
            <div className="min-w-0 flex-1">
              <DialogHeader className="gap-1 text-left">
                <DialogTitle className="text-sm">有人对你的活动感兴趣</DialogTitle>
                <DialogDescription className="text-xs leading-5">
                  《{notification.activityTitle}》现在有 {notification.interestCount} 个感兴趣。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-3 flex-row justify-start gap-2 sm:justify-start">
                <Button type="button" size="sm" variant="outline" onClick={() => onDismiss(notification.id)}>
                  我知道了
                </Button>
                <Button asChild size="sm" onClick={() => onDismiss(notification.id)}>
                  <Link to="/me/activities">查看我的活动</Link>
                </Button>
              </DialogFooter>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const currentUser = useAtomValue(currentUserAtom);
  const isConnected = useAtomValue(isConnectedAtom);
  const { restoreSession, logout } = useAuth();
  const [checking, setChecking] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { notifications, removeNotification } = useActivityNotifications(!checking, currentUser?.id ?? 'local-session');

  useEffect(() => {
    let cancelled = false;
    restoreSession().finally(() => {
      if (!cancelled) setChecking(false);
    });
    return () => { cancelled = true; };
  }, [restoreSession]);

  useEffect(() => {
    if (!checking && currentUser) {
      const publicPaths = ['/login', '/register'];
      if (publicPaths.includes(window.location.pathname)) {
        navigate({ to: '/activities', replace: true });
      }
    }
  }, [checking, currentUser, navigate]);

  if (checking) {
    return (
      <main className="min-h-screen bg-app flex items-center justify-center text-muted text-sm">
        加载中...
      </main>
    );
  }

  if (!currentUser) {
    return (
      <>
        <ActivityInterestDialog notification={notifications[0]} onDismiss={removeNotification} />
        <Outlet />
      </>
    );
  }

  const userTitle = `${currentUser.displayName} · ${roleLabel[currentUser.role]}`;
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate({ to: '/login', replace: true });
  };

  return (
    <main className="min-h-screen bg-app text-primary">
      <ActivityInterestDialog notification={notifications[0]} onDismiss={removeNotification} />
      <div className="grid min-h-screen grid-cols-[320px_minmax(0,1fr)] max-lg:grid-cols-[minmax(0,1fr)]">
        <aside className="flex h-screen flex-col border-r border-divider bg-rail p-4 max-lg:hidden">
          <section className="shrink-0">
            <div className="flex items-center gap-3 px-1">
              <div className="grid size-11 place-items-center rounded-[16px] border border-accent-soft bg-accent text-on-accent shadow-accent" title="活动中心">
                <Icon className="size-5"><path d="M3 21h18" /><path d="M6 21V9l6-4 6 4v12" /><path d="M9 21v-5h6v5" /><path d="M9 11h.01M15 11h.01" /></Icon>
              </div>
              <div>
                <p className="text-sm font-semibold text-strong">校园活动中心</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-faint">发现活动</p>
              </div>
            </div>

            <nav className="mt-6 grid gap-2" aria-label="功能导航">
              {navigationItems.map((item) => (
                <SidebarNavigationItem key={item.label} item={item} pathname={pathname} />
              ))}
              {currentUser.role === 'ADMIN' && (
                <SidebarNavigationItem
                  item={{
                    label: '管理后台',
                    description: '平台数据与活动分析',
                    to: '/admin',
                    activeWhen: (path) => path.startsWith('/admin'),
                    icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>
                  }}
                  pathname={pathname}
                />
              )}
            </nav>
          </section>

          <section className="mt-7 flex-1 rounded-3xl border border-divider bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-strong">关于这里</p>
            <h2 className="mt-2 text-sm font-semibold text-strong">校园活动中心</h2>
            <p className="mt-2 text-xs leading-5 text-muted">
              这里收集校园里值得一起参与的活动。你可以浏览活动、查看参与方式，也可以发布自己的活动邀请。
            </p>
          </section>

          <section className="mt-5 shrink-0 border-t border-divider pt-4">
            <div className="grid gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-muted transition hover:bg-hover hover:text-primary"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-active text-faint">
                  {theme === 'dark' ? (
                    <Icon className="size-[18px]"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></Icon>
                  ) : (
                    <Icon className="size-[18px]"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></Icon>
                  )}
                </span>
                <span>
                  <span className="block text-sm font-semibold">夜间模式</span>
                  <span className="block text-[10px] text-faint">当前：{theme === 'dark' ? '深色' : '浅色'}</span>
                </span>
              </button>

              <button type="button" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-muted transition hover:bg-hover hover:text-primary">
                <span className="grid size-10 place-items-center rounded-xl bg-active text-faint">
                  <Icon className="size-[18px]"><circle cx="12" cy="12" r="3" /><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" /></Icon>
                </span>
                <span>
                  <span className="block text-sm font-semibold">设置</span>
                  <span className="block text-[10px] text-faint">偏好、通知与安全</span>
                </span>
              </button>
            </div>

            <div className="relative mt-3">
              {userMenuOpen && (
                <div className="absolute bottom-16 left-0 z-20 w-full rounded-2xl border border-divider bg-surface p-2 text-sm shadow-card">
                  <div className="mb-2 border-b border-divider px-2 pb-2">
                    <div className="truncate font-medium text-primary">{currentUser.displayName}</div>
                    <div className="text-xs text-muted">{roleLabel[currentUser.role]}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-danger transition hover:bg-hover"
                  >
                    <Icon className="size-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></Icon>
                    退出登录
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-label={userTitle}
                title={userTitle}
                className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left transition hover:bg-hover"
              >
                <span className="relative grid size-10 place-items-center rounded-xl bg-active text-xs font-bold text-primary">
                  {currentUser.displayName.slice(0, 1).toUpperCase() || '?'}
                  <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card ${isConnected ? 'bg-online' : 'bg-faint'}`} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-strong">{currentUser.displayName}</span>
                  <span className="block truncate text-[10px] text-faint">{roleLabel[currentUser.role]} · 个人信息</span>
                </span>
              </button>
            </div>
          </section>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
