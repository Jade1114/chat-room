# MVP

## Goal

验证一个最核心的假设：

> 如果校园里存在一个持续开放的平台，让任何人都可以发起值得共同参与的事情，人们是否愿意发现并参与？

MVP 不验证组织运营，不验证社区沉淀，也不验证复杂的社交关系。

我们只验证：

> **人是否愿意因为共同兴趣而参与现实中的事情。**

---

## User Story

```text
用户登录平台
↓
浏览最近正在发生或即将发生的事情
↓
搜索 / 按分类和标签筛选
↓
发现自己感兴趣的 Activity
↓
打开详情页
↓
点击查看参与方式
↓
通过微信、QQ、邮箱、外部表单、线下集合说明等方式私下联系发起者
↓
真实参与
↓
如果觉得不错，下次继续回来寻找新的事情
```

整个闭环到此结束。

---

## Core Objects

MVP 只有两个核心业务对象。

### User

用户。

可以浏览、发布、查看参与方式、管理自己发起的 Activity。

### Activity

任何希望别人共同参与的一件事情。

例如：

- Workshop
- 比赛
- 游戏
- 学习小组
- 运动
- 摄影
- Reading Group
- Hackathon
- 找队友
- 找搭子完成一件事情

Activity 不要求来自社团。

任何登录用户都可以以个人身份发起。

如果是社团、实验室、老师、公司或其他组织相关的事情，在 title 或 description 中写清楚即可，不在 MVP 中建模组织归属。

---

## Activity Fields

第一版 Activity 至少包含：

- title：标题；
- description：说明；
- category：固定分类，单选；
- tags：自由标签，最多 5 个；
- timeMode：`SCHEDULED` 或 `ONGOING`；
- startTime：明确时间型 Activity 的开始时间；
- endTime：可选结束时间；
- expiresAt：持续招募型 Activity 的有效期；
- location：地点 / 线上说明；
- participationMethod：自由文本参与方式；
- status：`DRAFT` / `PUBLISHED` / `EXPIRED` / `CLOSED`；
- createdBy：发起者；
- createdAt：发布时间。

### Category

第一版分类：

- `STUDY`：学习
- `SPORTS`：运动
- `GAME`：游戏
- `PROJECT`：项目
- `WORKSHOP`：Workshop
- `COMPETITION`：比赛
- `TRAVEL`：出行
- `TEAM_UP`：找队友 / 找搭子
- `OTHER`：其他

### Time Mode

`SCHEDULED`：有明确开始时间的事情。

`ONGOING`：持续招募 / 长期开放的事情，必须有 `expiresAt`，最长 30 天。

### Status

- `DRAFT`：未公开，第一版 UI 不做保存草稿，仅作为模型预留；
- `PUBLISHED`：已发布，仍有效；
- `EXPIRED`：已过期；
- `CLOSED`：发起者主动关闭。

到期后进入 `EXPIRED`，不会自动回到 `DRAFT`。

---

## Core Features

当前已验收 MVP 完成：

- 用户登录；
- Activity Feed；
- Activity 搜索；
- Activity 分类 / 标签筛选；
- Activity 详情；
- 发布 Activity；
- 关闭自己发布的 Activity；
- 查看参与方式；
- Activity Interest：`我感兴趣` / `已感兴趣`；
- Activity Update：发起者单向补充说明；
- 我的发布；
- Hot Activity Ranking：透明热门发现，不是推荐系统或游戏排行榜；
- Activity Rate Limiting：公开发布和 Interest 点击防刷；
- Activity Expiration Engine：到期后自动进入 `EXPIRED`；
- 最小行为事件记录:
  - `DETAIL_VIEW`
  - `PARTICIPATION_METHOD_VIEW`

当前保留但不作为已验收 UI 主能力：

- `DRAFT` 模型状态；
- Activity 编辑 API / 未来编辑 UI。

---

## Activity Feed

Feed 默认分成两个区，当前前端用 tabs 表达：

### 即将发生 Upcoming

- `timeMode = SCHEDULED`
- `status = PUBLISHED`
- 未过期
- 按 `startTime` 升序

### 持续招募 Ongoing

- `timeMode = ONGOING`
- `status = PUBLISHED`
- `expiresAt` 未过期
- 按 `createdAt` 倒序

搜索、分类筛选、标签筛选后仍然保留这两个分区。

---

## Current implementation status

Activity-first MVP 主链路已经本地手动验收通过：

```text
登录
→ /activities
→ Upcoming / Ongoing tabs
→ search / category / tag filter
→ /activities/:activityId
→ 查看参与方式
→ 我感兴趣 / 已感兴趣
→ 发起者收到在线匿名 Interest 提示
→ DETAIL_VIEW / PARTICIPATION_METHOD_VIEW event logs
→ Hot tab 展示可解释热门排序
→ /activities/new
→ /me/activities
→ close my initiated Activity
→ publish Activity Update
→ interested online identity receives Activity Update hint
```

Organization / Channel / Chat 相关能力是历史工程资产和 post-MVP 可能方向。当前前端已将这些 route 降级为 legacy，不进入 Activity-first MVP 主导航。

---

## Navigation

第一版主导航：

```text
发现事情   /activities
发起事情   /activities/new
我的发布   /me/activities
```

登录后默认进入：

```text
/activities
```

如果 `/dashboard` 保留，应重定向到 `/activities` 或改成 Activity-first landing page。

---

## What We Intentionally Don't Build

当前版本不会实现：

- 社团系统；
- 组织主页；
- Membership；
- 平台内报名 / Participation 表；
- “我参与的 Activity”；
- 收藏 / 历史记录；
- 多频道聊天；
- 实时聊天；
- 通知中心；
- 个性化推荐算法；
- 游戏化排行榜 / 勋章；
- 社交关系；
- 评论区；
- 图片 / 海报 / 文件上传；
- 人数上限 / 候补 / 审核 / 签到。

这些都不是 MVP。当前已实现的 Interest / Activity Update 在线提示只是 best-effort hint，不是通知中心；Hot Activity Ranking 是透明发现辅助，不是个性化推荐或游戏化排行榜。

---

## Success Metrics

MVP 不关注：

- 注册人数；
- 消息数量；
- 在线人数。

重点关注：

- Activity 发布数量；
- Activity Feed 浏览；
- Activity 详情打开；
- 参与方式查看；
- 用户是否真的私下联系发起者；
- 用户是否真实参与；
- 用户是否再次回来寻找新的 Activity。

系统内优先记录：

- `DETAIL_VIEW`
- `PARTICIPATION_METHOD_VIEW`

真实参与率通过人工访谈 / 同学反馈 / 发起者反馈验证。

---

## Principle

MVP 的目标不是建立社区。

而是验证：

> 人是否愿意因为平台上的事情，而主动参与现实中的事情。

如果答案是 Yes。

再考虑组织、社区、聊天和长期关系。
