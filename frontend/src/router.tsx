import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { Icon } from './components/Icon';
import { ChatWorkspace } from './features/chat/ChatWorkspace';
import { AppShell } from './layouts/AppShell';
import { FeaturePlaceholderPage } from './pages/FeaturePlaceholderPage';

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
  component: () => (
    <FeaturePlaceholderPage
      eyebrow="Assignments"
      title="作业分发与提交"
      description="围绕课程组织作业发布、学生提交和教师反馈。当前先建立稳定入口，业务数据将在课程与身份体系之上接入。"
      actions={['教师按课程发布作业', '学生查看截止时间并提交', '教师集中批改与反馈']}
      icon={<Icon className="size-6"><path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" /><rect width="6" height="4" x="9" y="3" rx="1" /><path d="m9 14 2 2 4-4" /></Icon>}
    />
  )
});

const teacherCommunicationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/teacher-communication',
  component: () => (
    <FeaturePlaceholderPage
      eyebrow="Teacher communication"
      title="师生交流"
      description="围绕课程、公告和作业建立定向沟通，让问题与教学上下文保持关联，而不是扩展成泛社交私聊。"
      actions={['从课程或作业发起交流', '保留问题所属的教学上下文', '集中查看教师回复与处理进度']}
      icon={<Icon className="size-6"><path d="m2 7 10-4 10 4-10 4Z" /><path d="M6 9.5V14c3 2 9 2 12 0V9.5" /><path d="M16 19h5l2 2v-7a2 2 0 0 0-2-2h-1" /></Icon>}
    />
  )
});

const clubsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clubs',
  component: () => (
    <FeaturePlaceholderPage
      eyebrow="Club plaza"
      title="社团广场"
      description="用宣传墙集中展示社团介绍、招新和活动内容，让学生发现校园组织，并进入感兴趣的社团频道持续交流。"
      actions={['浏览社团宣传墙与分类', '发布招新和校园活动', '从宣传内容进入社团频道']}
      icon={<Icon className="size-6"><path d="m3 11 17-5v12L3 14Z" /><path d="M11.6 16.5 13 21H7l-1.8-6" /><path d="M20 10a2 2 0 0 1 0 4" /></Icon>}
    />
  )
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
