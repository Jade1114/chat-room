-- Chat Room: Organization Platform Schema
-- Run this first, then seed.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS chat_room
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

ALTER DATABASE chat_room
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE chat_room;

CREATE TABLE app_user (
    id              VARCHAR(32)     PRIMARY KEY,
    username        VARCHAR(32)     NULL UNIQUE     COMMENT '登录账号',
    display_name    VARCHAR(64)     NOT NULL,
    password_hash   VARCHAR(255)    NULL            COMMENT 'BCrypt password hash; NULL means mock/dev user cannot use password login',
    role            VARCHAR(16)     NOT NULL COMMENT 'MEMBER | ORGANIZER | ADMIN'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE organization (
    id              VARCHAR(32)     PRIMARY KEY,
    name            VARCHAR(64)     NOT NULL,
    description     VARCHAR(512)    NULL,
    visibility      VARCHAR(16)     NOT NULL DEFAULT 'PUBLIC' COMMENT 'PUBLIC | PRIVATE | DRAFT',
    join_policy     VARCHAR(16)     NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN | APPROVAL | INVITE_ONLY',
    created_by      VARCHAR(32)     NULL,
    created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_organization_created_by
        FOREIGN KEY (created_by) REFERENCES app_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE organization_member (
    organization_id VARCHAR(32)     NOT NULL,
    user_id         VARCHAR(32)     NOT NULL,
    role            VARCHAR(16)     NOT NULL DEFAULT 'MEMBER' COMMENT 'MEMBER | ORGANIZER',
    joined_at       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (organization_id, user_id),
    INDEX idx_org_member_user (user_id, organization_id),
    CONSTRAINT fk_org_member_org
        FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT fk_org_member_user
        FOREIGN KEY (user_id) REFERENCES app_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE organization_channel (
    id              VARCHAR(32)     PRIMARY KEY,
    name            VARCHAR(64)     NOT NULL,
    type            VARCHAR(16)     NOT NULL DEFAULT 'ORGANIZATION' COMMENT 'ORGANIZATION',
    organization_id VARCHAR(32)     NOT NULL COMMENT 'owning organization id',
    description     VARCHAR(256)    NULL,
    is_readonly     TINYINT(1)      NOT NULL DEFAULT 0,
    CONSTRAINT fk_channel_organization
        FOREIGN KEY (organization_id) REFERENCES organization(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
        FOREIGN KEY (channel_id) REFERENCES organization_channel(id),
    CONSTRAINT fk_chat_message_user
        FOREIGN KEY (user_id) REFERENCES app_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_channel_read_state (
    user_id          VARCHAR(32)     NOT NULL,
    channel_id       VARCHAR(32)     NOT NULL,
    last_read_at     DATETIME(3)     NOT NULL,
    updated_at       DATETIME(3)     NOT NULL,
    PRIMARY KEY (user_id, channel_id),
    INDEX idx_read_state_channel (channel_id),
    CONSTRAINT fk_read_state_user
        FOREIGN KEY (user_id) REFERENCES app_user(id),
    CONSTRAINT fk_read_state_channel
        FOREIGN KEY (channel_id) REFERENCES organization_channel(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
