# Manual Acceptance Checklist

> 目的：用轻量手动验收方式证明当前 MVP 可运行、可观察、可解释。
>
> 当前 MVP 主线：身份 -> 频道 -> 权限 -> WebSocket 聊天 -> Redis presence -> RabbitMQ 消息分发。

## 1. 验收范围

本验收文档只覆盖当前 MVP，不覆盖后续大功能。

### 1.1 当前验收内容

- Mock 用户身份；
- 根据用户身份获取可访问频道；
- 获取频道详情与在线用户；
- WebSocket 加入频道；
- 频道权限校验；
- 同频道实时聊天；
- Redis presence 在线状态；
- RabbitMQ 消息发布、消费和广播；
- 前端构建和后端编译。

### 1.2 当前不验收内容

- 真实注册 / 密码登录 / JWT；
- 完整组织管理后台；
- 作业发布与提交；
- 社团申请与审批；
- 私聊；
- 文件上传；
- 历史消息持久化；
- 已读未读；
- 完整通知系统。

---

## 2. 前置依赖

后端默认连接本机服务：

| 依赖     | 默认地址         | 说明                  |
| -------- | ---------------- | --------------------- |
| MySQL    | `localhost:3306` | 数据库名：`chat_room` |
| Redis    | `localhost:6379` | 维护频道在线状态      |
| RabbitMQ | `localhost:5672` | 聊天消息分发          |
| Backend  | `localhost:8080` | Spring Boot 服务      |
| Frontend | Vite dev server  | React 前端            |

后端配置见：

```text
backend/src/main/resources/application.yaml
```

后端启动时会通过 Spring Boot Config Data 读取 `backend/.env`：

```yaml
spring.config.import: optional:file:.env[.properties]
```

本地首次启动前，确认 `backend/.env` 已存在；如果不存在，可参考 `backend/.env.example` 创建。`.env` 文件被 `.gitignore` 忽略，不应提交真实本地密码。

前端配置见：

```text
frontend/src/config.ts
```

默认前端请求地址：

```text
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws/chat
```

---

## 3. 数据库初始化

在 MySQL 中依次执行：

```bash
mysql -u root -p < backend/sql/schema.sql
mysql -u root -p < backend/sql/seed.sql
```

初始化后应存在以下核心数据：

### 3.1 用户

| userId        | displayName | role    |
| ------------- | ----------- | ------- |
| `u-stu-1`     | Yuy         | STUDENT |
| `u-stu-2`     | Mina        | STUDENT |
| `u-teacher-1` | Chen        | TEACHER |
| `u-admin-1`   | Admin       | ADMIN   |

### 3.2 频道

| channelId      | name           | type       |
| -------------- | -------------- | ---------- |
| `ch-school`    | 全校大厅       | SCHOOL     |
| `ch-cs`        | 计算机学院     | DEPARTMENT |
| `ch-cs-2401`   | 计科 2401 班   | CLASS      |
| `ch-java`      | Java 后端开发  | COURSE     |
| `ch-websocket` | 分布式实时通信 | COURSE     |

---

## 4. 启动与构建验证

### 4.1 后端编译验证

```bash
cd backend
mvn test
```

期望结果：

```text
BUILD SUCCESS
```

说明：当前没有测试用例时会显示：

```text
No tests to run
```

这是可接受状态，但后续可以补充轻量集成测试。

### 4.2 前端构建验证

```bash
cd frontend
pnpm build
```

期望结果：

```text
✓ built
```

### 4.3 启动后端

```bash
cd backend
mvn spring-boot:run
```

期望：

- Spring Boot 正常启动；
- 未报 MySQL / Redis / RabbitMQ 连接失败；
- 监听 `localhost:8080`。

### 4.4 启动前端

```bash
cd frontend
pnpm dev
```

期望：

- Vite dev server 正常启动；
- 浏览器可打开前端页面；
- 前端能请求后端 API。

---

## 5. REST API 验收

以下命令默认后端运行在 `localhost:8080`。

### 5.1 获取当前用户

```bash
curl 'http://localhost:8080/api/me?userId=u-stu-1'
```

期望：

- HTTP 200；
- 返回用户 `u-stu-1`；
- `displayName` 为 `Yuy`；
- `role` 为 `STUDENT`；
- 包含 `courseIds`。

### 5.2 获取学生可访问频道

```bash
curl 'http://localhost:8080/api/channels?userId=u-stu-1'
```

期望包含：

- `ch-school`；
- `ch-cs`；
- `ch-cs-2401`；
- `ch-java`；
- `ch-websocket`。

期望不包含：

- `ch-math`；
- `ch-math-2401`；
- `ch-linear-algebra`。

验收意义：学生只能看到与自己学校、院系、班级、课程相关的频道。

### 5.3 获取教师可访问频道

```bash
curl 'http://localhost:8080/api/channels?userId=u-teacher-1'
```

期望包含：

- `ch-school`；
- `ch-cs`；
- `ch-java`；
- `ch-websocket`。

验收意义：教师可以看到自己授课课程相关频道。

### 5.4 获取管理员可访问频道

```bash
curl 'http://localhost:8080/api/channels?userId=u-admin-1'
```

期望：

- 返回全部频道。

验收意义：管理员拥有全频道访问能力。

### 5.5 获取有权限的频道详情

```bash
curl 'http://localhost:8080/api/channels/ch-java?userId=u-stu-1'
```

期望：

- HTTP 200；
- 返回 `ch-java`；
- 包含 `onlineCount`；
- 包含 `onlineUsers`。

### 5.6 获取无权限的频道详情

```bash
curl -i 'http://localhost:8080/api/channels/ch-linear-algebra?userId=u-stu-1'
```

期望：

- HTTP 404。

验收意义：频道详情接口不能绕过权限校验。

---

## 6. WebSocket 协议验收

WebSocket 地址：

```text
ws://localhost:8080/ws/chat
```

协议字段：

```json
{
  "type": "USER_JOIN",
  "userId": "u-stu-1",
  "displayName": "Yuy",
  "channelId": "ch-java",
  "content": "进入了当前频道"
}
```

```json
{
  "type": "USER_CHAT",
  "displayName": "Yuy",
  "channelId": "ch-java",
  "content": "大家好"
}
```

### 6.1 前端手动验收

步骤：

1. 打开前端页面；
2. 选择 `Yuy` 身份进入系统；
3. 点击 `Java 后端开发` 频道；
4. 输入并发送一条消息；
5. 再打开一个浏览器窗口或另一个用户身份；
6. 进入同一频道；
7. 验证两个窗口能实时看到消息。

期望：

- 进入频道后连接状态正常；
- 发送消息后当前窗口显示发送状态；
- 同频道其他窗口能收到消息；
- 右侧在线用户列表会更新。

### 6.2 命令行 WebSocket 验收（可选）

如果安装了 `websocat`：

```bash
websocat ws://localhost:8080/ws/chat
```

发送加入消息：

```json
{
  "type": "USER_JOIN",
  "userId": "u-stu-1",
  "displayName": "Yuy",
  "channelId": "ch-java",
  "content": "进入了当前频道"
}
```

发送聊天消息：

```json
{
  "type": "USER_CHAT",
  "displayName": "Yuy",
  "channelId": "ch-java",
  "content": "hello from websocat"
}
```

期望：

- 服务端不报 JSON 解析错误；
- 加入有权限频道成功；
- 聊天消息经 RabbitMQ 消费后被广播回来。

### 6.3 无权限加入频道验收

用 `u-stu-1` 尝试加入 `ch-linear-algebra`：

```json
{
  "type": "USER_JOIN",
  "userId": "u-stu-1",
  "displayName": "Yuy",
  "channelId": "ch-linear-algebra",
  "content": "进入了当前频道"
}
```

期望：

- 后端日志出现无权访问频道提示；
- session 不应注册到该频道；
- Redis presence 不应写入该用户到该频道。

---

## 7. Redis presence 验收

Redis key 设计：

```text
channel:presence:{channelId}
channel:user:sessions:{channelId}:{userId}
```

### 7.1 用户进入频道后写入 presence

进入 `ch-java` 后执行：

```bash
redis-cli SMEMBERS channel:presence:ch-java
```

期望：

```text
u-stu-1
```

查看用户 session：

```bash
redis-cli SMEMBERS channel:user:sessions:ch-java:u-stu-1
```

期望：

- 至少存在一个 WebSocket sessionId。

### 7.2 同一用户多标签页只计 1

步骤：

1. 使用同一用户 `u-stu-1` 打开两个窗口；
2. 两个窗口都进入 `ch-java`；
3. 执行：

```bash
redis-cli SCARD channel:presence:ch-java
redis-cli SCARD channel:user:sessions:ch-java:u-stu-1
```

期望：

- `channel:presence:ch-java` 中 `u-stu-1` 只出现一次；
- `channel:user:sessions:ch-java:u-stu-1` 中有多个 sessionId；
- 前端在线人数按用户去重，而不是按标签页数量计数。

### 7.3 最后一个连接断开后清理 presence

步骤：

1. 关闭 `u-stu-1` 在 `ch-java` 的所有窗口；
2. 执行：

```bash
redis-cli SMEMBERS channel:presence:ch-java
redis-cli EXISTS channel:user:sessions:ch-java:u-stu-1
```

期望：

- `u-stu-1` 从 `channel:presence:ch-java` 中移除；
- `channel:user:sessions:ch-java:u-stu-1` 被删除。

### 7.4 当前边界

当前 presence 依赖 WebSocket 正常断开来清理。

如果服务进程异常崩溃，Redis 中可能残留 session 信息。后续可通过以下方式增强：

- session key TTL；
- WebSocket 心跳；
- 定期清理任务；
- 服务启动时清理本实例残留。

---

## 8. RabbitMQ 消息分发验收

当前 RabbitMQ 设计：

- exchange：`exchange01`；
- queue：`chat.queue.0`、`chat.queue.1`、`chat.queue.2`、`chat.queue.3`；
- routing key：`0`、`1`、`2`、`3`；
- bucket 根据 `channelId.hashCode() % 4` 计算。

### 8.1 队列存在

如果有 `rabbitmqctl`：

```bash
rabbitmqctl list_queues name messages consumers
```

期望看到：

```text
chat.queue.0
chat.queue.1
chat.queue.2
chat.queue.3
```

并且后端启动后对应队列应有 consumer。

### 8.2 发送聊天消息后发布与消费成功

步骤：

1. 前端进入 `ch-java`；
2. 发送聊天消息；
3. 观察后端日志。

期望看到类似日志：

```text
RabbitMQ 发布成功 channelId=ch-java bucketIndex=...
RabbitMQ 消费成功 channelId=ch-java message=...
```

### 8.3 前端收到消息状态

发送消息后，前端应经历：

```text
发送中 -> 已接收 -> 已送达
```

说明：

- `已接收` 表示后端已成功发布到 RabbitMQ；
- `已送达` 表示消息经 Consumer 消费后广播回前端。

### 8.4 当前边界

当前 RabbitMQ 链路主要证明消息接收与分发解耦。

当前不保证：

- 完整跨节点广播；
- 消息持久化；
- 消息重试；
- 死信队列；
- 历史消息查询；
- 严格全局顺序。

这些属于后续增强，不是当前 MVP 验收范围。

---

## 9. 当前 MVP 验收清单

### 9.1 构建

- [ ] 后端 `mvn test` 通过；
- [ ] 前端 `pnpm build` 通过。

### 9.2 REST

- [ ] `/api/me?userId=u-stu-1` 返回 Yuy；
- [ ] `/api/channels?userId=u-stu-1` 只返回学生可访问频道；
- [ ] `/api/channels?userId=u-teacher-1` 返回教师相关频道；
- [ ] `/api/channels?userId=u-admin-1` 返回全部频道；
- [ ] 有权限频道详情返回 200；
- [ ] 无权限频道详情返回 404。

### 9.3 WebSocket

- [ ] 用户可以加入有权限频道；
- [ ] 无权限频道不能加入；
- [ ] 同频道多用户能实时收发消息；
- [ ] 断开连接后触发离开事件。

### 9.4 Redis presence

- [ ] 用户进入频道后写入 `channel:presence:{channelId}`；
- [ ] 同一用户多标签页只计 1 个在线用户；
- [ ] 最后一个 session 离开后移除 presence；
- [ ] 频道详情中的 `onlineCount` 和 `onlineUsers` 与 Redis 状态一致。

### 9.5 RabbitMQ

- [ ] `chat.queue.0` 到 `chat.queue.3` 存在；
- [ ] 发送聊天消息后后端日志显示发布成功；
- [ ] Consumer 消费后消息广播到当前频道；
- [ ] 前端消息状态从发送中更新到已接收 / 已送达。

---

## 10. 验收结论记录模板

每次验收后可以在这里追加记录：

```text
日期：
分支 / commit：
后端构建：通过 / 失败
前端构建：通过 / 失败
REST 验收：通过 / 失败
WebSocket 验收：通过 / 失败
Redis presence 验收：通过 / 失败
RabbitMQ 验收：通过 / 失败
发现的问题：
下一步：
```

## 11. 验收记录

### 2026-06-22 第一轮 MVP 验收

```text
分支 / commit：f9f858c feat(docs): add manual acceptance checklist for MVP validation
后端构建：通过（mvn test -> BUILD SUCCESS, No tests to run）
前端构建：通过（pnpm build -> ✓ built）
后端启动：通过（Spring Boot started on localhost:8080）
REST 验收：通过
WebSocket 验收：通过
Redis presence 验收：通过
RabbitMQ 验收：通过
```

发现的问题：

- 后端默认不会自动读取 `backend/.env`，导致 `application.yaml` 中的环境变量占位符无法解析，启动时曾在 Redis port 绑定阶段失败。

处理结果：

- 在 `application.yaml` 中加入 `spring.config.import: optional:file:.env[.properties]`，使 Spring Boot 启动时读取 `backend/.env`。
- 验证后端可正常启动，并且 Hikari 能建立 MySQL 连接。

本轮实际验证结果：

- `/api/me?userId=u-stu-1` 返回 Yuy；
- `/api/channels?userId=u-stu-1` 返回 5 个学生可访问频道；
- `/api/channels?userId=u-teacher-1` 返回 4 个教师相关频道；
- `/api/channels?userId=u-admin-1` 返回 9 个全部频道；
- `/api/channels/ch-linear-algebra?userId=u-stu-1` 返回 404；
- 两个 WebSocket 客户端进入 `ch-java` 后，频道详情显示 `onlineCount=2`，在线用户为 Yuy 和 Chen；
- Yuy 发送消息后，Yuy 和 Chen 都收到 `USER_CHAT`；
- Yuy 收到 `MESSAGE_ACK: ACCEPTED`；
- RabbitMQ 日志显示发布成功和消费成功；
- 关闭 WebSocket 后，Redis presence 和用户 session key 被清理。

下一步：

- 提交 `.env` 加载修复和本轮验收记录；
- 前端已补齐 Mock 登录页：进入系统前先选择身份，选择后再进入频道工作区；
- 后续可以继续做前端真实页面验收，或开始补 Redis presence 的设计说明。
