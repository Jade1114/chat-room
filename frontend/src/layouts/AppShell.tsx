import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Link, Outlet } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Icon } from '../components/Icon';
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
  to: '/dashboard' | '/messages' | '/clubs' | '/admin';
  icon: ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    label: '首页',
    to: '/dashboard',
    icon: <><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>
  },
  {
    label: '消息',
    to: '/messages',
    icon: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 9h8M8 13h5" /></>
  },
  {
    label: '组织广场',
    to: '/clubs',
    icon: <><path d="m3 11 17-5v12L3 14Z" /><path d="M11.6 16.5 13 21H7l-1.8-6" /><path d="M20 10a2 2 0 0 1 0 4" /></>
  }
];

export function AppShell() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate({ to: '/login', replace: true });
  };

  return (
    <main className="min-h-screen bg-app text-primary">
      <div className="grid min-h-screen grid-cols-[64px_minmax(0,1fr)] max-md:grid-cols-[56px_minmax(0,1fr)]">
        <aside className="flex min-h-screen flex-col items-center border-r border-divider bg-rail px-2 py-4">
          <div className="grid size-10 place-items-center rounded-[14px] border border-accent-soft bg-accent text-on-accent shadow-accent" title="Organization Platform">
            <Icon className="size-5"><path d="M3 21h18" /><path d="M6 21V9l6-4 6 4v12" /><path d="M9 21v-5h6v5" /><path d="M9 11h.01M15 11h.01" /></Icon>
          </div>

          <nav className="mt-7 flex flex-1 flex-col items-center gap-2" aria-label="主导航">
            {navigationItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className="group relative grid size-10 place-items-center rounded-xl text-faint transition hover:bg-hover hover:text-muted data-[status=active]:bg-accent-soft data-[status=active]:text-accent"
              >
                <span className="absolute -left-2 h-5 w-0.5 rounded-r-full bg-accent opacity-0 transition group-data-[status=active]:opacity-100" />
                <Icon className="size-[19px]">{item.icon}</Icon>
              </Link>
            ))}
            {currentUser?.role === 'ADMIN' && (
              <Link
                to="/admin"
                title="管理"
                className="group relative grid size-10 place-items-center rounded-xl text-faint transition hover:bg-hover hover:text-muted data-[status=active]:bg-accent-soft data-[status=active]:text-accent"
              >
                <span className="absolute -left-2 h-5 w-0.5 rounded-r-full bg-accent opacity-0 transition group-data-[status=active]:opacity-100" />
                <Icon className="size-[19px]"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></Icon>
              </Link>
            )}
          </nav>

          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? '切换为浅色主题' : '切换为深色主题'}
            aria-label={theme === 'dark' ? '切换为浅色主题' : '切换为深色主题'}
            className="mb-2 grid size-10 place-items-center rounded-xl text-faint transition hover:bg-hover hover:text-primary"
          >
            {theme === 'dark' ? (
              <Icon className="size-[18px]"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" /></Icon>
            ) : (
              <Icon className="size-[18px]"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></Icon>
            )}
          </button>

          <div className="relative mb-1">
            {userMenuOpen && (
              <div className="absolute bottom-12 left-0 z-20 w-40 rounded-xl border border-divider bg-surface p-2 text-sm shadow-card">
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
              className="relative grid size-10 place-items-center rounded-xl bg-active text-xs font-bold text-primary transition hover:bg-hover"
            >
              {currentUser?.displayName.slice(0, 1).toUpperCase() || '?'}
              <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-rail ${isConnected ? 'bg-online' : 'bg-faint'}`} />
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
