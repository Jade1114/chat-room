# Known Engineering Concerns

> 这份文档记录 `codebase-architecture-review` 发现的工程问题。当前 MVP 开发优先，这些问题暂不处理，但不应遗忘。
>
> 每次大型重构前应重新审视此文档，决定哪些优先修复。

## 1. SessionManager 纯内存（跨实例盲区）

**位置**: `SessionManager.java`

`ConcurrentHashMap<WebSocketSession, UserSessionInfo>` 是所有 WS session 的唯一注册表。单实例下工作正常。

**问题**: 多实例部署时，RabbitMQ consumer 的 `broadcastService.broadcastMessage()` 调用 `sessionManager.getSessionsByChannelId()` 只能拿到**当前实例**的 session。其他实例上同频道的用户收不到广播。

**优先级**: P3（多实例部署前必须解决）

---

## 2. BroadcastDispatcher 固定容量阻塞队列

**位置**: `BroadcastDispatcher.java`

```java
new ArrayBlockingQueue<Message>(10)
```

每个频道一个固定容量 10 的阻塞队列。当频道消息量超过队列容量时，`put()` 阻塞调用线程（`MessageProcessor.handleUserChat` 在其中被调用）。

**问题**: 即使是单实例环境，消息突增（如多个用户快速发消息）也可能导致 WS 处理线程阻塞，影响该频道所有消息处理。

**优先级**: P3

---

## 3. N+1 查询：在线用户逐个查 display name

**位置**: `OrganizationDirectoryService.java:103-107`

```java
Map<String, String> idToName = onlineUserIds.stream()
    .map(this::getCurrentUser)         // ← 每个用户一次 SQL
    .filter(user -> user != null)
    .collect(Collectors.toMap(CurrentUser::getId, CurrentUser::getDisplayName));
```

代码已标注 `TODO: N+1`。在线用户数增长时性能开销线性增加。

**建议修复**: batch load（`WHERE id IN (...)`）或用 Redis 缓存 display name。

**优先级**: P4

---

## 4. PlatformController 保留 query-param 权限逃逸

**位置**: `PlatformController.java:88-94`

```java
private String resolveUserId(HttpServletRequest request, String queryUserId) {
    String authUserId = (String) request.getAttribute("userId");
    if (authUserId != null) {
        return authUserId;
    }
    // Fallback: old query-param style for migration period
    return queryUserId;
}
```

**问题**: 标注为"迁移期"的 query-param fallback 仍是**安全漏洞**。任何知道 userId 的人可以直接通过 `/api/channels/{id}?userId=u-yuy` 绕开 JWT 鉴权访问任意用户的可访问频道。

**建议修复**: 去掉 `queryUserId` fallback，全走 JWT attribute。

**优先级**: P2（安全漏洞）

---

## 5. 前端 Timeline 未读清除不稳定

**位置**: `useChatRoom.ts` 中 `sendChannelViewChanged` + `handleServerMessage`

前端切换频道时：
1. 本地立即设置 `unreadCount: 0`（纯 UI 行为）
2. 发送 `CHANNEL_VIEW_CHANGED` 让后端清 Redis

**问题**: 如果 WS 连接在 #1 和 #2 之间断开，Redis 未读计数不会被清除。下次用户重连时看到的未读计数是旧的（偏高）。

**优先级**: P4

---

## 6. RabbitMQ bucket 数硬编码为 4

**位置**: `RabbitMqConfig.java`, `ChatMessagePublisher.java:21`, `ChatMessageConsumer.java`

```java
private final int BUCKET_COUNT = 4;
```

修改 bucket 数需要同时改：
- `RabbitMqConfig.java`（增减 queue bean + binding bean）
- `ChatMessagePublisher.BUCKET_COUNT`（决定 hash 分布）
- `ChatMessageConsumer`（增减 `@RabbitListener` 方法）
- 手动重建 RabbitMQ 队列

**问题**: 不是功能缺陷，但动态调整成本高。

**优先级**: P5（只有在需要水平扩展消息吞吐时才需要动）

---

## 7. JWT 24h 过期且无 refresh token

**位置**: `JwtTokenProvider.java`

```java
private final long EXPIRATION_MS = 24 * 60 * 60 * 1000;
```

**问题**: 用户会话最长 24 小时。超过后前端无法静默续期，只能跳转登录页。当前通过 `/api/auth/me` 检测过期，用户体验尚可但不够平滑。

**优先级**: P5

---

## 8. WebSocket 消息无速率限制

**位置**: `WebSocketHandler.java` / `MessageProcessor.java`

任何已认证的 WS 连接可以任意频率发送 `USER_CHAT`。没有 per-session 的速率控制。

**问题**: 恶意客户端可以高频发消息导致：
- MySQL 写入压力
- RabbitMQ 队列堆积
- 广播给所有在线用户造成消息风暴

**建议修复**: `MessageProcessor` 中加 per-session 的 token bucket 或 sliding window 限流。

**优先级**: P5

---

## 9. 未读 UNREAD_CHANGED 乐观通知

**位置**: `ChatMessageConsumer.java:63-66`

```java
Set<WebSocketSession> failedSessions = broadcastService.broadcastMessage(unreadMessage,
    sessionManager.getSessionsByUserId(userId));
sessionManager.removeSessions(failedSessions);
```

**问题**: 如果用户的所有 WS session 都已断开，`getSessionsByUserId()` 返回空集合，UNREAD_CHANGED 不回送。但 Redis 未读计数已经增加了。用户下次打开页面时只能靠 idle unread 重建（`getUnreadCount` fallback），这需要一次 MySQL 查询。

**优先级**: P4

---

## 10. 代码风格不一致

**位置**: `MessageProcessor.java`

`isValidChatMessage` 中对 `message.getContent().trim()` 调用了两次 `trigger` → `isBlue`。建议提取为局部变量。

**优先级**: P6
