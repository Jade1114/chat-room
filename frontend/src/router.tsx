import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { ChatPage } from './pages/ChatPage';

const rootRoute = createRootRoute({
  component: () => <Outlet />
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ChatPage
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
