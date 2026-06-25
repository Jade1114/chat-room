# ADR 0003: Activity-first MVP

## Status

Accepted

## Context

The project was previously framed around organizations: users discover organizations, join them through Membership, and then enter organization channels for communication.

That framing was still too close to an organization/chat product. The newer vision reframes the product around participation:

- campus does not lack interesting people;
- it does not lack worthwhile things to do together;
- it lacks a place where those things remain discoverable;
- relationships often start after people complete something together, not merely because they chatted.

The MVP therefore should not validate organization operation, community persistence, realtime chat, or complex social relationships.

The MVP should validate one hypothesis:

> If campus has an always-open platform where anyone can publish worthwhile things to do together, will people discover them and participate?

## Decision

`VISION.md` and `docs/MVP.md` are the authoritative product documents for the current first version.

The first-version MVP is Activity-first.

The MVP core objects are:

- `User`
- `Activity`

An Activity means any worthwhile thing someone wants others to participate in together. It does not have to be created by a club or organization. In the first version, every Activity is initiated by an individual logged-in User. If the thing is associated with a club, lab, or other organization, that context should be written in the Activity title or description, not modeled as an organization-owned Activity.

The MVP does not require an in-platform participation table or registration workflow. The first version uses participation instructions on the Activity detail page. Concrete communication and coordination happen outside the platform.

The first-version Activity uses a single free-text field named `participationMethod` to explain how to participate or contact the initiator. It intentionally does not structure contact type, contact value, QR code upload, external form link, or contact analytics in the MVP. The field can contain examples such as a WeChat ID, QQ group, email, external form link, meeting link, or offline gathering instructions.

The first-version Activity uses a simple discovery taxonomy:

- `category`: one required value from a fixed list.
- `tags`: free-text multi-tags, up to 5 tags per Activity.

The first-version category list is:

- `STUDY`: 学习
- `SPORTS`: 运动
- `GAME`: 游戏
- `PROJECT`: 项目
- `WORKSHOP`: Workshop
- `COMPETITION`: 比赛
- `TRAVEL`: 出行
- `TEAM_UP`: 找队友 / 找搭子
- `OTHER`: 其他

Search may match title, description, and tags. Category provides a stable first-level filter, while tags preserve flexibility without creating a heavy taxonomy.

The first-version Activity does not include capacity or participant limits. Once the product models capacity, it naturally invites registration, waitlists, full-state handling, cancellation rules, and organizer-side participant management. Those are intentionally outside the MVP.

The first-version Activity supports two time modes:

- `SCHEDULED`: a thing with a concrete start time, such as a workshop, match, meetup, or game session.
- `ONGOING`: a continuous invitation or recruiting need, such as finding teammates, study partners, project collaborators, or travel companions.

An `ONGOING` Activity must have an expiration date and must not stay valid forever. The first-version maximum duration for an `ONGOING` Activity is 30 days.

The first-version Activity has a small status model:

- `DRAFT`: not publicly visible yet.
- `PUBLISHED`: visible in the Activity Feed while it is still valid.
- `EXPIRED`: no longer valid because its scheduled time or expiration date has passed.
- `CLOSED`: manually closed by the initiator.

Expired Activities do not automatically return to `DRAFT`. `DRAFT` means never published or intentionally unpublished; `EXPIRED` means previously published but no longer valid. This keeps the lifecycle understandable without introducing registration, waitlists, or organizer-side participant management.

The Organization-first model is demoted to historical implementation asset and future capability. Existing organization, membership, channel, and realtime chat code may be reused or retained, but they are not part of the current MVP acceptance standard.

## Consequences

Current MVP acceptance should focus on:

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

The first-version "My Activity" scope is narrowed to Activities initiated by the current user. It does not include joined Activities, interested Activities, contact-view history, favorites, or participation history because the MVP does not model in-platform participation.

The first-version Activity Feed is divided into two default sections:

- `Upcoming / 即将发生`: `SCHEDULED` + `PUBLISHED` Activities that have not expired, ordered by `startTime` ascending.
- `Ongoing / 持续招募`: `ONGOING` + `PUBLISHED` Activities whose `expiresAt` has not passed, ordered by `createdAt` descending.

Search and category/tag filters keep the same two-section structure. This avoids mixing concrete-time events with continuous recruiting invitations while preserving a simple feed model.

The first version records minimal Activity behavior events for MVP validation, without building an analytics dashboard or participation relationship model:

- `DETAIL_VIEW`: recorded when a user opens an Activity detail page.
- `PARTICIPATION_METHOD_VIEW`: recorded when a user clicks to reveal the participation method.

The participation method should not be prominently auto-exposed by default. The detail page should require an explicit "view participation method" action so the product can distinguish passive reading from stronger participation intent. These events are measurement logs, not registration, interest, favorites, or social relationships.

The first version requires login for all Activity surfaces:

- browsing the Activity Feed;
- opening Activity Detail;
- revealing the participation method;
- publishing Activity;
- viewing the current user's initiated Activities.

This keeps contact information out of public unauthenticated pages, simplifies behavior measurement by tying events to users, and fits a small campus MVP trial. Public feed/detail access can be reconsidered after the Activity-first hypothesis is validated.

The first version does not include a pre-publication review workflow. A logged-in user's publish action creates a `PUBLISHED` Activity directly. Boundary control is handled by clear publishing guidance and the initiator's ability to close their own Activity. The MVP does not introduce `PENDING_REVIEW`, `REJECTED`, or platform moderation states. Admin takedown can be added later if trial scope or content risk requires it.

The first-version Activity detail shows only minimal initiator information: the initiator's display name and the Activity publish time. If the initiator wants to provide identity/background context, they should write it in the Activity description. The MVP does not include user profile pages, profile bios, following, private messaging, initiator history, or reputation systems.

The first version allows an Activity initiator to edit their own `DRAFT` and `PUBLISHED` Activities. It does not include edit history, change notifications, review on edit, or version comparison. `EXPIRED` and `CLOSED` Activities are not directly edited in the MVP; future work may support copying or republishing them with a new validity window.

Although `DRAFT` exists in the status model, the first-version UI does not need a save-draft flow. Creating an Activity from the publish page creates a `PUBLISHED` Activity directly. `DRAFT` is kept as a model-level reserved state for future draft or unpublished flows, not as a required MVP interaction.

The first version does not include Activity images, cover images, posters, file upload, or media storage. Feed and detail pages should rely on text, category color, tags, time/status badges, and layout hierarchy. This avoids upload/storage/moderation complexity and keeps the MVP focused on whether the thing itself motivates participation.

The first-version navigation is Activity-first. After login, the default destination is `/activities`. The primary navigation contains only:

- `发现事情` → `/activities`
- `发起事情` → `/activities/new`
- `我的发布` → `/me/activities`

If `/dashboard` remains, it should redirect to `/activities` or become an Activity-first landing page. Organization, channel, and realtime chat routes may remain as legacy or future implementation assets, but they are not primary MVP navigation entries.

Current MVP documentation must no longer present these as required MVP capabilities:

- organization system;
- organization homepage;
- Membership;
- multi-channel chat;
- realtime chat;
- notification center;
- recommendation algorithm;
- ranking/badges;
- social graph;
- comment system.

Metrics should focus on Activity publication, browsing, detail views, contact-method views/copies, and qualitative confirmation of real participation. Registration count, message count, and online count are not primary MVP metrics.

Future versions may reintroduce organizations, communities, membership, chat, and long-term relationship features after the Activity-first participation hypothesis is validated.
