# Chat Room Frontend (Vue)

独立前端，采用 Vue 3 + Vite。

## 本地运行

```bash
cd frontend
npm install
npm run dev
```

默认地址：`http://localhost:5173`

## 环境变量

复制 `.env.example` 为 `.env.local`，按需修改：

```bash
VITE_WS_URL=ws://localhost:8080/ws/chat
VITE_API_BASE_URL=http://localhost:8080
```

- `VITE_WS_URL`：聊天 WebSocket 地址。
- `VITE_API_BASE_URL`：房间列表/详情 REST API 前缀（会调用 `/api/rooms`）。

前端已按后端当前能力支持：
- 房间大厅列表
- 房间详情（在线人数、用户列表）
- 带 `roomId` 的入房与发言
