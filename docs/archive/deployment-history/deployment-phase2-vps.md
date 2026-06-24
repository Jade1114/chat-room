# Deployment Phase 2: VPS 部署

> 状态：📌 准备执行
>
> 目标：把 Phase 1 已验证的 Docker Compose 本机部署迁移到 VPS，形成一个可公网访问、可验收、可排错的交付版本。

## 1. Phase 2 目标

Phase 1 已经证明：

```text
Browser
→ localhost:3000 frontend/Nginx
→ /api backend
→ /ws backend WebSocket
→ MySQL / Redis / RabbitMQ
```

Phase 2 要证明：

```text
Public Internet
→ domain / VPS public IP
→ HTTPS reverse proxy
→ frontend container
→ backend container
→ MySQL / Redis / RabbitMQ private containers
```

最终访问方式：

```text
https://chat-room.<domain>
```

如果暂时没有域名，则先用：

```text
http://<VPS_PUBLIC_IP>:3000
```

完成公网 smoke test 后，再接域名和 HTTPS。

当前 Phase 2A 已通过，验收记录见：

```text
docs/deployment-phase2a-acceptance.md
```

## 2. 推荐推进顺序

### Step 0：收束本地代码

VPS 部署前，先保证本地仓库有清晰 commit：

```text
退出登录按钮
JWT localStorage 清理
单一公开组织默认注册
Admin 移除组织归属填写
SQL 默认 school-1
```

不要带着未提交改动部署，否则服务器版本和本地版本难以对应。

### Step 1：VPS 基础环境

需要确认：

```text
OS: Ubuntu 22.04 / 24.04 LTS 推荐
CPU: 1-2 vCPU 起步
RAM: 2GB 起步，4GB 更稳
Disk: 20GB+
Ports: 22, 80, 443 必须开放
Optional: 3000, 15673 只建议临时开放验收
```

安装：

```bash
sudo apt update
sudo apt install -y ca-certificates curl git ufw

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

重新登录 SSH 后验证：

```bash
docker --version
docker compose version
```

### Step 2：上传代码

推荐用 GitHub 拉取：

```bash
git clone https://github.com/Jade1114/chat-room.git
cd chat-room
```

如果 VPS 部署分支不是 `main`，需要明确记录：

```bash
git checkout <branch>
git log --oneline -1
```

### Step 3：准备生产环境变量

在 VPS 上创建：

```bash
cp .env.deploy.example .env.deploy
nano .env.deploy
```

必须改掉：

```env
CHAT_ROOM_DB_ROOT_PASSWORD=<strong-password>
CHAT_ROOM_DB_USERNAME=chat_room_app
CHAT_ROOM_DB_PASSWORD=<strong-password>
CHAT_ROOM_RABBITMQ_USERNAME=chat_room
CHAT_ROOM_RABBITMQ_PASSWORD=<strong-password>
CHAT_ROOM_RABBITMQ_VIRTUAL_HOST=/
CHAT_ROOM_JWT_SECRET=<long-random-secret>
```

生成 JWT secret 示例：

```bash
openssl rand -base64 48
```

`.env.deploy` 不提交 Git。

### Step 4：先用公网 IP 跑通 Compose

先复用 Phase 1 的 compose：

```bash
docker compose --env-file .env.deploy up -d --build
```

查看：

```bash
docker compose --env-file .env.deploy ps
docker compose --env-file .env.deploy logs --tail=100 backend frontend
```

如果防火墙临时开放 3000：

```bash
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

浏览器访问：

```text
http://<VPS_PUBLIC_IP>:3000
```

通过后再关闭 3000，改走 80/443。

### Step 5：域名与 HTTPS

推荐使用 Caddy 作为 VPS 外层反向代理，负责自动 HTTPS：

```text
Internet
→ Caddy :80/:443
→ frontend container :80 through localhost/internal port
```

后续可以新增 `docker-compose.prod.yml`：

```text
caddy
frontend
backend
mysql
redis
rabbitmq
```

生产形态建议：

```text
只暴露 80 / 443
RabbitMQ 管理台默认不公网暴露
MySQL / Redis / backend 不公网暴露
frontend 只由 Caddy 访问
```

### Step 6：VPS 验收清单

#### 基础访问

```bash
curl -I http://<VPS_PUBLIC_IP>:3000
```

或 HTTPS 完成后：

```bash
curl -I https://chat-room.<domain>
```

#### Auth

```text
注册新用户
退出登录
刷新后不会恢复旧 token
重新登录成功
/api/auth/me 正常返回 schoolId=school-1
```

#### Admin

```text
ADMIN 登录
AdminPage 可打开
不再出现组织归属填写
可为用户分配课程频道
学生重新登录后可看到课程频道
```

#### Chat 主链路

```text
两个浏览器 / 两个账号
进入不同频道
发送消息
收到 MESSAGE_ACK
另一个用户收到未读提醒
切回频道后历史恢复，未读清零
```

#### 持久化

```bash
docker compose --env-file .env.deploy restart backend frontend
```

确认：

```text
历史消息仍在
用户仍在
课程分配仍在
```

## 3. Phase 2A 验收结果

```text
状态：✅ 已通过
部署版本：9d76740 feat: default users to public organization
访问方式：http://<VPS_IP>:3000
部署环境：Ubuntu 20.04.6 LTS + Docker Compose
```

通过项：

```text
Docker Compose 构建成功
MySQL / Redis / RabbitMQ healthy
Backend / Frontend started
公网 IP:3000 可访问
注册 / 登录 / 退出通过
JWT localStorage 清理通过
新注册用户默认 school_id=school-1
Admin 课程分配通过
WebSocket 聊天主链路通过
历史消息持久化通过
```

部署中遇到并解决的问题：

```text
RabbitMQ 镜像层在 VPS 上反复重试 → 本地 buildx 导出 linux/amd64 镜像，scp 到 VPS，docker load
Maven Central 超时 → backend Docker build 使用 Maven mirror settings
npm registry 超时 → frontend Docker build 使用 npmmirror registry
```

## 4. Phase 2 完成标准

Phase 2 完成不是“容器启动成功”，而是：

```text
公网可访问
HTTPS 可访问，或明确记录暂时仅 IP:3000
注册/登录/退出通过
Admin 课程分配通过
WebSocket 实时聊天通过
历史消息持久化通过
服务器重启后服务可恢复
部署过程有文档和故障记录
```

## 5. 风险与边界

当前 Phase 2 暂不做：

```text
CI/CD 自动发布
数据库备份自动化
日志集中采集
监控告警
多实例扩容
对象存储
```

但要为后续留下方向：

```text
备份 MySQL volume
Caddy 自动 HTTPS
docker compose restart policy
deployment troubleshooting 文档
```

## 6. 需要用户提供的信息

执行远端部署前，需要：

```text
VPS IP
SSH 用户名
SSH 登录方式：密码 / key
VPS OS 版本
是否已有域名
域名 DNS 是否能修改
希望使用的子域名，例如 chat-room.example.com
```

拿到这些信息后，可以开始执行 Phase 2。
