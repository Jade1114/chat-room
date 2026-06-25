-- Delete local chat_room database.
-- 用法：
--   mysql --default-character-set=utf8mb4 -uroot -p < backend/sql/delete/001_drop_database.sql
--
-- 注意：这会删除整个 chat_room 数据库，包括所有表和数据。

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP DATABASE IF EXISTS chat_room;
