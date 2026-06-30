# chat-room

chat-room is an **Activity-first campus participation platform**.

It is not a chat app, not a forum, not a marketplace, and not an organization management system. The first-version product asks one question:

> If campus has an always-open place where anyone can publish worthwhile things to do together, will people discover them and actually participate?

## Vision

Campus does not lack interesting people.

It also does not lack worthwhile things to do together.

What is missing is a place where those things remain discoverable after they leave WeChat groups, Moments, recruitment season, or friend-of-friend circulation.

The product exists so that every "I want to do something" moment can more easily find people willing to do it together.

## Current MVP status

The Activity-first MVP main path has been implemented and manually accepted locally. The current MVP is defined by:

- `VISION.md` — why the product exists;
- `docs/MVP.md` — what the first version validates;
- `docs/adr/0003-activity-first-mvp.md` — accepted Activity-first product decisions.

The first version validates:

```text
login
→ Activity Feed
→ search / filter Activities
→ Activity Detail
→ view participation method
→ private/off-platform contact
→ real-world participation
→ user returns to find new Activities
```

## Core objects

### User

A logged-in person who can browse, publish, and privately follow up on Activities.

### Activity

A worthwhile thing someone wants others to participate in together.

Examples:

- Workshop;
- match / game session;
- study group;
- sports;
- photography walk;
- reading group;
- Hackathon team-up;
- project collaborator search;
- travel companion search.

An Activity does not have to come from a club or organization. In the MVP every Activity is initiated by an individual user. If the thing is associated with a club, lab, teacher, company, or organization, that context is written in the Activity title or description.

## MVP features

The accepted MVP supports:

- user login;
- Activity Feed;
- Activity search;
- category / tag filtering;
- Activity Detail;
- publish Activity;
- free-text participation method;
- my initiated Activities;
- minimal Activity event logs for validation.

The first-version navigation is:

```text
发现事情   /activities
发起事情   /activities/new
我的发布   /me/activities
```

After login, the default destination should be `/activities`.

## MVP non-goals

The current MVP intentionally does not build:

- organization system;
- organization homepage;
- Membership;
- platform-internal registration / participation table;
- multi-channel chat;
- realtime chat;
- notification center;
- recommendation algorithm;
- gamified ranking / badges;
- social graph;
- comment system;
- image / poster / file upload;
- activity capacity / waitlist / approval workflow.

Existing organization, membership, channel, and chat code is historical implementation asset and possible future capability. It is not the current MVP acceptance standard. In the current frontend, Organization / Channel / Chat routes are downgraded as legacy capability: they are not shown as primary navigation and direct visits display a legacy notice.

The project now includes a small, accepted Hot Activity Ranking engineering slice: Redis stores a derived `activity:hot_score` Sorted Set, while MySQL remains the source of truth for Activity visibility and explanatory metrics. This is a transparent discovery aid, not a personalized recommendation system or gamified leaderboard.

The current engineering track also protects public Activity actions with Redis-backed rate limiting: publishing uses a sliding-window limit, Interest clicks use a token bucket, and exceeded limits return `429 Too Many Requests` with `Retry-After`.

## Activity rules

First-version Activity fields and rules:

- `title`: what the thing is;
- `description`: why it is worth participating in and what will happen;
- `category`: one fixed category;
- `tags`: up to 5 free-text tags;
- `timeMode`: `SCHEDULED` or `ONGOING`;
- `startTime`: required for `SCHEDULED`;
- `expiresAt`: required for `ONGOING`, max 30 days;
- `location`: where it happens, or online context;
- `participationMethod`: free-text instructions for how to participate or contact the initiator;
- `status`: `DRAFT`, `PUBLISHED`, `EXPIRED`, or `CLOSED`.

The first-version category list:

```text
STUDY        学习
SPORTS       运动
GAME         游戏
PROJECT      项目
WORKSHOP     Workshop
COMPETITION  比赛
TRAVEL       出行
TEAM_UP      找队友 / 找搭子
OTHER        其他
```

## Activity Feed

The Feed has two default time-based sections, plus an accepted Hot discovery tab:

```text
Upcoming / 即将发生
- SCHEDULED + PUBLISHED
- not expired
- ordered by startTime ascending

Ongoing / 持续招募
- ONGOING + PUBLISHED
- expiresAt has not passed
- ordered by createdAt descending

Hot / 热门
- valid PUBLISHED Activities only
- ordered by Redis hot score derived from detail views, participation-method views, and Activity Interest
- falls back to the default Feed order if Redis is empty or unavailable
```

Search and category/tag filters apply to the default time-based Feed and to the Hot discovery tab.

## Success metrics

The MVP does not primarily care about:

- registration count;
- message count;
- online count.

It cares about:

- Activity publication count;
- Activity Feed browsing;
- Activity Detail views;
- participation method views;
- qualitative confirmation that users actually contacted initiators or participated offline;
- whether users return to find new Activities.

## Next directions

After the accepted Activity-first MVP, future work is split into two tracks:

1. **Style / design adjustment** — improve the first-screen experience, Activity card hierarchy, Feed tabs, Detail page motivation, Publish form flow, mobile layout, and empty/error/legacy states.
2. **New features** — add only after real user feedback shows the need, such as Activity editing UI, drafts, interested/bookmark state, initiator profile/history, better ranking, participation intent, or a redesigned post-MVP Organization model.

## Local running

### Docker Compose

```bash
cp .env.deploy.example .env.deploy

docker compose --env-file .env.deploy up -d --build
```

Reset local data:

```bash
docker compose --env-file .env.deploy down -v
docker compose --env-file .env.deploy up -d --build
```

Open:

```text
http://localhost:3000
```

### Development mode

```bash
# backend
cd backend
mvn -q -DskipTests compile
mvn spring-boot:run

# frontend
cd frontend
npm run build
npm run dev
```

### Local SQL layout

```text
backend/sql/init/       fresh schema + seed
backend/sql/delete/     destructive local reset
backend/sql/changes/    migration-style changes for older local DBs
```

Fresh local reset:

```bash
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/delete/001_drop_database.sql
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/init/001_schema.sql
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/init/002_seed.sql
```

## Document map

For the full documentation structure, see:

```text
DOCUMENTATION.md
```

Quick entry points:

- `VISION.md`: product vision;
- `docs/MVP.md`: first-version MVP scope;
- `docs/adr/0003-activity-first-mvp.md`: accepted Activity-first decisions;
- `CONTEXT.md`: domain glossary;
- `docs/roadmap.md`: current status and phased roadmap;
- `docs/manual-acceptance.md`: manual acceptance checklist;
- `docs/classmate-review-guide.md`: reviewer / classmate guide;
- `DOCUMENTATION.md`: complete map, including local-only learning notes if present;
- `docs/archive/`: historical documents.
