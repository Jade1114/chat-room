# validation-005 organization platform core schema

## Result

基本通过。

这次验收重点不是新增功能，而是确认系统底层概念已经从旧的教学协作模型切换到组织平台模型。

## Checked

### 1. 表结构语义

已确认核心表结构改为组织平台语义：

- `campus_user` 已收束为 `app_user`
- `campus_channel` 已收束为 `organization_channel`
- `user_course` 已移除
- 频道归属字段使用 `organization_id`
- 不再使用旧的 `scope_id` 承载组织含义

当前核心表：

- `app_user`
- `organization`
- `organization_member`
- `organization_channel`
- `chat_message`
- `user_channel_read_state`

### 2. 字符集与中文数据

已确认 schema / init / migration 中核心表统一使用：

```sql
DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

执行 migration 时使用：

```bash
mysql --default-character-set=utf8mb4
```

已验证组织和频道 seed 中的中文数据正常显示，没有出现 `????` 或 mojibake。

### 3. 组织模型主链路

已确认当前主链路为：

```text
app_user
→ organization_member
→ organization
→ organization_channel
```

频道访问权由 `OrganizationMember` 决定，不再由旧的 school / class / course 关系决定。

### 4. API 行为

已做 API smoke：

- `/api/channels` 返回 `organizationId`
- 不再返回 `scopeId`
- 组织成员只能看到自己加入组织的频道
- 非成员直接访问其他组织频道 detail 返回 404
- 非成员直接访问其他组织频道 messages 返回 404
- 新注册用户默认加入 `org-public-square`
- 新注册用户默认只看到 `ch-public-square`

### 5. 前端主链路

已做前端粗验收：

- 可以通过 Docker Compose 启动全服务
- 登录 / 注册 / 主导航 / 消息主链路整体可用
- 主导航已移除旧的“作业”“师生交流”入口
- 前端主链路整体已经转向组织平台语义

## Verification Commands

已执行并通过：

```bash
cd backend
mvn test
```

结果：`BUILD SUCCESS`

```bash
cd frontend
npm run build
```

结果：构建成功。

```bash
git diff --check
```

结果：无输出。

Docker 全服务启动命令：

```bash
docker compose --env-file .env.deploy up -d --build mysql redis rabbitmq backend frontend
```

DB migration 命令：

```bash
docker compose --env-file .env.deploy exec -T mysql sh -c 'mysql --default-character-set=utf8mb4 -uroot -p"$MYSQL_ROOT_PASSWORD"' < backend/sql/migrations/001_rebuild_organization_platform.sql
```

## Notes

这次验收结论是：Phase 1 的表结构重构、字符集修复、组织成员权限主链路已经基本成立。

后续不建议再回到旧教学协作概念上继续包装，而应该基于当前组织平台模型继续推进：

1. Organization Hall
2. Organization Detail
3. Create Organization
4. Join Organization
5. Activity scaffold

## Remaining Boundaries

- 当前 frontend 仍是轻量粗验收状态，UI 细节可以在 Organization Hall 阶段继续打磨。
- 当前 migration 负责旧库迁移，因此 migration 文件中会保留旧表名作为迁移对象，这是合理的。
- 旧 README 可能仍需要后续单独重写为组织平台项目介绍。
