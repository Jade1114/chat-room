# 组织与频道模型草案

## 1. 目标

当前项目主线已经从高校教学协作平台切换为组织中心交流平台。

频道模型也需要从旧的学校/院系/班级/课程频道，调整为组织拥有的默认频道模型。

核心变化：

- 频道不再按 `SCHOOL` / `DEPARTMENT` / `CLASS` / `COURSE` 分类。
- 组织是频道的所有者。
- 用户加入组织后获得该组织默认频道访问权。
- 第一版每个组织只有一个默认频道。
- 模型保留一个组织多频道的扩展空间。

## 2. 核心关系

```text
Organization 1 ── n Channel
Organization 1 ── n OrganizationMember
User         1 ── n OrganizationMember
Organization 1 ── n Activity
Organization 1 ── n InvitationCode
```

第一版中，实际约束为：

```text
一个 Organization 默认只有一个 Channel
Channel.type = DEFAULT
```

## 3. 示例数据

### 3.1 官方组织

```text
org-public-square
name: 公共广场
description: 平台官方维护的默认组织，用于开放交流、组织发现和活动宣传。
visibility: PUBLIC
joinPolicy: OPEN
createdBy: system
```

用户注册后默认成为该组织成员。

### 3.2 示例兴趣组织

```text
org-anime
name: 二次元同好社
description: 动画、漫画、轻小说、虚拟主播相关交流。
tags: 二次元, 动画, 漫画, 虚拟主播
visibility: PUBLIC
joinPolicy: OPEN
```

```text
org-go
name: 围棋社
description: 面向新手和有经验棋友的围棋交流与活动组织。
tags: 围棋, 桌游, 线下活动
visibility: PUBLIC
joinPolicy: OPEN
```

```text
org-game
name: 周末开黑组
description: 周末一起玩多人游戏，组织开黑和攻略讨论。
tags: 游戏, 开黑, 线上活动
visibility: PUBLIC
joinPolicy: OPEN
```

## 4. 推荐字段

### 4.1 Organization

```text
id
name
description
tags
visibility: PUBLIC / PRIVATE / DRAFT / REVIEW（第一版默认 PUBLIC，可先只实现 PUBLIC）
joinPolicy: OPEN / APPROVAL_REQUIRED / INVITE_ONLY（第一版默认 OPEN，可先只实现 OPEN）
createdBy
createdAt
updatedAt
```

### 4.2 OrganizationMember

```text
organizationId
userId
role: ORGANIZER / MEMBER
joinedAt
```

第一版频道访问权从 OrganizationMember 推导：

```text
用户是组织成员 → 用户可以访问该组织默认频道
```

### 4.3 Channel

```text
id
organizationId
name
type: DEFAULT
createdAt
updatedAt
```

第一版不需要 ChannelMember。

未来如果一个组织拥有多个频道，并且频道之间存在不同成员范围，再引入 ChannelMember 或 ChannelPermission。

### 4.4 Activity

```text
id
organizationId
title
description
startTime
locationOrLink
visibility: PUBLIC / MEMBERS_ONLY（第一版可先只实现 PUBLIC）
createdBy
createdAt
updatedAt
```

第一版不需要 ActivityRegistration。

### 4.5 InvitationCode

```text
id
organizationId
code
createdBy
enabled
createdAt
```

第一版申请码绑定组织。

用户使用申请码时：

```text
申请码 → 找到 organizationId → 创建 OrganizationMember → 获得该组织默认频道访问权
```

第一版可不做过期时间、使用次数限制和审核状态。

## 5. 频道访问规则

### 5.1 新用户

新用户注册后：

```text
自动加入 Public Square 官方组织
自动获得 Public Square 默认频道访问权
没有其他组织频道访问权
```

### 5.2 公开组织

第一版公开组织默认可直接加入。

```text
用户在组织大厅/组织详情页点击加入
→ 创建 OrganizationMember
→ 组织出现在左侧已参与组织列表
→ 用户可以进入该组织默认频道
```

### 5.3 申请码加入

```text
用户输入组织申请码
→ 系统校验 InvitationCode.enabled
→ 创建 OrganizationMember
→ 用户可以进入该组织默认频道
```

### 5.4 Organizer

组织创建者自动成为 Organizer。

Organizer 第一版可以：

- 编辑组织资料。
- 发布/编辑/删除活动。
- 查看成员列表。
- 查看或生成申请码。

Organizer 第一版不做：

- 踢人。
- 禁言。
- 转让组织。
- 创建多个子频道。
- 自定义频道权限。
- 配置审核流程。

## 6. API 草案

接口命名可按现有代码风格调整。这里记录产品语义。

### 6.1 获取我的组织

```http
GET /api/my/organizations
```

返回当前用户已加入的组织，以及每个组织的默认频道。

用途：

- 左侧下段已参与组织列表。
- 我的组织页面。
- 我的频道访问权来源。

### 6.2 获取组织大厅

```http
GET /api/organizations?keyword=&tag=
```

返回公开组织卡片列表。

### 6.3 创建组织

```http
POST /api/organizations
```

效果：

```text
创建 Organization
创建默认 Channel
创建创建者的 OrganizationMember(role=ORGANIZER)
可选：创建默认 InvitationCode
```

### 6.4 获取组织详情

```http
GET /api/organizations/{organizationId}
```

返回组织展示信息、公开活动、当前用户成员状态、默认频道入口信息。

### 6.5 加入组织

```http
POST /api/organizations/{organizationId}/join
```

第一版公开组织可直接加入。

### 6.6 通过申请码加入组织

```http
POST /api/organizations/join-by-code
```

请求体包含申请码。

### 6.7 获取频道详情/历史消息

现有频道接口继续使用 `channelId`，但访问校验改为：

```text
channelId → organizationId → OrganizationMember(userId, organizationId)
```

非成员访问组织频道应返回 404 或等价的不可见结果，避免泄露频道存在性。

## 7. WebSocket 规则

WebSocket 消息仍然绑定 `channelId`。

加入频道时：

```text
channelId → organizationId → 校验当前用户是否为 OrganizationMember
```

只有组织成员可以进入该组织默认频道并发送消息。

## 8. 第一阶段落地边界

第一阶段只要求做到：

- 有 Organization。
- 有 OrganizationMember。
- 有 Public Square 官方组织。
- 注册用户默认加入 Public Square。
- 每个组织有一个默认 Channel。
- 用户加入组织后获得默认频道访问权。
- 左侧“我的组织/频道”从 OrganizationMember 推导。
- 现有聊天链路继续能基于 channelId 发送和接收消息。

暂时不要求：

- 多频道组织。
- ChannelMember。
- 活动报名。
- 加入审核。
- 私密组织治理。
- 内容审核。
- 推荐系统。
