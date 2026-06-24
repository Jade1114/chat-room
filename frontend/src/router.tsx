import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { ChatWorkspace } from './features/chat/ChatWorkspace';
import { RegisterPage } from './features/auth/RegisterPage';
import { LoginPage } from './features/workspace/LoginPage';
import { WorkspaceDashboard } from './features/workspace/WorkspaceDashboard';
import { AdminPage } from './features/admin/AdminPage';
import { OrganizationChannelPage } from './features/organizations/OrganizationChannelPage';
import { OrganizationDetailPage } from './features/organizations/OrganizationDetailPage';
import { OrganizationDiscoverPage } from './features/organizations/OrganizationDiscoverPage';
import { ActivitySchedulePage } from './features/organizations/ActivitySchedulePage';
import { CreateOrganizationPage } from './features/organizations/CreateOrganizationPage';
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

const clubsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clubs',
  beforeLoad: () => {
    throw redirect({ to: '/organizations' });
  }
});

const organizationsRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/organizations',
  component: OrganizationDiscoverPage
});

const createOrganizationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/organizations/create',
  component: CreateOrganizationPage
});

const organizationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/organizations/$organizationId',
  component: OrganizationDetailPage
});

const organizationChannelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/organizations/$organizationId/channels/$channelId',
  component: OrganizationChannelPage
});

const legacyMembersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/members',
  beforeLoad: () => {
    throw redirect({ to: '/organizations' });
  }
});

const activityScheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activities',
  component: ActivitySchedulePage
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPage
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  dashboardRoute,
  messagesRoute,
  clubsRoute,
  adminRoute,
  activityScheduleRoute,
  organizationsRootRoute,
  createOrganizationRoute,
  organizationDetailRoute,
  organizationChannelRoute,
  legacyMembersRoute
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
