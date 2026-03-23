# Chat Room Frontend (Vue)

独立前端，采用 Vue 3 + Vite。

## 本地运行

```bash
cd frontend
npm install
npm run dev
```

默认地址：`http://localhost:5173`

## WebSocket 地址

复制 `.env.example` 为 `.env.local`，按需修改：

```bash
VITE_WS_URL=ws://localhost:8080/ws/chat
```

前端只通过该变量连接，不依赖后端静态资源目录。
