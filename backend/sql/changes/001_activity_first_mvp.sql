-- Rebaseline activity table for Activity-first MVP.
-- Run after older organization-first migrations when migrating an existing dev database.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chat_room;

DROP TABLE IF EXISTS activity_event;
DROP TABLE IF EXISTS activity;

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
    created_at           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_activity_feed (status, time_mode, expires_at, start_time),
    INDEX idx_activity_category (category),
    INDEX idx_activity_created_by (created_by, created_at),
    CONSTRAINT fk_activity_user
        FOREIGN KEY (created_by) REFERENCES app_user(id)
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

INSERT INTO activity (id, title, description, category, tags, time_mode, start_time, end_time, expires_at, location, participation_method, status, created_by, created_at, updated_at) VALUES
('act-study-001', '周末 Redis 学习小组', '一起把 Redis 缓存、过期策略和项目里的使用场景讲清楚，适合正在做后端项目的同学。', 'STUDY', '后端,Redis,学习小组', 'SCHEDULED', '2026-07-04 14:00:00', '2026-07-04 17:00:00', '2026-07-04 17:00:00', '图书馆三楼讨论室', '加微信 redis-study-2026，备注“Redis学习”。', 'PUBLISHED', 'u-test-001', NOW(3), NOW(3)),
('act-sports-001', '今晚操场慢跑搭子', '配速 6-7 分钟，跑 5 公里左右，主要是找人一起坚持。', 'SPORTS', '跑步,搭子,运动', 'SCHEDULED', '2026-07-01 20:00:00', '2026-07-01 21:00:00', '2026-07-01 21:00:00', '东操场入口', '直接到东操场入口集合，或 QQ 123456789 提前说一声。', 'PUBLISHED', 'u-test-002', NOW(3), NOW(3)),
('act-project-001', '找 2 位同学一起做校园活动发现产品', '想做一个把校园里值得参与的事情持续展示出来的小产品，适合想练全栈/产品工程的同学。', 'PROJECT', '全栈,产品,找队友', 'ONGOING', NULL, NULL, '2026-07-25 23:59:00', '线上 + 咖啡厅讨论', '发邮件到 campus-build@example.com，附一句你想练什么。', 'PUBLISHED', 'u-admin', NOW(3), NOW(3)),
('act-game-001', '独立游戏 Jam 临时组队', '48 小时做一个小原型，美术、程序、策划都欢迎。', 'GAME', 'GameJam,游戏开发,找队友', 'ONGOING', NULL, NULL, '2026-07-20 23:59:00', '线上 Discord', '填写飞书表单：https://example.com/game-jam-team', 'PUBLISHED', 'u-test-001', NOW(3), NOW(3));
