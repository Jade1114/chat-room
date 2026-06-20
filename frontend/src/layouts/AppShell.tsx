import { useAtomValue } from 'jotai';
import { Link, Outlet } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Icon } from '../components/Icon';
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
  to: '/messages' | '/assignments' | '/direct-messages' | '/members';
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
    label: '私聊',
    to: '/direct-messages',
    icon: <><path d="M8 18H5l-3 3v-5a4 4 0 0 1-1-2.7V7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" /><path d="M14 13h6a2 2 0 0 1 2 2v6l-3-2h-5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z" /></>
  },
  {
    label: '成员',
    to: '/members',
    icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>
  }
];

export function AppShell() {
  useWorkspaceSession();

  const currentUser = useAtomValue(currentUserAtom);
  const isConnected = useAtomValue(isConnectedAtom);
  const userTitle = currentUser
    ? `${currentUser.displayName} · ${roleLabel[currentUser.role]}`
    : '正在加载用户';

  return (
    <main className="min-h-screen bg-[#080d13] text-[#e8edf2]">
      <div className="grid min-h-screen grid-cols-[64px_minmax(0,1fr)] max-md:grid-cols-[56px_minmax(0,1fr)]">
        <aside className="flex min-h-screen flex-col items-center border-r border-white/[0.06] bg-[#090f16] px-2 py-4">
          <div className="grid size-10 place-items-center rounded-[14px] border border-emerald-200/20 bg-emerald-300 text-[#07120f] shadow-[0_8px_28px_rgba(52,211,153,0.14)]" title="星河大学">
            <Icon className="size-5"><path d="M3 21h18" /><path d="M6 21V9l6-4 6 4v12" /><path d="M9 21v-5h6v5" /><path d="M9 11h.01M15 11h.01" /></Icon>
          </div>

          <nav className="mt-7 flex flex-1 flex-col items-center gap-2" aria-label="主导航">
            {navigationItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className="group relative grid size-10 place-items-center rounded-xl text-slate-600 transition hover:bg-white/[0.05] hover:text-slate-300 data-[status=active]:bg-emerald-300/10 data-[status=active]:text-emerald-300"
              >
                <span className="absolute -left-2 h-5 w-0.5 rounded-r-full bg-emerald-300 opacity-0 transition group-data-[status=active]:opacity-100" />
                <Icon className="size-[19px]">{item.icon}</Icon>
              </Link>
            ))}
          </nav>

          <div
            aria-label={userTitle}
            title={userTitle}
            className="relative mb-1 grid size-10 place-items-center rounded-xl bg-white/[0.06] text-xs font-bold text-slate-300"
          >
            {currentUser?.displayName.slice(0, 1).toUpperCase() || '?'}
            <span className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#090f16] ${isConnected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          </div>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
