# chat-room

chat-room 是一个**组织中心交流平台**。它不是普通聊天室，也不再以学校、课程、班级、作业作为主产品模型。

当前产品主线：用户发现组织、加入组织，并进入自己已加入组织的默认频道进行实时交流。Public Square 是平台维护的默认组织，新用户注册后自动加入。

## 项目定位

很多兴趣组织、校园社团、线上社区和临时活动小组，日常协作仍然散落在 QQ、微信群、朋友圈、表格和口头通知里。问题不是“缺一个聊天框”，而是：

- 组织信息不集中，用户很难判断有哪些组织值得加入；
- 活动信息分散，组织存在感弱；
- 成员关系和频道访问权混在一起，权限不可信；
- 聊天、在线状态、未读消息和历史消息需要真实后端支撑，而不是前端 mock。

chat-room 的目标是做一个小而完整的组织交流平台：

```text
注册 / 登录
→ 自动加入 Public Square
→ 浏览公开组织
→ 加入组织
→ 获得该组织默认频道访问权
→ 在组织频道中实时交流
```

## 当前核心领域模型

详见 `CONTEXT.md`。

第一版核心对象：

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

关键规则：

- Organization 是核心容器；
- Channel 属于 Organization，不是孤立聊天室；
- MVP 中每个 Organization 只有一个默认 Channel；
- Membership 决定用户是否能访问该 Organization 的默认 Channel；
- Public Square 是默认 Organization，而不是特殊的全局频道；
- 新用户注册后默认成为 Public Square 成员；
- 未授权 Channel 不应出现在“我的频道”列表里，直接访问详情或历史消息应返回 404。

## 当前已实现能力

### 身份与认证

- 注册；
- 登录；
- JWT token；
- WebSocket 通过 `?token=` 鉴权；
- dev-login 仅用于本地开发 mock 用户。

### 组织与成员关系

- 公开组织列表；
- 组织详情；
- 加入公开组织；
- 新注册用户自动加入 Public Square；
- 左侧栏展示已加入组织；
- 频道访问权从 OrganizationMember 推导。

### 聊天主链路

- WebSocket 实时聊天；
- 后端使用 session 绑定身份，不信任前端聊天消息中的 userId；
- MySQL 持久化聊天消息；
- Redis 缓存最近消息；
- RabbitMQ 发布/消费聊天消息；
- Redis 维护 workspace 在线状态、当前查看频道和未读计数；
- 频道详情返回在线用户与在线人数；
- 历史消息接口带权限校验。

## 当前还未完成的 MVP 缺口

这些是下一次大型重构前最重要的事实边界：

1. `/organizations/:organizationId/channels/:channelId` 仍是 placeholder，真实聊天暂时还在 `/messages`；
2. 创建组织链路尚未完整落地；
3. Organization Detail 中 Activity、Member、Organizer 操作仍未接入真实后端数据；
4. Activity Schedule 仍未形成真实闭环；
5. `/api/channels` 仍是兼容型全局接口，语义上表示“当前用户可访问的组织频道列表”；
6. 旧教学平台设计已归档，不再作为当前实现依据。

## 本地运行

当前本地开发依赖：

- MySQL
- Redis
- RabbitMQ
- Spring Boot backend
- Vite React frontend

常用命令：

```bash
# backend
cd backend
mvn test
mvn spring-boot:run

# frontend
cd frontend
pnpm build
pnpm dev
```

后端环境变量参考：

```text
backend/.env.example
backend/src/main/resources/application.yaml
```

前端环境变量：

```text
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws/chat
```

## 文档入口

- `CONTEXT.md`：领域词汇表，记录当前产品语言；
- `docs/product-engineering-map.md`：产品工程地图，说明当前 MVP、缺口和推进顺序；
- `docs/current-mvp-gap-and-roadmap.md`：下一次大型重构前的 MVP 缺口和路线图；
- `docs/api-contract.md`：当前可信前后端契约；
- `docs/manual-acceptance.md`：轻量手动验收清单；
- `docs/organization-channel-model.md`：组织与频道模型；
- `docs/features/organization-platform-scope.md`：组织平台范围；
- `docs/design/organization-shell.md`：组织优先 UI 信息架构；
- `docs/adr/`：已接受的关键产品/架构决策；
- `docs/archive/`：历史教学平台设计，仅供追溯。

## 当前项目表达

> Organization-centered communication platform with authenticated membership-based channel access, real-time WebSocket chat, Redis presence/unread state, RabbitMQ fanout, and message persistence.
