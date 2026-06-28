# Context Glossary

This file defines the current domain language for the project. It is a glossary, not an implementation spec.

## Project

The project is an Activity-first campus participation platform.

Its purpose is to make worthwhile things to do together continuously discoverable. The project does not primarily validate chat, organization management, community persistence, or complex social relationships.

A browser-local **Local Session** may act before login for low-friction browsing, Interest expression, and Activity initiation. A Local Session is not a User account; it is a temporary browser identity that may later be associated with a logged-in User.

The first-version hypothesis is:

> If campus has an always-open platform where anyone can publish worthwhile things to do together, will people discover them and participate?

## User

A logged-in person using the platform.

In the MVP, a User can browse Activities, publish Activities, open Activity details, view participation methods, and manage Activities they initiated.

The MVP does not model following, friends, private messaging, profile pages, reputation, or social graph relationships.

## Activity

A worthwhile thing someone wants others to participate in together.

Examples include workshops, matches, game sessions, study groups, sports, photography walks, reading groups, Hackathon team-ups, project collaborator searches, travel companion searches, or finding people to complete something together.

An Activity is not required to belong to an organization, club, lab, course, or channel. In the first version, every Activity is initiated by either a Local Session or a logged-in User. If the thing is associated with a club or organization, that context is written in the Activity title or description.

## Initiator

The Local Session or logged-in User who publishes an Activity.

A Local Session Initiator is identified by a browser-local session identity. A logged-in User Initiator is identified by a stable User identity. Both can publish Activities in the first version.

The MVP shows only the initiator's display name and the publish time on Activity Detail. If the Initiator is a logged-in User, the display name is the User's display name. If the Initiator is a Local Session, the display name is a generic temporary-user label rather than the local session identity. If the initiator wants to provide background or identity context, they write it in the Activity description.

A Local Session Initiator can manage the Activity only from the same browser identity that created it. Management includes editing and closing that Activity. Clearing local storage may cause the Local Session Initiator to lose management access; that is acceptable for the first version.

If a Local Session Initiator later logs in or registers in the same browser, Activities created under that browser-local session identity may be associated with the logged-in User. This LocalSession-to-User Association happens immediately after successful login or registration, not lazily when the User later opens My Initiated Activities. After association, the Initiator display name and management identity become the logged-in User identity. Activities cannot be associated from another browser or after the local session identity is lost.

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

## Activity Interest

A lightweight signal that a Local Session or logged-in User is interested in an Activity.

An Activity Interest means "I am interested" or "I may want to participate". It is not registration, not confirmed participation, not attendance, and not a promise that coordination happens on the platform.

An Activity Interest is visible to the Activity's Initiator as feedback that someone is interested. It is different from a favorite or bookmark because it sends a signal to the Initiator rather than only saving the Activity for the interested identity.

The current implemented version exposes Activity Interest as an anonymous count and current-identity status. It does not expose the interested User, local session identity, interested-user list, or any way for the Initiator to contact interested people through the platform.

Online Interest hints are a future engineering slice. If implemented, a hint should be delivered to the Initiator identity only after the durable Interest relationship exists in MySQL, and notification failure must not change the Interest fact.

The current version shows Interest Count on Activity Detail and My Initiated Activities. It does not show Interest Count on Activity Feed cards, Admin dashboard, or a notification center.

A Local Session or logged-in User can express at most one Activity Interest per Activity. The Initiator of an Activity cannot express Interest in their own Activity; the product may instead offer a "promote my Activity" action for future work. After expressing interest, the same browser should be able to see that it has already expressed interest on that Activity's detail page. The first version does not model canceling interest, a personal interested-activities list, or Feed-level interested status.

Activity Interest is a current-state relationship, not only an event log. The system may record an additional Activity Event for analytics, but the Interest relationship itself is the source of truth for already-interested state, counts, and LocalSession-to-User Association.

In the first version, a Local Session may express Activity Interest using a browser-local session identity. If the Local Session later logs in or registers in the same browser, the Interest may be associated with the logged-in User rather than creating a duplicate Interest. Clearing local storage may create a new Local Session identity; that is acceptable for the first version.

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
