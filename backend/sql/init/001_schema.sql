-- Docker Compose init: Activity-first MVP schema
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

-- Legacy organization/chat tables remain as reusable infrastructure, but they are not Activity-first MVP acceptance objects.
CREATE TABLE organization (
    id              VARCHAR(32)     PRIMARY KEY,
    name            VARCHAR(64)     NOT NULL,
    description     VARCHAR(512)    NULL,
    visibility      VARCHAR(16)     NOT NULL DEFAULT 'PUBLIC' COMMENT 'PUBLIC | PRIVATE | DRAFT',
    join_policy     VARCHAR(16)     NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN | APPROVAL | INVITE_ONLY',
    created_by      VARCHAR(32)     NULL,
    created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_organization_name (name),
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

CREATE TABLE organization_tag (
    organization_id VARCHAR(32)  NOT NULL,
    tag             VARCHAR(32)  NOT NULL,
    PRIMARY KEY (organization_id, tag),
    INDEX idx_org_tag_org (organization_id),
    CONSTRAINT fk_org_tag_organization
        FOREIGN KEY (organization_id) REFERENCES organization(id)
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

CREATE TABLE activity (
    id                   VARCHAR(32)     PRIMARY KEY,
    title                VARCHAR(128)    NOT NULL,
    description          VARCHAR(2000)   NOT NULL,
    category             VARCHAR(32)     NOT NULL COMMENT 'STUDY | SPORTS | GAME | PROJECT | WORKSHOP | COMPETITION | TRAVEL | TEAM_UP | OTHER',
    tags                 VARCHAR(256)    NOT NULL DEFAULT '',
    time_mode            VARCHAR(16)     NOT NULL COMMENT 'SCHEDULED | ONGOING',
    start_time           DATETIME(3)     NULL,
    end_time             DATETIME(3)     NULL,
    expires_at           DATETIME(3)     NOT NULL,
    location             VARCHAR(128)    NOT NULL,
    participation_method VARCHAR(1000)   NOT NULL,
    status               VARCHAR(16)     NOT NULL DEFAULT 'PUBLISHED' COMMENT 'DRAFT | PUBLISHED | EXPIRED | CLOSED',
    created_by           VARCHAR(32)     NOT NULL,
    created_by_user_id   VARCHAR(32)     NULL,
    created_by_local_session_id VARCHAR(128) NULL,
    created_at           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_activity_feed (status, time_mode, expires_at, start_time),
    INDEX idx_activity_category (category),
    INDEX idx_activity_created_by (created_by, created_at),
    INDEX idx_activity_created_by_user (created_by_user_id, created_at),
    INDEX idx_activity_created_by_local_session (created_by_local_session_id, created_at),
    CONSTRAINT fk_activity_user
        FOREIGN KEY (created_by) REFERENCES app_user(id),
    CONSTRAINT fk_activity_created_by_user
        FOREIGN KEY (created_by_user_id) REFERENCES app_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_update (
    id                      VARCHAR(32)     PRIMARY KEY,
    activity_id             VARCHAR(32)     NOT NULL,
    author_user_id          VARCHAR(32)     NULL,
    author_local_session_id VARCHAR(128)    NULL,
    content                 VARCHAR(800)    NOT NULL,
    created_at              DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_activity_update_activity (activity_id, created_at),
    INDEX idx_activity_update_author_user (author_user_id, created_at),
    INDEX idx_activity_update_author_local_session (author_local_session_id, created_at),
    CONSTRAINT fk_activity_update_activity
        FOREIGN KEY (activity_id) REFERENCES activity(id),
    CONSTRAINT fk_activity_update_author_user
        FOREIGN KEY (author_user_id) REFERENCES app_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_interest (
    id               VARCHAR(32)     PRIMARY KEY,
    activity_id      VARCHAR(32)     NOT NULL,
    user_id          VARCHAR(32)     NULL,
    local_session_id VARCHAR(128)    NULL,
    created_at       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    associated_at    DATETIME(3)     NULL,
    UNIQUE KEY uk_activity_interest_user (activity_id, user_id),
    UNIQUE KEY uk_activity_interest_local_session (activity_id, local_session_id),
    INDEX idx_activity_interest_activity (activity_id, created_at),
    INDEX idx_activity_interest_user (user_id, created_at),
    INDEX idx_activity_interest_local_session (local_session_id, created_at),
    CONSTRAINT fk_activity_interest_activity
        FOREIGN KEY (activity_id) REFERENCES activity(id),
    CONSTRAINT fk_activity_interest_user
        FOREIGN KEY (user_id) REFERENCES app_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE activity_event (
    id              VARCHAR(32)     PRIMARY KEY,
    activity_id     VARCHAR(32)     NOT NULL,
    user_id         VARCHAR(32)     NULL,
    visitor_id      VARCHAR(64)     NULL,
    event_type      VARCHAR(32)     NOT NULL COMMENT 'DETAIL_VIEW | PARTICIPATION_METHOD_VIEW',
    created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_activity_event_activity (activity_id, event_type, created_at),
    INDEX idx_activity_event_user (user_id, created_at),
    INDEX idx_activity_event_visitor (visitor_id, event_type, created_at),
    CONSTRAINT fk_activity_event_activity
        FOREIGN KEY (activity_id) REFERENCES activity(id),
    CONSTRAINT fk_activity_event_user
        FOREIGN KEY (user_id) REFERENCES app_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE site_event (
    id              VARCHAR(32)     PRIMARY KEY,
    visitor_id      VARCHAR(64)     NOT NULL,
    user_id         VARCHAR(32)     NULL,
    event_type      VARCHAR(32)     NOT NULL COMMENT 'SITE_VISIT',
    path            VARCHAR(256)    NOT NULL,
    created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_site_event_visitor (visitor_id, event_type, created_at),
    INDEX idx_site_event_type (event_type, created_at),
    CONSTRAINT fk_site_event_user
        FOREIGN KEY (user_id) REFERENCES app_user(id)
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
