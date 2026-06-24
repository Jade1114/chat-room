-- Add activity table for organization activities/events.
-- Run after schema.sql (or 002_organization_tags.sql if migrating).

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

USE chat_room;

CREATE TABLE IF NOT EXISTS activity (
    id              VARCHAR(32)     PRIMARY KEY,
    organization_id VARCHAR(32)     NOT NULL,
    title           VARCHAR(128)    NOT NULL,
    description     VARCHAR(512)    NULL,
    location        VARCHAR(128)    NULL,
    start_time      DATETIME(3)     NOT NULL,
    end_time        DATETIME(3)     NULL,
    visibility      VARCHAR(16)     NOT NULL DEFAULT 'PUBLIC' COMMENT 'PUBLIC | ORGANIZATION',
    created_by      VARCHAR(32)     NOT NULL,
    created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_activity_org (organization_id),
    INDEX idx_activity_time (start_time),
    CONSTRAINT fk_activity_organization
        FOREIGN KEY (organization_id) REFERENCES organization(id),
    CONSTRAINT fk_activity_user
        FOREIGN KEY (created_by) REFERENCES app_user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed activities for existing organizations
INSERT IGNORE INTO activity (id, organization_id, title, description, location, start_time, end_time, visibility, created_by) VALUES
('act-public-square-1', 'org-public-square', '公共广场欢迎会', '欢迎新成员加入 Public Square，了解平台功能。', '线上', '2026-07-01 19:00:00', '2026-07-01 20:30:00', 'PUBLIC', 'u-admin'),
('act-go-club-1', 'org-go-club', '围棋社季度友谊赛', '季度友谊赛，欢迎所有成员参加。', '围棋社活动室', '2026-07-05 14:00:00', '2026-07-05 18:00:00', 'PUBLIC', 'u-yuy'),
('act-go-club-2', 'org-go-club', '新手入门教学', '零基础入门围棋，从规则到基础定式。', '线上', '2026-07-10 15:00:00', '2026-07-10 17:00:00', 'PUBLIC', 'u-yuy'),
('act-anime-club-1', 'org-anime-club', '七月新番推荐会', '一起看七月新番导视，推荐当季佳作。', '二次元同好会频道', '2026-07-03 20:00:00', '2026-07-03 22:00:00', 'PUBLIC', 'u-luna'),
('act-indie-game-lab-1', 'org-indie-game-lab', 'Game Jam 组队会', '寻找队友，组队参加 upcoming Game Jam。', '线上', '2026-07-08 19:00:00', '2026-07-08 21:00:00', 'PUBLIC', 'u-mina');
