USE chat_room;

ALTER TABLE activity
    ADD COLUMN created_by_user_id VARCHAR(32) NULL AFTER created_by,
    ADD COLUMN created_by_local_session_id VARCHAR(128) NULL AFTER created_by_user_id;

UPDATE activity
SET created_by_user_id = created_by
WHERE created_by_user_id IS NULL
  AND created_by <> 'u-public';

CREATE INDEX idx_activity_created_by_user
    ON activity (created_by_user_id, created_at);

CREATE INDEX idx_activity_created_by_local_session
    ON activity (created_by_local_session_id, created_at);

ALTER TABLE activity
    ADD CONSTRAINT fk_activity_created_by_user
        FOREIGN KEY (created_by_user_id) REFERENCES app_user(id);

CREATE TABLE IF NOT EXISTS activity_interest (
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
