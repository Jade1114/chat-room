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
```

### 1.1 验收内容

- 登录 / 注册；
- JWT 恢复当前用户；
- 登录后默认进入 `/activities`；
- Activity Feed 分为 Upcoming / Ongoing；
- Activity 搜索；
- category 筛选；
- tags 展示 / 筛选；
- Activity Detail；
- 打开详情记录 `DETAIL_VIEW`；
- 点击查看参与方式后展示 `participationMethod`；
- 点击查看参与方式记录 `PARTICIPATION_METHOD_VIEW`；
- 发布 Activity；
- 编辑自己 `PUBLISHED` 的 Activity；
- 关闭自己发布的 Activity；
- `/me/activities` 展示我的发布；
- 过期 Activity 不进入默认 Feed；
- 前端构建和后端编译。

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
- “我参与的 Activity”。

## 2. Prerequisites

后端默认连接本机服务：

| 依赖 | 默认地址 | 说明 |
| --- | --- | --- |
| MySQL | `localhost:3306` | 数据库名：`chat_room` |
| Backend | `localhost:8080` | Spring Boot 服务 |
| Frontend | Vite dev server | React 前端 |

Redis / RabbitMQ may still exist as legacy infrastructure, but they are not part of Activity-first MVP acceptance.

## 3. Build verification

### Backend

```bash
cd backend
mvn test
```

期望：

```text
BUILD SUCCESS
```

### Frontend

```bash
cd frontend
npm run build
```

期望：

```text
built successfully
```

## 4. Auth acceptance

### Login

```bash
curl -s -X POST 'http://localhost:8080/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"test001","password":"123456"}'
```

期望：

- HTTP 200；
- 返回 JWT；
- 返回当前用户信息。

### Current user

```bash
curl -s 'http://localhost:8080/api/auth/me' \
  -H '<auth header>'
```

期望：

- HTTP 200；
- 返回当前用户。

## 5. Activity Feed acceptance

打开：

```text
/activities
```

期望：

- 未登录访问会进入登录流程；
- 登录后默认进入 `/activities`；
- 页面主文案围绕“发现事情 / 有没人一起”；
- 页面包含 Upcoming / 即将发生；
- 页面包含 Ongoing / 持续招募；
- 默认只展示仍有效的 `PUBLISHED` Activities；
- `SCHEDULED` Activities 按 startTime 升序；
- `ONGOING` Activities 按 createdAt 倒序。

## 6. Search / filter acceptance

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
- 筛选后仍保留 Upcoming / Ongoing 两个区。

## 7. Activity Detail acceptance

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

## 8. Participation method acceptance

在 Activity Detail 点击：

```text
查看参与方式
```

期望：

- 点击前不突出展示 `participationMethod`；
- 点击后展示完整参与方式；
- 行为记录为 `PARTICIPATION_METHOD_VIEW`；
- 该行为不创建报名关系、不进入“我参与”。

## 9. Publish Activity acceptance

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

## 10. Activity lifecycle acceptance

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

## 11. My initiated Activities acceptance

打开：

```text
/me/activities
```

期望：

- 只展示当前用户发起的 Activities；
- 展示 `PUBLISHED` / `EXPIRED` / `CLOSED` / `DRAFT` 状态；
- 可进入详情；
- 可编辑 `PUBLISHED`；
- 可关闭 `PUBLISHED`。

不期望：

- 展示我参与的；
- 展示我收藏的；
- 展示我查看过联系方式的。

## 12. Manual user feedback

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

## 13. Checklist

### Build

- [ ] Backend `mvn test` passes；
- [ ] Frontend `npm run build` passes。

### Product flow

- [ ] Login works；
- [ ] `/activities` is the post-login entry；
- [ ] Activity Feed has Upcoming / Ongoing；
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
