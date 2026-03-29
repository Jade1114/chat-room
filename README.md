
这是一个基于 WebSocket 的多人在线聊天室后端项目。项目的目标并不是实现一个功能完备的聊天产品，而是以聊天室为载体，系统训练 Java 后端在并发、多线程、缓存、消息队列和实时通信等方面的进阶能力。在实现过程中，项目逐步引入了房间级并发广播、Redis 在线状态同步、RabbitMQ 聊天消息链路以及前后端分离与联调等内容。

## 为什么做这个项目

相比普通 CRUD 项目，聊天室天然具备实时消息流、在线状态维护、并发访问和异步解耦等场景，更适合训练 Java 后端在并发控制、缓存设计、消息队列接入和系统分层上的能力。因此，这个项目的重点始终是技术演进和能力训练，而不是堆叠大量业务功能。

## 重点训练内容

- 并发与多线程
- 缓存与共享状态管理
- 消息队列与异步解耦
- 前后端分离与联调
- 系统设计与分层职责划分

## 当前架构

### 系统运行核心类

- `backend/src/main/java/com/yuy/chatroom/service/MessageProcessor.java`
- `backend/src/main/java/com/yuy/chatroom/service/SessionManager.java`
- `backend/src/main/java/com/yuy/chatroom/service/BroadcastService.java`

### 本阶段技术演进核心类

- `backend/src/main/java/com/yuy/chatroom/service/MessageProcessor.java`
- `backend/src/main/java/com/yuy/chatroom/service/ChatMessagePublisher.java`
- `backend/src/main/java/com/yuy/chatroom/service/ChatMessageConsumer.java`

### 状态层

- **内存主状态**：`backend/src/main/java/com/yuy/chatroom/service/SessionManager.java`
- **Redis 衍生状态**：`backend/src/main/java/com/yuy/chatroom/service/RoomPresenceManager.java`

### 配置层

- `backend/src/main/java/com/yuy/chatroom/config/WebSocketConfig.java`
- `backend/src/main/java/com/yuy/chatroom/config/RabbitMqConfig.java`

## 核心链路

### 1. 聊天消息主链路

`WebSocketHandler -> MessageProcessor -> ChatMessagePublisher -> RabbitMQ -> ChatMessageConsumer -> BroadcastService`

说明：

- `USER_CHAT` 当前优先走 RabbitMQ 链路。
- `MessageProcessor` 负责消息合法性校验，并用服务端真实状态补齐 `sender` 和 `roomId`。
- `ChatMessagePublisher` 负责将聊天消息发布到 RabbitMQ。
- RabbitMQ 使用 bucket queue 方案：`roomId -> bucketIndex -> queueName`。
- `ChatMessageConsumer` 消费消息后调用 `BroadcastService` 执行最终广播，并清理异常 session。

### 2. 加入 / 离开事件链路

`WebSocketHandler -> MessageProcessor -> SessionManager -> RoomPresenceManager -> BroadcastDispatcher -> BroadcastService`

说明：

- `USER_JOIN` 与 `USER_LEAVE` 当前仍然走本地广播链路。
- `SessionManager` 管理 JVM 内存中的 session 主状态。
- `RoomPresenceManager` 负责同步 Redis 中的房间在线状态。
- `BroadcastDispatcher` 仍然承担加入 / 离开事件的本地异步广播。

## 当前技术演进阶段

### Phase 1：最小可运行聊天室

- 建立 WebSocket 聊天主链路
- 完成最小消息收发

### Phase 2：并发与房间模型

- 从全局广播升级到房间级广播
- 引入房间内串行、房间间并行的受控并发模型
- 增强 session 管理与线程安全

### Phase 3：Redis 状态同步

- 区分内存主状态与 Redis 衍生状态
- 同步维护：
  - `room:{roomId}:users`
  - `user:{username}:room`
- 为在线状态查询和后续多实例演进打基础

### Phase 4：RabbitMQ 聊天消息链路

- `USER_CHAT` 接入 RabbitMQ
- 配置固定 bucket queue 拓扑
- 完成 producer / consumer / exchange / binding / JSON converter 的第一版闭环

## RabbitMQ 设计说明

当前采用固定 bucket queue 方案，而不是“一个房间一个 queue”。

### 设计原因

- 保证同房间消息稳定落到同一个 bucket 中
- 保留房间内顺序性
- 通过多个 bucket 保留一定程度的并行能力
- 避免队列数量随着房间数无限增长

### 当前规则

- `bucketCount = 4`
- `bucketIndex = abs(roomId.hashCode()) % 4`
- queue 名称：`chat.queue.{bucketIndex}`
- routing key：`{bucketIndex}`

## 当前项目边界

当前版本更强调技术演进路线和核心链路打通，而不是业务功能完整性。因此有以下明确边界：

- 不追求完整产品功能
- 不追求复杂的前端展示
- 不追求消息可靠性、死信队列、幂等等 RabbitMQ 生产级能力
- 不追求 Redis 状态治理的全部细节（如 TTL、恢复策略、多实例一致性）

## 当前待优化点

- `BroadcastDispatcher` 与 RabbitMQ 链路仍处于迁移期双轨并存状态
- `MessageProcessor` 中 Redis 重试逻辑还可继续抽象
- `RoomPresenceManager` 的补偿逻辑还有进一步收口空间
- `ChatMessagePublisher` 中部分过渡性逻辑后续可以继续清理
- 文档与项目表达刚刚建立，后续还可继续打磨

## 运行要求

当前项目运行依赖：

- Java 21
- Redis
- RabbitMQ

## 配置说明

配置文件位于：

- `backend/src/main/resources/application.yaml`

当前至少需要填写：

- Redis 连接信息
- RabbitMQ 连接信息

## 如何验证当前阶段是否工作

建议按以下顺序验证：

1. 启动 Redis
2. 启动 RabbitMQ
3. 启动后端项目
4. 建立两个 WebSocket 客户端连接到同一房间
5. 发送一条 `USER_CHAT`
6. 观察日志中是否出现：
   - RabbitMQ 发布成功
   - RabbitMQ 消费成功
7. 确认同房间客户端能够收到广播消息
8. 再验证 `USER_JOIN / USER_LEAVE` 是否仍然正常广播

## 项目定位总结

这个项目不是一个面向产品功能的聊天室，而是一个以聊天室为载体的 Java 后端进阶训练项目。它的核心价值在于：
