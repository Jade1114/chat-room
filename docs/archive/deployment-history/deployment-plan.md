# Deployment Plan: chat-room 可部署 MVP

> 目标：把 chat-room 从“本地能跑的学习项目”推进到“可复现部署、可验收、可排错的交付作品”。
>
> 当前阶段先做 **Docker Compose 本机部署闭环**，稳定后再上 VPS / 域名 / HTTPS。

## 1. 为什么现在做部署

根据 Frank「交付化」思路：

```text
本地能跑，不等于真正交付。
```

chat-room 当前已经具备较完整的系统主链路：

```text
身份选择
→ 我的频道
→ 权限校验
→ workspace WebSocket
→ 实时聊天
→ MySQL 消息持久化
→ Redis 在线 / 当前查看频道 / 未读计数
→ RabbitMQ 消息分发
→ 历史恢复
→ 未读提醒
```

下一阶段应该补足岗位证据中的“交付能力”：

```text
能部署
能排错
能写交付文档
能让别人按说明跑起来并验收
```

因此，当前目标不是继续堆业务功能，而是先形成一个最小可部署闭环。

## 2. 部署目标

### 2.1 Phase 1：本机 Docker Compose 部署

目标：在任意装有 Docker 的机器上，通过一条命令启动完整系统：

```bash
docker compose up -d --build
```

包含服务：

```text
frontend  静态前端 + Nginx
backend   Spring Boot API + WebSocket
mysql     业务数据 / 消息历史 / 读状态
redis     workspace online / 当前查看频道 / 未读热计数
rabbitmq  消息发布与消费
```

本机访问：

```text
Frontend / API / WebSocket: http://localhost:3000
RabbitMQ Management:        http://localhost:15673
Backend:                    仅 Docker 内网暴露 backend:8080
```

说明：Phase 1 暂不把 backend 的 8080 直接暴露到宿主机，统一通过 frontend/Nginx 的 `/api` 和 `/ws` 反向代理访问，避免和本机开发后端端口冲突。

### 2.2 Phase 2：VPS 部署

Phase 1 稳定后，再迁移到服务器：

```text
VPS
→ Docker Compose
→ Nginx / Caddy 反向代理
→ 域名
→ HTTPS
```

目标访问方式：

```text
https://chat-room.<domain>
```

### 2.3 Phase 3：交付文档和复盘

部署闭环完成后补充：

```text
README 部署入口
docs/deployment.md
docs/deployment-acceptance.md
docs/troubleshooting.md
```

## 3. 部署架构

Phase 1 采用单机 Docker Compose：

```text
Browser
  │
  │ http://localhost:3000
  ▼
frontend container / Nginx
  │
  ├── 静态资源：/index.html, /assets/*
  │
  ├── /api/*  ───────────────▶ backend:8080
  │
  └── /ws/*   ───────────────▶ backend:8080 WebSocket
                                │
                                ├── mysql:3306
                                ├── redis:6379
                                └── rabbitmq:5672
```

关键原则：

```text
浏览器只访问 frontend/Nginx
前端通过相对路径访问 /api 和 /ws
Nginx 负责反向代理到 backend
backend 通过 Docker 内部网络访问 mysql / redis / rabbitmq
```

这样可以减少 CORS 问题，也更接近真实部署。

## 4. 计划新增文件

```text
docker-compose.yml
.env.deploy.example
backend/Dockerfile
frontend/Dockerfile
frontend/nginx.conf
docs/deployment.md
docs/deployment-acceptance.md
```

可选整理：

```text
backend/sql/init/001_schema.sql
backend/sql/init/002_seed.sql
backend/sql/init/003_chat_message.sql
backend/sql/init/004_remove_yuy_websocket_course.sql
backend/sql/init/005_user_channel_read_state.sql
```

## 5. 服务设计

### 5.1 MySQL

镜像建议：

```text
mysql:8.4
```

容器名：

```text
chat-room-mysql
```

数据库：

```text
chat_room
```

数据持久化：

```text
mysql_data:/var/lib/mysql
```

初始化脚本：

当前已有：

```text
backend/sql/schema.sql
backend/sql/seed.sql
backend/sql/migrations/001_chat_message.sql
backend/sql/migrations/002_remove_yuy_websocket_course.sql
backend/sql/migrations/003_user_channel_read_state.sql
```

Docker 初始化时需要注意执行顺序。MySQL 官方镜像会按文件名排序执行 `/docker-entrypoint-initdb.d/` 下脚本。

推荐实现方式：

```text
backend/sql/init/
  001_schema.sql
  002_seed.sql
  003_chat_message.sql
  004_remove_yuy_websocket_course.sql
  005_user_channel_read_state.sql
```

注意：初始化脚本只会在 volume 第一次创建时执行。如果要重新初始化，需要删除 volume：

```bash
docker compose down -v
```

### 5.2 Redis

镜像建议：

```text
redis:7-alpine
```

容器名：

```text
chat-room-redis
```

用途：

```text
workspace:online
workspace:user:sessions:{userId}
workspace:session:user:{sessionId}
workspace:session:channel:{sessionId}
channel:viewing:{channelId}
channel:messages:{channelId}
user:unread:{userId}
```

MVP 阶段 Redis 可以不持久化，或使用 volume 方便调试。

建议 Phase 1：

```text
可以不持久化 Redis，把它当热状态缓存。
```

### 5.3 RabbitMQ

镜像建议：

```text
rabbitmq:3-management
```

端口：

```text
5672   AMQP
15672  管理台
```

用途：

```text
WebSocket 收到消息
→ backend publish to RabbitMQ
→ consumer 消费
→ 广播当前频道消息
→ 触发未读计数更新
```

需要通过环境变量设置默认账号密码，不能在提交文件中写真实密码。

### 5.4 Backend

技术栈：

```text
Spring Boot 3.5.x
Java 21
Maven
MyBatis
MySQL / Redis / RabbitMQ
```

Dockerfile 建议采用 multi-stage build：

```text
maven:3-eclipse-temurin-21  构建 jar
eclipse-temurin:21-jre       运行 jar
```

运行命令：

```bash
java -jar app.jar
```

后端环境变量需要从 compose 注入：

```text
CHAT_ROOM_DB_URL=jdbc:mysql://mysql:3306/chat_room?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
CHAT_ROOM_DB_USERNAME=...
CHAT_ROOM_DB_PASSWORD=...
CHAT_ROOM_REDIS_HOST=redis
CHAT_ROOM_REDIS_PORT=6379
CHAT_ROOM_REDIS_PASSWORD=
CHAT_ROOM_RABBITMQ_HOST=rabbitmq
CHAT_ROOM_RABBITMQ_PORT=5672
CHAT_ROOM_RABBITMQ_USERNAME=...
CHAT_ROOM_RABBITMQ_PASSWORD=...
CHAT_ROOM_RABBITMQ_VIRTUAL_HOST=/
```

当前 `application.yaml` 已支持通过环境变量注入配置：

```yaml
spring.config.import: optional:file:.env[.properties]
```

在容器里可以不依赖 `.env` 文件，直接使用 compose environment。

### 5.5 Frontend

技术栈：

```text
React
Vite
TypeScript
Nginx 静态部署
```

Dockerfile 建议采用 multi-stage build：

```text
node:22-alpine  pnpm build
nginx:alpine    serve dist
```

当前前端配置已经调整为：

```text
开发环境：默认连接 http://localhost:8080 和 ws://localhost:8080/ws/chat
部署环境：默认走同源 /api 和 ws(s)://当前 host/ws/chat
```

相关文件：

```text
frontend/src/config.ts
frontend/src/lib/chatApi.ts
```

部署构建时 compose 传入空的 `VITE_API_BASE_URL` / `VITE_WS_URL`，让前端使用同源 Nginx 代理：

```text
/api/* -> backend:8080/api/*
/ws/*  -> backend:8080/ws/*
```

目标：开发环境仍可默认连 `localhost:8080`，部署环境走同源 `/api` 和 `/ws`。

## 6. docker-compose 设计草案

草案结构：

```yaml
services:
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: chat_room
      MYSQL_ROOT_PASSWORD: ${CHAT_ROOM_DB_ROOT_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/sql/init:/docker-entrypoint-initdb.d:ro
    healthcheck: ...

  redis:
    image: redis:7-alpine
    healthcheck: ...

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: ${CHAT_ROOM_RABBITMQ_USERNAME}
      RABBITMQ_DEFAULT_PASS: ${CHAT_ROOM_RABBITMQ_PASSWORD}
    ports:
      - "15673:15672"
    healthcheck: ...

  backend:
    build: ./backend
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    environment:
      CHAT_ROOM_DB_URL: jdbc:mysql://mysql:3306/chat_room?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
      ...

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_BASE_URL: /api
        VITE_WS_URL: /ws/chat
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

## 7. Nginx 设计草案

`frontend/nginx.conf`：

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://backend:8080/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /ws/ {
    proxy_pass http://backend:8080/ws/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
  }
}
```

## 8. 环境变量文件

新增：

```text
.env.deploy.example
```

示例：

```env
CHAT_ROOM_DB_ROOT_PASSWORD=change-me
CHAT_ROOM_DB_USERNAME=root
CHAT_ROOM_DB_PASSWORD=change-me

CHAT_ROOM_RABBITMQ_USERNAME=chatroom
CHAT_ROOM_RABBITMQ_PASSWORD=change-me
```

真实部署时复制：

```bash
cp .env.deploy.example .env.deploy
```

并修改密码。

`.env.deploy` 必须加入 `.gitignore`。

## 9. 本机部署验收标准

### 9.1 构建启动

```bash
docker compose --env-file .env.deploy up -d --build
```

期望：

```text
mysql healthy
redis healthy
rabbitmq healthy
backend running
frontend running
```

### 9.2 REST API 验收

```bash
curl http://localhost:3000/api/channels?userId=u-stu-1
```

期望：

```text
返回 Yuy 可访问频道列表
包含 unreadCount 字段
不包含无权限频道 ch-websocket
```

### 9.3 WebSocket / 前端验收

浏览器打开：

```text
http://localhost:3000
```

验收：

1. 选择 Yuy 学生身份登录；
2. 能看到自己的频道列表；
3. 选择 Chen 教师身份开第二个窗口；
4. 两个用户进入同一频道；
5. 一方发消息，另一方实时收到；
6. 切到其他频道后，未读数能增加；
7. 切回频道后能看到历史消息，未读清零。

### 9.4 数据持久化验收

1. 发送一条测试消息；
2. 重启 backend / frontend：

```bash
docker compose restart backend frontend
```

3. 重新进入频道，消息仍在；
4. 重启所有服务但保留 volume：

```bash
docker compose down
docker compose up -d
```

5. 历史消息仍在。

### 9.5 清理验收

```bash
docker compose down -v
```

期望：

```text
容器停止
network 删除
mysql_data volume 删除
下次启动会重新执行初始化 SQL
```

## 10. 预期风险和排错点

### 10.1 MySQL 初始化顺序

风险：`seed.sql` 依赖 schema；migration 依赖基础表。

处理：将 SQL 复制 / 整理到 `backend/sql/init/` 并用数字前缀保证顺序。

### 10.2 后端早于依赖启动

风险：MySQL / RabbitMQ 未 ready，backend 启动失败。

处理：compose healthcheck + `depends_on.condition: service_healthy`。

### 10.3 前端 WebSocket 地址

风险：Vite build 时写死 `ws://localhost:8080/ws/chat`，部署后浏览器连错地址。

处理：调整 `frontend/src/config.ts`，支持同源 WebSocket 默认值。

### 10.4 CORS / 反向代理

风险：前端从 `localhost:3000` 请求 `localhost:8080` 触发 CORS。

处理：部署环境让前端请求同源 `/api` 和 `/ws`，由 Nginx 代理。

### 10.5 RabbitMQ 默认 guest 限制

风险：`guest/guest` 只适合本机，容器网络或服务器部署中不应使用默认账号。

处理：使用 `.env.deploy` 设置专用账号密码。

### 10.6 Redis 热状态丢失

风险：Redis 重启后 online / unread cache 丢失。

当前语义：

```text
online 是热状态，重启后清空可接受；
unread 可以通过 MySQL read_state + chat_message 重算；
```

后续可增加启动时回填或按频道列表请求懒加载恢复。

## 11. 当前不做的事情

Phase 1 暂不做：

- Kubernetes；
- CI/CD；
- HTTPS；
- 域名；
- 多实例 backend；
- 云数据库；
- 对象存储；
- 日志采集系统；
- Prometheus / Grafana；
- 蓝绿发布。

这些都属于后续交付增强，不进入当前最小可部署 MVP。

## 12. 下一步实施顺序

建议按下面的小步推进：

1. 新增 `.env.deploy.example`。
2. 整理 `backend/sql/init/` 初始化 SQL。
3. 新增 `backend/Dockerfile`。
4. 新增 `frontend/Dockerfile`。
5. 新增 `frontend/nginx.conf`。
6. 调整 `frontend/src/config.ts` 支持同源 `/api` 和 `/ws`。
7. 新增 `docker-compose.yml`。
8. 本机执行 `docker compose up -d --build`。
9. 执行 REST / WebSocket / 未读 / 历史恢复验收。
10. 补 `docs/deployment.md` 和 README 部署入口。

## 13. 完成后的岗位证据表达

部署闭环完成后，chat-room 可以这样表达：

```text
围绕高校频道协作场景，设计并实现了一个支持身份权限、实时通信、消息持久化、workspace 在线状态和未读提醒的系统；使用 Docker Compose 编排 Spring Boot、React/Nginx、MySQL、Redis、RabbitMQ，实现本地一键部署、数据初始化、反向代理和 WebSocket 转发，并沉淀部署验收与排错文档。
```

这对应 Frank 总纲中的能力：

```text
理解场景
能使用工具
能交付结果
能验证质量
能发布作品
能复盘改进
```
