# chat-room

chat-room 是一个**社团 / 组织持续发现与参与平台**。它不是普通聊天室，也不再以学校、课程、班级、作业作为主产品模型。

当前产品主线：用户不必只依赖一年一度、持续时间很短的社团招新日，而是可以在任何时候发现组织、了解公开活动、查看组织主页、申请或直接加入组织。加入后，频道实时交流用于承接后续沟通，是锦上添花而不是第一痛点。Public Square 是平台维护的默认公共组织，新用户注册后自动加入。

## 项目定位

很多校园社团和兴趣组织的曝光高度依赖一年一度的招新日。招新日持续时间短，信息密度高，学生当时可能不感兴趣、没时间了解，或者过一段时间才突然想加入某个社团，却发现没有一个稳定渠道能查看全校社团资源、公开活动和加入方式。

问题不是“缺一个聊天框”，而是：

- 社团资源只在招新日集中曝光，平时缺少持续发现入口；
- 用户很难在非招新季系统了解有哪些组织、它们近期在做什么、是否还能加入；
- 活动信息分散，组织存在感弱，用户兴趣出现时很难马上转化为参与；
- 成员关系和频道访问权需要可信边界：先了解与加入组织，再进入组织内部交流；
- 聊天、在线状态、未读消息和历史消息是加入后的参与增强，不是项目的第一痛点。

chat-room 的目标是做一个小而完整的组织交流平台：

```text
注册 / 登录
→ 自动加入 Public Square
→ 浏览公开组织资源
→ 查看组织主页和公开活动
→ 在兴趣出现时加入组织
→ 获得该组织默认频道访问权
→ 后续在组织频道中交流
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

## 当前还未完成的 MVP 边界

当前已经可以本地 Docker 一键部署，并支持同学试用主链路。下一阶段更重要的是收集真实使用反馈，而不是继续把范围扩得过大。

仍需明确的边界：

1. 当前每个 Organization 仍以一个默认 Channel 为主，多频道管理不是 MVP 重点；
2. Activity 是轻量发布和展示，不是完整报名 / RSVP / 容量管理系统；
3. 私密组织、审核、邀请制、完整通知中心和文件上传暂不作为当前验收重点；
4. Redis presence / unread 仍有进一步一致性深化空间，先以手动验收和同学反馈发现真实问题；
5. 旧教学平台设计已归档，不再作为当前实现依据。

## 本地运行

### Docker Compose 一键部署

当前推荐先用 Docker Compose 验证完整交付链路：

```bash
cp .env.deploy.example .env.deploy

docker compose --env-file .env.deploy up -d --build
```

如果需要重置初始化数据：

```bash
docker compose --env-file .env.deploy down -v
docker compose --env-file .env.deploy up -d --build
```

浏览器访问：

```text
http://localhost:3000
```

内置测试账号密码均为 `123456`：

```text
admin / 123456
test001 / 123456
test002 / 123456
```

### 本地开发模式

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
npm run build
npm run dev
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

- `docs/classmate-review-guide.md`：给同学试用和快速理解项目的入口，包含用户画像、测试账号、验收流程和反馈格式；
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

> Always-on campus organization discovery and participation platform: students can discover clubs beyond recruitment day, inspect public organization profiles and activities, join organizations through membership, and then continue communication through authenticated organization channels with real-time chat and persisted history.
