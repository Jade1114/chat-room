# do-together

[中文文档](README.zh-CN.md)

**do-together** is an Activity-first campus participation platform that helps students discover worthwhile things to do together beyond fragmented WeChat groups, Moments, recruitment seasons, and friend-of-friend circulation.

## Current status

- Activity-first MVP implemented and manually accepted.
- Docker Compose deployment completed.
- VPS public-access acceptance completed.
- Current acceptance focuses on Activity discovery, participation method, Interest, and Activity Update notification.

## Why this exists

Campus does not lack interesting people.
It also does not lack worthwhile things to do together.

What is missing is a place where those activities remain discoverable after they leave WeChat groups, Moments, recruitment season, or private friend circles.

The first version validates one product question:

> If campus has an always-open place where anyone can publish worthwhile things to do together, will people discover them and actually participate?

## MVP flow

```text
login
→ Activity Feed
→ search / filter Activities
→ Activity Detail
→ view participation method
→ express Interest
→ receive Activity Update notification
→ publish Activity
→ manage my initiated Activities
```

The MVP validates whether users can discover an Activity, understand why it is worth joining, see how to participate, contact the initiator privately/off-platform, and return later to find more Activities.

## Features

- User login
- Activity Feed with `Upcoming` / `Ongoing` / `Hot` tabs
- Activity search, category filter, and tag filter
- Activity Detail
- Free-text participation method
- Activity Interest
- Activity Updates
- Online notification hints for Interest and Activity Updates
- My initiated Activities
- Close initiated Activity

## MVP non-goals

The current MVP intentionally does not build:

- organization system
- organization homepage
- membership workflow
- platform-internal registration table
- multi-channel chat
- realtime chat
- notification center
- recommendation algorithm
- comment system
- file / image upload

Legacy organization, channel, and chat code exists as historical implementation asset and possible future capability. It is not the current product acceptance path.

## Screenshots

### Activity discovery dashboard

The Activity Feed shows the first-screen discovery path: publish an Activity, view my initiated Activities, browse current Activities, search by title/description/tag, filter by category/tag, and switch between Upcoming, Ongoing, and Hot sections.

![Activity discovery dashboard](docs/screenshots/dashboard.png)

### Activity detail and participation method

The Activity Detail page keeps the decision context and participation method visible: what the Activity is, when and where it happens, who initiated it, and how an interested user can follow up privately/off-platform.

![Activity detail and participation method](docs/screenshots/detail.png)

## Tech stack

| Layer | Tech |
| --- | --- |
| Frontend | React, TypeScript, Vite, Nginx |
| Backend | Spring Boot, Java 21, MyBatis |
| Database | MySQL 8.4 |
| Cache / Ranking / Rate Limit | Redis |
| Async Notification | RabbitMQ |
| Deployment | Docker Compose, VPS |

## Engineering highlights

### Activity-first domain modeling

The project was reframed from a chat-room exercise into an Activity-first campus participation platform. The current product model centers on Activity discovery, participation method, Interest, and Activity Updates.

### Redis-backed discovery and protection

Redis supports:

- Hot Activity Ranking;
- public action rate limiting;
- Activity expiration time indexing.

MySQL remains the source of truth for Activity visibility, state, and durable records.

### RabbitMQ asynchronous side effects

Interest and Activity Update notifications are handled as asynchronous side effects instead of blocking the core Activity flow.

### Docker Compose deployment

Frontend, backend, MySQL, Redis, and RabbitMQ are containerized and can be started as one deployment unit.

### VPS public acceptance

The MVP has been deployed to a VPS and manually accepted through the public Activity-first flow.

## Architecture

```text
Browser
  ↓
Frontend container / Nginx :80
  ├─ serves React static assets
  ├─ proxies /api/* → backend:8080
  └─ proxies /ws/*  → backend:8080

Backend / Spring Boot
  ├─ MySQL    source of truth
  ├─ Redis    hot ranking, rate limiting, expiration index
  └─ RabbitMQ async notification side effects
```

## Quick start

```bash
cp .env.deploy.example .env.deploy
docker compose --env-file .env.deploy up -d --build
```

Open:

```text
http://localhost:3000
```

Check services:

```bash
docker compose --env-file .env.deploy ps
```

Reset local data:

```bash
docker compose --env-file .env.deploy down -v
docker compose --env-file .env.deploy up -d --build
```

## Seed accounts

When using the local development override, the following accounts are available:

| Username | Password | Role | Purpose |
| --- | --- | --- | --- |
| `admin` | `123456` | ADMIN | Admin / deployment verification |
| `test001` | `123456` | MEMBER | Activity browser / initiator |
| `test002` | `123456` | MEMBER | Second browser / initiator |

`docker-compose.override.yml` adds development seed data. Do not use it as-is for a real production deployment.

## Local smoke test

Login:

```bash
curl -s -X POST 'http://localhost:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"test001","password":"123456"}'
```

Fetch Activities with a token:

```bash
TOKEN=$(curl -s -X POST 'http://localhost:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"test001","password":"123456"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

AUTH_HEADER=$(printf 'Authorization: \x42earer %s' "$TOKEN")

curl -s 'http://localhost:3000/api/activities' \
  -H "$AUTH_HEADER"
```

## Development mode

Backend:

```bash
cd backend
mvn -q -DskipTests compile
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm run build
npm run dev
```

## Deployment

The project supports Docker Compose deployment.

```bash
cp .env.deploy.example .env.deploy
# edit secrets in .env.deploy
docker compose --env-file .env.deploy up -d --build
```

For VPS deployment steps and the acceptance checklist, see [docs/deployment.md](docs/deployment.md).

The VPS public-access acceptance has been completed. The public URL is intentionally omitted from repository documentation.

## Documentation

- [VISION.md](VISION.md) — product vision
- [docs/MVP.md](docs/MVP.md) — current MVP scope
- [docs/adr/0003-activity-first-mvp.md](docs/adr/0003-activity-first-mvp.md) — accepted Activity-first product decision
- [CONTEXT.md](CONTEXT.md) — domain glossary and current context
- [docs/api-contract.md](docs/api-contract.md) — API contract
- [docs/manual-acceptance.md](docs/manual-acceptance.md) — manual acceptance guide
- [docs/deployment.md](docs/deployment.md) — Docker/VPS deployment
- [docs/roadmap.md](docs/roadmap.md) — current state and next directions
- [DOCUMENTATION.md](DOCUMENTATION.md) — full documentation map
- [docs/archive/](docs/archive/) — historical documents
