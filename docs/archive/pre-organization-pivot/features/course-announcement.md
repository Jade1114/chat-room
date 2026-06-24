# Feature: 课程通知 / 官方公告

> 来源：Frank 产品型工程师视角下的下一阶段推进
>
> 状态：📌 待实现
>
> 目标：把当前的频道权限、消息持久化、workspace 在线和未读提醒能力，落到一个真实高校协作场景中。

## 1. 产品背景

chat-room 当前已经完成了基础协作主链路：

```text
身份选择
→ 我的频道
→ 权限校验
→ workspace WebSocket
→ 当前频道实时聊天
→ 消息持久化
→ 历史消息恢复
→ 跨频道未读提醒
```

这证明系统不再只是“聊天室 demo”，而是已经具备组织协作系统的基础设施。

下一步不应继续优先堆技术点，而应该回答 Frank 方法里的问题：

```text
这个系统解决了哪个真实用户场景？
```

课程通知 / 官方公告是最自然的下一条产品主线。

## 2. 核心问题

高校教学通知常见链路是：

```text
教师 / 学院发布通知
→ 学委或班委转发
→ QQ 群 / 微信群刷屏
→ 学生自行翻找
```

问题：

- 通知和普通聊天混在一起，容易被淹没；
- 离线学生容易错过；
- 历史通知难以追溯；
- 转发链路增加遗漏和延迟；
- 教师难以确认通知是否触达对应课程 / 班级范围。

系统切入点：

```text
让教师 / 管理员在课程或组织频道内发布正式通知，
让学生即使不在线，也能通过历史消息和未读提醒找回通知。
```

## 3. 用户故事

### 教师

```text
作为教师，
我希望能在我授课的课程频道发布正式通知，
让课程学生即使当时不在线，也能在之后进入频道时看到通知。
```

### 学生

```text
作为学生，
我希望课程频道有新通知时能在频道列表看到未读提醒，
进入频道后能清楚区分“正式通知”和“普通聊天”。
```

### 管理员

```text
作为管理员，
我希望能在学校 / 院系 / 班级频道发布组织级公告，
让对应范围内的用户收到通知。
```

## 4. MVP 边界

### 当前阶段做什么

1. 新增消息类型：`ANNOUNCEMENT`。
2. 教师 / 管理员可以发布公告。
3. 学生可以在有权限的频道看到公告。
4. 公告复用现有消息持久化链路。
5. 公告复用现有历史加载链路。
6. 公告复用现有未读计数链路。
7. 前端用不同样式区分普通聊天和正式通知。
8. 用户进入频道后，公告未读和普通消息未读一样清零。

### 当前阶段不做什么

- 不做富文本编辑器；
- 不做附件上传；
- 不做置顶公告；
- 不做公告编辑 / 撤回；
- 不做已读回执名单；
- 不做审批流程；
- 不做移动端推送；
- 不做通知中心聚合页。

这些能力后续可以扩展，但不进入当前 MVP。

## 5. 权限规则

### 谁可以发布公告

MVP 规则先收束为：

```text
TEACHER 可以在自己有权限访问的 COURSE 频道发布公告
ADMIN 可以在所有自己有权限访问的频道发布公告
STUDENT 不能发布公告
```

如果后续要更真实，可以继续细化：

```text
教师只能在自己授课课程频道发公告
学院管理员只能在本学院频道发公告
学校管理员可以发全校公告
```

但当前项目的权限模型还没有完整“教师授课关系”表，因此 MVP 先采用角色 + 频道可访问权限。

### 谁可以看到公告

沿用现有频道可见性规则：

```text
SCHOOL      → user.school_id 匹配
DEPARTMENT  → user.department_id 匹配
CLASS       → user.class_id 匹配
COURSE      → user_course 中存在订阅关系
ADMIN       → 可访问所有频道
```

没有权限的用户：

```text
频道列表不可见
频道详情 API 返回 404
历史消息 API 返回 404
WebSocket 发布 / 切换到该频道被拒绝
```

## 6. 系统链路

公告可以复用现有消息链路，只是在类型和权限上做区分：

```text
前端发送 ANNOUNCEMENT
→ MessageProcessor 校验 session 已登录
→ 校验 channelId 合法
→ CampusDirectoryService.canAccess(userId, channelId)
→ 校验 user.role 是 TEACHER 或 ADMIN
→ 补齐 userId / displayName / channelId / messageId / sentAt
→ MySQL INSERT chat_message(type=ANNOUNCEMENT)
→ Redis 最近消息缓存
→ RabbitMQ 发布
→ 当前频道 sessions 收到完整 ANNOUNCEMENT
→ 其他可见用户 unreadCount 增加
→ 在线但不在当前频道的用户收到 UNREAD_CHANGED
```

## 7. 涉及文件

### 后端

```text
backend/src/main/java/com/yuy/chatroom/model/MessageType.java
backend/src/main/java/com/yuy/chatroom/service/MessageProcessor.java
backend/src/main/java/com/yuy/chatroom/service/MessageHistoryService.java
backend/src/main/java/com/yuy/chatroom/service/UnreadMessageService.java
backend/src/main/java/com/yuy/chatroom/service/CampusDirectoryService.java
```

可能不需要改表，因为当前 `chat_message.type` 已经能存消息类型。

### 前端

```text
frontend/src/types/chat.ts
frontend/src/hooks/useChatRoom.ts
frontend/src/features/chat/components/MessageComposer.tsx
frontend/src/features/chat/ChatWorkspace.tsx
```

如果后续拆出消息项组件，可以将公告样式下沉到：

```text
MessageItem / TimelineItem
```

## 8. 前端交互草案

### 教师 / 管理员

在输入框附近增加轻量切换：

```text
[普通消息] [发布通知]
```

选择“发布通知”后：

- 输入框 placeholder 改为“发布课程通知...”
- 发送的 message type 为 `ANNOUNCEMENT`
- 发送后恢复普通消息模式或保留当前模式，待实现时决定

### 学生

学生不显示“发布通知”入口。

### 公告消息样式

公告在消息列表中显示为卡片：

```text
┌ 官方通知
│ 发布人：Chen 老师 · Java 后端开发
│ 今天实验课改到 3 号楼 502，请大家提前 10 分钟到。
└
```

视觉上和普通聊天区分：

- 更明显的边框或背景色；
- 标题显示“官方通知”；
- 保留发布人和时间；
- 内容区域更突出。

## 9. 验收标准

### 构建验收

```text
mvn test       → BUILD SUCCESS
pnpm build     → 成功
```

### 权限验收

1. `TEACHER` 在有权限的课程频道发布公告 → 成功。
2. `ADMIN` 在有权限频道发布公告 → 成功。
3. `STUDENT` 尝试发布公告 → 后端拒绝，前端不展示入口。
4. 无权限用户不能通过接口或 WebSocket 在不可访问频道发布公告。

### 消息链路验收

1. 教师在 `ch-java` 发布公告。
2. 当前正在看 `ch-java` 的用户收到完整公告。
3. 正在看其他频道的可见学生收到 `UNREAD_CHANGED`。
4. 学生频道列表 `ch-java.unreadCount` 增加。
5. 学生进入 `ch-java` 后看到公告卡片。
6. 学生进入 `ch-java` 后 unreadCount 清零。
7. 刷新页面后，公告仍能通过历史消息加载出来。

### 数据验收

1. `chat_message` 中存在 `type=ANNOUNCEMENT` 的记录。
2. Redis 最近消息缓存包含公告。
3. 测试数据清理后，smoke 消息不残留。

## 10. 简历 / 面试表达

这一步完成后，项目表达可以从：

```text
实现了 WebSocket 聊天、Redis 在线状态、RabbitMQ 消息队列
```

升级为：

```text
围绕高校课程通知场景，设计并实现了基于组织权限的频道公告能力：教师 / 管理员可发布正式通知，学生离线或切到其他频道时不会丢失，通过消息持久化、历史加载和未读提醒完成通知触达闭环。
```

这是更符合 Frank 产品型工程师路线的表达：

```text
场景 → 流程 → 系统 → 技术 → 验收
```
