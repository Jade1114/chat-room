# SQL 文件结构

当前 SQL 分为四个部分：

```text
backend/sql/
├── init/       # 初始化：从空数据库创建当前 Activity-first MVP schema（DDL only）
├── dev-seed/   # 本地开发测试数据（Docker override / local dev only）
├── delete/     # 删除：本地开发重置用，删除 chat_room 数据库
└── changes/    # 变动：已有数据库迁移到当前结构时使用
```

## 1. 初始化

用于空数据库或 Docker Compose 首次启动，只创建 schema，不加载测试数据：

```bash
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/init/001_schema.sql
```

生产 / 部署默认只使用：

```text
backend/sql/init/
```

## 2. 本地开发 seed

本地开发或手动验收需要演示数据时再加载：

```bash
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/dev-seed/002_seed.sql
```

## 3. 删除

用于本地开发重置：

```bash
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/delete/001_drop_database.sql
```

注意：这会删除整个 `chat_room` 数据库。

## 4. 变动

用于已有旧数据库迁移到当前 Activity-first MVP：

```bash
mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/changes/001_activity_first_mvp.sql
```

如果是彻底重置本地库，优先使用：

```text
delete/001_drop_database.sql
→ init/001_schema.sql
→ dev-seed/002_seed.sql
```
