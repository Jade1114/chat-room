# Deployment Phase 2B: Domain + HTTPS

> 状态：📌 待执行
>
> 前置：Phase 2A 已通过，当前可通过 `http://<VPS_IP>:3000` 访问。

## 1. 目标

把公网访问从临时形态：

```text
http://<VPS_IP>:3000
```

升级为：

```text
https://<CHAT_ROOM_DOMAIN>
```

并关闭公网 3000，只保留：

```text
22/tcp   SSH
80/tcp   HTTP -> HTTPS challenge / redirect
443/tcp  HTTPS
```

## 2. 推荐架构

```text
Internet
  │
  │ https://<CHAT_ROOM_DOMAIN>
  ▼
Caddy container :80/:443
  │
  ▼
frontend container / Nginx :80
  │
  ├── /api/* -> backend:8080
  └── /ws/*  -> backend:8080 WebSocket
                │
                ├── mysql:3306
                ├── redis:6379
                └── rabbitmq:5672
```

公网暴露：

```text
caddy: 80, 443
```

不公网暴露：

```text
frontend: 80/3000
backend: 8080
mysql: 3306
redis: 6379
rabbitmq: 5672
rabbitmq-management: 15672/15673
```

## 3. DNS

在域名服务商处添加 A 记录：

```text
Type: A
Host: <subdomain>
Value: <VPS_IP>
TTL: default / 600s
```

验证：

```bash
dig +short <CHAT_ROOM_DOMAIN>
# or
nslookup <CHAT_ROOM_DOMAIN>
```

期望输出 VPS IP。

## 4. Compose 改动

新增 `caddy` 服务。

建议把 frontend 从公网 `3000:80` 改成只暴露给本机：

```yaml
frontend:
  ports:
    - "127.0.0.1:3000:80"
```

更生产化的方式是完全不发布 frontend 端口，只让 Caddy 通过 Compose 内部网络访问 `frontend:80`。

Caddy 服务：

```yaml
caddy:
  image: caddy:2-alpine
  container_name: chat-room-caddy
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile:ro
    - caddy_data:/data
    - caddy_config:/config
  depends_on:
    - frontend
  restart: unless-stopped
```

Volumes:

```yaml
volumes:
  mysql_data:
  caddy_data:
  caddy_config:
```

## 5. Caddyfile

```caddyfile
<CHAT_ROOM_DOMAIN> {
  encode gzip

  reverse_proxy frontend:80
}
```

因为 frontend 内部 Nginx 已经负责：

```text
/         -> SPA static files
/api/*    -> backend:8080
/ws/*     -> backend:8080 WebSocket
```

所以 Caddy 只需要把整个站点反代到 frontend。

## 6. VPS 执行顺序

```bash
cd ~/chat-room

git pull origin main

cat > Caddyfile <<'EOF'
<CHAT_ROOM_DOMAIN> {
  encode gzip
  reverse_proxy frontend:80
}
EOF

# edit docker-compose.yml: add caddy, close public frontend 3000

docker compose config --quiet
docker compose up -d --build
```

查看：

```bash
docker compose ps
docker compose logs --tail=100 caddy
```

## 7. 防火墙

VPS UFW：

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw delete allow 3000/tcp
sudo ufw status
```

云厂商安全组：

```text
Allow: 22, 80, 443
Remove/deny: 3000, 15673 unless temporarily debugging
```

## 8. 验收

### HTTPS

```bash
curl -I https://<CHAT_ROOM_DOMAIN>
```

Expected:

```text
HTTP/2 200
```

或 `HTTP/1.1 200` 也可接受。

### HTTP redirect

```bash
curl -I http://<CHAT_ROOM_DOMAIN>
```

Expected:

```text
301 / 308 redirect to https
```

### 3000 closed

```bash
curl -I http://<VPS_IP>:3000 --max-time 5
```

Expected: connection refused / timeout.

### App flow

```text
注册
登录
刷新 session restore
左下角头像退出，localStorage JWT 清理
Admin 页面
课程分配
WebSocket 实时聊天
未读提醒
历史恢复
```

### WebSocket under HTTPS

浏览器 DevTools Network 应看到 WebSocket 使用：

```text
wss://<CHAT_ROOM_DOMAIN>/ws/chat?token=...
```

## 9. 完成标准

Phase 2B 完成标准：

```text
https://<CHAT_ROOM_DOMAIN> 可访问
证书自动签发成功
HTTP 自动跳 HTTPS
公网 3000 已关闭
RabbitMQ 管理台不公网暴露
Auth/Admin/Chat/WebSocket 主链路通过
```
