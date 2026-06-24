# Deployment Guide: Docker Compose 本机部署

> 当前状态：Phase 1 已验证。
>
> 目标：用 Docker Compose 在本机启动完整 chat-room 系统，并通过 Nginx 统一代理前端、REST API 和 WebSocket。

## 1. 前置条件

需要本机安装并启动：

```bash
docker --version
docker compose version
```

如果 Docker daemon 未启动，macOS 可先打开 Docker Desktop。

## 2. 环境变量

复制示例文件：

```bash
cp .env.deploy.example .env.deploy
```

`.env.deploy` 是本地部署密钥文件，已被 `.gitignore` 忽略，不应提交。

示例变量：

```env
CHAT_ROOM_DB_ROOT_PASSWORD=...
CHAT_ROOM_DB_USERNAME=...
CHAT_ROOM_DB_PASSWORD=...
CHAT_ROOM_RABBITMQ_USERNAME=...
CHAT_ROOM_RABBITMQ_PASSWORD=...
CHAT_ROOM_RABBITMQ_VIRTUAL_HOST=/
```

## 3. 启动

在项目根目录执行：

```bash
docker compose --env-file .env.deploy up -d --build
```

服务：

```text
chat-room-frontend   Nginx + 前端静态资源，暴露 localhost:3000
chat-room-backend    Spring Boot，仅 Docker 内网暴露 8080
chat-room-mysql      MySQL 8.4，仅 Docker 内网暴露 3306
chat-room-redis      Redis 7，仅 Docker 内网暴露 6379
chat-room-rabbitmq   RabbitMQ，管理台暴露 localhost:15673
```

查看状态：

```bash
docker compose --env-file .env.deploy ps
```

## 4. 访问地址

```text
应用入口：http://localhost:3000
REST API：http://localhost:3000/api/...
WebSocket：ws://localhost:3000/ws/chat
RabbitMQ 管理台：http://localhost:15673
```

说明：Phase 1 不直接暴露 backend 的 `8080`，浏览器统一访问 `frontend/Nginx`，由 Nginx 代理：

```text
/api/* -> backend:8080/api/*
/ws/*  -> backend:8080/ws/*
```

这样更接近生产部署，也避免和本机开发后端 `localhost:8080` 冲突。

## 5. 数据库初始化

MySQL 第一次创建 volume 时自动执行：

```text
backend/sql/init/001_schema.sql
backend/sql/init/002_seed.sql
```

初始化包含：

```text
campus_user
user_course
campus_channel
chat_message
user_channel_read_state
```

注意：MySQL 官方镜像只在数据目录为空时执行 `/docker-entrypoint-initdb.d/`。如果要完全重置数据库：

```bash
docker compose --env-file .env.deploy down -v
docker compose --env-file .env.deploy up -d --build
```

## 6. 快速验收

### 6.1 REST API

```bash
curl 'http://localhost:3000/api/channels?userId=u-stu-1'
```

期望：

```text
返回 Yuy 可访问频道
包含 unreadCount 字段
不包含无权限频道 ch-websocket
```

### 6.2 前端

打开：

```text
http://localhost:3000
```

手动验收：

1. 选择 Yuy 学生身份；
2. 能看到频道列表；
3. 切换频道不会断开 workspace；
4. 两个窗口不同用户进入同一频道可以实时聊天；
5. 一个用户在别的频道时，另一频道消息能产生未读；
6. 切回频道后可以看到历史消息，未读清零。

### 6.3 日志

```bash
docker logs chat-room-backend --tail 100
docker logs chat-room-frontend --tail 100
```

后端启动成功应看到：

```text
Started ChatRoomBackendApplication
```

## 7. 停止和清理

停止但保留数据：

```bash
docker compose --env-file .env.deploy down
```

停止并清空 MySQL volume：

```bash
docker compose --env-file .env.deploy down -v
```

## 8. 已验证记录

本机 Phase 1 已验证：

```text
mvn test       -> BUILD SUCCESS
pnpm build     -> ✓ built
docker compose --env-file .env.deploy up -d --build -> services started
curl /api/channels?userId=u-stu-1 -> HTTP 200, unreadCount present
WebSocket smoke -> MESSAGE_ACK / UNREAD_CHANGED / history load / unread clear all passed
backend+frontend restart -> MySQL history persisted
```

Smoke 结果：

```json
{
  "unreadJava": 1,
  "hasUnreadEvent": true,
  "historyHasMessage": true,
  "unreadAfterOpen": 0,
  "yuyAck": true
}
```

## 9. 当前边界

- 还没有 HTTPS / 域名；
- 还没有 CI/CD；
- backend 暂不直接暴露到宿主机；
- Redis 仍按热状态处理，重启后 online 会清空；
- RabbitMQ 管理台映射到 `15673`，避免和本机已有 RabbitMQ 的 `15672` 冲突；
- `.env.deploy.example` 是演示默认值，真实部署必须修改密码。
