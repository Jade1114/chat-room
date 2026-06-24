import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { organizationViewModels, type OrganizationViewModel } from '../features/organizations/organizationMock';
import { useTheme } from '../features/theme/useTheme';
import { currentUserAtom, isConnectedAtom } from '../state/chatAtoms';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/chat';

const roleLabel: Record<UserRole, string> = {
  MEMBER: '成员',
  ORGANIZER: '组织者',
  ADMIN: '管理员'
};

interface NavigationItem {
  label: string;
  description: string;
  to?: '/dashboard' | '/organizations' | '/messages' | '/admin';
  activeWhen?: (pathname: string) => boolean;
  icon: ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    label: '个人 Dashboard',
    description: '个人动态与待处理事项',
    to: '/dashboard',
    activeWhen: (pathname) => pathname.startsWith('/dashboard'),
    icon: <><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>
  },
  {
    label: '组织发现中心',
    description: '发现、加入和创建组织',
    to: '/organizations',
    activeWhen: (pathname) => pathname.startsWith('/organizations'),
    icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>
  },
  {
    label: '活动中心',
    description: '跨组织活动日程',
    icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>
  }
];

function OrganizationMark({ organization }: { organization: OrganizationViewModel }) {
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${organization.colors} text-sm font-bold text-white shadow-composer`}>
      {organization.mark}
    </span>
  );
}

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

function JoinedOrganizationCard({ organization, active }: { organization: OrganizationViewModel; active: boolean }) {
  return (
    <Link
      to="/organizations/$organizationId"
      params={{ organizationId: organization.id }}
      className={`group flex items-center gap-3 rounded-2xl border p-3 transition ${active ? 'border-accent-soft bg-accent-wash shadow-card' : 'border-divider bg-card hover:border-accent-soft hover:bg-hover'}`}
    >
      <OrganizationMark organization={organization} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-strong">{organization.name}</span>
        <span className="mt-0.5 block truncate text-[10px] text-faint">
          {organization.role} · {organization.channels.length} channels
        </span>
      </span>
      <Icon className="size-4 text-faint transition group-hover:translate-x-0.5 group-hover:text-muted">
        <path d="m9 18 6-6-6-6" />
      </Icon>
    </Link>
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

  useEffect(() => {
    let cancelled = false;
    restoreSession().finally(() => {
      if (!cancelled) setChecking(false);
    });
    return () => { cancelled = true; };
  }, [restoreSession]);

  useEffect(() => {
    if (!checking && !currentUser) {
      const publicPaths = ['/login', '/register'];
      if (!publicPaths.includes(window.location.pathname)) {
        navigate({ to: '/login', replace: true });
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
    return <Outlet />;
  }

  const userTitle = `${currentUser.displayName} · ${roleLabel[currentUser.role]}`;
  const activeOrganizationId = pathname.match(/\/organizations\/([^/]+)/)?.[1];
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate({ to: '/login', replace: true });
  };

  return (
    <main className="min-h-screen bg-app text-primary">
      <div className="grid min-h-screen grid-cols-[320px_minmax(0,1fr)] max-lg:grid-cols-[minmax(0,1fr)]">
        <aside className="flex min-h-screen flex-col border-r border-divider bg-rail p-4 max-lg:hidden">
          <section className="shrink-0">
            <div className="flex items-center gap-3 px-1">
              <div className="grid size-11 place-items-center rounded-[16px] border border-accent-soft bg-accent text-on-accent shadow-accent" title="Organization Platform">
                <Icon className="size-5"><path d="M3 21h18" /><path d="M6 21V9l6-4 6 4v12" /><path d="M9 21v-5h6v5" /><path d="M9 11h.01M15 11h.01" /></Icon>
              </div>
              <div>
                <p className="text-sm font-semibold text-strong">Chat Room</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-faint">Org Platform</p>
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
                    description: '组织治理与平台配置',
                    to: '/admin',
                    activeWhen: (path) => path.startsWith('/admin'),
                    icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>
                  }}
                  pathname={pathname}
                />
              )}
            </nav>
          </section>

          <section className="mt-7 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-faint">Joined</p>
                <h2 className="mt-0.5 text-sm font-semibold text-strong">我的组织</h2>
              </div>
              <span className="rounded-full bg-active px-2 py-1 text-[10px] font-semibold text-muted">
                {organizationViewModels.length}
              </span>
            </div>
            <div className="grid gap-2">
              {organizationViewModels.map((organization) => (
                <JoinedOrganizationCard
                  key={organization.id}
                  organization={organization}
                  active={activeOrganizationId === organization.id}
                />
              ))}
            </div>
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
