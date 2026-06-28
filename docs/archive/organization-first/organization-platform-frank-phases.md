# Organization Platform Roadmap with Frank's Evidence Framework

> **For Hermes:** Use this as a product/engineering roadmap, not as a code-only implementation checklist.

**Goal:** Turn `chat-room` from a technical chat-room exercise into a job-evidence project that proves Yuy can understand a real scenario, model the domain, deliver a working system, verify quality, deploy it, and explain decisions.

**Core Principle:** Follow Frank's path: `目标岗位 → 交付结果 → 证据作品 → 技术补缺`, not `学技术 → 堆功能 → 写简历`.

**Project Positioning:** An organization-centered communication platform for campuses and online communities. Users discover organizations, inspect activities, join organizations, and communicate in organization-owned channels.

---

## Phase 0: Product Reframing and Evidence Setup

**Purpose:** Finish the shift from “chat-room demo” to “organization-centered platform”.

**Frank Mapping:** 岗位证据法 / 产品化基本功.

**Main Work:**

- Treat the project as a system evidence work, not a feature pile.
- Keep the new domain language stable: `Organization`, `OrganizationMember`, `Channel`, `Activity`, `InvitationCode`, `Public Square`.
- Use ADRs to record irreversible or easy-to-forget decisions.
- Archive old teaching-platform documents to prevent semantic drift.

**Evidence Produced:**

- `CONTEXT.md`: domain glossary.
- `docs/adr/0001-reframe-product-around-organizations.md`.
- `docs/adr/0002-public-square-as-default-organization.md`.
- `docs/features/organization-platform-scope.md`.
- `docs/organization-channel-model.md`.

**Exit Criteria:**

- Anyone reading the docs can answer: who uses this product, what problem it solves, what the core model is, and what the first version intentionally does not do.

---

## Phase 1: Organization-Member-Channel Main Spine

**Purpose:** Rebuild the system's core authorization path around organizations.

**Frank Mapping:** 数据建模 / 接口设计 / 真实业务主链路.

**Main Work:**

- Add or refactor core models/tables:
  - `Organization`
  - `OrganizationMember`
  - `Channel`
  - `InvitationCode`
  - `Activity` scaffold only if convenient
- Create the platform-maintained default organization: `Public Square`.
- On user registration, automatically create membership in `Public Square`.
- Ensure each organization has one default channel in MVP.
- Change “my channels” semantics:
  - Old: channels assigned directly or course/class-derived.
  - New: joined organizations → their default channels.
- Keep WebSocket messages bound to `channelId`, but validate access by:
  - `channelId → organizationId → OrganizationMember(userId, organizationId)`.

**What Not To Do Yet:**

- Multi-channel organizations.
- ChannelMember.
- Join approval.
- Activity registration.
- Complex dashboard polish.

**Evidence Produced:**

- Backend authorization flow based on organization membership.
- Manual validation notes proving unauthorized organization channels do not appear and cannot be accessed directly.

**Exit Criteria:**

- A new user only sees Public Square by default.
- Joining an organization makes its default channel appear.
- Non-members cannot access organization channel detail/history/WebSocket.

---

## Phase 2: Organization Discovery and Creation Loop

**Purpose:** Make the product do what the product claims: help users find or create organizations.

**Frank Mapping:** 产品化 / 用户流程 / 从真实问题到系统功能.

**Main Work:**

- Build Organization Hall:
  - public organization cards;
  - keyword search;
  - tag filtering;
  - joined/unjoined status;
  - join or enter-channel action.
- Build Organization Detail page:
  - name, description, tags;
  - member count;
  - organizer/creator;
  - public activities summary;
  - join or enter-channel action.
- Build Create Organization:
  - any logged-in user can create;
  - new organization defaults to public/open;
  - creator becomes `Organizer`;
  - creator joins automatically;
  - default channel is created automatically.
- Support invitation/application code joining, bound to organization, not channel.

**What Not To Do Yet:**

- Approval-required organizations.
- Private organization governance.
- Content moderation system.
- Recommendation algorithm.

**Evidence Produced:**

- Product screenshots or short demo flow:
  - create organization → appears in hall → another user joins → channel appears.
- API examples for organization discovery/create/join.

**Exit Criteria:**

- The project can demonstrate both sides of the product:
  - user looking for an organization;
  - user creating and promoting an organization.

---

## Phase 3: Lightweight Activity Surface

**Purpose:** Give organizations a reason to exist beyond chat.

**Frank Mapping:** 真实场景 / 业务信息建模 / MVP 边界控制.

**Main Work:**

- Implement lightweight `Activity` as an independent entity:
  - title;
  - description;
  - start time;
  - location or link;
  - visibility;
  - organization owner;
  - creator.
- Allow Organizer to publish/edit/delete activities.
- Show activities on Organization Detail page.
- Build Activity Schedule:
  - Discover Activities: public activities from public organizations;
  - My Schedule: activities from joined organizations.

**What Not To Do Yet:**

- RSVP.
- Registration.
- Attendance.
- Capacity limits.
- Activity notifications.

**Evidence Produced:**

- Demo flow: organization publishes activity → activity appears in detail page and schedule → user discovers organization through activity.

**Exit Criteria:**

- Activities strengthen organization discovery without becoming a full event-management system.

---

## Phase 4: Dashboard and Navigation Integration

**Purpose:** Turn the system from separate features into a coherent product surface.

**Frank Mapping:** 轻量原型 / 用户流程 / 产品交付表达.

**Main Work:**

- Implement post-login Dashboard.
- Use two-section left sidebar:
  - upper: Dashboard, Organization Hall, My Organizations, Activity Schedule, Create Organization;
  - lower: joined organizations as default-channel entry points.
- Build My Organizations page:
  - joined organizations;
  - member vs Organizer role;
  - enter channel;
  - management entry for Organizer.
- Dashboard main area guides users to:
  - enter Public Square;
  - create organization;
  - explore organizations;
  - view activity schedule.

**What Not To Do Yet:**

- Over-polished UI.
- Complex analytics.
- Personal recommendation feed.

**Evidence Produced:**

- A recorded or documented end-to-end user path from login to organization discovery/creation/chat/activity.

**Exit Criteria:**

- A first-time viewer can understand the product within one minute.

---

## Phase 5: Delivery Evidence and Deployment

**Purpose:** Move from “local project” to “deliverable system”.

**Frank Mapping:** 交付化 / 自动化 / 运维 / 排错.

**Main Work:**

- Stabilize local Docker Compose deployment.
- Provide seed data for:
  - Public Square;
  - several example organizations;
  - members;
  - activities.
- Write README around product evidence, not only tech stack.
- Add deployment docs:
  - environment variables;
  - startup commands;
  - verification checklist;
  - common failure cases.
- Preserve manual acceptance records in `docs/bug/` or equivalent validation docs.

**Evidence Produced:**

- README.
- Architecture diagram or flow diagram.
- Docker Compose startup proof.
- Manual acceptance checklist.
- Bug/validation records.

**Exit Criteria:**

- Someone else can clone, configure, run, and understand the project.
- The project proves more than coding: it proves delivery.

---

## Phase 6: Engineering Depth: Redis, RabbitMQ, and Reliability

**Purpose:** Add backend depth only where the product naturally needs it.

**Frank Mapping:** 技术补缺 follows 证据作品, not the other way around.

**Main Work:**

- Use Redis for hot state where justified:
  - online presence;
  - unread counters;
  - hot channel/member state.
- Use RabbitMQ for event-driven workflows where justified:
  - message events;
  - activity publication events;
  - future notifications.
- Keep MySQL as source of truth for durable data.
- Document consistency tradeoffs:
  - Redis hot cache vs MySQL recovery;
  - message event flow;
  - failure/retry behavior.

**Evidence Produced:**

- Architecture notes explaining why Redis/RabbitMQ exist.
- Failure-mode notes and manual validation.
- Clear separation between source of truth and hot state.

**Exit Criteria:**

- Redis/RabbitMQ are no longer “learning labels”; they solve visible product/system problems.

---

## Phase 7: Safety and Governance Expansion

**Purpose:** Add the safety controls that were intentionally deferred in MVP.

**Frank Mapping:** 权限控制 / 风险边界 / 工程系统不是玩具.

**Main Work:**

- Add organization visibility states:
  - public;
  - private;
  - draft;
  - review/disabled if needed.
- Add join policies:
  - open;
  - approval required;
  - invite only.
- Add minimal moderation:
  - leave organization;
  - remove member;
  - disable invitation code;
  - possibly report organization.
- Revisit channel access once multi-channel support becomes real.

**Evidence Produced:**

- ADRs for safety/governance decisions.
- Permission matrix.
- Manual acceptance records for unauthorized access.

**Exit Criteria:**

- The system can explain what users may see, join, manage, and access under different policies.

---

## Phase 8: Portfolio Packaging and Interview Narrative

**Purpose:** Convert the project into job evidence.

**Frank Mapping:** 作品证明 / 岗位证据 / 能解释清楚.

**Main Work:**

- Rewrite README as a product-engineering case study:
  - scenario;
  - user problem;
  - core flow;
  - architecture;
  - tradeoffs;
  - deployment;
  - validation.
- Prepare a short demo script:
  - user registers;
  - Public Square appears;
  - user creates organization;
  - another user discovers and joins;
  - members chat;
  - Organizer publishes activity;
  - activity appears in schedule.
- Prepare interview talking points:
  - why Organization is the core model;
  - why Public Square is a default organization;
  - why activity is lightweight in MVP;
  - why channel access derives from membership;
  - where Redis/RabbitMQ fit.

**Evidence Produced:**

- README suitable for recruiters/interviewers.
- Demo screenshots or video.
- Architecture diagram.
- ADR index.
- Validation checklist.

**Exit Criteria:**

- The project can be introduced as: “I designed and delivered an organization-centered communication platform,” not “I made a chat room.”

---

## Phase 9: AI Collaboration Evidence Layer

**Purpose:** Connect this project with Frank's second work category: proving Yuy can manage AI output.

**Frank Mapping:** AI 编排化 / 管理 AI 输出 / Agent 工程闭环.

**Main Work:**

- Keep development handoff docs and prompts where useful.
- Record how AI was used:
  - domain modeling;
  - ADR drafting;
  - implementation planning;
  - code review;
  - manual acceptance checklist generation.
- Add human verification records showing Yuy did not blindly accept AI output.
- Optionally connect learnings to `Apothecary Agent` later:
  - context preparation;
  - tool boundaries;
  - permission controls;
  - evaluation and review loops.

**Evidence Produced:**

- A short `docs/ai-collaboration.md` or README section.
- Examples of AI-generated plans reviewed and corrected by Yuy.
- Evidence of manual validation and architectural decisions.

**Exit Criteria:**

- The project proves not only system-building ability, but also AI-era engineering workflow ability.

---

## Guiding Rule

For every next task, ask Frank's question first:

```text
这一步会增加哪一种岗位证据？
```

If the answer is unclear, do not do it yet.

Prioritize evidence in this order:

1. Product clarity: can people understand the real problem?
2. Domain model: are the core concepts stable?
3. Working flow: can users complete the main path?
4. Delivery: can the system run outside the author's head?
5. Validation: can correctness be demonstrated?
6. Engineering depth: do Redis/RabbitMQ/deployment solve real problems?
7. Narrative: can Yuy explain the tradeoffs in an interview?
