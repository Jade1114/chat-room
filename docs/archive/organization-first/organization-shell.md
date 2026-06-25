# Organization Shell Decision

## Status

Accepted for Phase 2.

This document records the UI information-architecture decision after comparing the Phase 2-A organization shell prototypes.

## Context

Phase 1 completed the core organization-platform schema and permission spine:

```text
app_user
→ organization_member
→ organization
→ organization_channel
```

The backend now treats channel access as a result of organization membership. However, the current UI still risks collapsing two different concepts:

```text
Organization = the social/product container
Channel = one communication surface inside an organization
```

That shortcut was acceptable for Phase 1 because each organization had a default channel. It is not acceptable as the long-term UI model, because future organizations will need multiple channels:

```text
围棋社
├── announcements
├── general
└── game-review

独立游戏实验室
├── announcements
├── general
├── game-jam
└── random
```

If the UI continues to treat organizations and channels as the same object, future work will become confusing:

- Does clicking an organization open the organization homepage or a channel?
- Where do members, activities, settings, and join flows live?
- Is the left sidebar listing organizations or channels?
- Does creating a channel create a new organization-like entity?

Phase 2 therefore starts with the product shell and information architecture before deeper API work.

## Prototype Options

The temporary prototype route is:

```text
/organization-shell-prototype
```

It contains three variants:

```text
A: Three-column workspace
B: Organization homepage first
C: Portal + organization drawer
```

### Variant A: Three-column workspace

Shape:

```text
Platform nav / My organizations / Organization channels / Chat
```

Strengths:

- Very clear platform → organization → channel separation.
- Strong fit for high-frequency realtime messaging.
- Multi-channel organizations are immediately visible.

Weaknesses:

- The product can easily read as “another chat app”.
- Chat becomes the visual center again.
- Organization overview, activities, and governance feel secondary.

### Variant B: Organization homepage first

Shape:

```text
Platform nav + My organizations
→ Organization page
  ├── Overview
  ├── Channels
  ├── Activities
  ├── Members
  └── Settings
```

Strengths:

- Organization is the primary product object.
- Channels become a module inside the organization, not the organization itself.
- Activities, members, and settings have natural homes.
- Better supports the portfolio story: this is an organization-centered platform, not only a chat room.

Weaknesses:

- Chat takes one extra step compared with a pure chat-first workspace.
- Needs careful shortcuts later for high-frequency channel access.

### Variant C: Portal + organization drawer

Shape:

```text
Platform discovery portal
→ Organization detail drawer
  ├── channels
  ├── activities
  └── actions
```

Strengths:

- Strong discovery and platform-homepage feeling.
- Good fit for Organization Hall and activity discovery.
- Keeps channels from dominating the page.

Weaknesses:

- Less suitable as the daily workspace after a user has joined organizations.
- Organization detail can feel too temporary if it is only a drawer.
- Channel entry may feel indirect.

## Decision

Choose **Variant B: Organization Homepage First** as the formal Phase 2 direction.

The core design rule is:

```text
User joins an Organization.
Organization owns Channels, Activities, Members, and Settings.
User enters a Channel only after choosing an Organization context.
```

This keeps the product model aligned with the new domain model:

```text
Organization is the container.
Channel is the communication surface.
Activity is the reason for participation.
Membership is the authorization source.
```

## Formal Information Architecture

### Platform Layer

Global product entry points:

```text
/dashboard
/organizations
/my-organizations
/activity-schedule
/organizations/new
/admin
```

Responsibilities:

- Show the user's overall workspace state.
- Help the user discover public organizations.
- Show organizations the user has joined.
- Show activity schedules across organizations.
- Provide creation and admin entry points.

### Organization Layer

Organization homepage:

```text
/organizations/:organizationId
```

Tabs / sections:

```text
Overview
Channels
Activities
Members
Settings
```

Responsibilities:

- Explain what the organization is.
- Show membership status and role.
- Show channel list.
- Show upcoming activities.
- Show members and governance surfaces.
- Provide organization-level actions such as join, leave, manage, invite.

### Channel Layer

Channel chat page:

```text
/organizations/:organizationId/channels/:channelId
```

Responsibilities:

- Show messages for one channel.
- Display dual context in the header:

```text
Organization Name / # channel-name
```

- Never present the channel as if it were the organization itself.

## Near-Term Route Plan

For Phase 2 implementation, avoid overbuilding. The first production shell can use mock data or existing `/api/channels` data while the Organization API catches up.

Suggested route sequence:

```text
1. /organizations/:organizationId
   - Organization homepage shell
   - Overview and Channels sections
   - Activities/Members/Settings as placeholders

2. /organizations/:organizationId/channels/:channelId
   - Chat page with explicit organization/channel context
   - Can reuse current ChatWorkspace internals after adapting the shell

3. /organizations
   - Organization Hall
   - Later backed by GET /api/organizations

4. /organizations/new
   - Create Organization
   - Later backed by POST /api/organizations
```

## Phase 2 Implementation Slices

### Phase 2-A.1: Decision capture

- Keep the prototype route as a temporary reference.
- Record this document.
- Do not treat prototype code as final production UI.

### Phase 2-A.2: Production organization shell

Implement the B-style shell in production UI:

- Add `OrganizationDetailPage`.
- Add route `/organizations/:organizationId`.
- Route `/organizations/:organizationId/channels/:channelId` now renders real ChatWorkspace under organization context.
- Display `Overview / Channels / Activities / Members / Settings`.
- Show channels as children of the selected organization.
- Keep current one-default-channel data compatible, but structure UI for multiple channels.

### Phase 2-B: Organization API

Add backend API once the shell target is stable:

```text
GET  /api/organizations
GET  /api/organizations/{organizationId}
POST /api/organizations/{organizationId}/join
POST /api/organizations
```

Minimum frontend DTO:

```ts
interface OrganizationSummary {
  id: string;
  name: string;
  description: string;
  visibility: 'PUBLIC';
  joinPolicy: 'OPEN';
  memberCount: number;
  joined: boolean;
  defaultChannelId: string;
}
```

### Phase 2-C: Join and create loop

- Join public organization.
- After joining, its channels appear under the organization and in channel access checks.
- Create organization.
- Creator becomes `ORGANIZER`.
- Default channel is created automatically.

## Acceptance Criteria for Phase 2-A.2

```text
[ ] Organization and Channel are visually distinct.
[ ] Clicking an organization opens an organization homepage, not directly a chat channel.
[ ] Organization homepage exposes Overview / Channels / Activities / Members / Settings.
[ ] Channel entry is visibly nested under an organization.
[ ] Chat header shows Organization / # Channel dual context.
[ ] Current one-default-channel organizations still work.
[ ] Future multi-channel organizations do not require another UI-level conceptual rewrite.
```

## Prototype Cleanup Rule

The prototype route is temporary:

```text
/organization-shell-prototype
```

After the production organization shell is implemented and accepted, either:

1. delete the prototype route, or
2. keep only the chosen layout's reusable pieces if they have been properly absorbed into production components.

Do not leave all three variants as permanent product code.
