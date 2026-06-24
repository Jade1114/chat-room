# Deployment Acceptance: Phase 2A VPS

> 状态：✅ 已通过
>
> 目标：验证 chat-room 可以在 VPS 上通过 Docker Compose 完整部署，并通过公网 IP 访问和验收核心链路。

## 1. 部署版本

```text
branch: main
commit: 9d76740 feat: default users to public organization
access: http://<VPS_IP>:3000
mode: VPS Docker Compose, public IP, no HTTPS yet
```

本阶段先不接域名和 HTTPS。Phase 2B 再收束为：

```text
https://chat-room.<domain>
```

## 2. VPS 环境

```text
OS: Ubuntu 20.04.6 LTS (Focal Fossa)
Docker: installed
Docker Compose: installed
```

服务：

```text
frontend  Nginx + static frontend, exposed on 3000
backend   Spring Boot API + WebSocket, internal 8080
mysql     MySQL 8.4, persisted volume
redis     Redis 7, hot state
rabbitmq  RabbitMQ 3 management, AMQP + temporary management console
```

## 3. 通过项

- [x] Docker Compose 构建成功
- [x] MySQL healthy
- [x] Redis healthy
- [x] RabbitMQ healthy
- [x] Backend started
- [x] Frontend started
- [x] Public access through `http://<VPS_IP>:3000`
- [x] Auth registration/login/logout passed
- [x] Logout clears localStorage JWT
- [x] New users default to `school_id = school-1`
- [x] Admin page passed
- [x] Admin organization fields removed
- [x] Course assignment passed
- [x] Chat/WebSocket main chain passed
- [x] History/persistence passed

## 4. Deployment issues encountered

### 4.1 RabbitMQ image pull stuck on VPS

Symptom:

```text
rabbitmq layer repeatedly retrying / waiting during docker pull
```

Resolution:

- Built/exported explicit `linux/amd64` RabbitMQ image from local Mac using Docker buildx.
- Uploaded tarball to VPS with `scp`.
- Loaded with `docker load`.
- Re-tagged to `rabbitmq:3-management` for compose.

Important pitfall:

```text
Apple Silicon Mac defaults to arm64 images.
VPS host is amd64.
The exported image must be linux/amd64.
```

Verification command:

```bash
docker image inspect rabbitmq:3-management --format '{{.Os}}/{{.Architecture}}'
```

Expected:

```text
linux/amd64
```

### 4.2 Maven Central timeout during backend Docker build

Symptom:

```text
Could not transfer artifact org.springframework.boot:spring-boot-starter-parent
from repo.maven.apache.org:443
```

Resolution:

- Added Maven mirror settings at `backend/.mvn/settings.xml`.
- Backend Dockerfile copies settings to `/root/.m2/settings.xml`.
- Maven build uses `mvn -s /root/.m2/settings.xml ...`.

### 4.3 npm registry timeout during frontend Docker build

Symptom:

```text
npm install -g pnpm -> ETIMEDOUT registry.npmjs.org
```

Resolution:

- Frontend Dockerfile configures npm registry to `https://registry.npmmirror.com`.
- Frontend Dockerfile configures pnpm registry to `https://registry.npmmirror.com` before install.

## 5. Phase 2A conclusion

Phase 2A is complete.

This proves the project is no longer only locally runnable. It can be deployed to a real VPS, accessed over the public internet, and manually accepted through the core Auth/Admin/Chat chain.

Remaining productionization work moves to Phase 2B:

```text
Domain
HTTPS
Caddy/Nginx outer reverse proxy
Close public 3000
Hide RabbitMQ management from public internet
Deployment troubleshooting / rollback docs
```
