# Activity Expiration Engine Design

> Scenario 3 implementation. This slice turns Activity expiration from request-time cleanup into a scheduled lifecycle engine.

---

## 1. Purpose

Activity-first has two time modes:

```text
SCHEDULED → expires at endTime, or startTime when endTime is absent
ONGOING   → expires at expiresAt
```

Before this slice, expired Activities were mostly cleaned opportunistically when users opened Feed or My Initiated Activities. That kept Feed mostly correct, but Activity lifecycle depended on reads.

This slice adds an engine:

```text
Activity publish / edit
→ Redis expiration time index
→ scheduled tick
→ distributed lock
→ query due Activities by score
→ MySQL status transition PUBLISHED → EXPIRED
```

---

## 2. Scope

Implemented:

- Spring scheduling enabled with `@EnableScheduling`;
- Redis Sorted Set expiration index:

```text
activity:expires_at
member = activityId
score = expiresAt epoch millis
```

- Redis lock:

```text
activity:expiration:lock
```

- scheduled expiration tick every 60 seconds by default;
- MySQL remains source of truth for Activity status;
- create/update Activity writes the Redis expiration index;
- close Activity removes it from the Redis expiration index;
- scheduled tick syncs active published Activities from MySQL into Redis before checking due ids;
- due ids are expired in MySQL with a guarded `status = 'PUBLISHED' AND expires_at < now` update;
- Redis failures fall back to SQL expiration and log warnings.

Not implemented:

- reminders before Activity starts/expires;
- RabbitMQ reminder fan-out;
- notification dedupe keys;
- admin expiration dashboard;
- retry queue for expiration events.

Those belong to a later reminder/notification slice if product feedback needs it.

---

## 3. Domain boundary

MySQL owns durable Activity lifecycle state:

```text
activity.status = PUBLISHED | EXPIRED | CLOSED | DRAFT
activity.expires_at
```

Redis owns only a hot time index that makes due-Activity lookup cheap:

```text
ZRANGEBYSCORE activity:expires_at 0 now
```

If Redis is flushed, the scheduler rebuilds the index from MySQL published Activities on its next tick. If Redis is down, the scheduler falls back to the existing SQL expiration update.

---

## 4. Data path

### Publish / edit

```text
POST /api/activities or PUT /api/activities/{id}
→ ActivityService persists Activity in MySQL
→ ActivityExpirationService.indexActivity(activity)
→ Redis ZADD activity:expires_at expiresAtMillis activityId
```

### Close

```text
POST /api/activities/{id}/close
→ MySQL status = CLOSED
→ Redis ZREM activity:expires_at activityId
```

### Scheduled expiration

```text
@Scheduled fixedDelay 60000ms
→ SETNX activity:expiration:lock with 30s TTL
→ sync published Activities from MySQL into activity:expires_at
→ ZRANGEBYSCORE activity:expires_at 0 now LIMIT 0 100
→ UPDATE activity SET status='EXPIRED'
   WHERE status='PUBLISHED'
     AND expires_at < now
     AND id IN (...due ids...)
→ ZREM due ids from activity:expires_at
→ release lock if token still matches
```

---

## 5. Consistency model

Accepted:

- expiration may lag by up to the scheduler interval;
- a Redis outage should not break Feed, publish, edit, close, or Interest actions;
- SQL request-time `expireOutdated(now)` remains as a defensive fallback;
- Redis lock avoids duplicate scheduled work across backend instances when Redis is available;
- if the lock cannot be acquired because another instance owns it, the tick skips.

Not accepted:

- Redis being the source of truth for whether an Activity is expired;
- closed Activities being re-expired or reintroduced by Redis index residue;
- requiring a user to open Feed before expiration can ever happen.

---

## 6. Implementation files

```text
backend/src/main/java/com/yuy/chatroom/ChatRoomBackendApplication.java
backend/src/main/java/com/yuy/chatroom/mapper/ActivityMapper.java
backend/src/main/java/com/yuy/chatroom/service/ActivityExpirationService.java
backend/src/main/java/com/yuy/chatroom/service/ActivityService.java
```

Key methods:

```text
ActivityExpirationService.indexActivity(...)
ActivityExpirationService.removeActivity(...)
ActivityExpirationService.expireDueActivities()
ActivityMapper.findPublishedExpirationIndexRows()
ActivityMapper.expirePublishedByIds(...)
```

---

## 7. Manual acceptance

### Compile

```bash
cd backend
mvn -q -DskipTests compile
```

### Redis index write

Create or edit an Activity with a near-future expiration time, then check:

```bash
redis-cli ZRANGE activity:expires_at 0 -1 WITHSCORES
```

Expected: the Activity id appears with an epoch-millis expiration score.

### Scheduled expiration

Use a short-lived Activity and wait for one scheduler tick, or temporarily lower:

```yaml
app:
  activity-expiration:
    fixed-delay-ms: 5000
```

Expected:

- after expiration time passes, Activity status becomes `EXPIRED` in MySQL;
- expired Activity no longer appears in default Feed;
- due id is removed from `activity:expires_at`.

### Distributed lock signal

During a tick, Redis may contain:

```text
activity:expiration:lock
```

Expected: only one backend instance runs expiration work per lock TTL.

### Redis failure boundary

Stop Redis and wait for a tick, or call Feed.

Expected:

- backend logs a warning;
- SQL fallback expiration still protects Feed correctness;
- normal Activity actions are not blocked by the Redis index failure.
