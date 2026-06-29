# Activity Interest and Realtime Hint Design

> This document turns the Activity Interest scenario into an implementable design. It is not the MVP glossary; canonical domain terms live in `CONTEXT.md`. Storage and async boundaries are recorded in `docs/adr/0004-activity-interest-storage-boundary.md`.

---

## 1. Purpose

Activity Interest is a lightweight "I am interested" signal for an Activity.

It exists to:

- let Local Sessions and logged-in Users express lightweight interest without becoming a registration system;
- give the Activity Initiator anonymous feedback;
- introduce system-level engineering depth through identity handling, RabbitMQ side effects, WebSocket targeted hints, and documented Redis deferral.

It explicitly does **not** represent registration, confirmed participation, attendance, bookmark/favorite, or platform-internal communication.

---

## 2. Domain decisions already fixed

- A Local Session or logged-in User can express Activity Interest.
- A Local Session or logged-in User can initiate an Activity.
- Local Session identity is browser-local and stored via localStorage localSessionId.
- Local Session Initiator can edit and close the Activity only from the same browser identity.
- Same-browser Local Session Activities and Interests may be associated to a User after login/register.
- Initiator display name:
  - logged-in User: User displayName;
  - Local Session: generic temporary-user label.
- Interest is shown to the Initiator only as anonymous count and anonymous real-time hint.
- Interested user/local-session lists are not exposed.
- Interest Count is shown on Activity Detail and My Initiated Activities, not Feed cards.
- MySQL is Interest source of truth.
- Redis is deferred from the Interest notification path until multi-instance routing or rate limiting becomes real product/ops pressure.
- RabbitMQ carries async side effects after durable MySQL write.

---

## 3. Delivery slices

### Slice 1: Domain fact loop — implemented and accepted

Status: ✅ Implemented in `a3ab00a feat: add activity interest local session flow`; Yuy manual acceptance passed.

Goal: make Activity Interest a real persisted domain object.

Includes:

- `activity_interest` table;
- express-interest API;
- Detail response with `interestCount` and `interestedByCurrentIdentity`;
- My Initiated Activities response with `interestCount`;
- Activity Detail button: `我感兴趣` → `已感兴趣`;
- local-session/user identity support;
- idempotency through durable uniqueness.

Excludes:

- Redis;
- RabbitMQ;
- WebSocket notifications;
- cancel interest;
- interested list;
- Feed card count;
- notification center.

### Slice 2A: Notification semantics design — accepted

Design doc: `docs/engineering/activity-interest-notification-design.md`.

This slice defines targeted Interest Notification semantics before implementation: who receives the hint, what identity stays hidden, when duplicate clicks do not notify, and how online/offline behavior works.

### Slice 2B: Single-instance WebSocket targeted hint — accepted

Delivered:

- `/ws/notifications` notification socket;
- optional JWT + `localSessionId` handshake;
- userId session registry;
- localSessionId session registry;
- anonymous right-top notification card delivered to Initiator identity after a new durable Interest is created;
- `GET /api/me/activities` public filter pass-through so Local Session initiators can open `查看我的活动`;
- no RabbitMQ/Redis requirement.

Accepted behavior:

- A creates or owns an Activity and keeps the app open;
- B uses another browser/local session and clicks `我感兴趣`;
- A sees one non-blocking notification card;
- B refreshes and still sees `已感兴趣`;
- repeated click/request does not notify again;
- self-interest shows `宣传我的活动` and does not notify;
- publishing a new Activity does not realtime-sync other users' Feed; users refresh Feed manually.

### Slice 2C: RabbitMQ async side effects — implemented and accepted

Includes:

- publish `ActivityInterestCreated` after MySQL success;
- consumer sends the already-accepted WebSocket notification side effect;
- publisher confirm or explicit publish-failure handling;
- consumer manual ack;
- retry / DLQ boundary;
- duplicate event idempotency.

Out of scope for Slice 2C unless explicitly reopened:

- Redis count/hot score;
- multi-instance WebSocket routing;
- notification center / offline persistence;
- interested identity exposure.

### Slice 2D: Redis hot-path and multi-instance routing — deferred

Original idea:

- Redis short-lived dedupe marker;
- Redis rate limiting;
- online session routing or pub/sub fanout for multiple backend instances;
- fallback behavior when Redis is unavailable.

Current decision:

- do not continue adding Redis to the Interest notification path in the single-instance MVP;
- revisit this only when multiple backend instances or real abuse/rate-limit pressure appears;
- use Redis next through Slice 3 Hot Activity Ranking, where Sorted Set ranking directly supports Activity discovery.

Next design: `docs/engineering/activity-hot-ranking-design.md`.

---

## 4. Slice 1 API

### Local Session naming

Use the new Local Session terminology directly. Do not add compatibility with old visitor naming.

New implementation names:

- frontend localStorage key: `chat_room_local_session_id`;
- HTTP header: `X-Local-Session-Id`;
- TypeScript variable: `localSessionId`;
- Java variable: `localSessionId`;
- SQL column: `local_session_id` / `created_by_local_session_id`.

Do not continue introducing new `visitorId`, `visitor_id`, `X-Visitor-Id`, or `chat_room_visitor_id` usage for this feature.

### Express Interest

```http
POST /api/activities/{activityId}/interest
```

Identity:

- reads `X-Local-Session-Id` from request header;
- reads logged-in `userId` from JWT when present;
- at least one identity must exist;
- local-session-only requests are valid.

Semantics:

- expresses Interest for current local-session/user identity;
- idempotent;
- repeated calls must not create duplicate Interest;
- successful response means the durable Interest relationship exists in MySQL.

Response: returns the full `ActivityResponse` shape so the detail page can update itself immediately. Relevant fields include:

```json
{
  "id": "act-001",
  "interestCount": 3,
  "interestedByCurrentIdentity": true,
  "canExpressInterest": false,
  "initiatedByCurrentIdentity": false
}
```

### Activity Detail

Existing:

```http
GET /api/activities/{activityId}
```

Add fields:

```json
{
  "interestCount": 3,
  "interestedByCurrentIdentity": true
}
```

### My Initiated Activities

Existing:

```http
GET /api/me/activities
```

Add field to each Activity:

```json
{
  "interestCount": 3
}
```

For Local Session Initiators, `GET /api/me/activities` should return Activities for the current identity. If the request has a logged-in userId, return `created_by_user_id = userId`; otherwise return `created_by_local_session_id = localSessionId` and `created_by_user_id IS NULL`. After LocalSession-to-User Association, the same Activities move into the User branch.

---

## 5. Slice 1 data model sketch

Use explicit dual identity fields instead of storing Local Session ids inside User id fields.

### Activity initiator identity

Activity should distinguish logged-in User identity from Local Session identity:

```sql
ALTER TABLE activity
  ADD COLUMN created_by_user_id VARCHAR(36) NULL,
  ADD COLUMN created_by_local_session_id VARCHAR(128) NULL;
```

Rules:

- logged-in User initiator: `created_by_user_id = user.id`, `created_by_local_session_id` may retain the current local session id;
- Local Session initiator: `created_by_user_id = NULL`, `created_by_local_session_id = localSessionId`;
- after LocalSession-to-User Association: fill `created_by_user_id`, keep `created_by_local_session_id` for origin and same-browser traceability;
- never store a Local Session id in a User id field.

### Activity Interest identity

```sql
CREATE TABLE activity_interest (
  id VARCHAR(36) PRIMARY KEY,
  activity_id VARCHAR(36) NOT NULL,
  local_session_id VARCHAR(128) NULL,
  user_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL,
  associated_at TIMESTAMP NULL,
  CONSTRAINT fk_activity_interest_activity FOREIGN KEY (activity_id) REFERENCES activity(id),
  CONSTRAINT fk_activity_interest_user FOREIGN KEY (user_id) REFERENCES app_user(id)
);
```

Rules:

- Local Session Interest: `user_id = NULL`, `local_session_id = localSessionId`;
- logged-in User Interest: `user_id = user.id`, `local_session_id` may retain the current local session id;
- after LocalSession-to-User Association: fill `user_id`, keep `local_session_id`;
- one Interest per `(activity_id, local_session_id)` when local session id exists;
- one Interest per `(activity_id, user_id)` when user id exists;
- association must not create duplicates.

Exact MySQL indexing strategy should be decided during implementation because partial unique indexes are not portable across all MySQL versions.

---

## 6. Slice 1 acceptance checklist

Status: ✅ Passed by Yuy after fixing the public-endpoint whitelist for `POST /api/activities/{activityId}/interest` in `JwtAuthFilter`.

- Local Session opens Activity Detail and sees `我感兴趣`.
- Local Session clicks it and sees `已感兴趣`.
- Refreshing the same browser keeps `已感兴趣`.
- Re-clicking does not increase count again.
- Another Local Session can express Interest and count increases.
- Logged-in user can express Interest.
- Initiator cannot express Interest in their own Activity; UI shows `宣传我的活动` instead.
- Local Session Initiator can see their own Activities in My Initiated Activities from the same browser.
- Same-browser login/register associates Local Session Activities and Interests to the User.
- Interest Count appears on Activity Detail.
- Initiator sees Interest Count on My Initiated Activities.
- Feed cards do not show Interest Count.
- No interested-user list is exposed.
- Existing visitor naming is replaced rather than extended for this feature.

## 7. Implementation notes from Slice 1

- Public Local Session endpoints must be whitelisted in `JwtAuthFilter`; otherwise correct frontend headers still receive 401 before reaching the controller.
- The implemented MySQL uniqueness strategy uses separate unique keys for `(activity_id, user_id)` and `(activity_id, local_session_id)` plus service-layer identity rules.
- The UI labels self-owned Activities with `宣传我的活动` rather than allowing self-interest.
- Slice 1 deliberately does not implement realtime hints. The next engineering slice should start from the product question: “when someone expresses Interest, how does the Initiator know?”
