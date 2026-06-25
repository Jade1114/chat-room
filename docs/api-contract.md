# API Contract

> Activity-first MVP target API contract. 旧 Organization / Channel / Chat API 属于历史实现资产，不是当前 MVP 契约。

## 1. Common rules

- All Activity MVP endpoints require login.
- REST responses are JSON.
- Time fields use ISO 8601 strings.
- `401`: unauthenticated.
- `403`: not allowed to edit/close another user's Activity.
- `404`: resource not found or not visible.
- `400`: invalid request.

Auth header examples in this document use `<auth header>` to avoid embedding token-shaped strings.

## 2. Auth

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

Request:

```json
{
  "username": "test001",
  "displayName": "测试用户001",
  "password": "123456"
}
```

Response:

```json
{
  "token": "jwt-token",
  "userId": "u-test-001",
  "displayName": "测试用户001",
  "role": "MEMBER"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

Request:

```json
{
  "username": "test001",
  "password": "123456"
}
```

Response is the same shape as register.

### Current user

```http
GET /api/auth/me
<auth header>
```

Response:

```json
{
  "id": "u-test-001",
  "displayName": "测试用户001",
  "role": "MEMBER"
}
```

## 3. Activity model

### Activity

```json
{
  "id": "act-001",
  "title": "周五晚羽毛球缺 2 人",
  "description": "新手友好，主要是运动出汗，不卷水平。",
  "category": "SPORTS",
  "tags": ["羽毛球", "新手友好", "线下"],
  "timeMode": "SCHEDULED",
  "startTime": "2026-06-26T11:00:00Z",
  "endTime": "2026-06-26T13:00:00Z",
  "expiresAt": null,
  "location": "体育馆 3 号场",
  "participationMethod": "加微信 test001，备注 羽毛球",
  "status": "PUBLISHED",
  "createdBy": "u-test-001",
  "createdByDisplayName": "测试用户001",
  "createdAt": "2026-06-25T10:00:00Z",
  "updatedAt": "2026-06-25T10:00:00Z"
}
```

### Enums

```text
category:
STUDY | SPORTS | GAME | PROJECT | WORKSHOP | COMPETITION | TRAVEL | TEAM_UP | OTHER

timeMode:
SCHEDULED | ONGOING

status:
DRAFT | PUBLISHED | EXPIRED | CLOSED
```

## 4. Activity Feed

```http
GET /api/activities?query=&category=&tag=
<auth header>
```

Response:

```json
{
  "upcoming": [
    {
      "id": "act-001",
      "title": "周五晚羽毛球缺 2 人",
      "description": "新手友好，主要是运动出汗，不卷水平。",
      "category": "SPORTS",
      "tags": ["羽毛球", "新手友好"],
      "timeMode": "SCHEDULED",
      "startTime": "2026-06-26T11:00:00Z",
      "endTime": "2026-06-26T13:00:00Z",
      "expiresAt": null,
      "location": "体育馆 3 号场",
      "status": "PUBLISHED",
      "createdByDisplayName": "测试用户001",
      "createdAt": "2026-06-25T10:00:00Z"
    }
  ],
  "ongoing": [
    {
      "id": "act-002",
      "title": "找 CSAPP 学习搭子",
      "description": "每周一起推进一章，互相讲题。",
      "category": "STUDY",
      "tags": ["CSAPP", "学习小组"],
      "timeMode": "ONGOING",
      "startTime": null,
      "endTime": null,
      "expiresAt": "2026-07-20T00:00:00Z",
      "location": "线上 / 图书馆均可",
      "status": "PUBLISHED",
      "createdByDisplayName": "测试用户002",
      "createdAt": "2026-06-25T12:00:00Z"
    }
  ]
}
```

Rules:

- `upcoming`: `SCHEDULED`, `PUBLISHED`, valid, ordered by `startTime` ascending.
- `ongoing`: `ONGOING`, `PUBLISHED`, valid, ordered by `createdAt` descending.
- Search matches title, description, and tags.
- Feed response should not require exposing `participationMethod`; detail page may reveal it after explicit action.

## 5. Activity Detail

```http
GET /api/activities/{activityId}
<auth header>
```

Response includes full Activity data, but UI should still require a deliberate action before prominently displaying `participationMethod`.

Expected side effect:

- Record `DETAIL_VIEW` for the current user and Activity.

## 6. Reveal participation method

```http
POST /api/activities/{activityId}/participation-method-view
<auth header>
```

Response:

```json
{
  "activityId": "act-001",
  "participationMethod": "加微信 test001，备注 羽毛球"
}
```

Expected side effect:

- Record `PARTICIPATION_METHOD_VIEW`.

This does not create registration, membership, interest, favorite, or participation relationship.

## 7. Publish Activity

```http
POST /api/activities
Content-Type: application/json
<auth header>
```

Request:

```json
{
  "title": "周五晚羽毛球缺 2 人",
  "description": "新手友好，主要是运动出汗，不卷水平。",
  "category": "SPORTS",
  "tags": ["羽毛球", "新手友好"],
  "timeMode": "SCHEDULED",
  "startTime": "2026-06-26T11:00:00Z",
  "endTime": "2026-06-26T13:00:00Z",
  "expiresAt": null,
  "location": "体育馆 3 号场",
  "participationMethod": "加微信 test001，备注 羽毛球"
}
```

Response:

```json
{
  "id": "act-001",
  "status": "PUBLISHED"
}
```

Rules:

- publish creates `PUBLISHED` directly;
- no pre-publication review;
- no capacity;
- no image upload;
- `ONGOING` requires `expiresAt` and max duration 30 days;
- tags max 5.

## 8. Update Activity

```http
PUT /api/activities/{activityId}
Content-Type: application/json
<auth header>
```

Rules:

- only the initiator may edit;
- only `DRAFT` / `PUBLISHED` may be edited in MVP;
- no edit history;
- no change notification.

## 9. Close Activity

```http
POST /api/activities/{activityId}/close
<auth header>
```

Rules:

- only the initiator may close;
- status becomes `CLOSED`;
- closed Activity is not shown in default Feed.

## 10. My initiated Activities

```http
GET /api/me/activities
<auth header>
```

Response:

```json
[
  {
    "id": "act-001",
    "title": "周五晚羽毛球缺 2 人",
    "status": "PUBLISHED",
    "timeMode": "SCHEDULED",
    "startTime": "2026-06-26T11:00:00Z",
    "expiresAt": null,
    "createdAt": "2026-06-25T10:00:00Z"
  }
]
```

This endpoint returns only Activities initiated by the current user.

It does not return joined, interested, favorited, or contact-viewed Activities.

## 11. Activity events

Activity events are internal validation logs.

```text
DETAIL_VIEW
PARTICIPATION_METHOD_VIEW
```

Minimum fields:

```json
{
  "id": "evt-001",
  "activityId": "act-001",
  "userId": "u-test-001",
  "eventType": "DETAIL_VIEW",
  "createdAt": "2026-06-25T10:01:00Z"
}
```

No analytics dashboard is required for MVP.

## 12. Legacy APIs

Organization, Membership, Channel, WebSocket chat, unread, and presence APIs may still exist in code.

They are not Activity-first MVP contract and should not be used as acceptance criteria for the current first version.
