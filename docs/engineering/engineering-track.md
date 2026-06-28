# Engineering Track: Real-time Activity Pipeline

> 目标：在当前 Activity-first MVP 上构建一条真实时间线，使其从 "MySQL CRUD 应用" 升级为 "能证明你会做系统的项目"。
>
> 核心原则：每个技术选择都源于一个具体的产品问题。不堆技术，不玩具演示。

---

## 当前状态

Activity-first MVP 全是同步 CRUD：

```
用户浏览器 → HTTP → Spring Controller → Service → MySQL
```

用户必须手动刷新页面才能看到新 Activity。没有实时性，没有异步处理，没有缓存层，没有跨实例通信。

---

## 目标状态

```
发起者发布 Activity
  → HTTP POST → MySQL（持久化，source of truth）
  → RabbitMQ exchange（fanout to all consumers）
    → Consumer 线程池竞争消费
      → Redis pub/sub publish（通知所有实例的 WebSocket 连接）
      → 每个实例的 broadcast handler → WebSocket → 浏览器实时更新 Feed
```

并发 Activity 发布需要顺序保证、失败重试、死信处理。WebSocket 连接需要心跳和优雅断开。Redis 缓存热 Feed 减少 MySQL 压力。

---

## Phase E0: Feed 实时推送（WebSocket + Redis pub/sub）

**产品问题**：发布 Activity 后，Feed 页必须手动刷新才能看到新内容。

**技术选择**：

| 组件 | 职责 | 为什么是它 |
|------|------|------------|
| WebSocket `/ws/feed` | 浏览器长连接 | HTTP 轮询在 Activity 场景浪费带宽且延迟高 |
| Redis pub/sub | 跨实例广播 | 单实例 WebSocket 只能推给直连用户；多实例部署时需要 Redis 做消息总线 |
| Spring `RedisMessageListenerContainer` | 订阅 Redis channel | 与 Spring WebSocket 生命周期一致 |

**工程要点**：
- JWT 握手鉴权（复用现有 `HandshakeAuthInterceptor`）
- WebSocket session → userId 映射
- 心跳检测断连
- 断线重连与消息补偿（重连后拉 MySQL 补漏）

**不做的**：
- 不做通用消息总线（只推送 `ACTIVITY_PUBLISHED` 一种事件）
- 不做离线消息队列（重连后直接查 MySQL）

**证据产出**：
- WebSocket + Redis pub/sub 集成代码
- 手动验证：用户 A 发 Activity，用户 B 在 Feed 页实时看到
- 简短笔记：为什么是 Redis pub/sub 而不是 RabbitMQ fanout 做这一步

---

## Phase E1: Activity 事件异步化（RabbitMQ）

**产品问题**：发布 Activity 的 HTTP 响应时间 = MySQL INSERT + event log INSERT + 可能的后续处理。链路越长，用户体验越差。

**技术选择**：

| 组件 | 职责 | 为什么是它 |
|------|------|------------|
| RabbitMQ topic exchange | Activity 事件路由 | 解耦 HTTP 线程和后台处理；支持多种 consumer 独立消费同一事件 |
| `ACTIVITY_PUBLISHED` 路由键 | 发布事件 | 后续 `ACTIVITY_CLOSED`、`ACTIVITY_EXPIRED` 可复用同一 exchange |
| Manual ack + retry | 可靠消费 | auto-ack 丢失消息；manual ack 后 consumer 崩溃消息自动 requeue |
| Dead Letter Queue | 失败消息兜底 | N 次重试后仍失败的消息不丢弃，记录到 DLQ 供排查 |

**工程要点**：
- Publisher confirm（确保消息到达 broker）
- Consumer manual ack（处理完才确认）
- 重试策略：指数退避，最多 3 次
- 幂等消费：consumer 通过 `activityId` + `eventType` 去重（Redis SETNX）
- DLQ 消费者：记录失败事件到日志/DB，发出告警日志
- 消息顺序：`ACTIVITY_PUBLISHED` 无需严格顺序；后续如有编辑/关闭需 `activityId` 级别顺序

**不做的**：
- 不做事务消息（分布式事务太重；先做 at-least-once + 幂等）

**证据产出**：
- RabbitMQ 配置：exchange、queue、binding、DLQ
- Publisher + Consumer 代码
- 手动验证：断开 RabbitMQ → 发布 Activity → 恢复 RabbitMQ → 消息不丢
- 笔记：at-least-once vs exactly-once 的选择理由

---

## Phase E2: Feed 热缓存（Redis）

**产品问题**：Feed 每次请求都走 MySQL。Upcoming + Ongoing 两个查询，加上 search/filter，频繁访问时 MySQL 是瓶颈。

**技术选择**：

| 组件 | 职责 | 为什么是它 |
|------|------|------------|
| Redis Sorted Set（`ZADD`） | Upcoming Feed（按 `startTime` 排序） | O(log N) 插入和范围查询，天然适合时间排序 |
| Redis Sorted Set（`ZADD`，`createdAt` score） | Ongoing Feed（按 `createdAt` 倒序） | 同上 |
| Redis Hash | Activity card 摘要缓存 | 减少 Feed 渲染时的 DB 回查 |
| Cache-aside pattern | 读写策略 | 读 Redis 未命中时回源 MySQL 并回填；写穿透（write-through）更新 Redis |

**工程要点**：
- 缓存预热：启动时从 MySQL 加载活跃 Activity 到 Redis
- 缓存失效：`ACTIVITY_PUBLISHED` / `CLOSED` / `EXPIRED` 事件触发缓存更新
- 一致性边界：Redis 是热缓存，MySQL 是 source of truth；允许短暂不一致
- TTL + 主动失效双保险
- 缓存穿透防护：空结果也缓存短 TTL
- 监控：缓存命中率日志

**不做的**：
- 不做分布式锁（单实例部署下 `synchronized` 足够）
- 不做缓存预热自动化（启动时手动预热即可）

**证据产出**：
- Redis 缓存层代码
- 手动验证：第一次访问 Feed 走 MySQL，第二次走 Redis
- 笔记：缓存一致性策略 + 为什么允许短暂不一致

---

## Phase E3: 并发安全加固

**产品问题**：多个用户同时发布 Activity，或者 consumer 并发消费时，缓存更新可能竞态。

**技术选择**：

| 场景 | 方案 |
|------|------|
| Feed 缓存更新竞态 | Redis `ZADD` 本身是原子的；多个写操作顺序不重要 |
| 幂等去重竞态 | Redis `SETNX` 原子操作 |
| 本地状态修改 | `synchronized` 或 `ReentrantLock`（单实例下足够） |

**工程要点**：
- 遍历所有并发接触点，标注是否线程安全
- `SessionManager` 已有 `synchronized`，review 是否覆盖所有路径
- RabbitMQ consumer 的并发度控制（`concurrency` 参数）
- WebSocket send 的线程安全（Spring `ConcurrentWebSocketSessionDecorator`）

**不做的**：
- 不做分布式锁（项目规模不需要）

**证据产出**：
- 并发安全审查文档：标注每个并发接触点 + 保护策略
- 笔记：单实例并发 vs 分布式并发的保护差异

---

## Phase E4: 一致性边界与故障模式文档

**产品问题**：MySQL、Redis、RabbitMQ 三者之间存在不一致窗口。需要明确每种场景下的一致性保证和恢复策略。

**工程要点**：
- 绘制数据流图：标注每个环节的一致性级别
- 每种故障场景的恢复路径：
  - RabbitMQ 宕机 → Activity 仍写入 MySQL，Feed 刷新可见（牺牲实时性）
  - Redis 宕机 → Feed 降级到 MySQL 直查
  - WebSocket 断连 → 重连后 MySQL 补偿
- 不伪装强一致性——明确说 "at-least-once + 最终一致"

**证据产出**：
- `docs/engineering/consistency-model.md`：一致性边界图 + 故障恢复路径
- 笔记：为什么这个系统不需要强一致性

---

## 优先级和依赖

```
E0 (WebSocket + Redis pub/sub)
  ↓ 不依赖
E1 (RabbitMQ 事件管道)
  ↓ E1 事件驱动 E2 缓存更新
E2 (Feed 热缓存)
  ↓ 不依赖
E3 (并发安全加固)
  ↓ 取决于前面全部做完才有意义
E4 (一致性文档)
```

E0 不依赖 RabbitMQ 改造，可以立刻开始。E0 也是产品上最可见的一步——用户在 Feed 页能看到实时更新。

---

## Frank 证据映射

| 证据层 | 对应 Phase | 产出 |
|--------|-----------|------|
| ⑥ 工程深度 | E0-E3 | WebSocket / Redis / RabbitMQ / 并发集成代码 |
| ⑦ 能解释 tradeoff | 每 Phase 附带笔记 | 为什么选 Redis pub/sub 不选 RabbitMQ fanout；为什么 at-least-once 不用 exactly-once；为什么允许缓存短暂不一致 |

全部做完后，你可以说：

> "我设计了一个 Activity-first 校园参与平台。工程上，我用 WebSocket + Redis pub/sub 做实时推送，RabbitMQ 做事件管道解耦 HTTP 响应和后台处理，Redis Sorted Set 做 Feed 热缓存。我明确标注了一致性边界——MySQL 是 source of truth，Redis 是热缓存允许短暂不一致，RabbitMQ 做 at-least-once + 幂等。每种故障模式都有恢复路径。"
