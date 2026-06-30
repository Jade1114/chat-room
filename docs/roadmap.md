# Roadmap

> Activity-first MVP 的当前状态和后续路线。权威来源：`docs/adr/0003-activity-first-mvp.md`、`VISION.md`、`docs/MVP.md`。

---

## 1. Product thesis

> 让校园里值得一起完成的事情持续被发现。让每一个"我想做点什么"的念头，都能更容易找到愿意一起完成的人。

校园不缺有趣的人，也不缺值得一起做的事情。真正缺的是一个让这些事情**持续被发现**的地方。很多机会依赖微信群、朋友圈、招新季或熟人传播——当一个人真正产生兴趣时，它们已经消失了。

MVP 只验证一个假设：

> 如果校园存在一个持续开放的平台，让任何人都可以发起值得共同参与的事情，人们是否愿意发现并参与？

---

## 2. Current state

Activity-first MVP 主链路已闭合，本地手动验收通过。

### 已完成的工程底座

- 登录 / JWT
- Spring Boot backend / React + Vite frontend
- MySQL / Docker Compose
- Activity-first schema / seed / migration
- Local Session 低门槛身份：`chat_room_local_session_id` + `X-Local-Session-Id`
- Activity Feed / Detail / Publish / My initiated APIs
- Activity event logging (DETAIL_VIEW / PARTICIPATION_METHOD_VIEW)
- Activity Interest：`我感兴趣`、幂等计数、当前身份状态、自发起 Activity 不可点
- Activity Interest 实时通知：发起者在线时收到匿名右上角通知卡片
- Activity Interest RabbitMQ 异步事件管道：`ActivityInterestCreatedEvent`、publisher confirm、manual ack、DLQ
- Redis Hot Activity Ranking：`activity:hot_score` Sorted Set、`GET /api/activities?sort=hot`、前端 `热门` tab、`hotMetrics` 解释指标
- Activity Rate Limiting：Redis sliding window / token bucket 保护公开发布和 Interest 点击，超限返回 `429` + `Retry-After`
- Activity Expiration Engine：Redis `activity:expires_at` Sorted Set、Spring `@Scheduled`、Redis lock、MySQL `PUBLISHED -> EXPIRED` 状态迁移
- Activity Update：发起者单向补充说明，详情页 timeline，RabbitMQ/WebSocket 通知已表达 Interest 的在线身份
- Activity-first frontend routes and navigation
- legacy Organization / Channel / Chat 前端入口降级

### 已验收的系统内闭环

```
login
→ /activities
→ Upcoming / Ongoing tabbed Feed
→ search / category / tag filter
→ /activities/:activityId
→ 查看参与方式
→ 我感兴趣 / 已感兴趣
→ 发起者收到匿名 Interest 通知卡片
→ RabbitMQ 异步投递 Interest notification side effect
→ DETAIL_VIEW / PARTICIPATION_METHOD_VIEW event logs
→ Redis Hot Activity Ranking 更新热度分数
→ /activities `热门` tab 展示可解释热门排序
→ /activities/new publish
→ /me/activities
→ close my initiated Activity
```

系统外真实参与仍需通过同学反馈和发起者反馈验证。

### 实现历史

```
P0 文档重基线                                      ✅
P1 Activity schema / migration / seed             ✅
P2 Activity API: feed, detail, publish, close, my  ✅
P3 Activity event logging                         ✅
P4 Activity-first frontend routes and navigation  ✅
P5 Manual acceptance                              ✅
P6 Hide / downgrade legacy Organization routes    ✅
P7 Activity Interest Notification: WebSocket + RabbitMQ ✅
P8 Hot Activity Ranking: Redis Sorted Set + Hot Feed ✅
P9 Activity Rate Limiting: Redis sliding window + token bucket ✅
P10 Activity Expiration Engine: Redis time index + scheduled lifecycle ✅
P11 Activity Update: initiator note + interested-user notification 🚧
```

---

## 3. MVP non-goals

当前不做：

- organization system / homepage / Membership
- platform-internal registration / Participation table
- "我参与的 Activity" / 收藏 / 历史
- realtime chat / multi-channel chat
- comments / notification center / recommendation
- images / upload / capacity / waitlist / approval

---

## 4. Acceptance principle

不要用聊天是否可用来判断 MVP。只看：

```
用户能不能发现 Activity
用户能不能判断是否感兴趣
用户能不能看到参与方式
用户是否愿意私下联系并真实参与
用户是否愿意回来继续找新的 Activity
```

---

## 5. Roadmap

两条轨道并行推进：

| 轨道 | 文档 | 当前 |
|------|------|------|
| 产品轨道 | 本文档 Section 5.1-5.3 | Phase 0（收集反馈） |
| 工程轨道 | `docs/engineering/activity-update-design.md` | 最后一个 feature：Activity Update 正在实现；完成后进入部署上线与文档收尾 |

产品轨道验证"用户是否需要这个产品"。工程轨道把项目从 MySQL CRUD 升级为能证明你**会做系统**的证据——WebSocket 实时推送、RabbitMQ 事件管道、Redis 热缓存、并发安全加固、一致性边界文档。

两条轨道互不阻塞：工程轨道从 legacy chat 基础设施和现有 Activity 模型出发，不依赖产品反馈。

### 5.1 Phase 0: 真实反馈收集（当前）

**目标**：验证 Activity-first 假设是否成立。

**工作**：
1. 邀请同学按主链路试用
2. 收集反馈：是否愿意私下联系、是否真实参与、为什么没参与
3. 记录系统内指标：发布数、浏览数、详情打开数、参与方式查看数

**已知限制**：公开社交平台限制管理员宣传（影响平台流量），需探索不依赖外部引流的增长方式。

**Frank 映射**：真实场景验证 / MVP 假设置信度

**出口条件**：有足够的反馈数据判断下一步优先方向。

---

### Phase 1: 根据反馈选方向

根据 Phase 0 反馈，从以下两个方向中选择一个作为 Phase 1 主线。

#### Direction A: 样式与体验

**触发条件**：用户能找到感兴趣的事，但页面理解成本高、"不像产品像工程功能堆叠"。

**可能工作**：
- Activity card 信息层级优化
- Feed 首屏视觉改版
- Upcoming / Ongoing tabs 视觉强化
- category / tag 筛选体验优化
- Detail 页信息结构和参与动机展示优化
- Publish 页从"后台表单"改为"发起邀请"
- 移动端布局
- empty / error / legacy 状态统一

**Frank 映射**：产品化 / 用户流程 / 从工程交付到产品交付

#### Direction B: 功能补足

**触发条件**：用户想参与但链路有断点（不敢联系、想了解更多发起者背景、希望收到后续提醒）。

**已完成**：
- 参与意向表达：Activity Detail `我感兴趣` → `已感兴趣`
- Interest Count：Activity Detail 与 My Initiated Activities 展示匿名计数
- Local Session 支持：未登录浏览器可表达兴趣；登录后可关联同浏览器 Local Session 的 Interest
- 幂等与自发起保护：重复点击不重复计数，发起者不能给自己的 Activity 表达兴趣
- Interest 实时通知：有人表达兴趣后，发起者在线时收到匿名右上角提示卡片
- RabbitMQ async side effects：把 Interest notification 从 HTTP 同步 side effect 拆成 `ActivityInterestCreated` 事件管道
- Hot Activity Ranking：用 Redis Sorted Set 将详情浏览、查看参与方式、表达兴趣转化为 `热门` Feed 排序
- Hot metrics explainability：热门卡片展示 score、浏览、查看参与方式、interest count 的来源
- Rate limiting and safety：公开发布与 Interest 点击加 Redis 限流，避免低成本匿名滥用
- Activity Expiration Engine：Activity 到期后由 scheduled lifecycle engine 自动转为 `EXPIRED`，不依赖用户打开 Feed 才清理
- Activity Update：发起者发布补充说明，帮助已表达 Interest 的人更容易真实参与，同时明确不做私聊/评论/频道
- Feed 手动刷新边界：发布新 Activity 不广播到其他用户 Feed

**可能工作**：
- Activity 编辑 UI
- Activity 草稿
- 收藏 / 个人感兴趣列表（不同于当前会通知发起者的 Interest）
- 发起者 profile / 历史发布
- 真实反馈收集面板

**工程轨道当前完成（Slice 3）**：
- Hot Activity Ranking 已实现并验收：Redis `activity:hot_score` Sorted Set 负责派生热度分数，`GET /api/activities?sort=hot` 和前端 `热门` tab 负责读路径，MySQL 仍是 Activity 可见性与解释指标的事实源。设计与边界见 `docs/engineering/activity-hot-ranking-design.md`。

**暂缓**：
- Redis multi-instance notification routing：等出现多 backend 实例部署需求时再做，不在当前单实例 MVP 中硬塞进 notification 链路

**Frank 映射**：参与链路 / 业务信息建模 / 从浏览到行动的转化

#### 优先级判断

```
用户找不到感兴趣的事 → Direction A（样式、分类/tag、排序）
用户不敢联系发起者   → Direction B（发起者可信度、历史发布）
用户想记录参与意向   → Direction B（收藏/感兴趣）
```

---

### Phase 2: post-MVP 能力扩展

**触发条件**：Activity-first 假设已验证，真实组织使用需求出现。

**原则**：重新设计 Organization，不恢复旧模型。根据实际需求决定 Organization 的形态——是轻量发布者身份、是社团主页、还是完整的组织管理系统。

**Frank 映射**：领域建模 / 从真实需求到系统设计 / 不恢复被推翻的旧模型

---

### Phase 3: 交付证据与工程深度

**触发条件**：产品方向稳定，需要为岗位证据补充交付化和工程深度表达。

**可能工作**：
- 稳定 Docker Compose / VPS 部署
- 种子数据与演示脚本
- README 从技术栈列表重写为产品工程案例
- Redis / RabbitMQ 只在解决真实产品问题时引入
- 架构图与一致性边界文档

**Frank 映射**：交付化 / 技术补缺跟随证据作品 / 能解释清楚

---

## 6. Documentation trust rule

实现前，以下文档必须一致：

| 优先级 | 文档 | 角色 |
|--------|------|------|
| 1 | `docs/adr/0003-activity-first-mvp.md` | 权威决策记录 |
| 2 | `docs/MVP.md` | MVP 边界 |
| 3 | `VISION.md` | 产品愿景 |
| 4 | `CONTEXT.md` | 领域词汇表 |
| 5 | `docs/roadmap.md`（本文档） | 现状与路线 |

`docs/archive/` 中的文档不做当前需求来源。
