-- Add anonymous visitor-aware metrics for the public Activity-first MVP.
-- Run this on existing local databases after 001_activity_first_mvp.sql.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chat_room;

ALTER TABLE activity_event
    MODIFY user_id VARCHAR(32) NULL;

ALTER TABLE activity_event
    ADD COLUMN visitor_id VARCHAR(64) NULL AFTER user_id;

CREATE INDEX idx_activity_event_visitor
    ON activity_event (visitor_id, event_type, created_at);

CREATE TABLE IF NOT EXISTS site_event (
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


INSERT INTO app_user (id, username, display_name, password_hash, role)
VALUES ('u-public', NULL, '匿名发布者', NULL, 'MEMBER')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), role = VALUES(role);
