import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { AssignmentsPrototype } from './features/assignments/AssignmentsPrototype';
import { ChatWorkspace } from './features/chat/ChatWorkspace';
import { ClubsPrototype } from './features/clubs/ClubsPrototype';
import { TeacherCommunicationPrototype } from './features/communication/TeacherCommunicationPrototype';
import { AppShell } from './layouts/AppShell';

const rootRoute = createRootRoute({
  component: AppShell
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/messages' });
  }
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/messages',
  component: ChatWorkspace
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
  messagesRoute,
  assignmentsRoute,
  teacherCommunicationRoute,
  clubsRoute,
  legacyDirectMessagesRoute,
  legacyMembersRoute
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
