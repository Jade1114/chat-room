# ADR 0004: Activity Interest Storage Boundary

## Status

Accepted

## Context

The project is adding **Activity Interest**: a lightweight "I am interested" signal for an Activity.

Activity Interest must support:

- Local Session and logged-in User identities;
- one Interest per Activity per identity;
- already-interested state on Activity Detail;
- Interest Count on Activity Detail and My Initiated Activities;
- LocalSession-to-User Association when a same-browser Local Session logs in or registers;
- future real-time anonymous hints to the Activity Initiator.

This feature naturally needs both durable state and hot-path protection:

- durable truth for whether an Interest exists;
- deduplication for repeated clicks;
- rate limiting to protect the endpoint;
- fast counters for UI and future hotness ranking;
- recovery when Redis state is lost or stale.

## Decision

**MySQL is the source of truth for Activity Interest. Redis is a hot-path protection and acceleration layer. RabbitMQ carries asynchronous side effects after the durable Interest record exists.**

An Activity Interest is successful only after the durable MySQL relationship has been written.

Redis may be used for:

- short-lived deduplication, e.g. `SETNX interest:dedupe:{activityId}:{identityKey}`;
- rate limiting, e.g. `ratelimit:interest:{identityKey}`;
- hot Interest Count cache, e.g. `interest:count:{activityId}`;
- future hotness ranking with Sorted Sets.

Redis must not be the only place where an Interest exists.

RabbitMQ may be used after MySQL succeeds for asynchronous side effects:

- update Redis Interest Count or future hotness score;
- deliver anonymous real-time Interest hints to the Activity Initiator;
- record analytics events such as `INTEREST_EXPRESSED`;
- support future fan-out workflows without slowing the HTTP response.

RabbitMQ must not decide whether the Interest itself exists. If MySQL succeeds and RabbitMQ publishing or consumption is delayed, the Interest still exists; only side effects may lag.

## Write path

```text
Local Session/User clicks `我感兴趣`
  → MySQL INSERT IGNORE activity_interest
  → Interest is successful only after MySQL succeeds
  → HTTP response returns updated ActivityResponse after durable write
  → future slice: publish Activity Interest event
  → future async consumers update Redis count / hot score, record analytics, and push notification
```

In the implemented Slice 1, MySQL uniqueness and `INSERT IGNORE` provide the durable idempotency boundary. Redis dedupe/rate limiting can be added later as hot-path protection, but it must remain best-effort and cannot be the source of truth.

## Read path

For already-interested state and correctness-sensitive checks, read from MySQL or use Redis only as a cache with MySQL fallback.

For Interest Count display, Redis may be used as a fast path. If Redis is missing or stale, the count can be rebuilt from MySQL:

```sql
SELECT COUNT(*) FROM activity_interest WHERE activity_id = ?
```

## Consistency model

| Data | Store | Consistency |
|------|-------|-------------|
| Interest relationship | MySQL | Strong source of truth |
| Dedupe marker | Redis | Short-lived, best-effort |
| Rate limit state | Redis | Ephemeral protection state |
| Interest Count cache | Redis | Eventually consistent, rebuildable |
| Real-time notification | RabbitMQ/WebSocket | At-least-once / best-effort online delivery |

## Failure handling

### Redis says duplicate, MySQL has no Interest

Possible cause:

```text
SETNX succeeded → MySQL INSERT failed → dedupe key still exists
```

Handling:

- set a short TTL on dedupe keys;
- attempt to delete the key after MySQL failure;
- accept a short window where the user may need to retry.

### MySQL has Interest, Redis count is stale

Possible cause:

```text
MySQL INSERT succeeded → async Redis update failed
```

Handling:

- Redis count is not source of truth;
- rebuild from MySQL when cache is missing or suspicious;
- keep UI tolerant of eventual consistency.

### Redis data is lost

Core Interest data remains in MySQL.

Effects:

- dedupe/rate-limit protection is temporarily cold;
- counters need to be rebuilt;
- no Activity Interest facts are lost.

## Consequences

### Positive

- Activity Interest facts are durable and recoverable.
- Redis improves hot-path behavior without becoming an unrecoverable truth store.
- The design can clearly explain source of truth vs hot state.
- Future hotness ranking can build on Redis without changing the Interest fact model.

### Negative

- The write path has more moving parts than pure CRUD.
- Redis/MySQL temporary inconsistency is possible and must be documented.
- Count display may briefly lag behind the durable Interest record.

## Alternatives considered

### Store Interest only as `activity_event`

Rejected. An event log is good for analytics but weak as the source of current state. Interest needs uniqueness, already-interested checks, counts, and LocalSession-to-User Association.

### Store Interest only in Redis

Rejected. Redis state is hot and rebuildable, not the durable record of who expressed Interest. Losing Redis must not lose Interest facts.

### Always compute counts from MySQL

Rejected for the long term. It is correct but does not demonstrate the intended hot-state design and may become expensive as Activity views and Interests grow.
