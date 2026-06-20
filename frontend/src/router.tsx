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

const directMessagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/direct-messages',
  component: () => (
    <FeaturePlaceholderPage
      eyebrow="Direct messages"
      title="师生私聊"
      description="为课程之外的一对一沟通提供独立空间，并与公开频道消息保持清晰分离。"
      actions={['按成员发起会话', '保留个人会话列表', '支持未读提醒与消息历史']}
      icon={<Icon className="size-6"><path d="M8 18H5l-3 3v-5a4 4 0 0 1-1-2.7V7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" /><path d="M14 13h6a2 2 0 0 1 2 2v6l-3-2h-5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z" /></Icon>}
    />
  )
});

const membersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/members',
  component: () => (
    <FeaturePlaceholderPage
      eyebrow="Directory"
      title="校园成员"
      description="按学校、院系、班级和课程关系查找成员，为频道协作与私聊提供统一入口。"
      actions={['按组织关系浏览成员', '搜索教师与学生', '查看身份和课程归属']}
      icon={<Icon className="size-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Icon>}
    />
  )
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  messagesRoute,
  assignmentsRoute,
  directMessagesRoute,
  membersRoute
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
