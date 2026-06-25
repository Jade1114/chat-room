# Product Engineering Map

> 当前可信的产品工程地图。本文档以 `VISION.md`、`docs/MVP.md` 和 `docs/adr/0003-activity-first-mvp.md` 为权威来源。

## 1. Product thesis

chat-room 当前主线是 **Activity-first campus participation platform**。

一句话：

> 让校园里值得一起完成的事情持续被发现，让用户在产生“我想做点什么”的念头时，能找到愿意一起参与的人。

## 2. Core pain

校园里不缺有趣的人，也不缺值得一起完成的事情。

真正缺少的是：

> 一个让这些事情持续被发现的地方。

很多机会依赖微信群、朋友圈、招新季或熟人传播。当一个人真正产生兴趣时，它们往往已经消失了。

## 3. What the MVP validates

MVP 只验证：

> 人是否愿意因为共同兴趣而参与现实中的事情。

不验证：

- 组织运营；
- 社区沉淀；
- 复杂社交关系；
- 实时聊天；
- 平台内报名流程。

## 4. Core user flow

```text
login
→ Activity Feed
→ search / category / tag filter
→ Activity Detail
→ view participation method
→ private/off-platform contact
→ real-world participation
→ return to find new Activities
```

## 5. Core domain objects

### User

登录用户。可以浏览、发起、查看参与方式、管理自己的发布。

### Activity

任何值得别人共同参与的一件事情。

Activity 不要求来自社团或组织。第一版中所有 Activity 都由个人用户发起；如果与社团、实验室、老师、公司或其他组织相关，在标题或描述中写明即可。

## 6. Supporting concepts

### Participation Method

自由文本字段，说明如何参与或联系发起者。

它可以包含微信、QQ、邮箱、外部链接、会议链接、线下集合说明等。

### Activity Event

MVP 验证用行为日志，不是社交关系。

- `DETAIL_VIEW`
- `PARTICIPATION_METHOD_VIEW`

### Activity Feed sections

- Upcoming / 即将发生；
- Ongoing / 持续招募。

## 7. Current implementation assets

当前代码中已经有一些可复用资产：

- JWT 登录；
- React / Vite 前端；
- Spring Boot 后端；
- MySQL；
- Docker Compose；
- 旧 Activity 模型雏形；
- 旧 Organization / Channel / Chat 能力。

但 Organization、Membership、Channel 和 realtime chat 是历史实现资产 / future capability，不是当前 MVP 验收标准。

## 8. Current MVP gap

当前最重要的缺口不是聊天，而是 Activity-first 主链路：

1. `/activities` Activity Feed；
2. Feed 的 Upcoming / Ongoing 分区；
3. 搜索、category、tags；
4. `/activities/:activityId` Activity Detail；
5. 显式点击“查看参与方式”；
6. `DETAIL_VIEW` / `PARTICIPATION_METHOD_VIEW` 事件；
7. `/activities/new` 发布 Activity；
8. `/me/activities` 我的发布；
9. Activity 状态与过期规则；
10. 登录后默认进入 `/activities`，旧 Organization / Chat 入口退出主导航。

## 9. MVP non-goals

当前不做：

- Organization-first product shell；
- Organization homepage；
- Membership；
- platform-internal registration / Participation table；
- “我参与的 Activity”；
- chat / unread / presence as MVP acceptance；
- comments / notifications / social graph；
- images / posters / upload；
- capacity / waitlist / approval。

## 10. Recommended implementation sequence

```text
P0 Documentation rebaseline
P1 Activity data model and seed data
P2 Activity Feed + filters
P3 Activity Detail + participation method reveal + event logging
P4 Publish / edit / close Activity
P5 My initiated Activities
P6 Login default route and Activity-first navigation
P7 Docker/manual acceptance update
```

## 11. Documentation trust rule

Before implementing, active docs must agree that:

- `VISION.md` explains why;
- `docs/MVP.md` defines the first version;
- `docs/adr/0003-activity-first-mvp.md` records decisions;
- `CONTEXT.md` names Activity-first domain language;
- Organization-first docs live under `docs/archive/organization-first/` and are not current requirements.
