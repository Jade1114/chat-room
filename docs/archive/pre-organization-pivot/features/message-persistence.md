# Feature: 消息持久化 & 多频道订阅

> 来源：Bug #1（离开频道后无法收到未读消息）→ 升级为 Feature
>
> 状态：✅ MVP 已实现
>
> 最近实现：`2f238b0 feat: add channel unread counts`

## 问题

系统最初是单频道实时聊天室：用户正在看哪个频道，后端就只把该频道消息推到该 session。

这会导致一个产品问题：

```text
用户不在某个频道时，会错过该频道的新消息；切回频道后也不知道自己错过了什么。
```

这个 Feature 的目标不是立刻做完整 Slack / Discord 级消息系统，而是先完成高校频道协作中最关键的闭环：

```text
消息可保存 → 错过可恢复 → 频道有未读提醒 → 进入频道后清零
```

## 目标

1. 用户不在某频道时，该频道的新消息能持久化存储。✅ MVP 已实现
2. 用户切回该频道后，能看到错过的消息。✅ MVP 已实现
3. 频道侧边栏能展示真实未读数量。✅ MVP 已实现
4. 用户打开频道后，该频道未读数量清零。✅ MVP 已实现
5. Redis 未读计数丢失时，可以通过 MySQL 读状态恢复。✅ MVP 已实现

## 当前实现状态

### 1. MySQL 消息事实源

新增表：

```text
chat_message
```

相关文件：

```text
backend/sql/schema.sql
backend/sql/migrations/001_chat_message.sql
backend/src/main/java/com/yuy/chatroom/mapper/MessageMapper.java
backend/src/main/java/com/yuy/chatroom/service/MessageHistoryService.java
```

当前写入顺序：

```text
WebSocket USER_CHAT
→ MessageProcessor 校验 session / channel 权限
→ 补齐 userId / displayName / channelId / messageId / sentAt
→ MySQL INSERT chat_message
→ Redis 缓存最近消息
→ RabbitMQ 发布
→ Consumer 广播给当前正在查看该频道的 sessions
```

MVP 选择：

```text
MySQL 是事实源；Redis 只是最近消息热缓存。
```

### 2. Redis 最近消息缓存

当前 Redis key：

```text
channel:messages:{channelId}
```

行为：

```text
发送成功 → LPUSH 最近消息 → LTRIM 保留最近 100 条
读取最近消息 → 优先读 Redis → Redis 为空则回退 MySQL 并回填缓存
```

### 3. 历史消息 API

接口：

```http
GET /api/channels/{channelId}/messages?userId={userId}&limit=50
GET /api/channels/{channelId}/messages?userId={userId}&before={sentAt}&limit=50
```

权限规则：

```text
用户无权访问该频道 → 返回 404
```

这和频道权限约定一致：

```text
没有权限的频道不出现在“我的频道”中；直接访问频道详情 / 历史消息也返回 404。
```

### 4. 前端进入频道加载最近历史

相关文件：

```text
frontend/src/lib/chatApi.ts
frontend/src/hooks/useChatRoom.ts
```

行为：

```text
进入 / 切换频道
→ GET /api/channels/{channelId}/messages
→ 将历史消息转换为 timeline item
→ 与当前实时消息按 messageId 合并去重
```

### 5. 频道未读数量

最近提交：

```text
2f238b0 feat: add channel unread counts
```

新增读状态表：

```text
user_channel_read_state
```

相关文件：

```text
backend/sql/schema.sql
backend/sql/migrations/003_user_channel_read_state.sql
backend/src/main/java/com/yuy/chatroom/mapper/ReadStateMapper.java
backend/src/main/java/com/yuy/chatroom/service/UnreadMessageService.java
backend/src/main/java/com/yuy/chatroom/service/ChatMessageConsumer.java
backend/src/main/java/com/yuy/chatroom/service/MessageProcessor.java
backend/src/main/java/com/yuy/chatroom/controller/CampusController.java
frontend/src/features/chat/components/ChannelSidebar.tsx
frontend/src/hooks/useChatRoom.ts
frontend/src/types/chat.ts
```

Redis key：

```text
user:unread:{userId}
  Hash<channelId, count>
```

事件链路：

```text
USER_CHAT
→ MySQL INSERT chat_message
→ Redis 最近消息缓存
→ RabbitMQ 发布
→ ChatMessageConsumer 消费消息
→ 广播给当前正在查看该频道的 sessions
→ UnreadMessageService 找到该频道所有可见用户
→ 排除发送者
→ 排除当前正在查看该频道的用户
→ HINCRBY user:unread:{userId} {channelId} 1
→ 对在线用户推送 UNREAD_CHANGED 轻量事件
```

用户打开频道时：

```text
CHANNEL_VIEW_CHANGED(channelId)
→ HSET user:unread:{userId} {channelId} 0
→ UPSERT user_channel_read_state(last_read_at)
```

频道列表接口：

```http
GET /api/channels?userId={userId}
```

返回每个频道的：

```json
{
  "id": "ch-java",
  "name": "Java 后端开发",
  "unreadCount": 1
}
```

前端侧边栏展示规则：

```text
unreadCount > 0 且不是当前频道 → 展示数字 badge
进入该频道 → 前端立即置 0，后端也清零 Redis / read_state
```

## 已验证行为

最近手动 / smoke 验收：

```text
Mina 登录 workspace，当前查看 ch-school
Yuy 登录 workspace，当前查看 ch-java
Yuy 在 ch-java 发送消息
Mina 收到 UNREAD_CHANGED(channelId=ch-java)
GET /api/channels?userId=u-stu-2 返回 ch-java.unreadCount = 1
Mina 切到 ch-java
GET /api/channels?userId=u-stu-2 返回 ch-java.unreadCount = 0
```

真实 smoke 结果：

```json
{
  "unreadJava": 1,
  "hasUnreadEvent": true,
  "unreadAfterOpen": 0
}
```

构建验证：

```text
mvn test       → BUILD SUCCESS
pnpm build     → ✓ built
```

## 当前仍保留的边界

### 1. 前端上滑分页加载

后端已经支持：

```http
before={sentAt}
```

但前端目前只加载最近 50 条，还没有做：

```text
上滑到顶部 → 加载更早消息
```

### 2. RabbitMQ 发布失败后的补偿语义

当前顺序是：

```text
MySQL 已保存 → RabbitMQ 发布失败 → 前端收到 FAILED
```

这会出现一种 MVP 可接受但需要记录的边界情况：

```text
前端以为发送失败，但刷新历史时可能看到该消息。
```

后续可选方案：

1. MVP 继续接受这个 trade-off。
2. ACK 语义细分为 `PERSISTED_BUT_NOT_DELIVERED`。
3. 引入 outbox pattern，保证持久化和消息发布最终一致。

### 3. 跨频道“完整消息内容”实时推送

当前已经实现：

```text
用户在线但正在看其他频道时，可以实时收到 UNREAD_CHANGED 轻量事件。
```

但普通聊天消息本体仍只广播给：

```java
sessionManager.getSessionsByChannelId(channelId)
```

也就是说：

```text
当前频道 → 收到完整 USER_CHAT
其他频道 → 收到 UNREAD_CHANGED + unreadCount 增加
```

这符合当前 MVP：用户知道别的频道有新消息；点进去后通过历史 API 加载完整消息。

## 与 Workspace Presence 的关系

这个 Feature 解决的是：

```text
用户没看当前频道时，消息如何保留 / 如何恢复 / 如何提醒。
```

另一个相关 Feature 解决的是：

```text
用户登录应用后，如何在所有可见频道中展示为在线。
```

对应文档：

```text
docs/features/workspace-presence.md
```

两者共同把系统从“单频道聊天室”升级为：

```text
workspace + 多频道消息系统
```

## 下一步建议

从 产品型工程师视角，下一步不继续堆消息基础设施，而是把这条基础链路落到真实高校协作场景中：

```text
课程通知 / 官方公告
```

推荐顺序：

1. 新增 `ANNOUNCEMENT` 消息类型。
2. 教师 / 管理员可在课程或组织频道发布正式通知。
3. 公告复用现有持久化、历史加载、未读计数链路。
4. 前端用不同样式区分普通聊天与正式通知。
5. 验收“教师发布通知 → 学生离线 / 在其他频道 → 未读提醒 → 进入频道看到公告 → 未读清零”。

对应新 Feature 文档：

```text
docs/features/course-announcement.md
```
