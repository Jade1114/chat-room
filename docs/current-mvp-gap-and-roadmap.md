# Current MVP Gap and Roadmap

> 当前 MVP 已经从 Organization-first 切换为 Activity-first。本文档按 `VISION.md`、`docs/MVP.md` 和 `docs/adr/0003-activity-first-mvp.md` 重新定义差距和推进顺序。

## 1. Current state

项目已有一些可复用工程资产：

- 登录 / JWT；
- Spring Boot backend；
- React / Vite frontend；
- MySQL；
- Docker Compose；
- 旧 Activity 雏形；
- 旧 Organization / Channel / Chat 能力。

但当前 MVP 不再以 Organization / Membership / Chat 为验收主线。

当前最准确描述是：

> 技术底座存在，但 Activity-first 发现、详情、参与方式和我的发布主链路尚未闭合。

## 2. MVP target loop

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

## 3. Gaps

### Gap 1: Activity-first navigation missing

目标：

```text
登录后默认进入 /activities
主导航：发现事情 / 发起事情 / 我的发布
```

当前旧导航仍可能围绕 Dashboard、Organization、Channel、Chat。

### Gap 2: Activity Feed missing

目标：

```text
/activities
```

展示两个分区：

- Upcoming / 即将发生；
- Ongoing / 持续招募。

Feed 只展示仍有效的 `PUBLISHED` Activities。

### Gap 3: Search / category / tags missing

目标：

- 搜索 title / description / tags；
- category 固定单选筛选；
- tags 自由标签筛选；
- 筛选后仍保持 Upcoming / Ongoing 两区。

### Gap 4: Activity Detail missing

目标：

```text
/activities/:activityId
```

详情页展示：

- title；
- description；
- category / tags；
- time mode and time / expiration；
- location；
- initiator displayName；
- publish time；
- explicit “查看参与方式” action。

### Gap 5: participationMethod reveal and event logging missing

目标：

- 打开详情记录 `DETAIL_VIEW`；
- 点击查看参与方式后展示 `participationMethod`；
- 点击时记录 `PARTICIPATION_METHOD_VIEW`。

这些事件只是验证日志，不是报名关系。

### Gap 6: Publish Activity missing or needs rework

目标：

```text
/activities/new
```

发布字段：

- title；
- description；
- category；
- tags；
- timeMode；
- startTime / expiresAt；
- location；
- participationMethod。

发布后直接 `PUBLISHED`，不做审核。

### Gap 7: My initiated Activities missing

目标：

```text
/me/activities
```

只展示当前用户发起的 Activities。

不展示：

- 我参与的；
- 我感兴趣的；
- 收藏；
- 查看过联系方式的历史。

### Gap 8: Activity lifecycle missing

目标状态：

- `DRAFT`；
- `PUBLISHED`；
- `EXPIRED`；
- `CLOSED`。

MVP UI 不做保存草稿，但模型保留 `DRAFT`。

过期规则：

- `SCHEDULED` 根据 start/end time 过期；
- `ONGOING` 根据 expiresAt 过期，最长 30 天。

发起者可以关闭自己的 Activity。

### Gap 9: Active docs and acceptance need rebaseline

Organization-first docs必须归档或降级；当前验收和对外说明必须围绕 Activity-first。

## 4. Non-goals

当前不做：

- organization system；
- organization homepage；
- Membership；
- platform-internal registration / Participation table；
- realtime chat；
- comments；
- notification center；
- recommendation；
- images / upload；
- capacity / waitlist / approval。

## 5. Recommended order

```text
P0 文档重基线
P1 Activity schema / migration / seed
P2 Activity API: feed, detail, publish, edit, close, my initiated
P3 Activity event logging
P4 Activity-first frontend routes and navigation
P5 Manual acceptance and Docker smoke test
P6 Optional: clean or hide legacy Organization/Chat routes
```

## 6. Acceptance principle

不要用聊天是否可用来判断 MVP。

当前 MVP 是否成立，只看：

```text
用户能不能发现 Activity
用户能不能判断是否感兴趣
用户能不能看到参与方式
用户是否愿意私下联系并真实参与
用户是否愿意回来继续找新的 Activity
```
