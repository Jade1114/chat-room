# Classmate Review Guide

> 给同学、朋友或外部 reviewer 快速理解和试用 chat-room 的入口。重点不是读源码，而是判断：这个平台是否能让人发现值得一起做的事情，并愿意联系发起者真实参与。

## 1. 一句话理解

chat-room 当前是一个 **Activity-first 校园参与平台**。

它想解决的问题不是“缺一个聊天室”，而是：

> 校园里有很多值得一起完成的事情，但它们常常只出现在微信群、朋友圈、招新季或熟人传播里，很快就消失了。

平台希望让每一个“我想做点什么”的念头，更容易找到愿意一起完成的人。

## 2. 当前版本已经能做什么

当前 Activity-first MVP 主链路已经本地手动验收通过：

```text
登录
→ 发现 Activity
→ 搜索 / 分类 / 标签筛选
→ 打开 Activity 详情
→ 查看参与方式
→ 私下联系发起者
→ 发布 Activity
→ 查看我的发布
→ 关闭我发起的 Activity
```

系统会记录两个最小验证事件：

```text
DETAIL_VIEW
PARTICIPATION_METHOD_VIEW
```

它们只用于判断用户是否真的打开详情和查看参与方式，不代表平台内报名关系。

## 3. 你要帮忙验证什么

请不要主要测试聊天。

这次 MVP 只验证：

```text
人是否愿意因为共同兴趣，而主动参与现实中的事情。
```

试用时重点看：

```text
登录
→ 发现事情
→ 搜索 / 筛选
→ 打开详情
→ 查看参与方式
→ 判断是否愿意联系发起者
→ 判断是否愿意自己发布一个 Activity
```

## 4. 当前不会做什么

第一版不验证：

- 社团系统；
- 组织主页；
- 加入组织；
- 实时聊天；
- 评论区；
- 通知中心；
- 平台内报名；
- “我参与的 Activity”；
- 收藏 / 关注 / 好友；
- 图片海报上传；
- Activity 编辑 UI。

如果你觉得“没有聊天”或者“不能直接报名”，这不是 bug，是当前 MVP 边界。

Organization / Channel / Chat 是历史能力，当前前端已降级为 legacy，不在主导航中作为验收入口。

## 5. 测试账号

当前初始化测试账号密码均为：

```text
123456
```

| username | password | 用途 |
| --- | --- | --- |
| `admin` | `123456` | 管理视角 / 默认数据验证 |
| `test001` | `123456` | 普通用户 / 发起者视角 |
| `test002` | `123456` | 另一个普通用户视角 |

## 6. 本地启动

### Docker Compose

```bash
cp .env.deploy.example .env.deploy

docker compose --env-file .env.deploy up -d --build
```

浏览器访问：

```text
http://localhost:3000
```

### 本地开发模式

后端：

```bash
cd backend
mvn -q -DskipTests compile
mvn spring-boot:run
```

前端：

```bash
cd frontend
npm run build
npm run dev
```

通常访问：

```text
http://localhost:5173
```

## 7. 重置本地数据

当前 SQL 目录只保留三类：

```text
backend/sql/init/       初始化
backend/sql/delete/     删除
backend/sql/changes/    变动
```

本地 MySQL 重置：

```bash
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/delete/001_drop_database.sql
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/init/001_schema.sql
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/init/002_seed.sql
```

如果重置后浏览器还保留旧登录态，可以清理：

```js
localStorage.removeItem('chat_room_token')
```

## 8. 15–20 分钟试用流程

### 8.1 登录

使用：

```text
test001 / 123456
```

检查：

- 能否登录；
- 登录后是否进入“发现事情”页面；
- 第一屏是否能理解这个平台是干什么的。

### 8.2 浏览 Activity Feed

检查：

- 是否有“即将发生”和“持续招募”两个 tab；
- tab 数量是否清楚；
- 卡片是否能快速看懂：做什么、什么时候、在哪里、谁发起；
- Activity 是否像“邀请别人一起做事”，而不是普通帖子 / 广告。

### 8.3 搜索和筛选

尝试：

```text
搜索关键词
选择分类
点击标签
```

检查：

- 是否能找到感兴趣的 Activity；
- 分类是否够直观；
- 标签是否帮助判断；
- 筛选后 Upcoming / Ongoing tabs 是否同步变化。

### 8.4 Activity 详情

打开一个感兴趣的 Activity。

检查：

- 描述是否足够判断是否参与；
- 时间、地点是否清楚；
- 发起者是谁是否清楚；
- 是否有明确的“查看参与方式”。

### 8.5 查看参与方式

点击：

```text
查看参与方式
```

检查：

- 参与方式是否清楚；
- 你是否愿意按这个方式联系发起者；
- 如果不愿意，是因为 Activity 不感兴趣、信息不清楚、还是联系方式不可信？

### 8.6 发布 Activity

进入：

```text
发起事情
```

发布一个你真的可能发起的事情，例如：

```text
周五晚羽毛球缺 2 人
找 CSAPP 学习搭子
周末摄影扫街
想组队参加 Hackathon
```

检查：

- 发布表单是否知道怎么填；
- category / tags 是否够用；
- participationMethod 是否足够表达参与方式；
- 发布后是否出现在对应 Feed。

### 8.7 我的发布

进入：

```text
我的发布
```

检查：

- 是否能看到自己发布的 Activity；
- 是否能区分状态；
- 是否能关闭自己发布的 Activity；
- 关闭后的 Activity 是否不再出现在默认 Feed。

## 9. 反馈格式

如果是 bug，请按这个格式反馈：

```text
我用的账号：
我在哪个页面：
我想做什么：
实际发生了什么：
我原本期待什么：
如果是 Activity：标题是什么：
截图 / 录屏：
是否能稳定复现：
```

如果是产品感受，请回答：

```text
有没有看到你想参与的事情？
你会不会点击查看参与方式？
你会不会真的联系发起者？
什么信息会让你更敢参与？
你会不会自己发布一个 Activity？
你会不会下次回来继续找？
```

## 10. 这次试用成功意味着什么

不是消息多。

不是在线人数多。

不是注册人数多。

而是：

```text
有人愿意发布 Activity
有人愿意打开详情
有人愿意查看参与方式
有人愿意私下联系发起者
有人真的参与了现实中的事情
有人愿意下次回来继续找
```

## 11. 后续长期方向

当前不急着恢复 Organization / Chat。后续方向分成两大块。

### 方向 A：调整样式设计

目标是降低第一次使用的理解成本，让页面更像“发现值得一起做的事”，而不是工程功能堆叠。

可能包含：

- Activity card 信息层级优化；
- Feed 首屏视觉改版；
- category / tag 交互优化；
- detail 页面参与动机强化；
- 发布表单更像“发起邀请”，而不是后台表单；
- 移动端布局优化；
- 空状态、错误状态、legacy 提示的视觉统一。

### 方向 B：增加新功能

新功能要从真实反馈出发，不先假设要恢复聊天。

可能包含：

- 发起者 profile / 历史发布；
- Activity 编辑 UI；
- Activity 草稿；
- 收藏 / 个人感兴趣列表（区别于当前已经实现、会反馈给发起者的 Activity Interest）；
- Interest 实时通知：有人表达兴趣后，发起者在线时收到匿名提示；
- 更好的活动质量和推荐排序；
- 后续再重新设计 post-MVP Organization 能力。
