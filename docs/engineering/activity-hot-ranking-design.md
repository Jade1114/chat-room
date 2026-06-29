# Activity Hot Ranking Design

> Slice 3 design. This document defines how Redis enters the Activity-first system through Hot Activity Ranking, rather than being forced into Activity Interest notification routing.

---

## 1. Purpose

The Activity-first product thesis is:

```text
让校园里值得一起完成的事情持续被发现。
```

The current Feed helps users discover Activities by time and filters. Slice 3 adds a second discovery signal:

```text
Which Activities are currently attracting attention?
```

Hot Activity Ranking turns real user behavior into a derived ranking model. Redis is used because ranking scores are hot, frequently updated, and naturally represented as a Sorted Set.

This is not a recommendation system. It is a transparent activity-discovery aid built from first-version behavior signals.

---

## 2. Why this is the right Redis slice

Slice 2 originally considered Redis for Activity Interest notification dedupe / multi-instance routing. That path is deferred because the accepted MVP is still single-backend-instance and online notification is best-effort.

Hot Activity Ranking is a better Redis entry point for the current stage because it directly serves the product problem:

```text
User opens Activity Feed
→ user wants to find worthwhile Activities faster
→ hot ranking uses real behavior to surface Activities with traction
```

Engineering evidence:

- Redis Sorted Set for ranking;
- MySQL source of truth + Redis derived read model;
- event-driven score updates;
- fallback/rebuild boundary when Redis is unavailable or empty;
- explainable consistency tradeoff.

---

## 3. Current product facts from Slice 2

Already accepted:

- Activity Detail records `DETAIL_VIEW`;
- participation method reveal records `PARTICIPATION_METHOD_VIEW`;
- Activity Interest records durable `activity_interest` and emits `ActivityInterestCreatedEvent` through RabbitMQ;
- Feed does not realtime-sync new publications; users refresh manually;
- Activity Interest notification is online best-effort and anonymous.

Slice 3 builds on the same event language. It does not change the meaning of Interest or Notification.

---

## 4. Domain language

### Hot Activity

An Activity with recent/meaningful attention signals.

Hotness is not a durable domain fact. It is a derived score used for discovery ranking.

### Hot Score

A numeric score derived from behavior events.

The first version uses simple weighted increments:

| Behavior | Source | Weight |
| --- | --- | ---: |
| Activity Detail View | `DETAIL_VIEW` event | +1 |
| Participation Method View | `PARTICIPATION_METHOD_VIEW` event | +3 |
| Activity Interest Created | `ActivityInterestCreatedEvent` | +5 |

### Hot Feed

A Feed ordering mode that lists valid published Activities by hot score.

First API shape:

```http
GET /api/activities?sort=hot
```

Default `GET /api/activities` remains the accepted time/category/tag Feed.

---

## 5. Storage boundary

### MySQL

Owns durable facts:

- Activity rows and status;
- `activity_event` rows;
- `activity_interest` rows;
- rebuild source for hot score.

### Redis

Owns derived hot read model:

```text
ZSET activity:hot_score
member = activityId
score = weighted hot score
```

Redis does **not** own whether an Activity exists, whether an Interest exists, or whether an Activity is visible.

### RabbitMQ

Carries asynchronous score update events when the behavior source already uses an async path.

For Slice 3A/3B, implementation can choose either:

```text
simple path: service records behavior → Redis ZINCRBY
```

or:

```text
event path: service records behavior → RabbitMQ event → consumer updates Redis
```

Given Slice 2C already introduced RabbitMQ for Interest-created side effects, the preferred implementation is to add a hot-score consumer for `ActivityInterestCreatedEvent` and use a direct Redis update for existing synchronous `DETAIL_VIEW` / `PARTICIPATION_METHOD_VIEW` unless those events are later moved to RabbitMQ too.

---

## 6. Consistency model

Hot ranking is eventually consistent.

Accepted tradeoffs:

- losing a small number of view increments is acceptable;
- MySQL remains able to rebuild approximate hot scores from event logs and interest rows;
- Redis downtime must not block Activity Detail, participation reveal, or Interest creation;
- Feed `sort=hot` should fall back to normal time ordering if Redis is unavailable or empty.

Not accepted:

- returning closed/expired Activities just because they still have Redis score;
- making Redis the only source of Activity visibility;
- using hot score as a participation/attendance metric.

---

## 7. Delivery slices

### Slice 3A: Hot Ranking design — current

Deliver this document and update roadmap/scenario catalog/manual acceptance.

No production code.

### Slice 3B: Redis write path

Goal: update `activity:hot_score` when user behavior happens.

Includes:

- Redis service wrapper for `ZINCRBY`;
- score increment on `DETAIL_VIEW`;
- score increment on `PARTICIPATION_METHOD_VIEW`;
- score increment from `ActivityInterestCreatedEvent` consumer or a separate hot-score consumer;
- graceful fallback if Redis write fails.

Acceptance:

- opening Activity Detail increases score by 1;
- revealing participation method increases score by 3;
- creating a new Interest increases score by 5;
- duplicate Interest does not add +5 again;
- Redis failure does not block product action.

### Slice 3C: Hot Feed read path

Goal: users can request hot ranking.

Includes:

- `GET /api/activities?sort=hot`;
- Redis `ZREVRANGE` / `ZREVRANGE_WITHSCORES` reads;
- MySQL hydration for valid Activity rows;
- status/time filtering remains MySQL-owned;
- fallback to normal Feed order if Redis empty/unavailable.

Acceptance:

- Activity with higher behavior score appears earlier in hot Feed;
- closed/expired Activities do not appear;
- default Feed remains unchanged;
- category/tag/search filters still narrow results.

### Slice 3D: Rebuild / operations boundary

Goal: document and optionally implement hot-score rebuild.

Includes:

- script or admin-only operation to rebuild `activity:hot_score` from MySQL events and interests;
- manual RabbitMQ/Redis smoke commands;
- notes for demo reset.

Acceptance:

- Redis hot-score key can be deleted;
- rebuild reconstructs scores from durable records;
- product actions still work while Redis is empty.

---

## 8. API sketch

### Default Feed remains unchanged

```http
GET /api/activities
```

### Hot ranking

```http
GET /api/activities?sort=hot
```

Optional filters can be combined:

```http
GET /api/activities?sort=hot&category=SPORTS&tag=羽毛球&q=周五
```

Response shape should stay the same as current Activity Feed response so frontend can reuse cards/tabs.

---

## 9. Frontend UX sketch

First version should be minimal:

```text
发现事情
[最新] [热门]
```

Rules:

- `最新` uses current accepted Feed ordering;
- `热门` calls `GET /api/activities?sort=hot`;
- no realtime Feed updates;
- no personalized recommendations;
- no explanation-heavy score display in first version.

Optional small copy:

```text
热门：根据浏览、查看参与方式和感兴趣行为排序。
```

---

## 10. Failure model

### Redis write fails

Product action still succeeds. Log warning; do not roll back MySQL or RabbitMQ facts.

### Redis read fails

Return normal Feed order and optionally include no special UI error. Hot ranking is an enhancement, not source of truth.

### Redis has stale score for closed Activity

Hydrate through MySQL and filter by visibility. Redis score alone must never make a closed/expired Activity visible.

### Activity Interest event is retried

The first implementation may tolerate occasional duplicate hot-score increments. If this becomes visible or problematic, add idempotency keyed by `eventId` in Redis:

```text
SETNX hot_score:processed:{eventId} 1 EX 86400
```

Do not add this before it is needed.

---

## 11. Manual acceptance checklist

- Create at least three valid published Activities.
- Open Activity A detail once: score +1.
- Reveal Activity B participation method once: score +3.
- Express Interest in Activity C once from another Local Session: score +5.
- Open `GET /api/activities?sort=hot` or frontend Hot tab.
- C appears before B, B before A when no other scores exist.
- Repeat Interest on C does not add another +5.
- Close C; Hot tab no longer shows C.
- Stop/disable Redis temporarily if practical; default Feed still works.

---

## 12. Non-goals

Slice 3 does not implement:

- personalized recommendation;
- machine-learning ranking;
- realtime Feed push;
- notification center;
- trending notifications;
- exposing exact hot score to users as a social proof metric;
- using Redis as Activity source of truth.
