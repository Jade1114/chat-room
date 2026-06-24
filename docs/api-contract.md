# API Contract

> 前后端接口约定文档。本文档描述当前可信实现与下一次重构前应保持的契约。
>
> 历史 school / course / class / teaching-platform contract 已归档到 `docs/archive/`，不再作为当前实现依据。

## 1. 基础约定

### 1.1 环境变量

前端通过环境变量配置后端地址：

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws/chat
```

### 1.2 通用约定

- REST 响应默认为 `application/json`；
- 时间字段使用 ISO 8601 字符串；
- 成功返回 `200`；
- 参数错误返回 `400`；
- 未登录返回 `401`；
- 无权限访问管理能力返回 `403`；
- 不可见或不存在的 Channel / Organization 资源返回 `404`；
- 认证优先使用 `Authorization` header 携带 Bearer token；
- 旧 `?userId=` query fallback 仅用于迁移/开发兼容，不是新功能应依赖的接口形态。

### 1.3 核心语义

```text
User joins Organization.
Membership grants access to the Organization's default Channel.
Channel belongs to Organization.
Public Square is the default Organization.
```

未授权 Channel 不应出现在用户的频道列表中。直接请求未授权 Channel detail 或 history messages 时应返回 404，避免泄露 Channel 存在性。

## 2. Auth API

### 2.1 Register

```http
POST /api/auth/register
Content-Type: application/json
```

Request:

```json
{
  "username": "yuy",
  "displayName": "Yuy",
  "password": "password"
}
```

Semantics:

- 创建 User；
- 默认 role 为 `MEMBER`；
- 自动创建该 User 到 Public Square 的 Membership；
- 返回 JWT。

Response:

```json
{
  "token": "jwt-token",
  "userId": "u-xxxxxxx",
  "displayName": "Yuy",
  "role": "MEMBER"
}
```

### 2.2 Login

```http
POST /api/auth/login
Content-Type: application/json
```

Request:

```json
{
  "username": "yuy",
  "password": "password"
}
```

Response:

```json
{
  "token": "jwt-token",
  "userId": "u-xxxxxxx",
  "displayName": "Yuy",
  "role": "MEMBER"
}
```

### 2.3 Current Auth User

```http
GET /api/auth/me
Authorization: Bearer <token>
```

Response:

```json
{
  "id": "u-xxxxxxx",
  "displayName": "Yuy",
  "role": "MEMBER"
}
```

### 2.4 Dev Login

```http
POST /api/auth/dev-login
Content-Type: application/json
```

Request:

```json
{
  "userId": "u-yuy"
}
```

Response is same as login.

Dev login is a local development adapter. Product flows should use register/login.

## 3. User / Development API

### 3.1 Get current user

```http
GET /api/me
Authorization: Bearer <token>
```

Response:

```json
{
  "id": "u-yuy",
  "displayName": "Yuy",
  "role": "MEMBER"
}
```

`GET /api/me?userId=...` may still work during migration, but new code should not depend on it.

### 3.2 Mock users

```http
GET /api/mock-users
```

Returns seeded development users for dev-login and local manual acceptance.

Response:

```json
[
  {
    "id": "u-yuy",
    "displayName": "Yuy",
    "role": "MEMBER"
  },
  {
    "id": "u-admin-1",
    "displayName": "Admin",
    "role": "ADMIN"
  }
]
```

## 4. Organization API

### 4.1 List public organizations

```http
GET /api/organizations
Authorization: Bearer <token>
```

Response:

```json
[
  {
    "id": "org-public-square",
    "name": "Public Square",
    "description": "平台官方维护的默认组织。",
    "visibility": "PUBLIC",
    "joinPolicy": "OPEN",
    "memberCount": 10,
    "joined": true,
    "defaultChannelId": "ch-public-square"
  }
]
```

Current behavior:

- Returns organizations with membership status for current user;
- Frontend filters `visibility === 'PUBLIC'` for Organization Hall;
- Frontend filters `joined === true` for joined organizations sidebar.

### 4.2 Get organization detail

```http
GET /api/organizations/{organizationId}
Authorization: Bearer <token>
```

Response:

```json
{
  "id": "org-public-square",
  "name": "Public Square",
  "description": "平台官方维护的默认组织。",
  "visibility": "PUBLIC",
  "joinPolicy": "OPEN",
  "memberCount": 10,
  "joined": true,
  "defaultChannelId": "ch-public-square",
  "channels": [
    {
      "id": "ch-public-square",
      "name": "公共广场",
      "type": "ORGANIZATION",
      "organizationId": "org-public-square",
      "description": "开放交流频道",
      "readonly": false,
      "unreadCount": 0
    }
  ]
}
```

Current missing fields:

- tags;
- organizer / creator display info;
- real activities;
- real member preview/list;
- invitation/application code;
- Organizer action availability.

### 4.3 Join public organization

```http
POST /api/organizations/{organizationId}/join
Authorization: Bearer <token>
```

Semantics:

- Only `visibility = PUBLIC` and `joinPolicy = OPEN` organizations can be joined directly;
- Creates OrganizationMember if missing;
- Returns updated Organization detail;
- Joining an Organization grants access to its default Channel.

Response: same shape as organization detail.

### 4.4 Create organization — planned MVP gap

```http
POST /api/organizations
Authorization: Bearer <token>
```

This is part of the intended MVP but is not yet a completed contract.

Expected future semantics:

```text
create Organization
create default Channel
create OrganizationMember(role=ORGANIZER)
return Organization detail
```

Do not document this as implemented until code and manual acceptance are updated.

## 5. Channel API

Current Channel API is compatibility-shaped but semantically means “current user's accessible Organization Channels”.

### 5.1 List accessible channels

```http
GET /api/channels
Authorization: Bearer <token>
```

Response:

```json
[
  {
    "id": "ch-public-square",
    "name": "公共广场",
    "type": "ORGANIZATION",
    "organizationId": "org-public-square",
    "description": "开放交流频道",
    "readonly": false,
    "unreadCount": 0
  }
]
```

Semantics:

- Returns only channels the current user can access;
- Access derives from OrganizationMember;
- Admin may see all channels;
- `?userId=` fallback is migration-only.

### 5.2 Get accessible channel detail

```http
GET /api/channels/{channelId}
Authorization: Bearer <token>
```

Response:

```json
{
  "id": "ch-public-square",
  "name": "公共广场",
  "type": "ORGANIZATION",
  "organizationId": "org-public-square",
  "description": "开放交流频道",
  "readonly": false,
  "unreadCount": 0,
  "onlineCount": 2,
  "onlineUsers": ["Yuy", "Mina"]
}
```

Unauthorized or nonexistent Channel:

```http
HTTP/1.1 404 Not Found
```

### 5.3 Get channel messages

```http
GET /api/channels/{channelId}/messages?limit=50
Authorization: Bearer <token>
```

Optional pagination:

```http
GET /api/channels/{channelId}/messages?before=2026-06-24T09:00:00Z&limit=50
```

Response:

```json
[
  {
    "type": "USER_CHAT",
    "userId": "u-yuy",
    "displayName": "Yuy",
    "content": "hello",
    "channelId": "ch-public-square",
    "messageId": "uuid",
    "sentAt": "2026-06-24T09:00:00Z"
  }
]
```

Unauthorized or nonexistent Channel returns 404.

## 6. WebSocket Protocol

### 6.1 Connect

```text
ws://localhost:8080/ws/chat?token=<jwt-token>
```

Connection semantics:

- Backend validates token during handshake;
- Backend stores `userId` and `displayName` on the WebSocket session;
- Session is registered as workspace-online;
- Current Channel may be null until the client sends `CHANNEL_VIEW_CHANGED`.

### 6.2 Message envelope

All WebSocket messages are JSON.

```ts
type MessageType =
  | 'WORKSPACE_JOIN'
  | 'CHANNEL_VIEW_CHANGED'
  | 'USER_CHAT'
  | 'MESSAGE_ACK'
  | 'UNREAD_CHANGED'
  | 'USER_JOIN'   // legacy adapter
  | 'USER_LEAVE'; // server disconnect event / legacy adapter
```

### 6.3 WORKSPACE_JOIN

Current frontend may send this after socket open:

```json
{
  "type": "WORKSPACE_JOIN",
  "displayName": "Yuy",
  "content": "进入 workspace",
  "userId": "u-yuy"
}
```

Current backend treats it as a backward-compatible no-op because JWT handshake already registered the workspace session.

### 6.4 CHANNEL_VIEW_CHANGED

```json
{
  "type": "CHANNEL_VIEW_CHANGED",
  "displayName": "Yuy",
  "channelId": "ch-public-square",
  "content": "切换当前查看频道",
  "userId": "u-yuy"
}
```

Semantics:

- Backend uses session-bound user identity, not the userId as authority;
- Backend checks Membership-derived Channel access;
- If authorized, backend updates current Channel view state;
- Backend clears unread count for that user/channel.

### 6.5 USER_CHAT

```json
{
  "type": "USER_CHAT",
  "displayName": "Yuy",
  "channelId": "ch-public-square",
  "content": "大家好"
}
```

Semantics:

- Client does not need to send userId;
- Backend overwrites userId/displayName/channelId from session state;
- Backend persists message;
- Backend publishes to RabbitMQ;
- Backend sends `MESSAGE_ACK` with `ACCEPTED` or `FAILED`;
- Consumer broadcasts `USER_CHAT` to current Channel sessions;
- Consumer increments unread for visible users not currently viewing that Channel.

### 6.6 MESSAGE_ACK

```json
{
  "type": "MESSAGE_ACK",
  "displayName": "system",
  "content": "ACCEPTED",
  "channelId": "ch-public-square",
  "messageId": "uuid",
  "sentAt": "2026-06-24T09:00:00Z"
}
```

`content` / display field currently carries status. This is a current implementation detail and may be cleaned up later.

### 6.7 UNREAD_CHANGED

```json
{
  "type": "UNREAD_CHANGED",
  "displayName": "system",
  "content": "1",
  "channelId": "ch-public-square"
}
```

Semantics:

- Sent to online sessions of users who can access the Channel but are not currently viewing it;
- Frontend increments the unread badge for that Channel.

### 6.8 Legacy USER_JOIN

`USER_JOIN` remains a backward-compatible adapter for the old channel-join flow. New product behavior should use JWT connection + `CHANNEL_VIEW_CHANGED`.

## 7. Current data enums

### UserRole

```text
MEMBER
ORGANIZER
ADMIN
```

### ChannelType

```text
ORGANIZATION
```

### Organization visibility

Currently used:

```text
PUBLIC
```

Future model room:

```text
PRIVATE
DRAFT
REVIEW
```

### Organization join policy

Currently used:

```text
OPEN
```

Future model room:

```text
APPROVAL_REQUIRED
INVITE_ONLY
```

## 8. Known contract gaps before next major refactor

- Organization-scoped channel route exists in frontend but still renders placeholder;
- `POST /api/organizations` is planned but not completed;
- Activity, member preview, organizer actions, tags, and invitation code are not yet in Organization detail response;
- `/api/channels` is semantically correct but path shape is compatibility-first;
- `?userId=` fallback should be removed after JWT-only manual acceptance is stable.

## 9. Change log

| Date | Change |
| --- | --- |
| 2026-06-17 | Initial teaching-platform API contract created. |
| 2026-06-20 | Redis presence and RabbitMQ chat flow documented. |
| 2026-06-21 | WebSocket identity fields clarified. |
| 2026-06-24 | Rewrote active contract around Organization, Membership, JWT auth, Organization Channel access, history messages, unread, and presence. Archived teaching-platform contract. |
