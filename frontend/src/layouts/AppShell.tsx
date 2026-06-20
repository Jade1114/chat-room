import { useAtomValue } from 'jotai';
import { Link, Outlet } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { useTheme } from '../features/theme/useTheme';
import { useWorkspaceSession } from '../features/workspace/useWorkspaceSession';
import { currentUserAtom, isConnectedAtom } from '../state/chatAtoms';
import type { UserRole } from '../types/chat';

const roleLabel: Record<UserRole, string> = {
  STUDENT: '学生',
  TEACHER: '教师',
  ADMIN: '管理员'
};

interface NavigationItem {
  label: string;
  to: '/messages' | '/assignments' | '/teacher-communication' | '/clubs';
  icon: ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    label: '消息',
    to: '/messages',
    icon: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 9h8M8 13h5" /></>
  },
  {
    label: '作业',
    to: '/assignments',
    icon: <><path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" /><rect width="6" height="4" x="9" y="3" rx="1" /><path d="m9 14 2 2 4-4" /></>
  },
  {
    label: '师生交流',
    to: '/teacher-communication',
    icon: <><path d="m2 7 10-4 10 4-10 4Z" /><path d="M6 9.5V14c3 2 9 2 12 0V9.5" /><path d="M16 19h5l2 2v-7a2 2 0 0 0-2-2h-1" /></>
  },
  {
    label: '社团广场',
    to: '/clubs',
    icon: <><path d="m3 11 17-5v12L3 14Z" /><path d="M11.6 16.5 13 21H7l-1.8-6" /><path d="M20 10a2 2 0 0 1 0 4" /></>
  }
];

export function AppShell() {
  useWorkspaceSession();
  const { theme, toggleTheme } = useTheme();

  const currentUser = useAtomValue(currentUserAtom);
  const isConnected = useAtomValue(isConnectedAtom);
  const userTitle = currentUser
    ? `${currentUser.displayName} · ${roleLabel[currentUser.role]}`
    : '正在加载用户';

  return (
    <main className="min-h-screen bg-app text-primary">
      <div className="grid min-h-screen grid-cols-[64px_minmax(0,1fr)] max-md:grid-cols-[56px_minmax(0,1fr)]">
        <aside className="flex min-h-screen flex-col items-center border-r border-divider bg-rail px-2 py-4">
          <div className="grid size-10 place-items-center rounded-[14px] border border-accent-soft bg-accent text-on-accent shadow-accent" title="星河大学">
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

          <div
            aria-label={userTitle}
            title={userTitle}
            className="relative mb-1 grid size-10 place-items-center rounded-xl bg-active text-xs font-bold text-primary"
          >
            {currentUser?.displayName.slice(0, 1).toUpperCase() || '?'}
            <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-rail ${isConnected ? 'bg-online' : 'bg-faint'}`} />
          </div>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
