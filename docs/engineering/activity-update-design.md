# Activity Update Design

> Final product feature before project closure. Activity Update lets an Activity initiator publish one-way supplemental notes that help interested people actually participate, without turning the product back into chat.

---

## 1. Product purpose

Activity-first currently supports:

```text
publish Activity
→ users discover it
→ users view participation method
→ users express Interest
→ initiator sees Interest feedback
```

After people express Interest, the initiator often needs to clarify details:

- meeting point changed;
- contact method updated;
- preparation material added;
- enough people are interested, final details are confirmed;
- activity will close soon.

Activity Update answers this product question:

```text
How can the initiator move interested people closer to real participation without building platform chat?
```

---

## 2. Domain language

### Activity Update

A one-way supplemental note published by the Activity initiator.

An Activity Update is:

- part of an Activity's lifecycle;
- durable MySQL content;
- visible on Activity Detail;
- eligible to notify people who already expressed Interest.

An Activity Update is **not**:

- private chat;
- group chat;
- comment;
- reply thread;
- channel;
- registration;
- notification center item.

---

## 3. First-version scope

Implemented:

- only the Activity initiator can publish an update;
- updates belong to one Activity;
- updates are append-only in the first version;
- Activity Detail returns and renders update timeline;
- `PUBLISHED` Activity only: `CLOSED` / `EXPIRED` cannot receive new updates;
- publishing an update emits `ActivityUpdatePublishedEvent`;
- a RabbitMQ consumer notifies already-interested User / Local Session identities through `/ws/notifications`;
- notifications are online-only and best-effort.

Not implemented:

- replies;
- editing/deleting updates;
- per-update read state;
- unread center;
- conversation list;
- direct message;
- activity group/channel;
- moderation workflow.

---

## 4. Data model

```text
activity_update
- id
- activity_id
- author_user_id nullable
- author_local_session_id nullable
- content
- created_at
```

Source of truth:

- MySQL owns update content and Activity lifecycle constraints;
- RabbitMQ carries update-published side effects;
- WebSocket only delivers online hints;
- Local Session/User identity remains dual-field and explicit.

---

## 5. API shape

### Publish update

```http
POST /api/activities/{activityId}/updates
Content-Type: application/json
X-Local-Session-Id: <local session>
Authorization: Bearer <token> optional

{
  "content": "周五 7 点图书馆门口集合，微信群二维码已更新在参与方式里。"
}
```

Responses:

- `200`: returns created update;
- `400`: invalid content or non-published Activity;
- `403`: current identity is not the Activity initiator;
- `404`: Activity not found.

### Activity Detail

`GET /api/activities/{activityId}` includes:

```json
"updates": [
  {
    "id": "upd-...",
    "activityId": "act-...",
    "content": "...",
    "authorDisplayName": "匿名发布者",
    "createdAt": "..."
  }
]
```

---

## 6. Event and notification path

```text
initiator POST /updates
→ MySQL insert activity_update
→ RabbitMQ ActivityUpdatePublishedEvent
→ consumer queries interested identities
→ WebSocket notification to online interested Users / Local Sessions
```

Payload:

```json
{
  "type": "ACTIVITY_UPDATE_PUBLISHED",
  "activityId": "act-001",
  "activityTitle": "周五晚羽毛球缺 2 人",
  "updateId": "upd-001",
  "message": "你感兴趣的活动有新补充"
}
```

The notification does not expose the list of interested identities or author contact details.

---

## 7. Consistency boundary

Accepted:

- update insert is the durable fact;
- notification failure does not roll back the update;
- offline interested identities do not receive a stored notification in this slice;
- duplicate update notifications are acceptable as side effects only if RabbitMQ redelivers after failure;
- update timeline on Activity Detail is the durable fallback.

Not accepted:

- update as chat message;
- update reply thread;
- update notification becoming a notification center;
- Redis or WebSocket as the source of truth.

---

## 8. Manual acceptance

1. Initiator opens their own `PUBLISHED` Activity detail.
2. Initiator publishes an update.
3. Activity Detail shows the update in timeline.
4. Another Local Session/User that already expressed Interest and is online receives a non-blocking notification.
5. A non-initiator cannot publish update (`403`).
6. A `CLOSED` or `EXPIRED` Activity rejects new update (`400`).
7. Offline notification is not stored; reopening Activity Detail still shows the update because MySQL is source of truth.
