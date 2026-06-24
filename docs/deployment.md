# Deployment Status

> 当前部署文档的可信入口。
>
> 历史 deployment 文档已经移动到 `docs/archive/deployment-history/`，其中可能包含旧 teaching-platform / query-userId / school-course channel 示例，不再作为当前部署验收依据。

## Current status

当前项目已经具备适合部署验收的技术链路：

- Spring Boot backend；
- React/Vite frontend；
- MySQL；
- Redis；
- RabbitMQ；
- JWT auth；
- WebSocket chat；
- message persistence；
- unread / presence。

但下一轮正式部署验收前，需要重新制作一份与组织平台模型一致的 Docker Compose / deployment acceptance。

## Target local deployment acceptance

目标是一条命令或一组清晰命令启动本机环境：

```text
MySQL
Redis
RabbitMQ
Backend
Frontend / Nginx
```

并验收：

```text
register/login
→ default Public Square Membership
→ list organizations
→ join public Organization
→ accessible Organization Channels update
→ enter Channel chat
→ send message
→ reload history
→ presence/unread observable
```

## Current deployment gap

当前缺口：

1. 旧 deployment 文档已归档；
2. 新 Docker Compose 验收文档待重新生成；
3. 新验收必须使用 Organization / Membership / Channel 语义；
4. 不再使用 school/course/class channel 示例；
5. 不再把 query `userId` fallback 当作主路径。

## Next document to create

在部署任务开始时，创建或更新：

```text
docs/deployment-local-compose.md
```

建议内容：

- compose services；
- env file template；
- database initialization；
- startup command；
- health checks；
- organization MVP smoke test；
- troubleshooting。
