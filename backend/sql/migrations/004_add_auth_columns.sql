-- Add auth columns to campus_user
ALTER TABLE campus_user
  ADD COLUMN username VARCHAR(32) NULL UNIQUE
    COMMENT '登录用户名（学号/工号）',
  ADD COLUMN password_hash VARCHAR(255) NULL
    COMMENT 'BCrypt 哈希密码，NULL 表示不可登录的 Mock 用户';

-- Set username = id for existing mock users (can't login: password_hash is NULL)
UPDATE campus_user SET username = id WHERE username IS NULL;
