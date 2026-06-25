# Product Engineering Map

> 目的：这不是对外包装文案，而是 chat-room 当前可信的产品工程地图。
>
> 这份文档回答：用户是谁、核心问题是什么、当前 MVP 已经做到哪里、还差哪些闭环、下一次大型重构前哪些文档和代码语义必须保持一致。

## 1. 项目命题

chat-room 当前主线是**社团 / 组织持续发现与参与平台**。

它不再是高校教学协作平台，也不是泛用聊天室。学校、课程、班级、作业等概念已经归档为历史方向；当前模型以 Organization、Activity、Membership、Channel 为核心。实时交流是加入组织后的参与能力，不是第一痛点。

一句话概括：

> 用户不必只依赖一年一度的社团招新日，而是可以在任何时候发现组织、了解公开活动、查看主页并加入组织；加入后，再通过组织频道持续交流。

## 2. 核心矛盾

很多社团和兴趣组织的问题不是缺一个聊天窗口，而是曝光和参与窗口过于短暂：一年一度的社团招新日持续时间短，学生当时可能不感兴趣或没空深入了解；过一段时间兴趣出现时，又找不到一个大而全、持续更新的组织资源入口。

因此系统首先要表达：

- 有哪些组织，它们为什么值得了解；
- 组织近期有哪些公开活动，是否仍然活跃；
- 用户是否已经加入组织；
- 未加入时能看到哪些公开信息；
- 加入后能获得哪些参与入口；
- 频道交流如何承接加入后的持续沟通。

所以本项目要解决的问题是：

> 把一次性招新日变成持续可发现、可了解、可加入、可参与的组织入口；实时交流是加入后的增强链路，而不是产品存在的根本理由。

## 3. 当前用户角色

### 3.1 User

平台用户。可以注册、登录，在非招新季也能发现公开组织、查看组织主页和公开活动、加入组织，并在加入后进入自己有权访问的组织频道交流。

### 3.2 Organizer

组织维护者。MVP 语义上负责让组织在招新日之外也保持可见：维护组织资料、公开活动、成员入口和后续交流空间。当前代码只部分支持该角色，完整管理能力仍是 MVP 边界。

### 3.3 Admin

平台级操作者。当前主要用于开发和管理入口，未来可扩展平台治理能力。

## 4. 核心领域对象

详见根目录 `CONTEXT.md`。

当前核心对象：

```text
User
Organization
OrganizationMember / Membership
Channel
Activity
InvitationCode
Organizer
Admin
```

关键建模规则：

- Organization 是核心容器；
- Channel 是 Organization 下的交流载体；
- MVP 中每个 Organization 一个默认 Channel；
- Membership 决定用户是否能访问该 Organization 的默认 Channel；
- Public Square 是平台维护的默认 Organization；
- 新用户注册后默认加入 Public Square；
- 用户口语上说“加入频道”，领域模型里应解释为“加入组织后获得默认频道访问权”。

## 5. 当前 MVP 主链路

当前已经实现或部分实现的主链路：

```text
注册 / 登录
→ 后端签发 JWT
→ 新注册用户自动加入 Public Square
→ 前端恢复当前用户身份
→ 加载公开组织 / 已加入组织
→ 用户查看组织主页、公开活动和频道预览
→ 用户在兴趣出现时加入公开组织
→ 后端创建 OrganizationMember
→ 用户获得该组织默认 Channel access
→ 前端通过 /api/channels 加载当前用户可访问频道
→ 用户进入聊天 workspace
→ WebSocket 通过 token 建立 workspace session
→ 用户切换当前查看 Channel
→ 后端校验 Membership-derived channel access
→ 加载历史消息
→ 用户发送聊天消息
→ 后端以 session 绑定身份覆盖消息身份
→ MySQL 持久化消息
→ Redis 缓存最近消息
→ RabbitMQ 发布并消费消息
→ 后端广播给当前 Channel 的 WebSocket sessions
→ 对未查看该 Channel 的可见用户增加 unread count
→ 前端更新时间线 / 未读 badge / 在线成员
```

这条链路是当前项目最重要的工程证据。

## 6. 当前已实现能力

### 6.1 身份与认证

- 注册；
- 密码登录；
- JWT；
- `/api/auth/me`；
- WebSocket `?token=` 鉴权；
- dev-login 作为本地开发入口；
- 后端不信任聊天消息中的前端 userId。

### 6.2 组织与成员关系

- Public Square 默认组织；
- 注册时自动加入 Public Square；
- 公开组织列表；
- 组织详情；
- 加入公开组织；
- 左侧栏展示已加入组织；
- Channel access 从 OrganizationMember 推导；
- 无权限 Channel detail/history 返回 404。

### 6.3 实时聊天与消息状态

- Workspace WebSocket session；
- 当前查看 Channel 切换；
- 实时聊天；
- 消息 ACK；
- MySQL 消息持久化；
- Redis 最近消息缓存；
- RabbitMQ 分发；
- 历史消息读取。

### 6.4 Presence / Unread

- Redis workspace online；
- Redis session current channel；
- 当前 Channel 在线人数和在线用户；
- 当前查看 Channel 时清除 unread；
- 不在当前 Channel 的可见用户收到 unread 更新。

### 6.5 前端产品壳

- 登录/注册页；
- Dashboard；
- Organization Hall；
- Organization Detail；
- 已加入组织 sidebar；
- ChatWorkspace；
- `/organizations/:organizationId/channels/:channelId` renders real ChatWorkspace under Organization context。

## 7. 当前 MVP 缺口

这些不是“未来幻想”，而是当前组织平台 MVP 尚未闭合的明确缺口。

### 7.1 `/messages` 仍是兼容聊天入口

组织频道 route 已经承载真实 ChatWorkspace：

```text
/organizations/:organizationId/channels/:channelId
```

当前它负责：

- 从 Organization API 加载组织/频道上下文；
- 在 Organization context 下渲染 ChatWorkspace；
- 使用 route channelId 作为初始当前频道；
- 左侧展示当前组织内部 Channels；
- 中间展示对应 Channel 的聊天记录和输入框；
- 右侧展示 Activity records 和 Members / online members；
- 聊天 header 展示 Organization / # Channel。

剩余问题：

```text
/messages
```

仍是兼容聊天入口。后续需要决定它是保留为 workspace shortcut，还是重定向到 Public Square/default Channel。

### 7.2 创建组织链路未完整落地

MVP 需要：

```text
POST /api/organizations
→ 创建 Organization
→ 创建默认 Channel
→ 创建 OrganizationMember(role=ORGANIZER)
→ 新组织出现在 Organization Hall 和已加入组织列表
```

当前文档和 UI 已表达该方向，但代码未形成完整闭环。

### 7.3 Organization Detail 仍有占位数据

当前 Organization Detail 主要有真实 Organization + Channel 数据。

仍缺：

- tags；
- organizer / creator；
- real activities；
- real member preview/list；
- Organizer 操作；
- invitation/application code。

在这些数据接入前，页面不应把占位 Activity/Member 误表达为真实后端能力。

### 7.4 Activity Schedule 尚未真实闭环

Activity 是组织存在感的一部分，但当前尚未形成真实数据与页面闭环。

MVP 最小目标：

- Organization Detail 展示公开 Activity；
- Activity Schedule 有 Discover Activities / My Schedule；
- My Schedule 表示“我加入组织的活动”，不是报名系统。

### 7.5 API 仍有兼容型全局 Channel interface

当前：

```text
GET /api/channels
GET /api/channels/{channelId}
GET /api/channels/{channelId}/messages
```

当前可信解释：

```text
/api/channels = 当前用户可访问的组织频道列表
```

未来可演进为 Organization-scoped interface，但在重构前不要误把它理解为平台全局公开频道目录。

### 7.6 Membership access 规则已可用但 locality 不够

规则目前散落在注册、加入组织、频道列表、详情、历史消息、WebSocket 切换和 unread fanout 中。

下一次大型重构时建议收束为 Membership-derived Channel access module。

## 8. 当前不做

为了保持 MVP 主链路清晰，当前不做：

- 多频道组织；
- ChannelMember；
- ActivityRegistration / RSVP；
- 组织加入审核；
- 私密组织治理；
- 踢人、禁言、封禁；
- 私聊；
- 文件上传；
- 完整通知中心；
- 推荐系统；
- 学校 / 课程 / 班级 / 作业平台方向。

这些功能不是永远不做，而是不能抢在组织、Membership、默认 Channel、活动展示、创建组织和部署交付之前。

## 9. 下一阶段推进顺序

建议顺序：

```text
P0 文档可信度收束
P1 组织频道 route 接入真实 ChatWorkspace
P2 创建组织链路
P3 Organization Detail 去假数据 / 接真实最小 profile
P4 Activity 最小版
P5 本机 Docker Compose + manual acceptance
P6 Membership-derived Channel access module 重构
P7 API contract 组织作用域演进
```

当前这次文档更新属于 P0。

## 10. 文档可信度规则

1. `CONTEXT.md` 只写领域语言，不写实现细节；
2. `docs/api-contract.md` 是当前前后端契约唯一事实源；
3. `docs/manual-acceptance.md` 只验收当前真实能力，不写未来能力；
4. 历史 teaching-platform 文档只能放在 `docs/archive/`；
5. 如果代码尚未实现，文档必须标记为“缺口 / 后续”，不能混成已实现；
6. 下一次大型重构前，先检查这些文档是否仍可信。
