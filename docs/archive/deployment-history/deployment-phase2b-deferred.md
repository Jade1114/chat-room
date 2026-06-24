# Deployment Phase 2B Deferred: Domain + HTTPS

> 状态：⏸️ 暂缓
>
> 结论：当前项目阶段的核心目标是跑通云部署实例；域名 + HTTPS 暂不继续推进。

## 1. 背景

Phase 2A 已完成：

```text
VPS Docker Compose 部署
公网 IP:3000 访问
Auth/Admin/Chat 主链路验收通过
```

原计划 Phase 2B：

```text
https://chat-room.yuysapothecary.com
Caddy 自动 HTTPS
关闭公网 3000
```

实际推进时发现，域名解析到国内阿里云 ECS 后，HTTP 请求被云厂商 ICP 备案墙拦截：

```text
HTTP/1.1 403 Forbidden
Server: Beaver
Non-compliance ICP Filing
```

这说明请求在到达 VPS 上的 Caddy 前，已经被阿里云备案拦截层处理。

## 2. 原因

国内云服务器绑定域名并通过 80/443 对外提供网站访问，通常需要 ICP 备案。

在未备案状态下：

```text
http://chat-room.yuysapothecary.com  -> 403 ICP Filing block
https://chat-room.yuysapothecary.com -> TLS/connection failure
```

Caddy 的 ACME HTTP-01 challenge 也依赖域名 80 端口能正常打到 Caddy，因此未备案会阻塞自动证书签发。

## 3. 当前决策

本项目当前只是一个学习/作品实例，核心目标是证明：

```text
项目可以部署到云服务器
Docker Compose 可运行完整系统
公网可访问并完成核心链路验收
```

这些目标已经由 Phase 2A 完成，因此 Phase 2B 暂不继续推进。

当前保留访问方式：

```text
http://<VPS_IP>:3000
```

## 4. 后续可选路线

### 路线 A：进行 ICP 备案

适合后续正式国内发布。

完成备案后再恢复：

```text
Caddy
80/443
HTTPS
关闭公网 3000
```

### 路线 B：切换海外 / 香港 VPS

适合快速完成域名 + HTTPS 演示。

```text
海外 VPS
DNS A 记录指向海外公网 IP
Caddy 自动 HTTPS
```

### 路线 C：继续使用 Phase 2A

当前选择。

```text
公网 IP:3000
继续推进业务功能和项目证据建设
```

## 5. 如果已经在 VPS 上启动了 Caddy

可以回退到 Phase 2A：

```bash
cd ~/chat-room

docker compose stop caddy 2>/dev/null || true
docker compose rm -f caddy 2>/dev/null || true
```

如果 `frontend` 端口被改成了本机绑定：

```yaml
ports:
  - "127.0.0.1:3000:80"
```

需要改回：

```yaml
ports:
  - "3000:80"
```

然后：

```bash
docker compose up -d
docker compose ps
```

确认：

```bash
curl -I http://<VPS_IP>:3000
```

返回 `200 OK` 即可。

## 6. 当前阶段结论

Phase 2A 已经满足当前项目目的：

```text
云部署跑通
公网可验收
部署问题已复盘
```

Phase 2B 暂缓，等待备案或海外服务器条件成熟后再恢复。
