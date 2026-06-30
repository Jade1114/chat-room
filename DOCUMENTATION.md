# Documentation Map

项目文档分为两条轨道：

1. **产品交付轨道** — 项目是什么、MVP 验证什么、如何实现和验收。
2. **学习轨道** — Yuy 通过此项目学习 Redis/RabbitMQ/并发。

---

## 产品交付轨道

### 入口

| 文档 | 用途 |
|------|------|
| `README.md` | 项目入口：产品定位、MVP 状态、本地运行 |
| `VISION.md` | 产品愿景：为什么存在、相信什么、拒绝成为什么 |
| `CONTEXT.md` | 领域词汇表：User、Activity、Feed、Event 等术语定义 |

### MVP 定义

| 文档 | 用途 |
|------|------|
| `docs/MVP.md` | MVP 边界：核心假设、用户故事、核心对象、功能列表、不做列表、成功指标 |
| `docs/adr/0003-activity-first-mvp.md` | 权威决策记录：Activity-first 替代 Organization-first 的全部决策 |

### 实现与验证

| 文档 | 用途 |
|------|------|
| `docs/roadmap.md` | 当前状态 + 分阶段路线图 |
| `docs/api-contract.md` | 前后端 API 契约 |
| `docs/manual-acceptance.md` | 手动验收清单 |
| `docs/deployment.md` | 部署与冒烟测试 |

### 工程风险

| 文档 | 用途 |
|------|------|
| `docs/bug/bug-log.md` | Bug 与质量闭环记录 |
| `docs/known-engineering-concerns.md` | 已知工程问题（SessionManager 内存、N+1 等） |

### 工程轨道

| 文档 | 用途 |
|------|------|
| `docs/engineering/scenario-catalog.md` | 工程场景目录：5 个候选场景，每个场景分析为什么必须用 Redis/RabbitMQ/并发，能产生什么工程证据。从中选择推进。 |
| `docs/engineering/activity-interest-design.md` | Activity Interest + realtime hint 的可实现设计：领域边界、交付切片、Slice 1 API/数据模型/验收清单。 |
| `docs/engineering/activity-interest-notification-design.md` | Slice 2 总结：Interest notification 语义、WebSocket targeted hint、RabbitMQ async side-effect、Redis multi-instance routing 暂缓边界。 |
| `docs/engineering/activity-hot-ranking-design.md` | Slice 3 设计、实现状态与恢复边界：用 Redis Sorted Set 把浏览、查看参与方式、表达兴趣转化为已验收的 Hot Activity Ranking。 |
| `docs/engineering/activity-rate-limiting-design.md` | 场景 4 限流与安全：Redis sliding window / token bucket，保护公开发布和 Interest 点击。 |
| `docs/engineering/capability-checklist.md` | 工程能力清单：6 大能力域（消息可靠性/缓存/实时推送/并发安全/一致性/系统保护），每项能力的具体技术手段和面试表达，技能覆盖矩阵。 |
| `docs/engineering/engineering-track.md` | 历史：旧的线性 E0-E4 计划，已被场景目录替代。E0 已实现。 |

---

## 学习轨道

以下文件在 `.gitignore` 中，是本地学习笔记：

| 文档 | 用途 |
|------|------|
| `MISSION.md` | 学习目标：通过 chat-room 学 Redis/RabbitMQ/并发 |
| `NOTES.md` | 教学协作偏好 |
| `RESOURCES.md` | 学习资源索引 |
| `learning-records/` | 学习记录（如 Redis presence、RabbitMQ boundary） |

---

## 归档

| 路径 | 内容 |
|------|------|
| `docs/archive/organization-first/` | Organization-first 产品文档 + ADR 0001/0002（已被 ADR 0003 替代） |
| `docs/archive/pre-organization-pivot/` | 更早期的 teaching-platform 文档 |
| `docs/archive/deployment-history/` | 历史部署记录 |
| `docs/archive/feedback-history/` | 历史验证反馈记录 |

---

## 推荐阅读路径

**实现前：**
```
VISION.md → docs/MVP.md → docs/adr/0003-activity-first-mvp.md
→ CONTEXT.md → docs/roadmap.md → docs/api-contract.md → docs/manual-acceptance.md
```

**给 reviewer / 同学试用：**
```
README.md → docs/classmate-review-guide.md → docs/manual-acceptance.md
```

**产品工程 / 面试证据：**
```
README.md → VISION.md → docs/roadmap.md → docs/MVP.md → docs/manual-acceptance.md
```

---

## 冲突规则

文档冲突时按以下优先级解决：

1. `docs/adr/0003-activity-first-mvp.md`
2. `docs/MVP.md`
3. `VISION.md`
4. `CONTEXT.md`
5. `docs/roadmap.md`

归档文档不做当前需求来源。
