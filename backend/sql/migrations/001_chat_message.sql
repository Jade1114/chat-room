USE chat_room;

CREATE TABLE IF NOT EXISTS chat_message (
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
