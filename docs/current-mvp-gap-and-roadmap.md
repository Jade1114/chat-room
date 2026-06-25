# Current MVP Status and Roadmap

> 当前 MVP 已经从 Organization-first 切换为 Activity-first。本文档按 `VISION.md`、`docs/MVP.md` 和 `docs/adr/0003-activity-first-mvp.md` 记录当前实现状态、已验收主链路和后续方向。

## 1. Current state

当前最准确描述是：

> Activity-first MVP 主链路已经闭合并完成手动验收；Organization / Channel / Chat 已降级为 legacy 能力，不再作为当前 MVP 验收主线。

已完成的工程底座：

- 登录 / JWT；
- Spring Boot backend；
- React / Vite frontend；
- MySQL；
- Docker Compose；
- Activity-first schema / seed / migration；
- Activity Feed / Detail / Publish / My initiated APIs；
- Activity event logging；
- Activity-first frontend routes and navigation；
- legacy Organization / Channel / Chat 前端入口降级。

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

当前已验收的系统内闭环：

```text
login
→ /activities
→ Upcoming / Ongoing tabbed Feed
→ search / category / tag filter
→ /activities/:activityId
→ 查看参与方式
→ DETAIL_VIEW / PARTICIPATION_METHOD_VIEW event logs
→ /activities/new publish
→ /me/activities
→ close my initiated Activity
```

系统外真实参与仍需通过同学反馈、发起者反馈或人工访谈验证。

## 3. Completed gaps

### Gap 1: Activity-first navigation

状态：✅ 已完成。

```text
登录后默认进入 /activities
主导航：发现事情 / 发起事情 / 我的发布
```

旧 Organization / Channel / Chat 不再作为主导航入口。

### Gap 2: Activity Feed

状态：✅ 已完成。

```text
/activities
```

Feed 使用 tab 表达两个分区：

- Upcoming / 即将发生；
- Ongoing / 持续招募。

Feed 只展示仍有效的 `PUBLISHED` Activities。

### Gap 3: Search / category / tags

状态：✅ 已完成。

- 搜索 title / description / tags；
- category 固定单选筛选；
- tags 自由标签筛选；
- 筛选后 Upcoming / Ongoing tab 数量和列表同步更新。

### Gap 4: Activity Detail

状态：✅ 已完成。

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

### Gap 5: participationMethod reveal and event logging

状态：✅ 已完成。

- 打开详情记录 `DETAIL_VIEW`；
- 点击查看参与方式后展示 `participationMethod`；
- 点击时记录 `PARTICIPATION_METHOD_VIEW`。

这些事件只是验证日志，不是报名关系。

### Gap 6: Publish Activity

状态：✅ 已完成。

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

### Gap 7: My initiated Activities

状态：✅ 已完成。

```text
/me/activities
```

只展示当前用户发起的 Activities。

不展示：

- 我参与的；
- 我感兴趣的；
- 收藏；
- 查看过联系方式的历史。

### Gap 8: Activity lifecycle

状态：✅ 已完成 MVP 必要部分。

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

### Gap 9: Active docs and acceptance rebaseline

状态：✅ 本轮同步中。

当前验收和对外说明围绕 Activity-first；Organization-first docs 应继续归档或标记为 historical / legacy。

## 4. Non-goals

当前不做：

- organization system as MVP；
- organization homepage as MVP；
- Membership as MVP；
- platform-internal registration / Participation table；
- “我参与的 Activity”；
- 收藏 / 历史；
- realtime chat as MVP；
- comments；
- notification center；
- recommendation；
- images / upload；
- capacity / waitlist / approval。

## 5. Implementation history

```text
P0 文档重基线                                      ✅
P1 Activity schema / migration / seed             ✅
P2 Activity API: feed, detail, publish, close, my  ✅
P3 Activity event logging                         ✅
P4 Activity-first frontend routes and navigation  ✅
P5 Manual acceptance                              ✅
P6 Hide / downgrade legacy Organization routes    ✅
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

## 7. Recommended next work

下一阶段先做项目表达和真实反馈：

1. 邀请同学按 Activity-first 主链路试用；
2. 收集他们是否愿意私下联系、是否真实参与、为什么没参与；
3. 根据反馈决定样式设计和新功能优先级。

长期方向分成两大块。

### Direction A: 样式设计调整

目标：降低第一次使用的理解成本，让页面更像“发现值得一起做的事”，而不是工程功能堆叠。

可能工作：

- Activity card 信息层级优化；
- Feed 首屏视觉改版；
- Upcoming / Ongoing tabs 的视觉强化；
- category / tag 筛选体验优化；
- Detail 页面参与动机和参与方式展示优化；
- Publish 页面从“后台表单”改成“发起邀请”；
- 移动端布局；
- empty / error / legacy 状态视觉统一。

### Direction B: 新功能增加

目标：根据真实试用反馈补足 Activity-first 参与链路，而不是默认回到 Organization / Chat。

可能工作：

- Activity 编辑 UI；
- Activity 草稿；
- 我感兴趣 / 收藏；
- 发起者 profile / 历史发布；
- Activity 质量、排序和推荐；
- 参与意向表达；
- 真实反馈收集面板；
- post-MVP Organization 能力重新设计。

优先级判断原则：

```text
如果用户找不到感兴趣的事情 → 优先样式、内容质量、分类/tag、排序
如果用户不敢联系发起者 → 优先发起者可信度、历史发布、详情信息结构
如果用户想记录自己想参加什么 → 再考虑收藏 / 感兴趣 / 参与意向
如果真实组织使用需求强烈 → 再重新设计 Organization，而不是恢复旧模型
```
