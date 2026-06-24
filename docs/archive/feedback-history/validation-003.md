# validation-003：Docker Compose 部署验收反馈

> 验收主题：Phase 1 Docker Compose 本机部署闭环。
>
> 当前相关提交：
>
> - `1da9814 chore: add docker compose deployment`
> - `cd6058f fix: use latest channel for realtime messages`
> - `24246f3 feat(frontend): improve Safari Enter key handling and add global message navigation`

## 本轮修复总结

本轮累计发现 6 项反馈，其中 4 项已修复并提交，1 项语义边界已记录，1 项为后续 Auth 大功能：

| # | 反馈 | 状态 | 提交 |
|---|------|------|------|
| 1 | 去除 mock 用户，注册登录 | `下一步 Feature 主线` | — |
| 2 | 聊天不具备实时性 | `✅ 已修复` | `cd6058f` |
| 3 | Safari 拼音输入法 Enter 误发送 | `✅ 已修复` | `24246f3` |
| 4 | 登录后应进入 dashboard | `✅ 已修复` | `24246f3` |
| 5 | 红点消除和显示逻辑不明确 | `✅ 暂未复现 / 语义边界已记录` | — |
| 6 | MySQL 字符集乱码 | `✅ 已修复` | `1da9814` |

后续：进入 #1 注册登录 Feature 设计。

## 验收结论

当前 Docker Compose 部署链路已通过本机验收：

```text
frontend/nginx
→ /api 代理 backend REST
→ /ws 代理 backend WebSocket
→ backend
→ MySQL / Redis / RabbitMQ
```

已确认：

- `http://localhost:3000` 可访问；
- 频道 API 可返回正确中文；
- MySQL 初始化字符集问题已修复；
- 同频道实时聊天暂未复现问题；
- 跨频道未读红点暂未复现问题；
- Docker Compose 服务正常运行。

---

## 1. 系统类：去除 mock 用户数据，通过注册登录实现全流程

状态：`🔄 下一步 Feature 主线`

设计文档：

```text
docs/features/auth.md
```

核心设计决定：

- Token 方案：JWT（jjwt 0.12.x）；
- 注册：最小注册（学号 + 显示名 + 密码），默认 STUDENT 角色；
- 旧 mock 用户保留但 password_hash = NULL，不可登录；
- Dev 开关：开发环境保留 Mock 快捷入口。

后续实现范围：

- 注册 / 登录 API；
- JWT 签发与验证；
- BCrypt 密码哈希；
- REST API 全局 token 校验；
- WebSocket 连接级 JWT 校验；
- WORKSPACE_JOIN / USER_CHAT 不再信任前端传的 userId；
- 前端登录态持久化 + 路由保护。~~

---

## 2. 系统类：聊天不具备实时性

原始反馈：

> 聊天不具备实时性，哪怕两个人在同一个频道内，也不能实时加载别人发送的消息。

状态：`✅ 已修复 / 待长期观察`

修复提交：

```text
cd6058f fix: use latest channel for realtime messages
```

根因：

前端 WebSocket `onmessage` 绑定时，`pushChat` 使用了 React closure 里的旧 `selectedChannelId`。

用户切换频道后，WebSocket 收到 `USER_CHAT`，但前端可能仍然用旧频道判断：

```ts
if (message.channelId && message.channelId !== selectedChannelId) {
  return;
}
```

导致消息已到达浏览器，但被前端状态层丢弃。

修复：

改为使用最新 ref：

```ts
const currentChannelId = selectedChannelRef.current;

if (message.channelId && message.channelId !== currentChannelId) {
  return;
}
```

涉及文件：

```text
frontend/src/hooks/useChatRoom.ts
```

验收结果：

用户复验后暂未发现问题。

---

## 3. 浏览器适配：Safari 中文输入法 Enter 误发送

原始反馈：

> Safari 浏览器的回车机制不明确，使用拼音输入法时按下回车会直接发送消息，而不是关闭拼音输入法。

状态：`✅ 已修复 / 待 Safari 实机复验`

修复点：

`MessageComposer.tsx` 在原有 `event.nativeEvent.isComposing` 基础上补充 Safari 兼容保护：

- `nativeEvent.isComposing`：处理标准 IME composing 状态；
- `nativeEvent.keyCode === 229`：兼容部分浏览器 IME keydown；
- `compositionend` 后 80ms 内的 Enter 不触发送：规避 Safari 中 `compositionend → keydown(Enter)` 顺序导致的误发送。

涉及文件：

```text
frontend/src/features/chat/components/MessageComposer.tsx
```

本地浏览器验证：

- 手动触发 `compositionend` 后立即 Enter：不会发送，草稿保留；
- 等待后普通 Enter：正常发送。

---

## 4. 系统类：进入系统后不应该直接进入默认频道

原始反馈：

> 进入系统后，不应该直接进入一个默认的频道。而是进入一个 dashboard 页面。

状态：`✅ 已修复 / 待产品验收`

当前行为：

登录后进入 dashboard：

```text
/login 选择身份
→ /dashboard
→ 用户主动选择频道
→ /messages
```

Dashboard 展示：

- Workspace 连接状态；
- 我的频道数量；
- 总未读；
- 需要处理的未读频道；
- 最近可进入频道；
- 我的课程频道。

同时调整消息页逻辑：

- 频道列表加载后不再自动 fallback 到第一个频道；
- 未选择频道时禁用发送；
- 用户点击频道后才发送 `CHANNEL_VIEW_CHANGED` 并加载历史消息。

涉及文件：

```text
frontend/src/features/workspace/WorkspaceDashboard.tsx
frontend/src/features/workspace/LoginPage.tsx
frontend/src/hooks/useChatRoom.ts
frontend/src/state/chatAtoms.ts
frontend/src/router.tsx
frontend/src/layouts/AppShell.tsx
```

---

## 5. 系统类：红点消除和显示逻辑不明确

原始反馈：

> 使用 admin，chen 两个身份在课程频道「分布式实时通信」中聊天，其中一人不在当前频道，另一人发送消息时，没有红点推送。但刷新 chen 的页面之后就好了。

状态：`✅ 当前暂未复现 / 语义边界已记录`

排查结果：

后端 unread 事实状态和实时 `UNREAD_CHANGED` 链路在干净 session 下可以通过：

```json
{
  "chenUnreadWebsocket": 1,
  "chenHasUnreadEvent": true,
  "adminAck": true
}
```

发现的语义边界：

当前 unread 是按 `userId + channelId` 计算，不是按单个浏览器窗口计算。

也就是说，如果同一个用户有多个窗口：

```text
Chen 窗口 A 正在看 ch-websocket
Chen 窗口 B 正在看 ch-java
Admin 在 ch-websocket 发消息
```

当前系统会认为：

```text
Chen 已经有一个 session 正在看 ch-websocket
→ ch-websocket 对 Chen 不算未读
```

这是当前模型的设计边界，不是刷新问题本身。

当前产品语义：

```text
未读 = 用户级别未读
不是窗口级别未读
```

后续如果希望每个窗口都独立显示红点，需要把 unread 提醒从用户级模型扩展为 session/view 级模型。

---

## 6. 部署类：MySQL 字符集 / 排序规则不一致导致中文乱码

原始反馈：

> MySQL 字符集 / 排序规则不一致，导致存储的数据乱码。前端没办法查看信息。

状态：`✅ 已修复`

修复提交：

```text
1da9814 chore: add docker compose deployment
```

根因：

Docker MySQL 镜像会根据：

```yaml
MYSQL_DATABASE: chat_room
```

提前创建数据库。此时如果只在 SQL 中写：

```sql
CREATE DATABASE IF NOT EXISTS chat_room
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

由于数据库已存在，`IF NOT EXISTS` 不会修改已有库的 collation。

同时 seed SQL 没有显式：

```sql
SET NAMES utf8mb4;
```

导致中文 seed 被错误解释并写入数据库。

修复点：

1. MySQL 容器指定 server charset / collation：

```yaml
command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
```

2. schema 初始化中补：

```sql
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER DATABASE chat_room
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

3. seed SQL 中补：

```sql
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. JDBC URL 显式指定字符集 / collation。

验收结果：

数据库和 API 都返回正确中文：

```text
计算机学院
```

对应 UTF-8 HEX：

```text
E8AEA1E7AE97E69CBAE5ADA6E999A2
```

---

## 后续处理顺序建议

下一步建议不要继续改部署基础设施，优先处理产品/体验问题：

```text
P1: Safari 中文输入法 Enter 误发送
P1: 登录后进入 dashboard，而不是默认频道
P2: 真实注册 / 登录系统
```

其中 Safari 输入法问题影响中文输入体验，建议优先级高于 dashboard。
