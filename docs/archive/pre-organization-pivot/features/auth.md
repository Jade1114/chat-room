# Auth Feature：注册登录系统

> 状态：设计阶段。
>
> 目标：把 chat-room 从 Mock 身份选择升级为真实注册登录系统，使系统从"演示工具"升级为"可被真实用户使用的协作系统"。

## 1. 产品问题

当前系统使用 Mock 身份选择：

```text
登录页 → 选择一个预置用户（Yuy / Mina / Chen / Admin）
→ 进入 workspace
```

这导致：

- 任何人在浏览器里就能以任意身份进入系统；
- 没有密码保护、没有真实登录态；
- 不能在学校环境或公网被真实使用；
- 对岗位证据来说，缺少 Auth 这个基础能力证明。

## 2. 用户故事

```text
学生：我可以注册账号，用学号和密码登录，系统认得我是谁，我只能看到与自己身份匹配的频道。

教师：我可以用工号和密码登录，系统知道我所属院系和课程，自动匹配可访问频道。

管理员：我登录后可以管理组织结构，添加课程频道，分配用户权限。
```

## 3. MVP 边界

### 要做

```text
✅ 用户注册：用户名（学号/工号）+ 显示名 + 密码
✅ 用户登录：用户名 + 密码 → 返回 JWT
✅ JWT 签发与验证（含 userId, role, displayName）
✅ 密码 BCrypt 哈希存储
✅ 前端 token 持久化（localStorage），刷新不丢
✅ 前端登录态保护：未登录 → /login，已登录 → /dashboard
✅ REST API 全局 JWT 校验
✅ WebSocket 连接 JWT 校验，WORKSPACE_JOIN 不再信任前端传的 userId
✅ USER_CHAT 从 WebSocket session 读真实 userId，不信任前端传值
✅ Dev 开关：开发环境保留 Mock 快捷入口
```

### 不做

```text
❌ 邮箱 / 手机号验证
❌ OAuth / 第三方登录
❌ 角色申请审批（注册默认 STUDENT）
❌ 密码找回 / 重置
❌ 多设备 session 管理
❌ 完整 RBAC 权限系统
❌ 管理员后台用户管理
```

## 4. 系统链路

### 4.1 注册

```text
POST /api/auth/register
Body: { username: "20240101001", displayName: "张三", password: "***" }

后端：
1. 校验 username 唯一
2. BCrypt.hash(password)
3. INSERT campus_user (id=username, display_name, role='STUDENT', password_hash)
4. 签发 JWT（sub=username, role=STUDENT, displayName=显示名）
5. 返回 { token, user }

前端：
1. 存 token 到 localStorage
2. 设置 currentUser
3. navigate /dashboard
```

### 4.2 登录

```text
POST /api/auth/login
Body: { username: "20240101001", password: "***" }

后端：
1. 查 campus_user WHERE username = ?
2. BCrypt.verify(password, password_hash)
3. 签发 JWT
4. 返回 { token, user }

前端：
1. 存 token 到 localStorage
2. 设置 currentUser
3. navigate /dashboard
```

### 4.3 已登录检测

```text
前端 App 启动：
1. 读 localStorage token
2. GET /api/auth/me（Authorization: Bearer ***）

后端 /api/auth/me：
1. 从 JWT 读 userId
2. 查 campus_user
3. 返回 CurrentUser
```

### 4.4 REST 鉴权

```text
所有 /api/** 请求（除 /api/auth/**）：
→ JwtAuthFilter 拦截
→ 从 Authorization header 读 Bearer token
→ 验 JWT
→ 注入 SecurityContext（userId, role）
→ Controller 通过 @CurrentUser 注解获取当前用户
```

### 4.5 WebSocket 鉴权

```text
前端连接：
new WebSocket(`ws://host/ws/chat?token=${token}`)

后端 WebSocketHandler.beforeHandshake：
→ 从 URL query 读 token
→ 验 JWT
→ 把 userId, role, displayName 存入 WebSocket session attributes

MessageProcessor 处理 WORKSPACE_JOIN：
→ 从 session attributes 读真正的 userId，不再信任 message.userId
→ 从 campus_user 查 displayName，不再信任 message.displayName

MessageProcessor 处理 USER_CHAT：
→ 从 session attributes 读真正的 userId
→ 从 campus_user 查 displayName
→ 构造 Message 对象时用查出来的值
```

## 5. 数据库变更

### campus_user 表改动

```sql
ALTER TABLE campus_user
  ADD COLUMN username VARCHAR(32) NULL UNIQUE
    COMMENT '登录用户名（学号/工号）',
  ADD COLUMN password_hash VARCHAR(255) NULL
    COMMENT 'BCrypt 哈希密码，NULL 表示不可登录的 Mock 用户';

-- 给旧用户设 username（用于外键不崩，但 password_hash 为 NULL 不可登录）
UPDATE campus_user SET username = id WHERE username IS NULL;
```

说明：

- 旧 mock 用户 `username = id`，`password_hash = NULL`，不能登录；
- 新注册用户 `username` 唯一，`password_hash` 有值；
- `id` 仍然是主键，`username` 是登录凭证；
- 后续新 `id` 可以改为 UUID。

### 初始化 SQL 同步

```text
backend/sql/schema.sql
backend/sql/init/001_schema.sql
```

### 迁移 SQL

```text
backend/sql/migrations/004_add_auth_columns.sql
```

## 6. 后端新增文件

```text
backend/src/main/java/com/yuy/chatroom/
├── controller/
│   └── AuthController.java          # POST /api/auth/register, /login, GET /api/auth/me
├── dto/
│   ├── LoginRequest.java            # { username, password }
│   ├── RegisterRequest.java         # { username, displayName, password }
│   └── AuthResponse.java            # { token, user }
├── security/
│   ├── JwtTokenProvider.java        # 签发 / 验证 JWT
│   ├── JwtAuthFilter.java           # OncePerRequestFilter，验 Authorization header
│   └── WebSecurityConfig.java       # Spring Security 配置，放行 /api/auth/**
└── annotation/
    └── CurrentUser.java             # @CurrentUser 注解，注入 SecurityContext 中的 userId
```

### 依赖

```xml
<!-- pom.xml -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

### application.yaml 新增配置

```yaml
app:
  jwt:
    secret: ${CHAT_ROOM_JWT_SECRET}
    expiration-ms: 86400000  # 24 小时
```

## 7. 后端修改文件

```text
修改：
├── WebSocketMessageHandler.java     # beforeHandshake 验 JWT
├── MessageProcessor.java            # WORKSPACE_JOIN / USER_CHAT 不再信任前端传值
├── ChannelController.java           # userId 从 SecurityContext 读取，不从 query param
├── CampusUserMapper.java            # 新增 findByUsername
├── pom.xml                          # 加 jjwt 依赖
├── application.yaml                 # 加 jwt 配置
├── .env.example                     # 加 CHAT_ROOM_JWT_SECRET
```

### WebSocketMessageHandler.beforeHandshake

```java
@Override
public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
        WebSocketHandler wsHandler, Map<String, Object> attributes) {
    URI uri = request.getURI();
    String query = uri.getQuery();
    // 从 ?token=xxx 提取 token
    String token = extractToken(query);
    if (token == null || !jwtTokenProvider.validateToken(token)) {
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        return false;
    }
    String userId = jwtTokenProvider.getUserId(token);
    String role = jwtTokenProvider.getRole(token);
    String displayName = jwtTokenProvider.getDisplayName(token);
    attributes.put("userId", userId);
    attributes.put("role", role);
    attributes.put("displayName", displayName);
    return true;
}
```

### MessageProcessor 关键变更

```java
// WORKSPACE_JOIN: userId 从 session attributes 读
String userId = (String) session.getAttributes().get("userId");
String displayName = (String) session.getAttributes().get("displayName");

// USER_CHAT: userId 和 displayName 从 session attributes 读，不从 message 读
Message message = new Message(
    MessageType.USER_CHAT,
    (String) session.getAttributes().get("userId"),    // 真实 userId
    (String) session.getAttributes().get("displayName"), // 真实显示名
    message.getContent(),
    message.getChannelId()
);
```

## 8. 前端新增文件

```text
frontend/src/
├── features/auth/
│   ├── LoginPage.tsx                # 真实登录表单（替换当前 /login）
│   ├── RegisterPage.tsx             # 注册表单
│   └── DevLoginButton.tsx           # Dev 开关：显示 Mock 快捷入口
├── lib/
│   └── authApi.ts                   # fetch wrapper，自动带 Authorization header
├── hooks/
│   └── useAuth.ts                   # 登录、注册、登出、token 管理
└── state/
    └── authAtoms.ts                 # token atom，currentUser 注入逻辑
```

## 9. 前端修改文件

```text
修改：
├── router.tsx                       # 加 /register 路由
├── App.tsx                          # 启动时读 token，调 /api/auth/me
├── hooks/useChatRoom.ts             # WebSocket 连接带 token
├── lib/chatApi.ts                   # 全局请求带 Authorization header
├── layouts/AppShell.tsx             # Dev 开关控制 Mock 入口显示
├── features/workspace/LoginPage.tsx  # 重构为真实登录页
```

### 前端 token 管理

```ts
// authApi.ts
const TOKEN_KEY = 'chat-room-token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// 通用 fetch wrapper
export async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}
```

### WebSocket 连接带 token

```ts
// useChatRoom.ts
const token = getToken();
const socket = new WebSocket(`${wsUrl}?token=${token}`);
```

## 10. Dev 开关设计

```ts
// 环境变量控制
const DEV_MOCK_LOGIN = import.meta.env.VITE_DEV_MOCK_LOGIN === 'true';

// LoginPage 中
{DEV_MOCK_LOGIN && <DevLoginButton />}
```

- 开发环境：`VITE_DEV_MOCK_LOGIN=true`，显示 Mock 快捷入口；
- 生产构建：不设此变量，隐藏 Mock 入口，只显示真实登录表单。

Dev 快捷入口逻辑：

```ts
function devLogin(user: MockUser) {
  // 直接设置 currentUser，不校验密码
  // 仍通过后端签发一个 dev JWT
  const { token, user } = await devLoginApi(user.id);
  setToken(token);
  setCurrentUser(user);
  navigate({ to: '/dashboard' });
}
```

后端提供：

```java
// AuthController
@PostMapping("/api/auth/dev-login")
@Profile("dev")  // 只在 dev profile 可用
public AuthResponse devLogin(@RequestBody DevLoginRequest request) {
    // 为 mock 用户签发 JWT
}
```

---

## 11. 涉及文件总览

### 后端

| 操作 | 文件 |
|------|------|
| 新增 | `AuthController.java` |
| 新增 | `LoginRequest.java` |
| 新增 | `RegisterRequest.java` |
| 新增 | `AuthResponse.java` |
| 新增 | `JwtTokenProvider.java` |
| 新增 | `JwtAuthFilter.java` |
| 新增 | `WebSecurityConfig.java` |
| 新增 | `CurrentUser.java` |
| 新增 | `migrations/004_add_auth_columns.sql` |
| 修改 | `MessageProcessor.java` |
| 修改 | `WebSocketMessageHandler.java` |
| 修改 | `ChannelController.java` |
| 修改 | `CampusUserMapper.java` |
| 修改 | `pom.xml` |
| 修改 | `application.yaml` |
| 修改 | `.env.example` |
| 修改 | `schema.sql` |
| 修改 | `init/001_schema.sql` |

### 前端

| 操作 | 文件 |
|------|------|
| 新增 | `features/auth/LoginPage.tsx` |
| 新增 | `features/auth/RegisterPage.tsx` |
| 新增 | `features/auth/DevLoginButton.tsx` |
| 新增 | `lib/authApi.ts` |
| 新增 | `hooks/useAuth.ts` |
| 修改 | `router.tsx` |
| 修改 | `App.tsx` |
| 修改 | `hooks/useChatRoom.ts` |
| 修改 | `lib/chatApi.ts` |
| 修改 | `layouts/AppShell.tsx` |
| 重构 | `features/workspace/LoginPage.tsx` |

---

## 12. 验收标准

```text
1. 注册：
   - 访问 /login → 点击"注册"
   - 填写学号、显示名、密码
   - 提交后跳转 /dashboard
   - 刷新页面不丢登录态

2. 登录：
   - 用注册的学号 + 密码登录
   - 进入 /dashboard，看到正确频道

3. 已登录保护：
   - 关闭标签页 → 重新打开 → 仍然已登录（不跳转 /login）

4. REST 鉴权：
   - 不带 token 直接 curl /api/channels → 401
   - 带 token → 200，频道列表与用户身份匹配

5. WebSocket 鉴权：
   - 不带 token 连接 WebSocket → 连接被拒
   - 带 token → 连接成功，WORKSPACE_JOIN 生效

6. USER_CHAT 身份安全：
   - 前端恶意改 userId 发消息 → 后端忽略，用真实身份

7. 旧 mock 用户不可登录：
   - 用 Yuy / Mina 等旧身份尝试登录 → 失败

8. Dev 开关：
   - VITE_DEV_MOCK_LOGIN=true → 登录页显示快速 Mock 入口
   - 生产构建 → 不显示 Mock 入口

9. Docker Compose 部署：
   - 注册新用户 → WebSocket 实时聊天 → 历史消息恢复 → 未读提醒 → 全链路正常
```

---

## 13. 明确推迟的内容

```text
- 邮箱 / 手机号验证
- OAuth / 第三方登录
- 角色申请审批流
- 密码找回 / 重置
- Token 黑名单 / 主动失效
- 多设备登录管理
- 管理员用户管理后台
- 组织关系自助绑定
```

## 14. 错误码设计

```text
401 UNAUTHORIZED        token 无效或缺失
409 CONFLICT            username 已存在
400 BAD_REQUEST         参数校验失败
```

## 15. 面试 / 简历表达

完成后可以这样写：

```text
为高校频道协作系统实现了基于 JWT 的注册登录鉴权体系，
包括 BCrypt 密码哈希、REST API 全局 token 校验、
WebSocket 连接级鉴权、前后端身份安全（后端不信任前端传的 userId），
并设计了开发 / 生产环境分离的 Mock 入口开关。
```
