USE chat_room;

CREATE TABLE IF NOT EXISTS activity_update (
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
