# 频道与身份模型草案

## 1. 目标

把当前聊天室里的临时 `roomId` 模型升级为高校场景下的 `channelId` 模型。

核心变化：

- 用户不再手动输入房间号。
- 用户登录后，后端根据身份返回可访问频道。
- 聊天消息绑定频道，而不是临时房间。
- 频道权限由用户角色和组织归属决定。

## 2. Mock 数据范围

MVP 阶段先使用内存 mock 数据。

### 2.1 学校

```text
school-1: 星河大学
```

### 2.2 院系

```text
dept-cs: 计算机学院
dept-math: 数学学院
```

### 2.3 班级

```text
class-cs-2401: 计科 2401 班
class-cs-2402: 计科 2402 班
class-math-2401: 数学 2401 班
```

### 2.4 课程

```text
course-java: Java 后端开发
course-websocket: 分布式实时通信
course-linear-algebra: 线性代数
```

### 2.5 用户

```text
u-stu-1: Yuy，学生，计算机学院，计科 2401 班，课程：Java 后端开发、分布式实时通信
u-stu-2: Mina，学生，计算机学院，计科 2402 班，课程：Java 后端开发
u-teacher-1: Chen，教师，计算机学院，课程：Java 后端开发、分布式实时通信
u-admin-1: Admin，管理员，星河大学
```

## 3. 频道类型

```text
SCHOOL      全校频道
DEPARTMENT  院系频道
CLASS       班级频道
COURSE      课程频道
```

## 4. 频道示例

```text
ch-school: 全校大厅，SCHOOL，scopeId = school-1
ch-cs: 计算机学院，DEPARTMENT，scopeId = dept-cs
ch-cs-2401: 计科 2401 班，CLASS，scopeId = class-cs-2401
ch-java: Java 后端开发，COURSE，scopeId = course-java
ch-websocket: 分布式实时通信，COURSE，scopeId = course-websocket
```

## 5. 权限规则

### 5.1 学生

学生可访问：

- 所属学校的全校频道。
- 所属院系频道。
- 所属班级频道。
- 自己课程列表里的课程频道。

### 5.2 教师

教师可访问：

- 所属学校的全校频道。
- 所属院系频道。
- 自己授课课程的课程频道。
- 后续可扩展为可访问授课课程关联班级频道。

### 5.3 管理员

管理员可访问：

- 全部频道。

## 6. 后端接口草案

### 6.1 获取当前用户

```http
GET /api/me?userId=u-stu-1
```

MVP 阶段通过 query 参数模拟登录态。

响应：

```json
{
  "id": "u-stu-1",
  "displayName": "Yuy",
  "role": "STUDENT",
  "schoolId": "school-1",
  "departmentId": "dept-cs",
  "classId": "class-cs-2401",
  "courseIds": ["course-java", "course-websocket"]
}
```

### 6.2 获取可访问频道

```http
GET /api/channels?userId=u-stu-1
```

响应：

```json
[
  {
    "id": "ch-school",
    "name": "全校大厅",
    "type": "SCHOOL",
    "description": "星河大学公共频道"
  },
  {
    "id": "ch-cs",
    "name": "计算机学院",
    "type": "DEPARTMENT",
    "description": "计算机学院公共频道"
  }
]
```

### 6.3 获取频道详情

```http
GET /api/channels/{channelId}?userId=u-stu-1
```

响应：

```json
{
  "id": "ch-java",
  "name": "Java 后端开发",
  "type": "COURSE",
  "description": "课程讨论与通知",
  "onlineCount": 3,
  "onlineUsers": ["Yuy", "Chen", "Mina"]
}
```

## 7. WebSocket 消息草案

### 7.1 加入频道

```json
{
  "type": "USER_JOIN",
  "userId": "u-stu-1",
  "channelId": "ch-java",
  "content": "进入了频道"
}
```

### 7.2 发送聊天消息

```json
{
  "type": "USER_CHAT",
  "userId": "u-stu-1",
  "channelId": "ch-java",
  "content": "老师，这次作业什么时候截止？"
}
```

### 7.3 离开频道

```json
{
  "type": "USER_LEAVE",
  "userId": "u-stu-1",
  "channelId": "ch-java",
  "content": "离开了频道"
}
```

## 8. 第一轮落地边界

第一轮只要求做到：

- 后端有 mock 用户。
- 后端有 mock 频道。
- 后端能返回某个用户可访问频道。
- 前端能选择 mock 用户进入系统。
- 前端左侧显示频道列表。
- 点击频道后，聊天消息进入对应频道。

暂时不要求：

- 数据库存储。
- JWT。
- 作业模块。
- 历史消息。
- 复杂成员管理。
