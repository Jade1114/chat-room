# API Contract

前后端接口约定文档。本文档是前后端协作的唯一事实源，后端接口变更必须同步更新本文档。

## 1. 基础约定

### 1.1 环境变量

前端通过环境变量配置后端地址：

```bash
VITE_WS_URL=ws://localhost:8080/ws/chat
VITE_API_BASE_URL=http://localhost:8080
```

### 1.2 通用约定

- 所有 REST 响应为 `application/json`。
- 时间字段统一使用 ISO 8601 字符串或 Unix 毫秒时间戳（具体接口另外说明）。
- HTTP 状态码按语义使用：`200` 成功，`404` 资源不存在，`400` 参数错误，`500` 服务端异常。
- MVP 阶段不要求认证 header，所有接口通过 `?userId=` query 参数模拟登录态。

---

## 2. REST API

### 2.1 获取当前用户

```http
GET /api/me?userId={userId}
```

**说明**：根据 userId 返回当前用户的身份与组织归属信息。userId 为空时返回默认用户。

**响应**：

```json
{
  "id": "u-stu-1",
  "displayName": "Yuy",
  "role": "STUDENT",
  "schoolId": "school-1",
  "departmentId": "dept-cs",
  "classId": "class-cs-2401",
  "courseIds": ["course-java", "course-websocket"]
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 用户唯一标识 |
| displayName | string | 显示名称 |
| role | enum | STUDENT / TEACHER / ADMIN |
| schoolId | string | 所属学校 ID |
| departmentId | string | 所属院系 ID，管理员可为 null |
| classId | string | 所属班级 ID，教师/管理员可为 null |
| courseIds | string[] | 关联课程 ID 列表，管理员可为空数组 |

---

### 2.2 获取 Mock 用户列表

```http
GET /api/mock-users
```

**说明**：返回所有 mock 用户，供模拟登录页选择。

**响应**：

```json
[
  {
    "id": "u-stu-1",
    "displayName": "Yuy",
    "role": "STUDENT",
    "schoolId": "school-1",
    "departmentId": "dept-cs",
    "classId": "class-cs-2401",
    "courseIds": ["course-java", "course-websocket"]
  }
]
```

**字段说明**：同 `/api/me`。

---

### 2.3 获取可访问频道列表

```http
GET /api/channels?userId={userId}
```

**说明**：根据用户身份返回该用户可访问的频道列表。权限过滤规则见 [channel-model.md](./channel-model.md)。

**响应**：

```json
[
  {
    "id": "ch-school",
    "name": "全校大厅",
    "type": "SCHOOL",
    "scopeId": "school-1",
    "description": "星河大学公共频道",
    "readonly": false
  }
]
```

**字段说明**：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 频道唯一标识 |
| name | string | 频道显示名称 |
| type | enum | SCHOOL / DEPARTMENT / CLASS / COURSE |
| scopeId | string | 频道所属组织 ID |
| description | string | 频道描述 |
| readonly | boolean | 是否只读（当前 MVP 阶段暂时均为 false） |

---

### 2.4 获取频道详情

```http
GET /api/channels/{channelId}?userId={userId}
```

**说明**：返回指定频道详情。如用户无权访问该频道则返回 404。

**响应**（200）：

```json
{
  "id": "ch-java",
  "name": "Java 后端开发",
  "type": "COURSE",
  "scopeId": "course-java",
  "description": "课程讨论与通知",
  "readonly": false,
  "onlineCount": 3,
  "onlineUsers": ["Yuy", "Chen", "Mina"]
}
```

**响应**（404）：无 body。

**字段说明**：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | string | 频道唯一标识 |
| name | string | 频道显示名称 |
| type | enum | SCHOOL / DEPARTMENT / CLASS / COURSE |
| scopeId | string | 频道所属组织 ID |
| description | string | 频道描述 |
| readonly | boolean | 是否只读 |
| onlineCount | int | Redis presence 维护的频道在线用户数，统计 `channel:presence:{channelId}` 中去重后的 userId 数量；同一用户多个 WebSocket session 只计 1 |
| onlineUsers | string[] | Redis presence 维护的在线用户显示名列表，由 `channel:presence:{channelId}` 中的 userId 解析得到 |

---

## 3. WebSocket 协议

### 3.1 连接地址

```
ws://localhost:8080/ws/chat
```

### 3.2 消息格式

所有 WebSocket 消息为 JSON。用户身份字段和展示字段分开：

- `userId`：稳定用户身份，用于后端 session 绑定和 Redis presence；`USER_JOIN` 必填。
- `sender`：展示名称，用于 UI 展示；不作为唯一身份。
- `roomId`：当前仍表示频道 ID，后续可统一重命名为 `channelId`。

```json
{
  "type": "USER_CHAT",
  "sender": "Yuy",
  "roomId": "room-1",
  "content": "大家好"
}
```

### 3.3 消息类型

#### 3.3.1 用户加入

```json
{
  "type": "USER_JOIN",
  "userId": "u-stu-1",
  "sender": "Yuy",
  "roomId": "room-1",
  "content": "进入了当前频道"
}
```

**说明**：`USER_JOIN` 是建立 WebSocket session 身份绑定的入口，必须携带 `userId`。后端会用 `userId + sender + roomId` 绑定当前 session，并用 `userId` 写入 Redis presence。

#### 3.3.2 用户离开

```json
{
  "type": "USER_LEAVE",
  "userId": "u-stu-1",
  "sender": "Yuy",
  "roomId": "room-1",
  "content": "离开了频道"
}
```

**说明**：客户端当前不主动发送 `USER_LEAVE`。后端在 WebSocket 断开时根据 session 绑定信息生成离开消息，并用 `userId` 清理 Redis presence。

#### 3.3.3 聊天消息

```json
{
  "type": "USER_CHAT",
  "sender": "Yuy",
  "roomId": "room-1",
  "content": "大家好，我是 Yuy"
}
```

**说明**：客户端发送 `USER_CHAT` 时不需要携带 `userId`。后端不会信任聊天消息中的身份字段，而是使用当前 WebSocket session 已绑定的 `userId`、`sender` 和 `roomId` 覆盖消息后再广播。

### 3.4 待升级字段

| 当前字段 | 目标字段 | 状态 |
| --- | --- | --- |
| `roomId` | `channelId` | ⚠️ TODO: 待频道系统稳定后统一迁移 |
| `sender` | `displayName` | ⚠️ TODO: 当前 `sender` 语义已收敛为展示名，后续可重命名为 `displayName` |

### 3.5 ⚠️ 待设计方案

以下能力涉及 Redis / RabbitMQ / 多线程，已标记为待设计方案，不在当前 MVP 范围内实现：

| 能力 | 涉及技术 | 状态 |
| --- | --- | --- |
| 频道在线人数统计 | Redis Set | 已实现：`channel:presence:{channelId}` 存去重 userId，`SCARD` 得到在线用户数 |
| 频道在线用户列表 | Redis Set + 用户目录查询 | 已实现：`SMEMBERS channel:presence:{channelId}` 得到 userId 后解析显示名 |
| 同一用户多 session presence | Redis Set | 已实现：`channel:user:sessions:{channelId}:{userId}` 存 sessionId；最后一个 session 离开时才移除用户 presence |
| 消息广播分发 | RabbitMQ Topic Exchange | 已实现（bucket queue），后续需接入 channelId |
| 消息历史持久化 | 数据库 + Redis 缓存 | 标记，待设计 |
| 多频道并发 WebSocket 心跳 | 多线程 / 虚拟线程 | 标记，待设计 |
| 消息已读/未读 | Redis + 数据库 | 标记，待设计 |
| 跨节点 WebSocket 广播 | RabbitMQ / Redis Pub/Sub | 标记，待设计 |

---

## 4. 数据模型

### 4.1 UserRole

```text
STUDENT | TEACHER | ADMIN
```

### 4.2 ChannelType

```text
SCHOOL | DEPARTMENT | CLASS | COURSE
```

### 4.3 枚举值对照表

| 后端枚举 | 前端预期字符串 | 说明 |
| --- | --- | --- |
| `STUDENT` | `"STUDENT"` | 学生 |
| `TEACHER` | `"TEACHER"` | 教师 |
| `ADMIN` | `"ADMIN"` | 管理员 |
| `SCHOOL` | `"SCHOOL"` | 全校频道 |
| `DEPARTMENT` | `"DEPARTMENT"` | 院系频道 |
| `CLASS` | `"CLASS"` | 班级频道 |
| `COURSE` | `"COURSE"` | 课程频道 |

---

## 5. 变更记录

| 日期 | 变更内容 |
| --- | --- |
| 2026-06-17 | 初始版本：定义 `/api/me`、`/api/mock-users`、`/api/channels`、`/api/channels/{channelId}`、WebSocket 协议、旧接口、待设计方案标记 |
| 2026-06-20 | Redis presence 改为由 WebSocket 生命周期维护；移除 REST join/leave 与旧 `/api/rooms` 接口；明确在线人数为去重在线用户数而非 session 数 |
| 2026-06-21 | WebSocket 身份字段拆分：`userId` 用于稳定身份和 Redis presence，`sender` 保留为展示名；聊天消息身份以后端 session 绑定为准 |
