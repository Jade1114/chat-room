# Engineering Scenario Catalog

> 这份文档不是实施计划，是场景清单。每个场景定义了一个可以从产品角度自然引入核心技术的机会。从中选择推进，每个场景做完都增加一层工程证据。
>
> 原则：不是"我想用 Redis"，而是"这个场景不做 Redis 就做不了/做不好"。

---

## 场景 1: 参与意向 + 实时通知

### 产品

当前已完成 Slice 1：用户在 Activity 详情页点 `我感兴趣`，系统在 MySQL 中记录一个持久的 Activity Interest，并在详情页 / 我的发起中展示匿名 Interest Count。

下一步工程场景：当 B 对 A 发起的 Activity 表达兴趣时，A 在线时收到匿名实时提示："有人对你的活动感兴趣"。这仍然不是报名系统，只是降低表达兴趣门槛，同时给发起者反馈。

当前设计入口：`docs/engineering/activity-interest-notification-design.md`。先完成通知语义对齐，再进入单实例 WebSocket proof。

### 为什么需要核心技术

| 需求 | 技术 | 为什么必须 |
|------|------|-----------|
| 同一个身份不能重复表达兴趣 | MySQL unique constraint + service-layer identity rules | Interest 是事实关系，去重必须落在 source of truth，而不是只靠缓存 |
| 高频点击防刷 | Redis 滑动窗口 / Token Bucket | 防刷；放在 Redis 是因为多实例共享计数器 |
| 解除 HTTP 响应和后台处理耦合 | RabbitMQ | Interest 写入 MySQL 后立即返回，后台异步计数、热度、通知 |
| 发起者收到实时通知 | WebSocket 定向推送 | Feed 广播是群发，这个是点到点；需要知道发起者是否在线 |
| 热度计数（浏览量+意向数） | Redis `Sorted Set` + `ZINCRBY` | 原子递增，天然排序，比 MySQL `COUNT` + `ORDER BY` 快几个数量级 |
| 消息不丢 | RabbitMQ publisher confirm + consumer manual ack | Interest 事实已写入 MySQL，通知/热度等 side effect 应至少处理一次 |
| 消费失败不丢 | Dead Letter Queue | 重试 N 次后仍然失败的进入 DLQ，人工/自动排查 |
| 多 consumer 并发 | 线程安全审查 | 多个 consumer 同时处理不同用户的意向，计数不能错 |

### 一致性边界

| 数据 | 存储 | 一致性 |
|------|------|--------|
| 意向记录（谁对哪个活动表达了意向） | MySQL | 强一致（source of truth） |
| 意向计数（展示用） | Redis | 最终一致（允许短暂不一致，从 MySQL 重建） |
| 通知投递 | RabbitMQ → WebSocket | at-least-once（可能重复推送，前端幂等去重） |

### 数据路径

```
用户点 `我感兴趣`
  → POST /api/activities/:id/interest
    → MySQL INSERT IGNORE activity_interest（source of truth，幂等）
    → 返回 updated ActivityResponse（interestCount / interestedByCurrentIdentity）
    → RabbitMQ publish (exchange: activity-events, routing: interest.created)
      → Consumer A: Redis ZINCRBY activity:hot:score
      → Consumer B: 查询发起者身份 → Redis 查询在线状态 → WebSocket 定向推送
```

当前 Slice 1 已实现到 MySQL 返回 updated ActivityResponse；RabbitMQ / Redis / WebSocket 是下一步 engineering slice。

### 证据产出

- Redis 三种数据结构实战（String SETNX、Sorted Set ZINCRBY、String 限流）
- RabbitMQ 可靠消息管道（confirm/ack/retry/DLQ）
- WebSocket 定向推送（不止群发）
- 并发安全分析（多 consumer 竞争计数）
- 一致性边界文档（MySQL 强一致 vs Redis 最终一致 vs RabbitMQ at-least-once）

### Frank 映射

⑥ 工程深度：Redis 多结构 / RabbitMQ 可靠管道 / WebSocket 定向推送 / 并发安全
⑦ 解释 tradeoff：为什么意向计数用 Redis 不用 MySQL、为什么 at-least-once 不用 exactly-once

---

## 场景 2: 热度排序 + Feed 动态重排

### 产品

Feed 不再纯按时间排序。引入"热度"维度——结合浏览量、意向数、新发布，让用户看到的不只是"最新"，还有"最值得看"。

### 为什么需要核心技术

| 需求 | 技术 | 为什么必须 |
|------|------|-----------|
| 实时热度计数（每次浏览/意向原子递增） | Redis `ZINCRBY` | MySQL `UPDATE SET count = count + 1` 在并发下性能差且需行锁 |
| 按热度排序查询 | Redis `ZREVRANGE` | O(log N + M)，MySQL `ORDER BY score` 全表扫描 |
| Feed 接口先查 Redis 再 fallback | cache-aside 模式 | Redis 命中时完全不走 MySQL；未命中回源并回填 |
| 缓存失效 | 事件驱动 | Activity 发布/关闭/过期时主动 invalidate，不依赖 TTL 猜测 |
| 多实例缓存一致 | Redis pub/sub 跨实例通知 | 实例 A 更新了缓存，实例 B 的缓存也失效 |

### 一致性边界

| 数据 | 存储 | 一致性 |
|------|------|--------|
| Activity 数据 | MySQL | 强一致 |
| Feed 列表（排序后） | Redis Sorted Set | 最终一致（从 MySQL 重建） |
| 热度分数 | Redis Sorted Set | 最终一致（允许短暂丢失几次浏览） |

### 数据路径

```
用户打开 Feed
  → GET /api/activities?sort=hot
    → Redis ZREVRANGE activity:feed:hot 0 19
      → 命中：直接返回
      → 未命中：MySQL 查询 → 回填 Redis → 返回

用户浏览 Activity 详情
  → 记录 DETAIL_VIEW 事件
    → RabbitMQ publish
      → Consumer: Redis ZINCRBY activity:hot:{activityId} +1
      → Consumer: Redis ZINCRBY activity:feed:hot {activityId} +1
```

### 证据产出

- Redis Sorted Set 做排行榜（最经典的 Redis 应用场景）
- cache-aside 模式（读写策略、回填、失效）
- 事件驱动缓存更新（不依赖 TTL）
- 热度算法设计（简单加权 vs 时间衰减）

---

## 场景 3: 活动过期引擎

### 产品

Activity 到期后自动标记为 EXPIRED，即将开始的 Activity 推送提醒给感兴趣的参与者。不用人工管理生命周期。

### 为什么需要核心技术

| 需求 | 技术 | 为什么必须 |
|------|------|-----------|
| 高效查询"即将过期/开始"的 Activity | Redis `ZRANGEBYSCORE` | 按时间戳排序，O(log N) 范围查询 |
| 定时检查 | Spring `@Scheduled` | 简单可靠，单实例足够（配合 Redis 分布式锁防重复执行） |
| 多实例不重复执行 | Redis `SETNX` 分布式锁 | 防止每个实例都扫一遍 |
| 批量发送提醒 | RabbitMQ 批量 publish | 一次检查可能产生几十条提醒，逐条 HTTP 太慢 |
| 提醒不重复发送 | Redis 幂等标记 | `SETNX reminder:sent:{activityId}:{userId}` |

### 一致性边界

| 数据 | 存储 | 一致性 |
|------|------|--------|
| Activity 状态 | MySQL | 强一致 |
| 过期/提醒索引 | Redis Sorted Set | 热数据，从 MySQL 重建 |
| 提醒去重 | Redis String | 幂等保证，带 TTL |

### 证据产出

- Redis Sorted Set 做时间索引
- Redis 分布式锁（`SETNX` + TTL）
- 定时任务设计（频率、批量、容错）
- RabbitMQ 批量处理

---

## 场景 4: 限流与安全

### 产品

防止恶意用户高频发布 Activity 或刷意向。系统级保护，不是功能需求。

### 为什么需要核心技术

| 需求 | 技术 | 为什么必须 |
|------|------|-----------|
| 每人每分钟最多发 3 个 Activity | Redis 滑动窗口 | 跨实例共享计数器；重启不丢（Redis 持久化） |
| 每秒最多 10 个意向点击 | Redis Token Bucket | 突发容忍 + 稳定限流 |
| 限流拒绝时返回 429 + Retry-After | HTTP 标准响应 | 前端可以展示友好提示 |
| IP 级别限流和用户级别限流分开 | 两级 Redis key | 防止单用户换账号绕开 |

### 一致性边界

| 数据 | 存储 | 一致性 |
|------|------|--------|
| 限流计数器 | Redis | 热数据，不需要持久化（重启后重新计数可以接受） |

### 证据产出

- Redis 两种限流算法（滑动窗口 + Token Bucket）
- 多级限流设计（IP + User）
- 限流不影响正常用户体验

---

## 场景 5: 离线消息补偿

### 产品

用户断线后重连，不错过断线期间发布的 Activity。不是实时推送的替代，是补偿机制。

### 为什么需要核心技术

| 需求 | 技术 | 为什么必须 |
|------|------|-----------|
| 记录用户最后在线时间 | Redis `SET` + TTL | 轻量标记，不需要 MySQL |
| 查询"上次在线之后的新 Activity" | MySQL 范围查询 | Source of truth 兜底 |
| 推送补偿消息 | WebSocket | 重连后立即推送 |
| 避免重复推送 | Redis `SETNX` 去重 | 用户可能同时收到实时推送和补偿推送 |

### 证据产出

- 在线状态管理（Redis 做轻量状态，MySQL 做持久记录）
- 断线重连 + 消息补偿的完整方案
- 实时推送 + 补偿推送的去重设计

---

## 场景选择指南

| 如果你想要... | 选 |
|---------------|-----|
| 最完整的链路（Redis + RabbitMQ + WebSocket + 并发全串起来） | 场景 1 |
| 最经典的 Redis 应用（排行榜 + 缓存） | 场景 2 |
| 最轻量的系统级能力（不依赖新产品功能） | 场景 4 |
| 最偏向运维/可靠性 | 场景 3 |
| 完善已有能力（不引入新产品概念） | 场景 5 |

---

## 与技术选型的对应

| 技术 | 场景 1 | 场景 2 | 场景 3 | 场景 4 | 场景 5 |
|------|--------|--------|--------|--------|--------|
| Redis String (SETNX/GET/SET) | ✅ 去重+限流 | | ✅ 分布式锁 | ✅ 限流 | ✅ 去重 |
| Redis Sorted Set | ✅ 热度 | ✅ Feed排序 | ✅ 时间索引 | | |
| Redis Set | | | | | ✅ 在线状态 |
| RabbitMQ 可靠管道 | ✅ 事件 | ✅ 事件 | ✅ 批量 | | |
| RabbitMQ DLQ | ✅ | | | | |
| WebSocket 定向推送 | ✅ | | | | ✅ |
| 并发安全 | ✅ | ✅ | | | |
| 一致性文档 | ✅ | ✅ | | | |
