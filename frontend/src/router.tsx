import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { AssignmentsPrototype } from './features/assignments/AssignmentsPrototype';
import { ChatWorkspace } from './features/chat/ChatWorkspace';
import { ClubsPrototype } from './features/clubs/ClubsPrototype';
import { TeacherCommunicationPrototype } from './features/communication/TeacherCommunicationPrototype';
import { RegisterPage } from './features/auth/RegisterPage';
import { LoginPage } from './features/workspace/LoginPage';
import { WorkspaceDashboard } from './features/workspace/WorkspaceDashboard';
import { AdminPage } from './features/admin/AdminPage';
import { AppShell } from './layouts/AppShell';

const rootRoute = createRootRoute({
  component: AppShell
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/login' });
  }
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages',
  component: ChatWorkspace
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: WorkspaceDashboard
});

const assignmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/assignments',
  component: AssignmentsPrototype
});

const teacherCommunicationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/teacher-communication',
  component: TeacherCommunicationPrototype
});

const clubsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clubs',
  component: ClubsPrototype
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPage
});

const legacyDirectMessagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/direct-messages',
  beforeLoad: () => {
    throw redirect({ to: '/teacher-communication' });
  }
});

const legacyMembersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/members',
  beforeLoad: () => {
    throw redirect({ to: '/clubs' });
  }
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  dashboardRoute,
  messagesRoute,
  assignmentsRoute,
  teacherCommunicationRoute,
  clubsRoute,
  adminRoute,
  legacyDirectMessagesRoute,
  legacyMembersRoute
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
