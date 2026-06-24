# Current MVP Gap and Roadmap

> 这份文档记录下一次大型重构前的事实边界：哪些已经是当前能力，哪些是组织平台 MVP 缺口，应该按什么顺序补齐。

## 1. 当前状态判断

chat-room 已经完成：

```text
组织领域模型骨架
+ Membership-derived Channel access
+ JWT/WebSocket 身份链路
+ 真实聊天基础设施
+ Redis presence/unread
+ RabbitMQ fanout
+ MySQL message history
```

但还没有完成完整的组织平台 MVP 闭环。

当前最准确的描述是：

> 组织模型已经接上聊天主链路，但组织频道入口、创建组织、Activity/Profile 真实数据和部署交付证据还需要补齐。

## 2. 已经可信的 MVP 能力

### 2.1 Domain spine

- User；
- Organization；
- OrganizationMember / Membership；
- Organization Channel；
- Public Square default Organization；
- Membership-derived Channel access。

### 2.2 Auth spine

- register；
- login；
- JWT；
- `/api/auth/me`；
- WebSocket token handshake；
- dev-login as local adapter。

### 2.3 Chat spine

- WebSocket workspace session；
- Channel view changed；
- message persistence；
- recent message cache；
- RabbitMQ publish/consume；
- unread count；
- online users。

## 3. MVP 缺口

### Gap 1: `/messages` is still the legacy chat adapter

Current:

```text
/organizations/:organizationId/channels/:channelId → real ChatWorkspace under Organization context
/messages → compatibility chat entry
```

Completed in current frontend slice:

- User enters a real ChatWorkspace from Organization Detail；
- URL preserves Organization/Channel context；
- Chat header shows Organization / # Channel；
- Left sidebar shows Channels inside the current Organization；
- Middle panel shows the selected Channel timeline and composer；
- Right panel shows Activity records and Members/online members；
- Backend still authorizes via Membership。

Remaining:

- Decide whether `/messages` should redirect to Public Square/default Channel or remain a legacy workspace shortcut.

### Gap 2: Create Organization flow missing

Target:

```text
POST /api/organizations
→ create Organization
→ create default Channel
→ create OrganizationMember(role=ORGANIZER)
→ return Organization detail
```

Acceptance:

- Any logged-in User can create an Organization；
- Creator sees it in joined organizations；
- It appears in Organization Hall if public；
- Creator can enter its default Channel。

### Gap 3: Organization Detail has placeholder profile sections

Current real data:

- Organization summary；
- Membership status；
- default Channel；
- Channel list。

Missing real data:

- tags；
- organizer/creator；
- activities；
- member preview/list；
- invitation/application code；
- Organizer actions。

Acceptance:

- Remove fake Activity/Member data or replace with real minimal backend data；
- Page clearly distinguishes implemented features from planned sections。

### Gap 4: Activity minimum model missing

Target MVP:

- Activity belongs to Organization；
- public activities display on Organization Detail；
- Activity Schedule has Discover Activities and My Schedule；
- My Schedule means activities from joined Organizations, not RSVP。

Out of scope:

- RSVP；
- capacity；
- attendance；
- cancellation workflow；
- activity-specific notifications。

### Gap 5: Documentation and delivery proof

Target:

- README describes Organization platform；
- API contract matches current code；
- manual acceptance validates actual current capabilities；
- old teaching-platform docs are archived；
- Docker Compose / deployment proof can demonstrate the main chain end-to-end。

## 4. Recommended implementation order

```text
P0 Documentation credibility cleanup
P1 Organization Channel route hosts real ChatWorkspace
P2 Create Organization flow
P3 Organization Detail real minimal profile
P4 Activity minimum model
P5 Docker Compose / deployment acceptance
P6 Membership-derived Channel access module deepening
P7 Organization-scoped Channel API evolution
```

## 5. Why not start with architecture refactor?

Membership access, presence, and message delivery all have deepening opportunities, but the current product risk is bigger than the architecture risk.

The highest-value next work is to make the user-facing organization platform loop real:

```text
discover organization
→ join organization
→ enter organization default Channel
→ talk there
→ see history/unread/presence
```

After this loop is real, architecture deepening will have a clearer target and better manual acceptance coverage.

## 6. Documentation trust rule

Before each large refactor, check:

- Does `CONTEXT.md` still name the real domain objects?
- Does `docs/api-contract.md` match actual backend/frontend behavior?
- Does `docs/manual-acceptance.md` test only implemented behavior?
- Are historical ideas under `docs/archive/`?
- Are current MVP gaps explicitly marked as gaps, not mixed into implemented scope?
