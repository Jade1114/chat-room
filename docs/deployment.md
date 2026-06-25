# Deployment Status

> 当前部署文档的可信入口。部署验收应围绕 Activity-first MVP，而不是旧 Organization / Chat 主链路。

## 1. Current status

项目已有 Docker Compose 本地部署基础，可继续复用：

```text
Browser
→ frontend container / Nginx :80, exposed as host :3000
→ /api/* reverse proxy to backend:8080
→ backend container
→ MySQL container
```

Redis / RabbitMQ may still run because of legacy chat infrastructure, but Activity-first MVP deployment acceptance does not depend on realtime chat, unread, presence, or message fanout.

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

Docker 初始化测试账号密码均为：

```text
123456
```

| username | display name | role | purpose |
| --- | --- | --- | --- |
| `admin` | 平台管理员 | ADMIN | 管理/部署验证 |
| `test001` | 测试用户001 | MEMBER | Activity 发起者 / 浏览者 |
| `test002` | 测试用户002 | MEMBER | 第二浏览者 / 发起者 |

## 4. Local smoke test

登录：

```bash
curl -s -X POST 'http://localhost:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"test001","password":"123456"}'
```

Activity Feed：

```bash
curl -s 'http://localhost:3000/api/activities' \
  -H '<auth header>'
```

浏览器主流程：

```text
login
→ /activities
→ Activity Feed: Upcoming / Ongoing
→ search/filter
→ Activity Detail
→ view participation method
→ /activities/new publish Activity
→ /me/activities see initiated Activities
```

## 5. VPS Phase 2A target

VPS 第一阶段目标：

```text
http://<VPS_IP>:3000
```

这足够证明：

- 项目不是只能本地跑；
- 同学可以通过公网访问并试用；
- Activity-first 主链路能被真实用户反馈验证。

VPS 上建议先开放：

```text
22    SSH
3000  chat-room frontend
```

不要优先开放 MySQL / Redis / RabbitMQ 管理端口给公网。

## 6. VPS deploy commands

```bash
git clone <repo-url> chat-room
cd chat-room
cp .env.deploy.example .env.deploy
```

编辑 `.env.deploy`，至少替换：

```text
CHAT_ROOM_DB_ROOT_PASSWORD
CHAT_ROOM_DB_PASSWORD
CHAT_ROOM_JWT_SECRET
```

如仍启动 RabbitMQ/Redis legacy services，也替换对应密码。

生成 JWT secret：

```bash
openssl rand -base64 48
```

启动：

```bash
docker compose --env-file .env.deploy up -d --build
```

## 7. VPS acceptance

在 VPS 本机：

```bash
curl -s -X POST 'http://127.0.0.1:3000/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":"test001","password":"123456"}'
```

在自己电脑浏览器：

```text
http://<VPS_IP>:3000
```

验收重点：

- 登录成功；
- 默认进入 `/activities`；
- Activity Feed 显示 Upcoming / Ongoing；
- Activity 搜索 / 分类 / 标签可用；
- Activity Detail 可打开；
- 点击后能查看 participationMethod；
- 可以发布 Activity；
- 可以查看我的发布；
- 可以关闭自己发布的 Activity；
- 中文无乱码。

不以以下内容作为当前部署验收重点：

- 组织主页；
- 加入组织；
- 频道聊天；
- WebSocket 实时消息；
- unread / presence。

## 8. Troubleshooting priorities

### Docker image pull fails

国内 VPS 可能拉不动基础镜像。优先配置 Docker mirror。

### Maven / npm dependency download fails

如果构建卡在依赖下载：

- backend 加 Maven mirror；
- frontend 加 npm registry mirror。

### Chinese text mojibake

检查 MySQL charset：

```sql
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME='chat_room';
```

Activity title / description / participationMethod 必须能正确保存中文。

### Domain / HTTPS blocked by ICP

如果使用国内云服务器，域名访问 80/443 可能被 ICP 备案拦截。Phase 2A 先使用：

```text
http://<VPS_IP>:3000
```
