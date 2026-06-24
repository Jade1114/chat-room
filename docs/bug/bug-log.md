# Bug Log

> 轻量 bug 记录，供手动验收和后期 fix 时定位。
>
> 每个 bug 有唯一编号 `B-xxx`，描述当前错误行为，记录发现时的手动验收步骤。
>
> 相关工程优化 / 重构方向见 `docs/known-engineering-concerns.md`。

---

## B-001: 前端 Timeline 未使用历史消息 timeline 缓存

**发现日期**: 2026-06-24

**现象**: 切换频道后，新频道的历史消息和之前频道切换时缓存的旧消息混在一起。因为 `useChatRoom.ts` 的 `channelTimelinesRef` 虽然存了按 channelId 分组的 `TimelineItem[]`，但 `setTimeline` 在 `mergeTimelines` 时会把当前 timeline 和缓存的历史 timeline 合并，旧频道缓存没先清掉就塞了新频道的历史。

**复现步骤**:
1. 进入频道 A → 发几条消息
2. 切换到频道 B
3. 观察 timeline：频道 A 的旧消息可能还在

**预期**: 切换频道时 timeline 应该只展示当前频道的历史消息 + 当前 WS 实时消息。

**关联**: 无

---

## B-002: WebSocket 连接成功后未自动拉取当前频道的历史消息

**发现日期**: 2026-06-24

**现象**: 刷新页面后，WebSocket 重连成功，但 timeline 是空的——没有加载历史消息。需要手动切换一下频道才能触发历史消息加载。

**原因追踪**: `useChatRoom` 的 `connectWorkspace` 在 `onopen` 里发送了 `WORKSPACE_JOIN` 和 `CHANNEL_VIEW_CHANGED`，但没有调用 `loadRecentMessages`。`loadRecentMessages` 只在 `refreshLobby` 里被调用。刷新页面时 `refreshLobby` 依赖的 `selectedChannelId` 可能是空字符串，导致跳过加载。

**复现步骤**:
1. 进入组织频道聊天
2. 刷新页面（F5）
3. 观察：WS 连接成功，但 timeline 空白，没有历史消息

**预期**: WS 重连后自动拉取当前频道最近消息。

**关联**: 无

---

## B-003: `/messages` 路由保留但行为不稳定

**发现日期**: 2026-06-24（从现有已知缺口迁移）

**现象**: 访问 `/messages` 时进入旧版 ChatWorkspace（无组织上下文），但旧组件现在接收了 `initialChannelId` / `organizationContext` 参数。`/messages` 路由没有传这些参数，所以 fallback 到默认值。如果默认 channelId 为空，chat 体验不完整。

**预期**: `/messages` 要么作为 workspace shortcut 正常可用，要么重定向到 Public Square 默认频道。

**关联**: `current-mvp-gap-and-roadmap.md` Gap 1；`known-engineering-concerns.md` 不直接关联

---
