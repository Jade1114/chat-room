# Deployment Status

> 当前部署文档的可信入口。
>
> 历史 deployment 文档已经移动到 `docs/archive/deployment-history/`，其中可能包含旧 teaching-platform / query-userId / school-course channel 示例，不再作为当前部署验收依据。

## 1. Current status

当前项目已经完成本地 Docker Compose 一键部署验证，可以作为 VPS Phase 2A 的基础。

部署链路：

```text
Browser
→ frontend container / Nginx :80, exposed as host :3000
→ /api/* reverse proxy to backend:8080
→ /ws/* reverse proxy to backend WebSocket
→ backend container
→ MySQL / Redis / RabbitMQ containers
```

当前服务：

- Spring Boot backend；
- React/Vite frontend built into Nginx；
- MySQL 8.4；
- Redis 7；
- RabbitMQ management；
- JWT auth；
- WebSocket chat；
- message persistence；
- unread / presence。

## 2. Local Docker Compose

首次启动：

```bash
cp .env.deploy.example .env.deploy

docker compose --env-file .env.deploy up -d --build
```

重置初始化数据：

```bash
docker compose --env-file .env.deploy down -v
docker compose --env-file .env.deploy up -d --build
```

查看状态：

```bash
docker compose --env-file .env.deploy ps
```

浏览器访问：

```text
http://localhost:3000
```

## 3. Seed accounts

Docker 初始化数据内置三个测试账号，密码都是：

```text
123456
```

| username | display name | role | purpose |
| --- | --- | --- | --- |
| `admin` | 平台管理员 | ADMIN | 平台维护和默认数据验证 |
| `test001` | 测试用户001 | MEMBER | 普通用户 / 围棋社组织者视角 |
| `test002` | 测试用户002 | MEMBER | 第二用户 / 二次元同好会组织者视角 |

## 4. Local smoke test

登录：

```bash
curl -s -X POST 'http://localhost:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"test001","password":"123456"}'
```

组织列表：

```bash
JWT='<copy jwt from login response>'
LOGIN_HEADER='<copy the HTTP Authorization header value built from JWT>'

curl -s 'http://localhost:3000/api/organizations' \
  -H "$LOGIN_HEADER"
```

浏览器主流程：

```text
login
→ Public Square
→ Organization Hall
→ Organization Detail
→ Join Organization
→ Enter Channel
→ Send Message
→ Refresh History
```

## 5. VPS Phase 2A target

VPS 第一阶段目标是：

```text
http://<VPS_IP>:3000
```

这足够证明：

- 项目不是只能本地跑；
- Docker Compose 能在服务器上启动完整链路；
- 同学可以通过公网访问并试用；
- 后续 bug 可以来自真实用户反馈。

VPS 上建议先开放：

```text
22    SSH
3000  chat-room frontend
```

不要优先开放 MySQL/RabbitMQ 管理端口给公网。

## 6. VPS deploy commands

在 VPS 上：

```bash
git clone <repo-url> chat-room
cd chat-room
cp .env.deploy.example .env.deploy
```

编辑 `.env.deploy`，至少替换：

```text
CHAT_ROOM_DB_ROOT_PASSWORD
CHAT_ROOM_DB_PASSWORD
CHAT_ROOM_RABBITMQ_PASSWORD
CHAT_ROOM_JWT_SECRET
```

生成 JWT secret：

```bash
openssl rand -base64 48
```

启动：

```bash
docker compose --env-file .env.deploy up -d --build
```

如果是重置测试环境：

```bash
docker compose --env-file .env.deploy down -v
docker compose --env-file .env.deploy up -d --build
```

## 7. VPS acceptance

在 VPS 本机：

```bash
curl -s -X POST 'http://127.0.0.1:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123456"}'
```

在自己电脑浏览器：

```text
http://<VPS_IP>:3000
```

验收重点：

- 三个测试账号都能登录；
- Public Square 能打开；
- 组织发现中心能展示组织；
- 未加入组织时不能进入频道聊天；
- 加入组织后可以进入频道；
- 两个用户能实时聊天；
- 刷新页面后历史消息仍在；
- 中文没有乱码。

## 8. Troubleshooting priorities

### 8.1 Docker image pull fails

国内 VPS 可能拉不动：

```text
mysql:8.4
redis:7-alpine
rabbitmq:3-management
```

优先尝试 Docker mirror；如果 RabbitMQ 反复失败，可以从本机导出 amd64 镜像再传 VPS。

### 8.2 Maven / npm dependency download fails

如果构建卡在依赖下载：

- backend 加 Maven mirror；
- frontend 加 npm registry mirror。

### 8.3 Chinese text mojibake

检查 MySQL charset：

```sql
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME='chat_room';

SELECT name, HEX(name), CHAR_LENGTH(name), LENGTH(name)
FROM organization
WHERE id='org-go-club';
```

`围棋社` 应该是 3 个字符，UTF-8 byte length 为 9。

### 8.4 Domain / HTTPS blocked by ICP

如果使用国内云服务器，域名访问 80/443 可能被 ICP 备案拦截。Phase 2A 先使用：

```text
http://<VPS_IP>:3000
```

等主流程稳定后，再考虑 Caddy / HTTPS / 域名。
