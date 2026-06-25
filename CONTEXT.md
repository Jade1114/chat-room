# Context Glossary

This file defines the current domain language for the project. It is a glossary, not an implementation spec.

## Project

The project is an Activity-first campus participation platform.

Its purpose is to make worthwhile things to do together continuously discoverable. The project does not primarily validate chat, organization management, community persistence, or complex social relationships.

The first-version hypothesis is:

> If campus has an always-open platform where anyone can publish worthwhile things to do together, will people discover them and participate?

## User

A logged-in person using the platform.

In the MVP, a User can browse Activities, publish Activities, open Activity details, view participation methods, and manage Activities they initiated.

The MVP does not model following, friends, private messaging, profile pages, reputation, or social graph relationships.

## Activity

A worthwhile thing someone wants others to participate in together.

Examples include workshops, matches, game sessions, study groups, sports, photography walks, reading groups, Hackathon team-ups, project collaborator searches, travel companion searches, or finding people to complete something together.

An Activity is not required to belong to an organization, club, lab, course, or channel. In the first version, every Activity is initiated by an individual User. If the thing is associated with a club or organization, that context is written in the Activity title or description.

## Initiator

The User who publishes an Activity.

The MVP shows only the initiator's display name and the publish time on Activity Detail. If the initiator wants to provide background or identity context, they write it in the Activity description.

## Participation Method

A free-text instruction that tells interested users how to participate or contact the initiator.

Examples: a WeChat ID, QQ group, email, external form link, meeting link, offline gathering instructions, or preparation requirements.

The MVP intentionally does not structure contact type, contact value, QR code upload, external form link handling, or contact analytics as product features.

## Activity Category

A fixed first-level classification for discovery and filtering.

The MVP categories are:

- `STUDY`: 学习
- `SPORTS`: 运动
- `GAME`: 游戏
- `PROJECT`: 项目
- `WORKSHOP`: Workshop
- `COMPETITION`: 比赛
- `TRAVEL`: 出行
- `TEAM_UP`: 找队友 / 找搭子
- `OTHER`: 其他

## Activity Tags

Free-text labels used for flexible discovery.

An Activity may have up to 5 tags. Search may match title, description, and tags.

## Activity Time Mode

The way an Activity stays valid in the Feed.

### SCHEDULED

A concrete-time Activity, such as a workshop, game session, match, meetup, or reading group.

A `SCHEDULED` Activity has a `startTime` and may have an `endTime`.

### ONGOING

A continuous invitation or recruiting need, such as finding teammates, study partners, project collaborators, or travel companions.

An `ONGOING` Activity must have an `expiresAt`. The MVP maximum duration is 30 days.

## Activity Status

The small lifecycle model for Activity.

- `DRAFT`: not publicly visible yet. Reserved for future flows; the MVP UI does not need save-draft.
- `PUBLISHED`: visible in the Activity Feed while valid.
- `EXPIRED`: no longer valid because time has passed.
- `CLOSED`: manually closed by the initiator.

Expired Activities do not return to `DRAFT` automatically.

## Activity Feed

The logged-in user's main product entry.

The Feed has two default sections:

- `Upcoming / 即将发生`: valid `SCHEDULED` Activities ordered by `startTime` ascending.
- `Ongoing / 持续招募`: valid `ONGOING` Activities ordered by `createdAt` descending.

Search and category/tag filtering preserve this two-section structure.

## Activity Event

A minimal measurement log for MVP validation.

The MVP records:

- `DETAIL_VIEW`: a User opens an Activity detail page.
- `PARTICIPATION_METHOD_VIEW`: a User clicks to reveal the participation method.

These are measurement events only. They are not participation relationships, favorites, registrations, or social relationships.

## Organization

A future or historical capability representing a longer-lived group.

Organizations are not a current MVP core object. Previous Organization-first documents live in `docs/archive/organization-first/`. Existing organization, membership, channel, and chat code may remain as implementation assets, but they do not define the current MVP.

## Membership

A previous Organization-first relationship between User and Organization.

Membership is not part of the Activity-first MVP. The MVP does not model platform-internal Activity registration or participation relationships.

## Channel / Chat

A previous or future communication capability.

Realtime chat is not part of the MVP. Concrete Activity coordination happens off-platform through the Activity's participation method.

## Admin

A platform-level operator role that may be useful later for moderation or takedown.

The MVP does not require pre-publication review, `PENDING_REVIEW`, `REJECTED`, or platform moderation states. Logged-in users publish Activities directly; initiators can close their own Activities.
