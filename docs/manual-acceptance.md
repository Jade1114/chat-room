# Manual Acceptance Checklist

> 目的：用轻量手动验收证明当前组织中心交流平台 MVP 可运行、可观察、可解释。
>
> 本文档只验收当前真实能力；尚未实现的创建组织、真实 Activity 等能力必须标记为缺口，不写成已完成。

## 1. 当前验收范围

当前主线：

```text
Auth
→ Public Square default Membership
→ Organization discovery / join
→ Membership-derived Channel access
→ WebSocket workspace session
→ Channel chat
→ Message history
→ Redis presence / unread
→ RabbitMQ fanout
```

### 1.1 当前验收内容

- 注册 / 登录 / dev-login；
- JWT 恢复当前用户；
- 新注册用户默认加入 Public Square；
- 公开组织列表；
- 组织详情；
- 加入公开组织；
- 已加入组织列表 / sidebar；
- `/api/channels` 只返回当前用户可访问的 Organization Channels；
- 未授权 Channel detail / messages 返回 404；
- WebSocket 通过 token 建立连接；
- Channel view changed 后才能发送当前 Channel 消息；
- 消息持久化和历史消息加载；
- Redis workspace online / current channel / unread；
- RabbitMQ 消息发布、消费和广播；
- Organization Channel route renders real ChatWorkspace；
- 前端构建和后端编译。

### 1.2 当前不验收内容

- 创建组织完整链路；
- Activity 后端模型和日程页；
- Organization Detail 中真实 member preview / activity list / organizer actions；
- 多频道组织；
- 私密组织 / 审核 / 邀请码限制；
- 私聊、文件上传、完整通知中心；
- school / course / class / assignment teaching-platform 方向。

## 2. 前置依赖

后端默认连接本机服务：

| 依赖 | 默认地址 | 说明 |
| --- | --- | --- |
| MySQL | `localhost:3306` | 数据库名：`chat_room` |
| Redis | `localhost:6379` | workspace presence / unread / recent messages |
| RabbitMQ | `localhost:5672` | 聊天消息分发 |
| Backend | `localhost:8080` | Spring Boot 服务 |
| Frontend | Vite dev server | React 前端 |

配置入口：

```text
backend/src/main/resources/application.yaml
backend/.env.example
frontend/src/config.ts
```

## 3. 数据库初始化

在 MySQL 中执行：

```bash
mysql -u root -p < backend/sql/schema.sql
mysql -u root -p < backend/sql/seed.sql
```

当前 seed 的核心数据：

### 3.1 Users

| userId | displayName | role |
| --- | --- | --- |
| `u-yuy` | Yuy | MEMBER |
| `u-mina` | Mina | MEMBER |
| `u-luna` | Luna | MEMBER |
| `u-admin` | Platform Admin | ADMIN |

### 3.2 Organizations

| organizationId | name | default channel | note |
| --- | --- | --- | --- |
| `org-public-square` | Public Square | `ch-public-square` | 默认官方组织 |
| `org-go-club` | 围棋社 | `ch-go-club` | Yuy 是 Organizer |
| `org-anime-club` | 二次元同好会 | `ch-anime-club` | Luna 是 Organizer |
| `org-indie-game-lab` | 独立游戏实验室 | `ch-indie-game-lab` | Mina 是 Organizer |

### 3.3 Seed Memberships

- `u-yuy` 已加入 Public Square 和围棋社；
- `u-mina` 已加入 Public Square 和独立游戏实验室；
- `u-luna` 已加入 Public Square 和二次元同好会；
- `u-admin` 是 Public Square Organizer。

## 4. 构建验证

### 4.1 Backend

```bash
cd backend
mvn test
```

期望：

```text
BUILD SUCCESS
```

### 4.2 Frontend

```bash
cd frontend
pnpm build
```

期望：

```text
✓ built
```

## 5. 启动验证

### 5.1 Backend

```bash
cd backend
mvn spring-boot:run
```

期望：

- Spring Boot 正常启动；
- 未报 MySQL / Redis / RabbitMQ 连接失败；
- 监听 `localhost:8080`。

### 5.2 Frontend

```bash
cd frontend
pnpm dev
```

期望：

- Vite dev server 正常启动；
- 浏览器可打开前端；
- 前端能请求后端 API。

## 6. Auth 验收

### 6.1 Dev login

```bash
curl -s -X POST 'http://localhost:8080/api/auth/dev-login' \
  -H 'Content-Type: application/json' \
  -d '{"userId":"u-yuy"}'
```

期望：

- HTTP 200；
- 返回 token；
- userId 为 `u-yuy`；
- role 为 `MEMBER`。

建议把 token 保存为 shell 变量：

```bash
TOKEN=$(curl -s -X POST 'http://localhost:8080/api/auth/dev-login' \
  -H 'Content-Type: application/json' \
  -d '{"userId":"u-yuy"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')
AUTH_HEADER="$(printf 'Authorization: %s %s' Bearer "$TOKEN")"
```

### 6.2 Current auth user

```bash
curl -s 'http://localhost:8080/api/auth/me' \
  -H "$AUTH_HEADER"
```

期望：

- 返回 `u-yuy`；
- `displayName` 为 Yuy；
- `role` 为 MEMBER。

### 6.3 Register default Public Square membership

手动注册新用户：

```bash
curl -s -X POST 'http://localhost:8080/api/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"username":"acceptance-user","displayName":"Acceptance User","password":"password123"}'
```

期望：

- HTTP 200；
- 返回 token；
- 新用户可以访问 Public Square 默认 Channel；
- 新用户不应自动访问其他组织 Channel。

## 7. Organization API 验收

### 7.1 获取公开组织列表

```bash
curl -s 'http://localhost:8080/api/organizations' \
  -H "$AUTH_HEADER"
```

期望：

- 返回 Public Square、围棋社、二次元同好会、独立游戏实验室；
- `org-public-square.joined = true`；
- `org-go-club.joined = true`；
- `org-anime-club.joined = false` for `u-yuy`；
- 每个组织有 `defaultChannelId`。

### 7.2 获取组织详情

```bash
curl -s 'http://localhost:8080/api/organizations/org-go-club' \
  -H "$AUTH_HEADER"
```

期望：

- HTTP 200；
- 返回 `org-go-club`；
- `joined = true`；
- `channels` 包含 `ch-go-club`。

### 7.3 加入公开组织

```bash
curl -s -X POST 'http://localhost:8080/api/organizations/org-anime-club/join' \
  -H "$AUTH_HEADER"
```

期望：

- HTTP 200；
- 返回 `org-anime-club` detail；
- `joined = true`；
- 再请求 `/api/channels` 时应包含 `ch-anime-club`。

## 8. Channel access 验收

### 8.1 当前用户可访问频道列表

```bash
curl -s 'http://localhost:8080/api/channels' \
  -H "$AUTH_HEADER"
```

使用 seed 初始状态下，`u-yuy` 期望包含：

- `ch-public-square`；
- `ch-go-club`。

期望不包含：

- `ch-anime-club`；
- `ch-indie-game-lab`。

如果已经执行过加入二次元同好会，则 `ch-anime-club` 会变成可访问，这是正确结果。

### 8.2 有权限 Channel detail

```bash
curl -i 'http://localhost:8080/api/channels/ch-go-club' \
  -H "$AUTH_HEADER"
```

期望：

- HTTP 200；
- 返回 `ch-go-club`；
- 包含 `onlineCount` 和 `onlineUsers`。

### 8.3 无权限 Channel detail

```bash
curl -i 'http://localhost:8080/api/channels/ch-indie-game-lab' \
  -H "$AUTH_HEADER"
```

如果 `u-yuy` 未加入独立游戏实验室，期望：

- HTTP 404。

验收意义：直接访问 Channel detail 不能绕过 Membership。

### 8.4 无权限 Channel messages

```bash
curl -i 'http://localhost:8080/api/channels/ch-indie-game-lab/messages' \
  -H "$AUTH_HEADER"
```

如果 `u-yuy` 未加入独立游戏实验室，期望：

- HTTP 404。

验收意义：历史消息接口不能泄露未授权 Channel。

## 9. 前端组织主链路验收

步骤：

1. 打开前端；
2. 使用 dev-login 或真实登录进入系统；
3. 查看左侧“我的组织”；
4. 确认 Public Square 和已加入组织显示；
5. 进入组织发现中心；
6. 查看公开组织卡片；
7. 加入一个未加入组织；
8. 确认该组织出现在左侧已加入组织中；
9. 进入 Organization Detail；
10. 点击该组织的 Channel 入口；
11. 确认进入 `/organizations/:organizationId/channels/:channelId`；
12. 确认页面渲染真实 ChatWorkspace；
13. 确认左侧展示当前组织内部频道；
14. 确认中间展示当前频道聊天记录和输入框；
15. 确认右侧展示活动记录与 members / 在线成员；
16. 确认聊天 header 展示 `Organization / # Channel`。

当前已知缺口：

- `/messages` 仍是兼容聊天入口，尚未决定是否重定向到 Public Square/default Channel；
- Organization Detail 的 Activity / Member 数据仍不应当作真实后端能力验收。

## 10. WebSocket 聊天验收

WebSocket 地址：

```text
ws://localhost:8080/ws/chat?token=<jwt-token>
```

### 10.1 前端手动验收

步骤：

1. 打开两个浏览器窗口；
2. 分别登录两个能访问同一 Channel 的用户，例如 `u-yuy` 和 `u-mina` 都能访问 Public Square；
3. 进入真实聊天 workspace；
4. 选择 `ch-public-square`；
5. 一个窗口发送消息；
6. 另一个窗口确认收到消息。

期望：

- WebSocket 连接状态正常；
- 发送消息有 ACK；
- 两个窗口都能看到 `USER_CHAT`；
- 刷新或重新进入后能加载历史消息；
- 在线成员会更新。

### 10.2 命令行 WebSocket 验收（可选）

如果安装了 `websocat`：

```bash
websocat "ws://localhost:8080/ws/chat?token=$TOKEN"
```

连接后发送 Channel view changed：

```json
{
  "type": "CHANNEL_VIEW_CHANGED",
  "displayName": "Yuy",
  "channelId": "ch-public-square",
  "content": "切换当前查看频道",
  "userId": "u-yuy"
}
```

再发送聊天消息：

```json
{
  "type": "USER_CHAT",
  "displayName": "Yuy",
  "channelId": "ch-public-square",
  "content": "hello from websocat"
}
```

期望：

- 后端不报 JSON 解析错误；
- 有权限 Channel view changed 成功；
- 聊天消息经 RabbitMQ 消费后广播回来；
- 客户端收到 `MESSAGE_ACK`。

## 11. Redis 验收

当前 Redis key 语义：

```text
workspace:online
workspace:user:sessions:{userId}
workspace:session:user:{sessionId}
workspace:session:channel:{sessionId}
channel:viewing:{channelId}
user:unread:{userId}
channel:messages:{channelId}
```

### 11.1 workspace online

用户连接 WebSocket 后：

```bash
redis-cli SMEMBERS workspace:online
```

期望包含当前 userId。

### 11.2 current channel viewing

用户切换到 `ch-public-square` 后：

```bash
redis-cli SMEMBERS channel:viewing:ch-public-square
```

期望至少存在一个 sessionId。

### 11.3 recent messages cache

发送消息后：

```bash
redis-cli LRANGE channel:messages:ch-public-square 0 2
```

期望看到最近消息 JSON。

### 11.4 unread count

当用户 A 在 `ch-public-square` 发消息，用户 B 在线但当前不查看该 Channel 时：

```bash
redis-cli HGETALL user:unread:u-mina
```

期望对应 Channel unread 增加。

## 12. RabbitMQ 验收

当前 RabbitMQ 设计：

- exchange：`exchange01`；
- queue：`chat.queue.0`、`chat.queue.1`、`chat.queue.2`、`chat.queue.3`；
- routing key：`0`、`1`、`2`、`3`；
- bucket 根据 `channelId.hashCode() % 4` 计算。

### 12.1 队列存在

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

### 12.2 发送聊天消息后发布与消费成功

步骤：

1. 前端进入 `ch-public-square`；
2. 发送聊天消息；
3. 观察后端日志。

期望看到类似日志：

```text
RabbitMQ 发布成功 channelId=ch-public-square bucketIndex=...
RabbitMQ 消费成功 channelId=ch-public-square message=...
```

## 13. 当前 MVP 验收清单

### 13.1 构建

- [ ] 后端 `mvn test` 通过；
- [ ] 前端 `pnpm build` 通过。

### 13.2 Auth

- [ ] dev-login 返回 token；
- [ ] `/api/auth/me` 可通过 token 返回当前用户；
- [ ] register 后新用户默认可访问 Public Square。

### 13.3 Organization

- [ ] `/api/organizations` 返回公开组织；
- [ ] Organization item 包含 joined 和 defaultChannelId；
- [ ] `/api/organizations/{id}` 返回 organization detail；
- [ ] join public organization 后 joined 变 true；
- [ ] join 后对应 default Channel 出现在 `/api/channels`。

### 13.4 Channel access

- [ ] `/api/channels` 只返回当前用户可访问 Organization Channels；
- [ ] 有权限 Channel detail 返回 200；
- [ ] 无权限 Channel detail 返回 404；
- [ ] 无权限 Channel messages 返回 404。

### 13.5 WebSocket / Chat

- [ ] WebSocket token connection 成功；
- [ ] `CHANNEL_VIEW_CHANGED` 有权限时成功；
- [ ] 无权限 Channel 不会成为当前查看 Channel；
- [ ] 同 Channel 多用户能实时收发消息；
- [ ] 聊天消息持久化后可通过 history API 读回。

### 13.6 Redis / RabbitMQ

- [ ] `workspace:online` 记录在线用户；
- [ ] `channel:viewing:{channelId}` 记录当前查看 Channel 的 sessions；
- [ ] `channel:messages:{channelId}` 缓存最近消息；
- [ ] unread hash 会随消息增加 / 清零；
- [ ] RabbitMQ queue 存在；
- [ ] 发送消息后有发布和消费日志。

## 14. 验收记录模板

```text
日期：
分支 / commit：
后端构建：通过 / 失败
前端构建：通过 / 失败
Auth：通过 / 失败
Organization：通过 / 失败
Channel access：通过 / 失败
WebSocket / Chat：通过 / 失败
Redis：通过 / 失败
RabbitMQ：通过 / 失败
发现的问题：
下一步：
```
