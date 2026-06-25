# Documentation Map

This document explains how the project documentation is layered after the Activity-first MVP rebaseline.

The project now has two documentation tracks:

1. **Product delivery track** — what the project is, what the MVP validates, how to implement and verify it.
2. **Learning track** — how Yuy uses the project to learn backend engineering topics such as Redis, RabbitMQ, WebSocket lifecycle, and concurrency.

## 1. Top-level project entry

### `README.md`

Project entry point.

Use it when you need a quick understanding of:

- what the project is;
- what the current MVP is;
- how to run it locally;
- where to find the important docs.

The README should stay concise. Detailed documentation belongs in the files below.

---

## 2. Product delivery track

These documents define the current Activity-first product direction and the first-version MVP.

### `VISION.md`

Product vision.

Answers:

- why this product exists;
- what belief drives it;
- what kind of culture it wants to create;
- what it intentionally refuses to become.

Current thesis:

> Campus does not lack interesting people or worthwhile things to do together. It lacks a place where those things remain discoverable.

### `docs/MVP.md`

First-version MVP boundary.

Answers:

- what the first version validates;
- what the core user story is;
- what the core objects are;
- what features must exist;
- what the MVP intentionally does not build;
- what success metrics matter.

Current MVP:

```text
login
→ Activity Feed
→ search/filter Activities
→ Activity Detail
→ view participation method
→ private/off-platform contact
→ real-world participation
→ user returns to find new Activities
```

### `docs/adr/0003-activity-first-mvp.md`

Current authoritative decision record.

Records the accepted decisions from the Activity-first MVP grilling session:

- Activity-first replaces Organization-first for the current MVP;
- core objects are `User` and `Activity`;
- no platform-internal Participation table;
- `participationMethod` is a free-text field;
- no activity capacity;
- `SCHEDULED` and `ONGOING` time modes;
- `ONGOING` max duration is 30 days;
- Activity status is `DRAFT`, `PUBLISHED`, `EXPIRED`, `CLOSED`;
- Feed is split into Upcoming and Ongoing;
- minimal event logs are `DETAIL_VIEW` and `PARTICIPATION_METHOD_VIEW`;
- login is required for Activity surfaces;
- no image/upload/review/social/chat features in the MVP;
- default navigation is `/activities`, `/activities/new`, `/me/activities`.

### `CONTEXT.md`

Domain glossary.

Defines the vocabulary used by product docs, code discussion, and implementation planning:

- `User`
- `Activity`
- `Initiator`
- `Participation Method`
- `Activity Category`
- `Activity Tags`
- `Activity Time Mode`
- `Activity Status`
- `Activity Feed`
- `Activity Event`

It also explains why Organization, Membership, Channel, and Chat are historical/future concepts rather than current MVP core objects.

### `docs/product-engineering-map.md`

Product engineering map.

Connects product thinking to implementation:

- real user pain;
- MVP hypothesis;
- core flow;
- current implementation assets;
- current MVP gaps;
- recommended implementation sequence;
- documentation trust rules.

Use this when explaining the project as product-engineering evidence.

### `docs/current-mvp-gap-and-roadmap.md`

Current MVP status and roadmap.

Answers:

- what exists now;
- which Activity-first MVP slices have been completed and accepted;
- which legacy Organization/Chat abilities are no longer MVP acceptance criteria;
- what the two long-term directions are: style/design adjustment and new feature development.

Use this before implementation planning.

---

## 3. Contract, acceptance, and deployment track

These documents turn product direction into verifiable engineering work.

### `docs/api-contract.md`

Target frontend/backend API contract for the Activity-first MVP.

Defines target endpoints for:

- auth;
- Activity Feed;
- Activity Detail;
- participation method reveal;
- publish Activity;
- update Activity;
- close Activity;
- my initiated Activities;
- Activity event logs.

This is a target contract. It may describe intended MVP behavior before all code exists.

### `docs/manual-acceptance.md`

Manual acceptance checklist.

Use it to verify the MVP manually:

- login;
- `/activities` entry;
- Feed sections;
- search/filter;
- Activity Detail;
- participation method reveal;
- event logging;
- publish/close Activity;
- my initiated Activities.

It explicitly does not verify Organization, Membership, Channel, realtime chat, comments, notifications, or platform-internal registration.

### `docs/classmate-review-guide.md`

Guide for classmates or reviewers.

Use this when asking someone else to try the project without reading the source code.

It explains:

- what problem the project solves;
- what they should test;
- what is intentionally out of scope;
- how to run it;
- how to provide feedback;
- how to think about the two future directions: style/design and new features.

### `docs/deployment.md`

Deployment and smoke-test entry.

Covers:

- Docker Compose startup;
- seed accounts;
- local smoke tests;
- VPS Phase 2A target;
- VPS acceptance;
- troubleshooting priorities.

Deployment acceptance should follow Activity-first MVP flows, not the old chat flow.

---

## 4. Quality and engineering-risk track

### `docs/bug/bug-log.md`

Bug and quality-closure log.

This file may contain historical Organization/Chat bugs because they were real findings. When prioritizing now, ask:

> Does this block the Activity-first MVP?

If not, it may remain as historical or future work.

### `docs/known-engineering-concerns.md`

Known engineering concerns.

Documents architecture and backend risks discovered during review, such as:

- in-memory `SessionManager` cross-instance limits;
- WebSocket broadcast queue blocking;
- N+1 queries;
- query-param auth fallback risks;
- RabbitMQ bucket hardcoding.

These concerns are important engineering memory, but they are not all MVP blockers.

---

## 5. Feature-doc index

### `docs/features/README.md`

Feature documentation index.

It points readers away from historical feature docs and toward the current Activity-first source of truth:

- `VISION.md`
- `docs/MVP.md`
- `docs/adr/0003-activity-first-mvp.md`
- `CONTEXT.md`
- `docs/product-engineering-map.md`
- `docs/current-mvp-gap-and-roadmap.md`

---

## 6. Learning track

These documents are about Yuy's learning process, not the product MVP itself.

In the current repository setup, these learning files are local-only and ignored by git (`MISSION.md`, `NOTES.md`, `RESOURCES.md`, and `learning-records/` are listed in `.gitignore`). They are still part of this working project's documentation map, but they should not be treated as public product documentation unless the project intentionally removes them from `.gitignore` later.

### `MISSION.md`

Learning mission.

Defines the personal learning goal:

> Use the `chat-room` project as a real engineering lab to learn Redis, RabbitMQ, and concurrency in Java/Spring systems.

This document belongs to the learning track. It should not override the Activity-first product MVP.

### `NOTES.md`

Teaching and collaboration notes.

Captures working preferences such as:

- teaching mode over feature-delivery mode;
- short, concrete lessons;
- tie each lesson to real repository files;
- default language is Chinese.

### `RESOURCES.md`

Learning resource index.

Collects references for Redis, RabbitMQ, Java concurrency, and Spring WebSocket.

### `learning-records/`

Learning records.

Current examples:

- `0001-project-driven-redis-presence.md`
- `0002-presence-stable-identity.md`
- `0003-rabbitmq-message-event-boundary.md`

These record what was learned and what future lessons should build on.

---

## 7. ADR history

### `docs/adr/0001-reframe-product-around-organizations.md`

Historical ADR for the previous Organization-first phase.

Status: superseded by ADR 0003 for the current MVP.

### `docs/adr/0002-public-square-as-default-organization.md`

Historical ADR for the previous Public Square / default Organization decision.

Status: superseded by ADR 0003 for the current MVP.

### `docs/adr/0003-activity-first-mvp.md`

Current accepted MVP direction.

Use this as the source of truth when documents conflict.

---

## 8. Archive track

### `docs/archive/README.md`

Archive index.

Explains the historical document groups and reminds readers that archived docs are reference material only.

### `docs/archive/organization-first/`

Previous Organization-first product framing.

Historical only after ADR 0003.

### `docs/archive/pre-organization-pivot/`

Earlier teaching-platform / school-course-channel framing.

Historical only.

### `docs/archive/deployment-history/`

Historical deployment notes.

Current deployment entry is `docs/deployment.md`.

### `docs/archive/feedback-history/`

Historical validation and feedback records.

### `docs/archive/misc/`

Temporary or one-off historical notes.

---

## 9. Hermes planning artifacts

### `.hermes/plans/`

Internal planning artifacts generated during Hermes sessions.

These are not public-facing project documentation and should not be treated as current product requirements unless promoted into active docs.

---

## 10. Recommended reading paths

### For implementation

```text
VISION.md
→ docs/MVP.md
→ docs/adr/0003-activity-first-mvp.md
→ CONTEXT.md
→ docs/current-mvp-gap-and-roadmap.md
→ docs/api-contract.md
→ docs/manual-acceptance.md
```

### For classmates / reviewers

```text
README.md
→ docs/classmate-review-guide.md
→ docs/manual-acceptance.md
```

### For product-engineering / interview evidence

```text
README.md
→ VISION.md
→ docs/product-engineering-map.md
→ docs/MVP.md
→ docs/manual-acceptance.md
```

### For learning Redis / RabbitMQ / concurrency through this project

```text
MISSION.md
→ NOTES.md
→ RESOURCES.md
→ learning-records/
→ docs/known-engineering-concerns.md
```

## 11. Conflict rule

If documents conflict, resolve in this order:

1. `docs/adr/0003-activity-first-mvp.md`
2. `docs/MVP.md`
3. `VISION.md`
4. `CONTEXT.md`
5. `docs/current-mvp-gap-and-roadmap.md`
6. older ADRs and archived documents

Archived documents never override active Activity-first docs.
