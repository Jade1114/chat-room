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

---

## B-003: `/messages` 路由保留但行为不稳定

**状态**: ✅ 已修复（d8c988d refactor: remove standalone messages route）

**发现日期**: 2026-06-24（从现有已知缺口迁移）

**现象**: 访问 `/messages` 时进入旧版 ChatWorkspace（无组织上下文），但旧组件现在接收了 `initialChannelId` / `organizationContext` 参数。`/messages` 路由没有传这些参数，所以 fallback 到默认值。如果默认 channelId 为空，chat 体验不完整。

**预期**: `/messages` 要么作为 workspace shortcut 正常可用，要么重定向到 Public Square 默认频道。

**关联**: `roadmap.md` Gap 1

---

## B-004: 登录页 JWT 重定向逻辑不对 + 布局 bug

**状态**: ✅ 已修复（c5a5008 fix: navigation bugs B-004, B-005, B-012）

**发现日期**: 2026-06-24

**现象**:

1. 已登录用户（localStorage 有 token）手动输入 `/login` URL → 应该直接跳转到 dashboard，但显示了 login 页面
2. login 页面在已登录状态下渲染时出现布局 bug：左侧侧边栏能显示，右侧又显示了 login 表单

**复现步骤**:

1. 正常登录进入系统
2. 手动在浏览器 URL 输入 `/login`
3. 观察：没有重定向到 dashboard，右侧显示 login 表单，左侧 sidebar 也在

**预期**: 已有 JWT 时访问 `/login` 应直接跳转到 `/dashboard`；未登录状态下 login 页面不应出现 sidebar。

---

## B-005: 点击组织导航后 URL 变化但页面不渲染

**状态**: ✅ 已修复（c5a5008 fix: navigation bugs B-004, B-005, B-012）

**发现日期**: 2026-06-24

**现象**: 在侧边栏或组织发现中心点击组织后，浏览器 URL 正确变化，但页面内容没有更新。必须手动刷新浏览器才能看到正确的组织详情。

**复现步骤**:

1. 进入组织发现中心
2. 点击一个组织卡片
3. 观察：URL 变为 `/organizations/xxx`，但页面区域还是之前的内容
4. F5 刷新后内容正确

**预期**: 导航到组织详情时页面应自动重新渲染。

---

## B-006: Redis session 状态无心跳检测

**状态**: 🔜 下一轮处理（Redis session / 在线状态一致性深入排查）

**发现日期**: 2026-06-24

**现象**: 用户断开 WebSocket 连接后（关闭浏览器或网络中断），Redis 中的 session 状态（`workspace:online`、`channel:viewing`）没有及时清除，导致在线人数显示偏高，或 session 状态残留。

**原因追踪**: `ChannelPresenceService` 只在 `disconnect()` 时清理状态。如果 WS 连接异常断开（非正常 close 流程，如浏览器崩溃、网络断线），`afterConnectionClosed` 可能不被调用。没有心跳检测或 TTL 机制来兜底清除僵尸 session。

**关联**: `known-engineering-concerns.md` — 属于 Redis 状态一致性问题

**补充观察**: 有时候在线成员里会看到浏览器中没有登录的用户；需要确认这是缺少心跳/TTL 兜底，还是 logout、异常断线、多 tab/session 去重、频道 view 切换清理等其他状态一致性问题。

**下一步**: 明天从 B-006 开始，先诊断 `ChannelPresenceService`、WebSocket connect/disconnect 生命周期、Redis key 设计和在线成员查询语义，再决定是否加入 TTL/heartbeat 或调整清理逻辑。

---

## B-007: 创建组织后未立即同步到侧边栏"我的组织"

**状态**: ✅ 已修复（0a8cb4e fix: sync created organization into joined org sidebar）

**发现日期**: 2026-06-24

**现象**: 创建组织成功后页面跳转到新组织详情页，但左侧"我的组织"列表中没有显示新组织。需要手动刷新或重新导航才能看到。

**复现步骤**:

1. 点击"创建组织"，填写信息并提交
2. 页面跳转到新组织详情页
3. 查看左侧"我的组织"列表
4. 观察：新组织不在列表中

**预期**: 创建组织后"我的组织"列表应立即刷新，包含新创建的组织。

---

## B-008: 删除 `/messages` 路由

**状态**: ✅ 已修复（d8c988d refactor: remove standalone messages route）

**发现日期**: 2026-06-24

**现象**: `/messages` 作为旧版兼容路由保留，当前行为不稳定且没有独立的产品意义。组织频道路由 `/organizations/:id/channels/:id` 已是正式入口。

**预期**: 删除 `/messages` 路由，或将其重定向到 Public Square 的默认频道。

**关联**: B-003

---

## B-009: 未读通知应层层传递到侧边栏组织卡片

**状态**: ✅ 已修复（1382889 fix: surface unread counts in organization navigation）

**发现日期**: 2026-06-24

**现象**: 当前未读 badge 只显示在聊天窗口的频道列表中。侧边栏"我的组织"卡片没有显示未读通知，用户需要进入组织才能知道是否有新消息。

**预期**: 未读计数应从 channel → organization 汇总，最终显示在侧边栏"我的组织"对应卡片上（如小数字 badge）。

---

## B-010: 组织名称允许重复

**状态**: ✅ 已修复（61d6e71 fix: prevent duplicate organization names）

**发现日期**: 2026-06-24

**现象**: 可以创建多个同名组织。用户创建组织时没有检测名称是否已被使用。

**预期**: 创建组织时后端应校验组织名称唯一性（至少在同一用户下），或产品层面做展示名称去重。

---

## B-011: 无活动发布入口

**状态**: ✅ 已修复（7924ee4 feat: add organization activity publishing）

**发现日期**: 2026-06-24

**现象**: Activity 数据已有种子数据，但没有提供给 Organizer 的"发布活动"入口。Organizer 无法在前端创建新活动。

**预期**: 组织详情页或管理界面应有"发布活动"按钮，允许 Organizer 创建活动（标题、描述、时间、地点）。

---

## B-012: 侧边栏"我的组织"区域无滚动条

**状态**: ✅ 已修复（c5a5008 fix: navigation bugs B-004, B-005, B-012）

**发现日期**: 2026-06-24

**现象**: 当用户加入大量组织后，左侧 sidebar 的"我的组织"列表会拉长整个页面高度，超出视口的内容无法滚动访问。

**复现步骤**:

1. 加入 8 个以上组织
2. 观察左侧 sidebar："我的组织"区域溢出视口，但整个页面没有滚动条

**预期**: "我的组织"区域应有独立滚动条（`overflow-y-auto`），不影响顶部导航和底部用户菜单。

---

## B-013: 活动发布后未实时同步到其他页面

**状态**: 🟡 待评估（是否进入 MVP fix 取决于实时性要求）

**发现日期**: 2026-06-25

**现象**: Organizer 发布活动后，当前组织详情页会立即显示新活动，但其他已打开的页面（如活动中心、其他用户的组织详情页）不会实时同步，需要刷新或重新加载。

**预期**: 待定。如果活动发布需要具备通知/实时协同属性，可以通过 WebSocket 广播活动变更或前端定时/重新聚焦刷新；如果 MVP 只要求发布后可查询，则当前行为可接受。

## B-014: 非成员在组织主页可点击频道但无法加载聊天

**状态**: ✅ 已修复

**发现日期**: 2026-06-25

**现象**: 用户在组织发现中心点击“查看主页”后，可以在组织主页看到频道、成员、活动；但未加入组织时也能点击频道进入频道页，随后因为没有组织成员权限，聊天信息无法加载。

**复现步骤**:

1. 使用未加入目标组织的用户登录
2. 进入组织发现中心
3. 点击某个未加入组织的“查看主页”
4. 在组织主页点击频道入口
5. 观察：进入频道页后聊天信息无法加载

**预期**: 组织主页应区分公开展示信息和成员权限。未加入组织时只能查看成员人数、公开活动、公开频道信息，并看到“加入组织”按钮；只有加入组织后，才可以进入频道聊天。

---

## B-015: 旧 Dashboard 无法承接 Activity-first MVP

**状态**: 🔜 待处理（Activity-first MVP 重基线后进入实现）

**发现日期**: 2026-06-25

**现象**: 主页偏旧 workspace / organization / channel 入口，新手第一次进入不知道应该做什么，也不方便直接发现值得参与的事情。

**预期**: 登录后默认进入 `/activities`。第一屏应该围绕 Activity-first 主链路：发现事情、发起事情、我的发布，而不是围绕组织频道、未读或聊天工作台。

---

## B-016: 旧 Organization-first 能力缺少退社入口

**状态**: 🧊 已降级（Organization-first 非当前 MVP）

**发现日期**: 2026-06-25

**现象**: 旧组织模型中用户加入组织后缺少“退社 / 离开组织”入口。

**预期**: 如果未来重新启用 Organization / Membership 能力，需要补充离开组织流程。当前 Activity-first MVP 不验收该能力。

---

## B-017: Activity Feed 触发过期状态更新时 SQL 语法错误

**状态**: ✅ 已修复（待提交）

**发现日期**: 2026-06-25

**现象**: 验收 `/activities` 时，后端抛出 `BadSqlGrammarException`。错误 SQL 中出现了字面量 `&lt;`，导致 MySQL 报语法错误。

**复现步骤**:

1. 登录后进入 `/activities`
2. 后端执行 `activityMapper.expireOutdated(now)`
3. 观察后端日志：`near '; ... OR (time_mode = 'ONGOING' AND expires_at &lt;'`

**预期**: `expireOutdated` 应生成合法 SQL，用 `<` 比较过期时间，Activity Feed 正常返回 Upcoming / Ongoing。

**原因追踪**: `ActivityMapper.expireOutdated` 是普通 `@Update` 注解，不是 MyBatis `<script>` XML 片段；这里不应该写 XML entity `&lt;`。`&lt;` 被原样发送给 MySQL，造成 SQL 语法错误。

---

## B-018: 重置数据库后旧 JWT 仍可通过过滤器导致 Activity event 外键失败

**状态**: ✅ 已修复（待提交）

**发现日期**: 2026-06-25

**现象**: 重置本地数据库后，进入 Activity Detail 或点击查看参与方式时，后端抛出 `DataIntegrityViolationException`。错误为 `activity_event.user_id` 外键失败：JWT 中的 `userId` 不存在于当前 `app_user` 表。

**复现步骤**:

1. 浏览器保留旧 `chat_room_token`
2. 本地数据库重置，旧 token 中的用户行被删除
3. 访问 `/activities/:activityId` 或点击“查看参与方式”
4. 后端尝试写入 `activity_event(activity_id, user_id, event_type)`
5. MySQL 拒绝插入不存在的 `user_id`

**预期**: JWT 里的用户如果已经不存在，后端应直接返回 401，让前端清理本地 token 并重新登录；不应该让业务层继续执行到事件日志写入。

**原因追踪**: `JwtAuthFilter` 只校验 token 签名和过期时间，没有验证 token subject 对应的用户仍存在。重置数据库后，旧 token 仍然能把不存在的 `userId` 写入 request attribute，最终触发 `activity_event` 外键错误。
