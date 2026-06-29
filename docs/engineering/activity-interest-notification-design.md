# Activity Interest Notification Design

## 1. Purpose

Slice 1 made Activity Interest a durable product fact:

```text
Local Session or logged-in User clicks `我感兴趣`
→ MySQL records `activity_interest`
→ Activity Detail and My Initiated Activities show interest state/count
```

Slice 2 answers the next product question:

> When someone expresses Interest in my Activity, how do I know soon enough to react?

This document defines the notification semantics before implementation. It is intentionally not a code plan for RabbitMQ/Redis/WebSocket all at once. The goal is to keep the next engineering work scenario-driven rather than technology-driven.

## 2. Product scenario

Two identities use the platform:

```text
A = Activity Initiator
B = Interested identity
```

Scenario:

```text
A publishes an Activity
B opens the Activity Detail page
B clicks `我感兴趣`
A is currently online in the same browser/session or as a logged-in User
A receives an anonymous hint: `有人对你的 Activity 感兴趣`
```

The hint helps A notice that the Activity has traction. It does **not** turn the product into registration, private messaging, attendance tracking, or an in-platform contact system.

## 3. Dependency on Slice 1

Slice 2 depends on these Slice 1 facts:

- `activity_interest` is the source of truth for whether Interest exists;
- `interestCount` is derived from durable Interest rows;
- repeated clicks by the same identity are idempotent;
- the Activity Initiator cannot express Interest in their own Activity;
- Local Session is a browser-local identity carried by `X-Local-Session-Id` / `chat_room_local_session_id`;
- same-browser login/register may associate Local Session Activities and Interests to the logged-in User.

Slice 2 must not bypass these facts. Notification is a side effect after a durable Interest is created, not the definition of Interest itself.

## 4. Domain language

### Activity Interest

The durable relationship that means an identity is interested in an Activity.

### Initiator

The identity that created the Activity. It may be:

- a logged-in User; or
- a Local Session.

### Interested identity

The identity that clicks `我感兴趣`. It may be:

- a logged-in User; or
- a Local Session.

### Interest Notification

A transient anonymous hint delivered to the Initiator when a new Interest is created for their Activity.

An Interest Notification is not:

- a registration record;
- an attendance record;
- a chat message;
- a contact request;
- a durable notification-center item in the first realtime slice.

### Online notification session

A currently connected frontend session that can receive server-pushed hints. A notification session should be associated with either:

- a logged-in User identity; or
- a Local Session identity.

## 5. Notification semantics

### Who receives the notification?

Only the Activity Initiator receives the notification.

This is a targeted hint, not a Feed broadcast.

### Who is hidden?

The interested identity is anonymous in the first version. The notification must not expose:

- interested `userId`;
- interested `localSessionId`;
- display name;
- profile;
- contact method;
- interested-user list.

The UI may say:

```text
有人对你的 Activity 感兴趣
```

or, with title context:

```text
有人对《周五晚羽毛球缺 2 人》感兴趣
```

### When is a notification created?

A notification is created only when a **new** durable `activity_interest` row is created.

Cases:

| Case | Notify? | Reason |
| --- | --- | --- |
| B expresses Interest for the first time | Yes | New durable Interest fact |
| B repeats the same click | No | Idempotent duplicate; no new fact |
| A tries to express Interest in own Activity | No | Domain conflict; should be rejected before notification |
| Interest already existed under same Local Session, then user logs in | No by default | Association changes identity ownership; it is not a new Interest from product perspective |
| Activity not found / closed / expired | No | No valid Interest should be created |

### What is the delivery guarantee?

For the first realtime slice:

- if the Initiator is online, best-effort deliver the hint;
- if the Initiator is offline, do not persist a notification-center item;
- the Initiator can still see the durable signal through `interestCount` later.

This keeps Slice 2 narrow. Offline notification persistence can become a later feature if product feedback shows it matters.

### Non-goal: realtime Activity Feed synchronization

Publishing an Activity does not broadcast realtime Feed updates in the MVP.

Activity Feed is intentionally pull-based:

```text
User wants latest Activities
→ user manually refreshes the Feed
→ frontend calls GET /api/activities
→ MySQL returns the current Activity list
```

This is a product boundary, not a missing realtime feature. New Activity publication has weaker immediacy than `有人对你的活动感兴趣`; users can refresh the Feed when they want the latest list.

This slice must not add:

- Feed WebSocket broadcast;
- automatic insertion of newly published Activities into other users' lists;
- "new Activity published" notification hints;
- filter-aware realtime Feed merging.

Those behaviors can be reconsidered later only if the product explicitly becomes a realtime Activity square. For the current MVP, manual refresh keeps the Feed simpler and avoids disturbing search/category/tag state.

## 6. System responsibility boundaries

### MySQL

Owns durable truth:

- whether Interest exists;
- whether a click is new or duplicate;
- `interestCount` rebuildability;
- LocalSession-to-User association effects.

If MySQL says no new Interest was created, no notification should be emitted.

### WebSocket

Owns realtime delivery to currently connected notification sessions.

WebSocket should know how to route a hint to:

- `user:{userId}` sessions for logged-in Initiators;
- `local-session:{localSessionId}` sessions for Local Session Initiators.

### Redis

Potential future responsibility:

- shared online-session registry across multiple backend instances;
- rate limiting for frequent Interest clicks;
- hot count / hot score cache.

Redis should not be required for the first single-instance realtime proof unless the implementation is explicitly testing multi-instance routing.

### RabbitMQ

Potential future responsibility:

- move notification/hot-score/analytics side effects out of the HTTP request path;
- publisher confirm after MySQL success;
- consumer manual ack;
- retry and DLQ for failed side effects.

RabbitMQ must not decide whether Interest exists.

## 7. Failure model

### MySQL insert succeeds, notification fails

Interest still exists.

User-visible result:

- B sees `已感兴趣`;
- `interestCount` increases;
- A may not see realtime hint;
- A can still see count in Activity Detail or My Initiated Activities.

This is acceptable for Slice 2.

### Notification sends twice

Avoid duplicate sends when possible, but the product should tolerate occasional duplicate hints after retries in later RabbitMQ slices.

The durable Interest row remains unique. The notification is a side effect.

### WebSocket disconnected during delivery

Do not block or roll back Interest. Drop the online hint in Slice 2. Later offline notification persistence can be added if needed.

### RabbitMQ unavailable in future async slice

When RabbitMQ is introduced, the design decision must be explicit:

- either return success after MySQL and log/persist an outbox failure for later retry;
- or fail the HTTP response if event publication is considered mandatory for that slice.

For this product, the preferred direction is: durable Interest first, side effects retryable later.

## 8. Delivery slices

### Slice 2A: Notification semantics design

Status: current document.

Deliverable:

- define who gets notified;
- define what is hidden;
- define new-vs-duplicate behavior;
- define online/offline boundary;
- define component responsibilities;
- define manual acceptance target.

No production code in this slice.

### Slice 2B: Single-instance realtime hint

Goal: prove the user-facing realtime behavior with the smallest running implementation.

Possible implementation shape:

```text
POST /api/activities/{activityId}/interest
→ service attempts durable MySQL insert
→ service knows whether a new row was created
→ if new row created, call in-process NotificationPublisher
→ WebSocket sends anonymous hint to Initiator sessions
```

This slice may avoid RabbitMQ and Redis if the app is running as one backend instance. The purpose is to validate the product behavior first.

Acceptance:

- A opens a page with notification WebSocket connected;
- B uses another browser/local session and clicks `我感兴趣`;
- A receives anonymous hint;
- B repeats click and A does not receive a second hint;
- A does not receive a hint for self-interest attempt;
- backend/frontend compile/build pass.

### Slice 2C: Async Interest event

Goal: move side effects out of the HTTP request path.

Possible implementation shape:

```text
MySQL new Interest created
→ publish ActivityInterestCreated event
→ consumer sends WebSocket hint
→ future consumers update Redis hot score / analytics
```

This is where RabbitMQ belongs.

Acceptance should include:

- publisher confirm or documented publish-failure handling;
- consumer manual ack;
- retry behavior;
- duplicate event idempotency;
- notification still does not expose interested identity.

### Slice 2D: Multi-instance online routing

Goal: support more than one backend instance.

Possible implementation shape:

- Redis stores online session routing or pub/sub fanout;
- WebSocket connections remain local to each backend instance;
- Interest event can reach the instance that owns the Initiator session.

This should wait until single-instance behavior is accepted.

## 9. Suggested payload shape

Server-to-client WebSocket payload can be small:

```json
{
  "type": "ACTIVITY_INTEREST_HINT",
  "activityId": "act-001",
  "activityTitle": "周五晚羽毛球缺 2 人",
  "interestCount": 3,
  "message": "有人对你的 Activity 感兴趣"
}
```

Do not include interested identity fields.

## 10. UI placement options

First version should be simple:

- toast / small banner while A is online;
- optionally refresh `interestCount` on the current page if the Activity is visible;
- no notification center;
- no unread badge;
- no inbox.

Good first UX:

```text
toast: 有人对《周五晚羽毛球缺 2 人》感兴趣
button/link: 查看我的活动
```

## 11. Manual acceptance checklist for Slice 2B

- A creates or owns an Activity.
- A keeps the app open and connected.
- B opens the Activity from another browser profile or after clearing `chat_room_local_session_id`.
- B clicks `我感兴趣`.
- A sees one anonymous realtime hint.
- A sees no interested-user identity.
- B refreshes and still sees `已感兴趣`.
- B repeats the click / request and A does not receive another hint.
- A opens own Activity Detail and sees `宣传我的活动`, not `我感兴趣`.
- Closing or expired Activities do not emit new Interest hints.

## 12. Non-goals

Slice 2 does not implement:

- platform-internal registration;
- attendance tracking;
- initiator contacting interested people through the platform;
- interested-user list;
- notification center;
- offline notification persistence;
- mobile push notifications;
- email/SMS;
- recommendation ranking.

These can become later product choices if real usage shows the need.
