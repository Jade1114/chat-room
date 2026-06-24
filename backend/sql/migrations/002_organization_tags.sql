-- Add organization tag support for organization detail profile.
-- Run after schema.sql (or after 001_rebuild_organization_platform.sql if migrating from old schema).

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

USE chat_room;

CREATE TABLE IF NOT EXISTS organization_tag (
    organization_id VARCHAR(32)  NOT NULL,
    tag             VARCHAR(32)  NOT NULL,
    PRIMARY KEY (organization_id, tag),
    INDEX idx_org_tag_org (organization_id),
    CONSTRAINT fk_org_tag_organization
        FOREIGN KEY (organization_id) REFERENCES organization(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed tags for existing organizations
INSERT IGNORE INTO organization_tag (organization_id, tag) VALUES
('org-public-square', '公共交流'),
('org-public-square', '平台官方'),
('org-go-club', '围棋'),
('org-go-club', '棋类'),
('org-go-club', '竞技'),
('org-anime-club', '动漫'),
('org-anime-club', '同人'),
('org-anime-club', '二次元'),
('org-indie-game-lab', '游戏开发'),
('org-indie-game-lab', '编程'),
('org-indie-game-lab', '创作');
