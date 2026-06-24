# 验收 Bug 记录 · validation-002

> 来源：第二轮聊天体验验收
> 状态：已整理归档

## Bug #1 · 聊天窗口应该内部滚动，而不是触发全局页面滚动

**状态**：✅ 已修复

### 现象

消息较多时，聊天窗口没有形成稳定的内部滚动区域，而是带动整个浏览器页面上下滚动。

### 根因

页面主布局使用 `min-h-screen`，没有把 workspace 固定为视口高度；消息区域虽然设置了滚动，但外层仍允许 body 参与滚动。

### 修复方向

- workspace 外层改为 `h-screen overflow-hidden`
- 中间聊天区域也固定为 `h-screen overflow-hidden`
- 消息列表组件保留 `overflow-y-auto`

### 涉及文件

```text
frontend/src/features/chat/ChatWorkspace.tsx
frontend/src/features/chat/components/MessageTimeline.tsx
```

---

## Bug #2 · 多频道消息渲染到同一个消息窗口

**状态**：✅ 已修复为当前 MVP 方案；长期能力升级见 Feature 文档

### 现象

两个用户分别在不同频道聊天时，消息仍可能显示到当前频道窗口。

### 根因

前端切频道时曾复用同一个 WebSocket 再发送 `USER_JOIN`。但当前后端 `SessionManager` 是单频道 session 模型：一个 WebSocket session 只能注册一次。

结果变成：

```text
前端 UI 已切到频道 B
后端 session 仍绑定频道 A
频道 A 的消息进入前端后，被当前频道窗口渲染
```

### 当前 MVP 修复方向

- 切换频道时关闭旧 WebSocket
- 新频道重新建立 WebSocket 并注册 `USER_JOIN`
- 前端收到 `channelId !== selectedChannelId` 的消息时直接丢弃

### 边界

这个方案保证当前 MVP 的频道隔离，但不支持：

- 非活跃频道实时接收消息
- 跨频道未读提醒
- 切回频道后拉取历史消息

这些能力升级为：

```text
docs/features/message-persistence.md
```

---

## Bug #3 · 每个频道消息窗口分开存储，但频道隔离逻辑错误

**状态**：✅ 已修复为当前 MVP 方案；长期能力升级见 Feature 文档

### 现象

前端尝试按频道缓存 timeline，但由于 WebSocket 实际仍绑定旧频道，导致：

1. 不同频道消息被接收到当前窗口
2. 当前窗口被错误缓存
3. 原本对应频道没有正确存储消息

### 根因

前端局部缓存不能替代后端订阅模型。当前后端只会给 session 推送它所绑定频道的消息，所以前端不能假设一个 socket 可以代表多个频道。

### 当前 MVP 修复方向

- 前端 timeline 只表示当前频道窗口
- `channelTimelinesRef` 只用于切频道时保存 / 恢复本地已看过的消息
- 不再把非当前频道消息写入当前 timeline

### 长期方向

如果要实现类 Discord 的完整体验，需要后端支持 workspace-level session，并引入消息持久化 / 多频道订阅模型。

对应 Feature：

```text
docs/features/message-persistence.md
```

---

## Bug #4 · 计算机学院频道会统计所有在线人员

**状态**：⬆️ 升级为 Feature

### 现象

在所有频道中，`计算机学院` 频道会直接统计所有在线人员，无论成员当前是否在该频道。

同时观察到：

- 老师身份可以被正确识别，并且在线人数会随频道变化更新
- 默认两个学生会一直被记录为在线，无论他们当前所在频道

### 重新定义

这个现象不再按 bug 处理，而是升级成产品能力：

> 用户登录应用后，就进入 workspace 在线状态。只要用户订阅 / 可见某个频道，该频道就能显示该用户在线，无论用户当前是否正在查看这个频道。

这更接近 Discord / Slack 的在线语义。

### 新产品语义

旧模型：

```text
在线 = 正在当前频道内
```

新模型：

```text
在线 = 用户打开了应用 / 连接了 workspace
频道在线成员 = 当前在线用户 ∩ 该频道订阅成员 / 可见成员
```

### 升级为 Feature

归档到：

```text
docs/features/workspace-presence.md
```
