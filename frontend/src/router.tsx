import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { RegisterPage } from './features/auth/RegisterPage';
import { LoginPage } from './features/workspace/LoginPage';
import { WorkspaceDashboard } from './features/workspace/WorkspaceDashboard';
import { AdminPage } from './features/admin/AdminPage';
import { OrganizationChannelPage } from './features/organizations/OrganizationChannelPage';
import { OrganizationDetailPage } from './features/organizations/OrganizationDetailPage';
import { OrganizationDiscoverPage } from './features/organizations/OrganizationDiscoverPage';
import { ActivitySchedulePage } from './features/organizations/ActivitySchedulePage';
import { ActivityDetailPage } from './features/activities/ActivityDetailPage';
import { ActivityFormPage } from './features/activities/ActivityFormPage';
import { MyActivitiesPage } from './features/activities/MyActivitiesPage';
import { CreateOrganizationPage } from './features/organizations/CreateOrganizationPage';
import { AppShell } from './layouts/AppShell';

const rootRoute = createRootRoute({
  component: AppShell
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/activities' });
  }
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    const token = localStorage.getItem('chat_room_token');
    if (token) {
      throw redirect({ to: '/activities' });
    }
  },
  component: LoginPage
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  beforeLoad: () => {
    const token = localStorage.getItem('chat_room_token');
    if (token) {
      throw redirect({ to: '/activities' });
    }
  },
  component: RegisterPage
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  beforeLoad: () => {
    throw redirect({ to: '/activities' });
  },
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

const activityNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activities/new',
  component: ActivityFormPage
});

const activityDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activities/$activityId',
  component: ActivityDetailPage
});

const myActivitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/me/activities',
  component: MyActivitiesPage
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
  clubsRoute,
  adminRoute,
  activityScheduleRoute,
  activityNewRoute,
  activityDetailRoute,
  myActivitiesRoute,
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
