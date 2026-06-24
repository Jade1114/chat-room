# 验收 Bug 记录 · validation-001

> 日期：2026-06-22
> 来源：第一轮 MVP 手动验收

## Bug #1 · 离开频道后收不到该频道消息

**状态**：⬆️ 升级为 Feature

**现象**：离开频道后断开 WebSocket，后端不再往该 session 推送该频道消息，前端无法感知未读。

**根因**：当前后端架构是单频道订阅模型——一个 WebSocket session 同时只绑定一个频道。切频道时 SessionManager 会从旧频道移除，BroadcastDispatcher 只广播给当前频道 sessions。

**需要的后端能力**：

- 消息持久化（Redis List / MySQL）
- 多频道订阅或切频道时拉取历史消息
- 基于持久化消息计算未读数

**当前前端已有基础设施**：

- `channelTimelinesRef` 按频道存储消息
- `unreadChannelsAtom` 未读标记
- ChannelSidebar 红点 UI

**后续规划**：作为 Feature 单独推进，见 `docs/features/message-persistence.md`。

---

## Bug #2 · JOIN/LEAVE 系统消息在前端显示 ✅

**状态**：已修复

**现象**：用户进入/离开频道时 timeline 出现 "xxx进入了当前频道" 等系统消息。

**修复**：`useChatRoom.ts` 的 `handleServerMessage` 中对 `USER_JOIN` / `USER_LEAVE` 不再调用 `pushSystem`，仅用于触发 `refreshChannelDetail` 更新在线成员列表。

**修改文件**：`frontend/src/hooks/useChatRoom.ts`

---

## Bug #3 · 中文输入法回车误触发发送 ✅

**状态**：已修复

**现象**：使用中文输入法时，按回车将拼音转为汉字的同时也会发送消息。

**根因**：`MessageComposer` 的 `handleKeyDown` 只判断了 `event.key === 'Enter'`，未判断是否处于 IME 组合输入状态。

**修复**：改用 `event.nativeEvent.isComposing` 判断。浏览器原生保证 IME 组合输入期间该属性为 `true`，回车只用于选字，不触发发送。

**修改文件**：`frontend/src/features/chat/components/MessageComposer.tsx`

---

## Bug #4 · 小屏幕右侧在线成员不显示 ✅

**状态**：已修复

**现象**：非 2xl 屏幕无法查看在线成员列表。

**修复**：

- `MessageHeader` 右侧增加成员按钮 + 在线数（仅非 2xl 显示）
- 点击后从右侧滑出 overlay 面板展示在线成员
- 2xl+ 屏幕保持原有的固定三栏布局

**修改文件**：

- `frontend/src/features/chat/ChatWorkspace.tsx`
- `frontend/src/features/chat/components/MessageHeader.tsx`
- `frontend/src/features/chat/components/OnlineMemberList.tsx`
- `frontend/src/index.css`

---
