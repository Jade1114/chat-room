# Activity Rate Limiting and Safety Design

> Scenario 4 implementation. This slice adds Redis-backed protection for public Activity actions without changing the Activity-first product model.

---

## 1. Purpose

The Activity-first MVP intentionally allows low-friction public actions through a Local Session:

```text
anonymous/local user
→ publish Activity
→ express Activity Interest
```

That openness creates two abuse paths:

1. a browser repeatedly publishes low-quality Activities;
2. a browser or IP repeatedly clicks `我感兴趣`, creating noisy side effects and hot-score pressure.

This slice adds system protection around those actions while preserving the normal user path.

---

## 2. Scope

Implemented in this slice:

- rate limit public `POST /api/activities`;
- rate limit public `POST /api/activities/{activityId}/interest`;
- return HTTP `429 Too Many Requests` with `Retry-After`;
- apply both actor-level and IP-level limits;
- use Redis as shared, cross-instance hot state;
- fail open if Redis is unavailable so the MVP path is not blocked by cache infrastructure.

Not implemented in this slice:

- CAPTCHA;
- account bans;
- moderation queues;
- content spam scoring;
- frontend cooldown UI beyond showing the backend error message;
- distributed abuse analytics dashboard.

---

## 3. Identity model

Rate limiting uses the most stable identity available:

```text
logged-in User        → user:{userId}
anonymous browser     → local:{X-Local-Session-Id}
missing local session → ip:{clientIp}
```

The backend also applies IP-level buckets so one user cannot fully bypass limits by rotating Local Session ids in the same network.

Raw identities are hashed before being placed in Redis keys.

---

## 4. Rules

### Activity publish

```text
POST /api/activities
```

Rules:

| Scope | Algorithm | Limit |
| --- | --- | --- |
| actor | Redis ZSET sliding window | 3 creates / 60 seconds |
| IP | Redis ZSET sliding window | 10 creates / 60 seconds |

Why sliding window: publishing is low-frequency and user-visible. A sliding window gives a simple, explainable boundary without a hard clock reset.

### Activity Interest

```text
POST /api/activities/{activityId}/interest
```

Rules:

| Scope | Algorithm | Limit |
| --- | --- | --- |
| actor | Redis token bucket | capacity 10, refill 10 / second |
| IP | Redis token bucket | capacity 30, refill 30 / second |

Why token bucket: Interest clicks may happen in short bursts during normal browsing, but sustained high-frequency clicks should be rejected.

---

## 5. Redis keys

The exact keys are hashed by identity:

```text
rate:activity:create:actor:{identityHash}
rate:activity:create:ip:{ipHash}
rate:activity:interest:actor:{identityHash}:tokens
rate:activity:interest:actor:{identityHash}:ts
rate:activity:interest:ip:{ipHash}:tokens
rate:activity:interest:ip:{ipHash}:ts
```

The create limiter uses Sorted Sets. The Interest limiter uses String values for token count and last-refill timestamp.

---

## 6. API behavior

When a limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: <seconds>
Content-Type: application/json

{
  "error": "发布太频繁了，请稍后再试",
  "retryAfterSeconds": <seconds>
}
```

Frontend API helpers already parse `error` from the JSON body, so the existing page-level error display can show the message.

---

## 7. Consistency and failure boundary

Redis owns only hot protection state. MySQL remains the source of truth for Activity and Interest facts.

Accepted tradeoffs:

- rate-limit counters may reset if Redis is flushed;
- Redis failure logs a warning and fails open;
- a request can consume one bucket and then fail a later business validation;
- the limit is protection, not billing or durable compliance accounting.

Not accepted:

- Redis outage blocking normal publish or Interest actions;
- only frontend-side throttling;
- replacing MySQL uniqueness for Activity Interest with rate limiting.

---

## 8. Implementation

Backend files:

```text
backend/src/main/java/com/yuy/chatroom/service/ActivityRateLimitService.java
backend/src/main/java/com/yuy/chatroom/service/RateLimitExceededException.java
backend/src/main/java/com/yuy/chatroom/controller/ActivityController.java
```

`ActivityRateLimitService` owns Redis Lua scripts for atomic operations:

- sliding-window ZSET script for Activity publish;
- token-bucket String script for Interest clicks.

`ActivityController` applies limits before calling `ActivityService` and maps `RateLimitExceededException` to `429`.

---

## 9. Manual acceptance

### Compile

```bash
cd backend
mvn -q -DskipTests compile
```

### Create limit

Use the same Local Session id and post four valid Activities within one minute:

```bash
LOCAL_SESSION_ID="rate-create-demo"
# call POST /api/activities 4 times with valid payload
```

Expected:

- first 3 requests succeed;
- 4th request returns `429`;
- response has `Retry-After` and `retryAfterSeconds`.

### Interest limit

Use the same Local Session id and rapidly call Interest more than 10 times in one second:

```bash
LOCAL_SESSION_ID="rate-interest-demo"
# call POST /api/activities/{id}/interest rapidly
```

Expected:

- normal clicks succeed or become idempotent Interest responses;
- sustained rapid clicks return `429`;
- response has `Retry-After` and `retryAfterSeconds`.

### Redis failure boundary

Stop or disconnect Redis, then repeat one normal publish or Interest action.

Expected:

- action is not blocked by the limiter;
- backend logs a warning;
- MySQL business rules still apply.
