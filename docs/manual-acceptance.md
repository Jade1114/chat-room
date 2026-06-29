# Manual Acceptance Checklist

> 目的：用轻量手动验收证明 Activity-first MVP 主链路可运行、可观察、可解释。
>
> 当前 MVP 不验收 Organization、Membership、Channel、实时聊天、评论、通知中心或平台内报名。当前只验收 Activity Interest 的在线匿名提示卡片。

## 1. Acceptance scope

当前主线：

```text
Auth / Local Session
→ Activity Feed
→ Activity search/filter
→ Activity Detail
→ participation method reveal
→ Activity Interest (`我感兴趣` / `已感兴趣`)
→ Activity event logs
→ Publish Activity
→ My initiated Activities
→ Close Activity
```

### 1.1 验收内容

- 登录 / 注册；
- JWT 恢复当前用户；
- Local Session：未登录浏览器可携带 `X-Local-Session-Id` 完成公开 Activity 行为；
- 数据库重置后旧 JWT 会失效并要求重新登录；
- 登录后默认进入 `/activities`；
- Activity Feed 使用 Upcoming / Ongoing tabs；
- Activity 搜索；
- category 筛选；
- tags 展示 / 筛选；
- Activity Detail；
- 打开详情记录 `DETAIL_VIEW`；
- 点击查看参与方式后展示 `participationMethod`；
- 点击查看参与方式记录 `PARTICIPATION_METHOD_VIEW`；
- 点击 `我感兴趣` 后变成 `已感兴趣`；
- 刷新同一浏览器后保持 `已感兴趣`；
- 重复点击不重复增加 `interestCount`；
- 自己发起的 Activity 显示 `宣传我的活动`，不能表达兴趣；
- 发起者在线时收到匿名 Interest 通知卡片；
- Activity Detail 与 `/me/activities` 展示 `interestCount`；
- 发布 Activity；
- 关闭自己发布的 Activity；
- 未登录 Local Session 发起者关闭 Activity 不应出现 `close activity status 401`；
- `/me/activities` 展示我的发布，并支持未登录 Local Session 访问；
- 过期 / 关闭 Activity 不进入默认 Feed；
- 前端构建和后端编译；
- Organization / Channel / Chat 入口被降级为 legacy，不影响 MVP 第一印象。

### 1.2 不验收内容

- 组织系统；
- 组织主页；
- Membership；
- 多频道聊天；
- 实时聊天；
- 评论区；
- 通知中心；
- 推荐算法；
- 图片 / 文件上传；
- 人数上限 / 报名 / 候补 / 签到；
- “我参与的 Activity”；
- Activity 编辑 UI。

## 2. Prerequisites

后端默认连接本机服务：

| 依赖 | 默认地址 | 说明 |
| --- | --- | --- |
| MySQL | `localhost:3306` | 数据库名：`chat_room` |
| Backend | `localhost:8080` | Spring Boot 服务 |
| Frontend | Vite dev server | React 前端 |
| RabbitMQ | `localhost:5672` / management `localhost:15673` | Slice 2C Interest notification side effect |
| Redis | `localhost:6379` | Slice 3 Hot Activity Ranking planned |

## 3. Local database reset

当前 SQL 只保留三类：

```text
backend/sql/init/       初始化
backend/sql/delete/     删除
backend/sql/changes/    变动
```

重置本地库：

```bash
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/delete/001_drop_database.sql
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/init/001_schema.sql
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/dev-seed/002_seed.sql
```

重置后请清理浏览器旧 token，或让前端自动通过 `/api/auth/me` 401 清理：

```js
localStorage.removeItem('chat_room_token')
localStorage.removeItem('chat_room_local_session_id')
```

Seed test account:

```text
test001 / 123456
```

## 4. Build verification

### Backend

```bash
cd backend
mvn -q -DskipTests compile
```

期望：命令退出码为 0。

### Frontend

```bash
cd frontend
npm run build
```

期望：

```text
✓ built in ...
```

## 5. API smoke checks

### Login

```bash
TOKEN=$(curl -s -X POST 'http://localhost:8080/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"test001","password":"123456"}' \
  | jq -r '.token')
```

期望：`TOKEN` 非空。

### Activity Feed

```bash
LOCAL_SESSION_ID="hermes-manual-local-session"

curl -s 'http://localhost:8080/api/activities' \
  -H "X-Local-Session-Id: $LOCAL_SESSION_ID" \
  | jq
```

期望：返回：

```text
upcoming
ongoing
```

### Detail + reveal + interest

```bash
ACTIVITY_ID=act-study-001
LOCAL_SESSION_ID="hermes-manual-local-session"

curl -s "http://localhost:8080/api/activities/$ACTIVITY_ID" \
  -H "X-Local-Session-Id: $LOCAL_SESSION_ID" \
  | jq

curl -s -X POST "http://localhost:8080/api/activities/$ACTIVITY_ID/participation-method" \
  -H "X-Local-Session-Id: $LOCAL_SESSION_ID" \
  | jq

curl -s -X POST "http://localhost:8080/api/activities/$ACTIVITY_ID/interest" \
  -H "X-Local-Session-Id: $LOCAL_SESSION_ID" \
  | jq '{id, interestCount, interestedByCurrentIdentity, canExpressInterest, initiatedByCurrentIdentity}'
```

期望：详情返回 Activity；查看参与方式返回 `participationMethod`；表达兴趣后 `interestedByCurrentIdentity=true`，重复调用不重复增加 `interestCount`。

### Event logs

```bash
mysql --default-character-set=utf8mb4 -uroot -p -D chat_room -e "
SELECT activity_id, user_id, visitor_id AS local_session_id, event_type, created_at
FROM activity_event
ORDER BY created_at DESC
LIMIT 20;
"
```

期望包含：

```text
DETAIL_VIEW
PARTICIPATION_METHOD_VIEW
```

## 6. Frontend acceptance flow

打开：

```text
http://localhost:5173
```

本地验收可登录，也可先用匿名 Local Session 走公开 Activity 链路。登录账号：

```text
test001 / 123456
```

完整主链路：

```text
打开 /activities
→ Feed tab 正常：Upcoming / Ongoing
→ 搜索 Redis
→ 分类筛选 STUDY / PROJECT
→ 标签筛选 后端 / 找队友
→ 打开 Activity Detail
→ 点击查看参与方式
→ 点击 `我感兴趣`，按钮变 `已感兴趣`
→ 刷新同一浏览器，仍然 `已感兴趣`
→ 发布 SCHEDULED Activity
→ 发布 ONGOING Activity
→ 进入 /me/activities，看到自己发起的 Activity 和 interestCount
→ 自己发起的 Activity Detail 显示 `宣传我的活动`
→ 关闭自己发布的 Activity
→ 回到 /activities 确认 CLOSED 不出现在默认 Feed
```

## 7. Activity Feed acceptance

打开：

```text
/activities
```

期望：

- 未登录访问会进入登录流程；
- 登录后默认进入 `/activities`；
- 页面主文案围绕“发现事情 / 有没有人一起”；
- Feed 使用 Upcoming / 即将发生 tab；
- Feed 使用 Ongoing / 持续招募 tab；
- tab 数量正确；
- 默认只展示仍有效的 `PUBLISHED` Activities；
- `SCHEDULED` Activities 按 startTime 升序；
- `ONGOING` Activities 按 createdAt 倒序；
- 新发布 Activity 不会实时同步到其他用户 Feed，其他用户通过手动刷新 `/activities` 获取最新列表。

## 8. Search / filter acceptance

操作：

```text
输入关键词
选择 category
点击 tag
```

期望：

- 搜索匹配 title / description / tags；
- category 只显示对应分类；
- tags 能缩小结果；
- 筛选后 Upcoming / Ongoing tab 数量和列表同步更新。

## 9. Activity Detail acceptance

打开：

```text
/activities/:activityId
```

期望展示：

- title；
- description；
- category；
- tags；
- timeMode；
- time / expiresAt；
- location；
- initiator displayName；
- publish time；
- `查看参与方式` 按钮。

期望不展示：

- 评论区；
- 报名人数；
- 加入按钮；
- 聊天入口；
- 组织主页入口作为主行为。

## 10. Participation method acceptance

在 Activity Detail 点击：

```text
查看参与方式
```

期望：

- 点击前不突出展示 `participationMethod`；
- 点击后展示完整参与方式；
- 行为记录为 `PARTICIPATION_METHOD_VIEW`；
- 该行为不创建报名关系、不进入“我参与”。

## 11. Activity Interest and realtime notification acceptance

两个浏览器 / 两个本地身份：

```text
A = Activity 发起者，保持应用在线
B = 另一浏览器或清理过 chat_room_local_session_id 的 Local Session
```

操作：

```text
B 打开 A 的 Activity Detail
→ B 点击 `我感兴趣`
```

期望：

- B 的按钮变成 `已感兴趣`；
- B 刷新后仍然是 `已感兴趣`；
- `interestCount` 增加一次；
- B 重复点击 / 重复请求不重复增加 `interestCount`；
- A 看到右上角非阻断通知卡片：`有人对你的活动感兴趣`；
- 通知卡片只展示 Activity title / interestCount，不展示 interested identity；
- 通知卡片的 `查看我的活动` 可以进入 `/me/activities`；
- A 打开自己发起的 Activity Detail 时显示 `宣传我的活动`，不能点击 `我感兴趣`；
- A 不会因为自发起 Activity 或重复 Interest 收到通知。

### RabbitMQ Slice 2C smoke

Slice 2C 把通知 side effect 从 HTTP 同步调用改成 RabbitMQ event pipeline。验收时 RabbitMQ 需要处于运行状态。

期望：

- B 点击 `我感兴趣` 后，A 仍然收到同样的右上角通知卡片；
- HTTP response 仍然以 MySQL durable Interest 为准，B 看到 `已感兴趣`；
- RabbitMQ 中应存在 `activity.interest.created.queue` 和 `activity.interest.created.dlq`；
- 正常事件消费后 `activity.interest.created.queue` 不应积压消息；
- consumer 采用 manual ack，失败事件进入 DLQ 而不是回滚 Interest。

## 12. Publish Activity acceptance

打开：

```text
/activities/new
```

填写：

- title；
- description；
- category；
- tags；
- timeMode；
- startTime 或 expiresAt；
- location；
- participationMethod。

期望：

- 所有登录用户可以发布；
- 发布后直接 `PUBLISHED`；
- 不进入审核；
- 不要求 organization；
- 不要求 capacity；
- 不上传图片；
- 出现在对应 Feed 分区。

## 13. Activity lifecycle acceptance

### Ongoing max duration

创建 `ONGOING` Activity 时：

- 必须填写 expiresAt；
- expiresAt 不得超过 30 天。

### Close Activity

发起者关闭自己的 Activity。

期望：

- status 变为 `CLOSED`；
- 未登录 Local Session 发起者关闭时不出现 `close activity status 401`；
- 非发起者关闭返回 403；
- 不再出现在默认 Feed；
- 仍可在我的发布中看到。

### Expired Activity

过期后：

- status 可被计算或更新为 `EXPIRED`；
- 不出现在默认 Feed；
- 不自动回到 `DRAFT`。

## 14. My initiated Activities acceptance

打开：

```text
/me/activities
```

期望：

- 只展示当前登录用户或当前 Local Session 发起的 Activities；
- 未登录 Local Session 访问不应出现 `my activities status 401`；
- 展示 `PUBLISHED` / `EXPIRED` / `CLOSED` / `DRAFT` 状态；
- 可进入详情；
- 可关闭 `PUBLISHED`。

不期望：

- 展示我参与的；
- 展示我收藏的；
- 展示我查看过联系方式的。

## 15. Legacy routes acceptance

主导航不展示 Organization / Channel / Chat。

直接访问旧页面时：

```text
/organizations
/organizations/create
/organizations/:organizationId
/organizations/:organizationId/channels/:channelId
```

期望看到 legacy 提示：

```text
Legacy capability：组织 / 频道 / 聊天不属于当前 Activity-first MVP 验收主线。
```

## 16. Manual user feedback

MVP 需要人工问：

```text
你看到哪些 Activity 感兴趣？
你有没有点开详情？
你有没有点击查看参与方式？
你有没有真的联系发起者？
你最后有没有参与？
如果没有，为什么？
你会不会下次回来继续找事情？
```

## 17. Slice 3B/3C/3D: Hot Activity Ranking acceptance

Slice 3 设计入口：`docs/engineering/activity-hot-ranking-design.md`。

当前 Slice 3B 验收 Redis 写路径，Slice 3C 验收 Hot Feed 读路径和前端 `热门` tab，Slice 3D 验收 Redis 派生读模型的恢复边界。Redis key：

```text
activity:hot_score
```

操作前可以清空本地热度分数：

```bash
redis-cli DEL activity:hot_score
```

验收：

- 打开 Activity Detail 后，Redis Sorted Set 中该 Activity score 增加 1；
- 点击 `查看参与方式` 后，该 Activity score 再增加 3；
- 另一 Local Session 点击 `我感兴趣` 并触发 RabbitMQ `ActivityInterestCreatedEvent` 消费后，该 Activity score 再增加 5；
- 重复 `我感兴趣` 不再增加 5；
- Redis 写失败时，浏览详情、查看参与方式、表达兴趣仍应成功；
- Redis 为空时，`GET /api/activities?sort=hot` fallback 到默认 Feed 顺序。

检查命令：

```bash
redis-cli ZREVRANGE activity:hot_score 0 -1 WITHSCORES
```

Slice 3C API 验收：

```bash
curl -s 'http://localhost:8080/api/activities?sort=hot' \
  -H 'X-Local-Session-Id: slice3-hot-read' \
  | jq '.hot[] | {id,title,hotMetrics}'
```

期望：

- `hot` 按 Redis hot score 排序；
- `hot[]` 每项包含 `hotMetrics.score/detailViews/participationMethodViews/interestCount`，用于解释热门依据；
- `upcoming` / `ongoing` 仍然存在，保持原 Feed response 兼容；
- 关闭或过期 Activity 不会因为 Redis 里有分数而出现在 `hot`；
- Redis 为空或读取失败时，`sort=hot` fallback 到默认 Feed 顺序。

前端验收：

- `/activities` 出现第三个 tab：`热门`；
- 点击 `热门` 后展示 Hot Feed；
- 热门卡片展示 `最近被关注：X 人感兴趣 · Y 次查看参与方式 · Z 次浏览`；
- 搜索、category、tag 过滤后，热门列表也跟随缩小；
- 默认 `即将发生` / `持续招募` 行为不变。

Slice 3D 边界：

- 当前不实现 rebuild script / admin rebuild endpoint；
- MySQL 的 `activity_event` / `activity_interest` 是持久化事实；
- Redis `activity:hot_score` 是可丢失、可恢复的派生读模型；
- Redis 清空后，Hot Feed 允许短暂冷启动并 fallback；
- 后续新行为会继续写入 Redis；
- 只有当 Hot Feed 成为关键入口、不能接受冷启动时，才引入 scheduled rebuild job / admin rebuild endpoint / batch script。

## 18. Checklist

### Build

- [ ] Backend `mvn -q -DskipTests compile` passes；
- [ ] Frontend `npm run build` passes。

### Product flow

- [ ] Login works；
- [ ] stale JWT after DB reset becomes unauthorized；
- [ ] `/activities` is the post-login entry；
- [ ] Activity Feed has Upcoming / Ongoing tabs；
- [ ] Search works；
- [ ] Category filter works；
- [ ] Tag filter works；
- [ ] Activity Detail works；
- [ ] `DETAIL_VIEW` is recorded；
- [ ] Participation method reveal works；
- [ ] `PARTICIPATION_METHOD_VIEW` is recorded；
- [ ] Publish Activity works；
- [ ] My initiated Activities works；
- [ ] Close Activity works；
- [ ] Organization / Chat is not the MVP primary path。
