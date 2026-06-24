-- Rebuild old teaching/campus schema into the organization-platform schema.
-- This migration intentionally removes the old table/concept names from the live DB:
-- campus_user -> app_user, campus_channel -> organization_channel, user_course dropped.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS chat_room
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

ALTER DATABASE chat_room
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE chat_room;

DROP PROCEDURE IF EXISTS migrate_table_names_to_organization_platform;
DELIMITER //
CREATE PROCEDURE migrate_table_names_to_organization_platform()
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'campus_user'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'app_user'
    ) THEN
        RENAME TABLE campus_user TO app_user;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'campus_channel'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'organization_channel'
    ) THEN
        RENAME TABLE campus_channel TO organization_channel;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'organization_channel'
          AND column_name = 'scope_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'organization_channel'
          AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE organization_channel RENAME COLUMN scope_id TO organization_id;
    END IF;
END//
DELIMITER ;
CALL migrate_table_names_to_organization_platform();
DROP PROCEDURE IF EXISTS migrate_table_names_to_organization_platform;

DROP TABLE IF EXISTS user_course;

CREATE TABLE IF NOT EXISTS app_user (
    id              VARCHAR(32)     PRIMARY KEY,
    username        VARCHAR(32)     NULL UNIQUE     COMMENT '登录账号',
    display_name    VARCHAR(64)     NOT NULL,
    password_hash   VARCHAR(255)    NULL            COMMENT 'BCrypt password hash; NULL means mock/dev user cannot use password login',
    role            VARCHAR(16)     NOT NULL COMMENT 'MEMBER | ORGANIZER | ADMIN'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organization (
    id              VARCHAR(32)     PRIMARY KEY,
    name            VARCHAR(64)     NOT NULL,
    description     VARCHAR(512)    NULL,
    visibility      VARCHAR(16)     NOT NULL DEFAULT 'PUBLIC' COMMENT 'PUBLIC | PRIVATE | DRAFT',
    join_policy     VARCHAR(16)     NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN | APPROVAL | INVITE_ONLY',
    created_by      VARCHAR(32)     NULL,
    created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_organization_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organization_member (
    organization_id VARCHAR(32)     NOT NULL,
    user_id         VARCHAR(32)     NOT NULL,
    role            VARCHAR(16)     NOT NULL DEFAULT 'MEMBER' COMMENT 'MEMBER | ORGANIZER',
    joined_at       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (organization_id, user_id),
    INDEX idx_org_member_user (user_id, organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organization_channel (
    id              VARCHAR(32)     PRIMARY KEY,
    name            VARCHAR(64)     NOT NULL,
    type            VARCHAR(16)     NOT NULL DEFAULT 'ORGANIZATION' COMMENT 'ORGANIZATION',
    organization_id VARCHAR(32)     NOT NULL COMMENT 'owning organization id',
    description     VARCHAR(256)    NULL,
    is_readonly     TINYINT(1)      NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_message (
    message_id      VARCHAR(64)     PRIMARY KEY,
    channel_id      VARCHAR(32)     NOT NULL,
    user_id         VARCHAR(32)     NOT NULL,
    display_name    VARCHAR(64)     NOT NULL,
    content         VARCHAR(512)    NOT NULL,
    type            VARCHAR(32)     NOT NULL DEFAULT 'USER_CHAT',
    sent_at         DATETIME(3)     NOT NULL,
    INDEX idx_chat_message_channel_sent_at (channel_id, sent_at, message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_channel_read_state (
    user_id          VARCHAR(32)     NOT NULL,
    channel_id       VARCHAR(32)     NOT NULL,
    last_read_at     DATETIME(3)     NOT NULL,
    updated_at       DATETIME(3)     NOT NULL,
    PRIMARY KEY (user_id, channel_id),
    INDEX idx_read_state_channel (channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE app_user CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE organization CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE organization_member CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE organization_channel CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE chat_message CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE user_channel_read_state CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE app_user
    MODIFY username VARCHAR(32) NULL COMMENT '登录账号',
    MODIFY role VARCHAR(16) NOT NULL COMMENT 'MEMBER | ORGANIZER | ADMIN';

UPDATE app_user SET role = 'MEMBER' WHERE role IN ('STUDENT', 'TEACHER');

DELETE read_state
FROM user_channel_read_state read_state
LEFT JOIN organization_channel channel ON channel.id = read_state.channel_id
WHERE channel.id IS NULL OR channel.type <> 'ORGANIZATION';

DELETE message
FROM chat_message message
LEFT JOIN organization_channel channel ON channel.id = message.channel_id
WHERE channel.id IS NULL OR channel.type <> 'ORGANIZATION';

DELETE FROM organization_channel WHERE type <> 'ORGANIZATION';

INSERT IGNORE INTO app_user (id, display_name, role) VALUES
('u-yuy', 'Yuy', 'MEMBER'),
('u-mina', 'Mina', 'MEMBER'),
('u-luna', 'Luna', 'MEMBER'),
('u-admin', 'Platform Admin', 'ADMIN');

INSERT IGNORE INTO organization (id, name, description, visibility, join_policy, created_by, created_at) VALUES
('org-public-square', 'Public Square', '平台维护的公共广场，用于开放交流、组织发现和活动推广。', 'PUBLIC', 'OPEN', NULL, NOW(3)),
('org-go-club', '围棋社', '围棋爱好者组织，定期组织对局、复盘和新手教学。', 'PUBLIC', 'OPEN', 'u-yuy', NOW(3)),
('org-anime-club', '二次元同好会', '围绕番剧、同人创作和线下观影活动形成的兴趣组织。', 'PUBLIC', 'OPEN', 'u-luna', NOW(3)),
('org-indie-game-lab', '独立游戏实验室', '一起做小型游戏原型、试玩反馈和线上 Game Jam 的创作组织。', 'PUBLIC', 'OPEN', 'u-mina', NOW(3));

UPDATE organization
SET name = 'Public Square',
    description = '平台维护的公共广场，用于开放交流、组织发现和活动推广。',
    visibility = 'PUBLIC',
    join_policy = 'OPEN'
WHERE id = 'org-public-square';

UPDATE organization
SET name = '围棋社',
    description = '围棋爱好者组织，定期组织对局、复盘和新手教学。',
    visibility = 'PUBLIC',
    join_policy = 'OPEN',
    created_by = 'u-yuy'
WHERE id = 'org-go-club';

UPDATE organization
SET name = '二次元同好会',
    description = '围绕番剧、同人创作和线下观影活动形成的兴趣组织。',
    visibility = 'PUBLIC',
    join_policy = 'OPEN',
    created_by = 'u-luna'
WHERE id = 'org-anime-club';

UPDATE organization
SET name = '独立游戏实验室',
    description = '一起做小型游戏原型、试玩反馈和线上 Game Jam 的创作组织。',
    visibility = 'PUBLIC',
    join_policy = 'OPEN',
    created_by = 'u-mina'
WHERE id = 'org-indie-game-lab';

INSERT IGNORE INTO organization_member (organization_id, user_id, role, joined_at) VALUES
('org-public-square', 'u-yuy', 'MEMBER', NOW(3)),
('org-public-square', 'u-mina', 'MEMBER', NOW(3)),
('org-public-square', 'u-luna', 'MEMBER', NOW(3)),
('org-public-square', 'u-admin', 'ORGANIZER', NOW(3)),
('org-go-club', 'u-yuy', 'ORGANIZER', NOW(3)),
('org-anime-club', 'u-luna', 'ORGANIZER', NOW(3)),
('org-indie-game-lab', 'u-mina', 'ORGANIZER', NOW(3));

INSERT IGNORE INTO organization_channel (id, name, type, organization_id, description, is_readonly) VALUES
('ch-public-square', 'Public Square', 'ORGANIZATION', 'org-public-square', '公共广场默认频道：闲聊、组织宣传和活动预告。', 0),
('ch-go-club', '围棋社默认频道', 'ORGANIZATION', 'org-go-club', '围棋社成员交流、约棋和复盘讨论。', 0),
('ch-anime-club', '二次元同好会默认频道', 'ORGANIZATION', 'org-anime-club', '番剧讨论、观影活动和创作分享。', 0),
('ch-indie-game-lab', '独立游戏实验室默认频道', 'ORGANIZATION', 'org-indie-game-lab', '游戏原型开发、试玩反馈和 Game Jam 组队。', 0);

UPDATE organization_channel
SET name = 'Public Square',
    type = 'ORGANIZATION',
    organization_id = 'org-public-square',
    description = '公共广场默认频道：闲聊、组织宣传和活动预告。',
    is_readonly = 0
WHERE id = 'ch-public-square';

UPDATE organization_channel
SET name = '围棋社默认频道',
    type = 'ORGANIZATION',
    organization_id = 'org-go-club',
    description = '围棋社成员交流、约棋和复盘讨论。',
    is_readonly = 0
WHERE id = 'ch-go-club';

UPDATE organization_channel
SET name = '二次元同好会默认频道',
    type = 'ORGANIZATION',
    organization_id = 'org-anime-club',
    description = '番剧讨论、观影活动和创作分享。',
    is_readonly = 0
WHERE id = 'ch-anime-club';

UPDATE organization_channel
SET name = '独立游戏实验室默认频道',
    type = 'ORGANIZATION',
    organization_id = 'org-indie-game-lab',
    description = '游戏原型开发、试玩反馈和 Game Jam 组队。',
    is_readonly = 0
WHERE id = 'ch-indie-game-lab';
