# Manual Acceptance Checklist

> 目的：用轻量手动验收证明 Activity-first MVP 主链路可运行、可观察、可解释。
>
> 当前 MVP 不验收 Organization、Membership、Channel、实时聊天、评论、通知或平台内报名。

## 1. Acceptance scope

当前主线：

```text
Auth
→ Activity Feed
→ Activity search/filter
→ Activity Detail
→ participation method reveal
→ Activity event logs
→ Publish Activity
→ My initiated Activities
→ Close Activity
```

### 1.1 验收内容

- 登录 / 注册；
- JWT 恢复当前用户；
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
- 发布 Activity；
- 关闭自己发布的 Activity；
- `/me/activities` 展示我的发布；
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

Redis / RabbitMQ may still exist as legacy infrastructure, but they are not part of Activity-first MVP acceptance.

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
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/init/002_seed.sql
```

重置后请清理浏览器旧 token，或让前端自动通过 `/api/auth/me` 401 清理：

```js
localStorage.removeItem('chat_room_token')
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
AUTH_HEADER='<set this to your JWT HTTP auth header>'

curl -s 'http://localhost:8080/api/activities' \
  -H "$AUTH_HEADER" \
  | jq
```

期望：返回：

```text
upcoming
ongoing
```

### Detail + reveal

```bash
ACTIVITY_ID=act-study-001
AUTH_HEADER='<set this to your JWT HTTP auth header>'

curl -s "http://localhost:8080/api/activities/$ACTIVITY_ID" \
  -H "$AUTH_HEADER" \
  | jq

curl -s -X POST "http://localhost:8080/api/activities/$ACTIVITY_ID/participation-method" \
  -H "$AUTH_HEADER" \
  | jq
```

期望：详情返回 Activity；查看参与方式返回 `participationMethod`。

### Event logs

```bash
mysql --default-character-set=utf8mb4 -uroot -p -D chat_room -e "
SELECT activity_id, user_id, event_type, created_at
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

登录：

```text
test001 / 123456
```

完整主链路：

```text
登录
→ 自动进入 /activities
→ Feed tab 正常：Upcoming / Ongoing
→ 搜索 Redis
→ 分类筛选 STUDY / PROJECT
→ 标签筛选 后端 / 找队友
→ 打开 Activity Detail
→ 点击查看参与方式
→ 发布 SCHEDULED Activity
→ 发布 ONGOING Activity
→ 进入 /me/activities
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
- `ONGOING` Activities 按 createdAt 倒序。

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

## 11. Publish Activity acceptance

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

## 12. Activity lifecycle acceptance

### Ongoing max duration

创建 `ONGOING` Activity 时：

- 必须填写 expiresAt；
- expiresAt 不得超过 30 天。

### Close Activity

发起者关闭自己的 Activity。

期望：

- status 变为 `CLOSED`；
- 不再出现在默认 Feed；
- 仍可在我的发布中看到。

### Expired Activity

过期后：

- status 可被计算或更新为 `EXPIRED`；
- 不出现在默认 Feed；
- 不自动回到 `DRAFT`。

## 13. My initiated Activities acceptance

打开：

```text
/me/activities
```

期望：

- 只展示当前用户发起的 Activities；
- 展示 `PUBLISHED` / `EXPIRED` / `CLOSED` / `DRAFT` 状态；
- 可进入详情；
- 可关闭 `PUBLISHED`。

不期望：

- 展示我参与的；
- 展示我收藏的；
- 展示我查看过联系方式的。

## 14. Legacy routes acceptance

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

## 15. Manual user feedback

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

## 16. Checklist

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
