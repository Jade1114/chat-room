-- Docker Compose init: base schema
-- Keep this file in sync with backend/sql/schema.sql.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS chat_room
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

ALTER DATABASE chat_room
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE chat_room;

CREATE TABLE campus_user (
    id              VARCHAR(32)     PRIMARY KEY,
    username        VARCHAR(32)     NULL UNIQUE     COMMENT '登录用户名（学号/工号）',
    display_name    VARCHAR(64)     NOT NULL,
    password_hash   VARCHAR(255)    NULL            COMMENT 'BCrypt 哈希密码，NULL 表示不可登录的 Mock 用户',
    role            VARCHAR(16)     NOT NULL COMMENT 'STUDENT | TEACHER | ADMIN',
    school_id       VARCHAR(32)     NULL,
    department_id   VARCHAR(32)     NULL,
    class_id        VARCHAR(32)     NULL
) ENGINE=InnoDB;

CREATE TABLE user_course (
    user_id     VARCHAR(32) NOT NULL,
    course_id   VARCHAR(32) NOT NULL,
    PRIMARY KEY (user_id, course_id),
    CONSTRAINT fk_user_course_user
        FOREIGN KEY (user_id) REFERENCES campus_user(id)
) ENGINE=InnoDB;

CREATE TABLE campus_channel (
    id              VARCHAR(32)     PRIMARY KEY,
    name            VARCHAR(64)     NOT NULL,
    type            VARCHAR(16)     NOT NULL COMMENT 'SCHOOL | DEPARTMENT | CLASS | COURSE',
    scope_id        VARCHAR(32)     NOT NULL COMMENT 'organization id this channel belongs to',
    description     VARCHAR(256)    NULL,
    is_readonly     TINYINT(1)      NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE chat_message (
    message_id      VARCHAR(64)     PRIMARY KEY,
    channel_id      VARCHAR(32)     NOT NULL,
    user_id         VARCHAR(32)     NOT NULL,
    display_name    VARCHAR(64)     NOT NULL,
    content         VARCHAR(512)    NOT NULL,
    type            VARCHAR(32)     NOT NULL DEFAULT 'USER_CHAT',
    sent_at         DATETIME(3)     NOT NULL,
    INDEX idx_chat_message_channel_sent_at (channel_id, sent_at, message_id),
    CONSTRAINT fk_chat_message_channel
        FOREIGN KEY (channel_id) REFERENCES campus_channel(id),
    CONSTRAINT fk_chat_message_user
        FOREIGN KEY (user_id) REFERENCES campus_user(id)
) ENGINE=InnoDB;

CREATE TABLE user_channel_read_state (
    user_id          VARCHAR(32)     NOT NULL,
    channel_id       VARCHAR(32)     NOT NULL,
    last_read_at     DATETIME(3)     NOT NULL,
    updated_at       DATETIME(3)     NOT NULL,
    PRIMARY KEY (user_id, channel_id),
    INDEX idx_read_state_channel (channel_id),
    CONSTRAINT fk_read_state_user
        FOREIGN KEY (user_id) REFERENCES campus_user(id),
    CONSTRAINT fk_read_state_channel
        FOREIGN KEY (channel_id) REFERENCES campus_channel(id)
) ENGINE=InnoDB;
