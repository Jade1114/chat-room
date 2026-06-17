# Chat Room Frontend

聊天室前端，采用 React + TypeScript + Vite + Tailwind CSS + Jotai + TanStack Router。

## 本地运行

```bash
pnpm install
pnpm dev
```

默认地址：`http://localhost:5173`

## 构建验证

```bash
pnpm build
```

## 环境变量

复制 `.env.example` 为 `.env.local`，按需修改：

```bash
VITE_WS_URL=ws://localhost:8080/ws/chat
VITE_API_BASE_URL=http://localhost:8080
```

- `VITE_WS_URL`：聊天 WebSocket 地址。
- `VITE_API_BASE_URL`：REST API 前缀（会调用 `/api/me`、`/api/mock-users`、`/api/channels`）。

## 当前界面

- 模拟登录用户选择。
- 类 Discord 的频道侧边栏。
- 可访问频道列表与频道资料。
- WebSocket 聊天时间线：系统消息、自己消息、其他用户消息。
- 输入框支持 Enter 发送，Shift + Enter 换行。
