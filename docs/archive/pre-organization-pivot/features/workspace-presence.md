# Feature: Workspace 级在线状态与频道订阅可见性

> 来源：validation-002 Bug #4 → 升级为 Feature
>
> 状态：✅ MVP 已实现，仍保留后续增强项
>
> 最近实现：`9717d07 feat: connect workspace session on login`、`2f238b0 feat: add channel unread counts`

## 背景

系统最初采用的是传统聊天室模型：

```text
用户进入频道 A → 频道 A 在线人数 +1
用户切到频道 B → 频道 A 在线人数 -1，频道 B 在线人数 +1
```

这个模型适合“单房间聊天室”，但不适合类 Discord / Slack 的 workspace 产品。

目标产品语义是：

```text
用户登录应用后，即进入 workspace 在线状态。
只要用户订阅 / 可见某个频道，该频道就能显示该用户在线。
用户当前正在查看哪个频道，不影响它在其他订阅频道里的在线可见性。
```

## 产品目标

1. 用户登录后，状态变为 workspace-level online。✅ MVP 已实现
2. 用户可见 / 订阅的所有频道，都能展示该用户在线。✅ MVP 已实现
3. 频道在线人数不再表示“当前正在看该频道的人”，而是表示“在线且可见该频道的人”。✅ MVP 已实现
4. 为后续私聊、未读提醒、跨频道消息通知做铺垫。✅ 未读提醒 MVP 已实现

## 已确认设计原则

### 1. 登录账号后即进入在线状态

在线状态的来源不是“进入某个频道”，而是：

```text
用户完成登录 / 选择身份
→ 前端建立 workspace-level WebSocket session
→ 后端记录 userId ↔ sessionId
→ 用户进入 workspace online
```

也就是说，最终模型里：

```text
online = 当前账号存在至少一个有效 workspace session
```

而不是：

```text
online = 当前正在某个频道内
```

频道只记录用户当前正在查看哪里：

```text
currentChannelId = 当前视图状态
```

它不决定用户是否在线。

### 2. 频道订阅 / 可见性以 MySQL 为事实源

“我的频道”展示不由 Redis presence 决定，也不由前端自行过滤决定，而是由 MySQL 中的用户关系和订阅关系决定。

当前规则可以继续收束为：

```text
SCHOOL      → 用户 school_id 匹配
DEPARTMENT  → 用户 department_id 匹配
CLASS       → 用户 class_id 匹配
COURSE      → user_course 中存在订阅关系
```

因此：

```text
我的频道 = MySQL 权限 / 订阅关系计算出的可访问频道
```

Redis 只负责热状态：

```text
谁在线
哪个 session 正在看哪个频道
未读计数缓存
```

Redis 不负责判定用户是否有权访问某频道。

### 3. 频道在线成员 = Redis 在线状态 ∩ MySQL 频道可见用户

频道在线列表来自两个事实的交集：

```text
workspaceOnlineUsers = Redis workspace:online
channelVisibleUsers  = MySQL 权限 / 订阅关系
channelOnlineUsers   = workspaceOnlineUsers ∩ channelVisibleUsers
```

这保证了：

```text
用户登录后，在所有自己可见 / 订阅的频道中显示在线；
没有权限的频道不会因为用户在线而出现。
```

## 旧模型与新模型

### 旧模型：Channel Presence

```text
channel:presence:{channelId} = 当前正在该频道内的用户集合
```

特点：

- 切频道会改变在线人数
- WebSocket session 绑定单个 channelId
- 实现简单，但产品体验更像聊天室

### 目标模型：Workspace Presence + Channel Visibility

```text
workspace:online = 当前打开应用的用户集合
channelMembers(channelId) = 可见 / 订阅该频道的用户集合
channelOnlineMembers(channelId) = workspace:online ∩ channelMembers(channelId)
```

特点：

- 登录应用即在线
- 切频道只是视图切换，不影响在线状态
- 频道在线人数来自“在线用户”和“频道成员关系”的交集
- 更接近 Discord / Slack

## 当前实现状态

### 已实现：Redis workspace online

当前 Redis key：

```text
workspace:online
  Set<userId>

workspace:user:sessions:{userId}
  Set<sessionId>

workspace:session:user:{sessionId}
  String userId

workspace:session:channel:{sessionId}
  String currentChannelId

channel:viewing:{channelId}
  Set<sessionId>
```

相关文件：

```text
backend/src/main/java/com/yuy/chatroom/service/ChannelPresenceService.java
```

行为：

```text
connect(userId, sessionId, channelId)
→ userId 加入 workspace:online
→ sessionId 加入 workspace:user:sessions:{userId}
→ 记录 session 当前查看的频道

 disconnect(userId, sessionId)
→ 移除该 session
→ 如果该 userId 没有剩余 session，才从 workspace:online 移除
```

这已经支持：

```text
同一用户多标签页打开时，只计算一次在线人数。
```

### 已实现：频道在线人数按权限交集计算

相关文件：

```text
backend/src/main/java/com/yuy/chatroom/service/CampusDirectoryService.java
```

当前逻辑：

```text
accessibleUserIds = 当前频道的可访问用户集合
onlineUserIds = workspace:online ∩ accessibleUserIds
```

这意味着：

```text
用户只要 workspace online，就会在所有自己有权限访问的频道中显示在线。
```

频道权限仍然由用户角色 / 学校 / 院系 / 班级 / 课程关系决定。

最近修复也验证了这个规则：

```text
Yuy 没有 course-websocket 权限 → “分布式实时通信”不会出现在“我的频道”中
直接访问 ch-websocket 详情 / 历史消息 → 404
Teacher 仍有 course-websocket 权限 → 仍能看到该频道
```

## 当前实现状态补充

这次实现已经从“进入频道才在线”推进到“登录后建立 workspace WebSocket”。频道切换不再代表重新进入一个聊天室，而是更新当前 session 的视图状态。

### 1. 登录后建立 workspace WebSocket

当前前端行为：

```text
用户选择身份登录
→ useChatRoom.connectWorkspace()
→ 建立 WebSocket
→ 发送 WORKSPACE_JOIN
→ 后端 tryRegisterWorkspaceSession(session, userId, displayName)
→ Redis workspace:online 增加 userId
```

对应文件：

```text
frontend/src/hooks/useChatRoom.ts
backend/src/main/java/com/yuy/chatroom/service/MessageProcessor.java
backend/src/main/java/com/yuy/chatroom/service/SessionManager.java
```

### 2. 切频道更新当前视图，不再重连

当前切频道行为：

```text
pickChannel(channelId)
→ 发送 CHANNEL_VIEW_CHANGED(channelId)
→ 后端校验用户是否有权访问频道
→ SessionManager.updateCurrentChannel(session, channelId)
→ ChannelPresenceService.setCurrentChannel(sessionId, channelId)
→ UnreadMessageService.clearUnread(userId, channelId)
```

这意味着：

```text
WebSocket session = workspace 连接
currentChannelId = 当前正在看的频道
```

### 3. SessionManager 仍保留 channel -> sessions 索引

当前 `SessionManager` 同时维护两类关系：

```text
session -> UserSessionInfo(userId, displayName, currentChannelId)
channelId -> Set<WebSocketSession>
userId -> Set<WebSocketSession>
```

其中 `channelId -> sessions` 不是授权来源，只是为了高效广播当前频道消息。

授权仍然由：

```text
CampusDirectoryService.canAccess(userId, channelId)
```

决定。

### 4. 跨频道未读提醒已实现

最近提交：

```text
2f238b0 feat: add channel unread counts
```

当前已经支持：

```text
用户在线但正在看其他频道
→ 其他频道有新消息
→ 用户收到 UNREAD_CHANGED 轻量事件
→ 频道侧边栏 unreadCount 增加
→ 用户进入该频道后 unreadCount 清零
```

这一步解决的是“跨频道提醒”，不是“跨频道直接推完整消息内容”。

### 5. 普通聊天消息本体仍只推给当前频道 sessions

当前 RabbitMQ Consumer 仍然广播给：

```text
sessionManager.getSessionsByChannelId(channelId)
```

因此当前语义是：

```text
当前正在看该频道 → 收到完整 USER_CHAT
在线但正在看其他频道 → 收到 UNREAD_CHANGED
离线用户 → Redis / MySQL 保留 unread 状态，下次上线读取
```

这符合当前 MVP：

```text
不是所有频道消息都实时刷屏，而是在侧边栏提示未读；点进频道后加载历史消息。
```

## 后续增强项

### Step 1：课程通知 / 官方公告

从 Frank 的产品型工程师视角，下一步应该把现有 workspace + history + unread 能力落到真实高校协作场景：

```text
教师 / 管理员发布课程通知
→ 学生即使不在线也不会错过
→ 频道列表有未读提醒
→ 进入频道后看到公告样式消息
```

对应文档：

```text
docs/features/course-announcement.md
```

### Step 2：跨频道完整消息推送策略

当前只跨频道推 `UNREAD_CHANGED`，后续如果要更接近 Slack / Discord，可以继续拆：

```text
当前频道：完整消息渲染
非当前频道：未读 + toast / 通知中心
高优先级公告：可选择额外弹出提示
```

## 与消息持久化 Feature 的关系

这个 Feature 和消息持久化是同一方向的两个侧面：

```text
workspace-level presence 解决“用户是否在线”
message persistence 解决“用户没看当前频道时，消息怎么保留 / 未读怎么计算”
```

对应文档：

```text
docs/features/message-persistence.md
```

两者最终会共同把系统从“单频道聊天室”升级为：

```text
workspace + 多频道消息系统
```

## 验收标准进度

1. 用户 A 登录后，不进入具体频道，也会被标记为 workspace online。✅ MVP 已实现
2. 用户 A 可见的频道都能展示 A 在线。✅ MVP 已实现
3. 用户 A 切换频道时，其他频道在线人数不减少。✅ MVP 已实现
4. 用户 A 关闭页面 / 断开最后一个 session 后，所有可见频道都不再显示 A 在线。✅ MVP 已实现
5. 同一用户多标签页打开时，只计算一次在线人数。✅ MVP 已实现
6. 老师、学生、管理员的频道可见范围由权限模型决定，而不是由当前所在频道决定。✅ 已验证
7. 用户在线但正在看其他频道时，可以收到未读提醒而不是丢消息。✅ MVP 已实现